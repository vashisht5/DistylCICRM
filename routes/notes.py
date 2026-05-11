"""
Meeting Notes routes
POST /api/notes          — submit notes (async processing)
GET  /api/notes          — list notes
GET  /api/notes/<id>     — full extracted data
"""
import threading
from datetime import datetime
from flask import Blueprint, jsonify, request
from database import get_db
from models import MeetingNote
from middleware.auth import require_login

notes_bp = Blueprint('notes', __name__)


def _process_note(note_id: int):
    try:
        from ai.notes_agent import NotesAgent
        agent = NotesAgent()
        agent.process(note_id)
    except Exception as e:
        print(f"[notes] note {note_id} failed: {e}")
        from database import get_db
        from models import MeetingNote
        try:
            with get_db() as db:
                note = db.query(MeetingNote).filter(MeetingNote.id == note_id).first()
                if note:
                    note.processing_status = "failed"
        except Exception:
            pass


@notes_bp.route('/api/notes', methods=['POST'])
@require_login
def submit_note():
    """Submit meeting notes for async AI processing."""
    data = request.json or {}

    raw_text = (data.get('raw_text') or '').strip()
    if not raw_text:
        return jsonify({"error": "raw_text is required"}), 400

    meeting_date = None
    if data.get('meeting_date'):
        try:
            meeting_date = datetime.fromisoformat(data['meeting_date'])
        except Exception:
            pass

    with get_db() as db:
        note = MeetingNote(
            title=data.get('title'),
            raw_text=raw_text,
            source=data.get('source', 'manual'),
            meeting_date=meeting_date,
            processing_status='pending',
        )
        db.add(note)
        db.flush()
        note_id = note.id
        note_dict = note.to_dict()

    # Process asynchronously
    t = threading.Thread(target=_process_note, args=(note_id,), daemon=True)
    t.start()

    return jsonify({
        "note": note_dict,
        "message": "Note submitted, processing in background",
    }), 202


@notes_bp.route('/api/notes', methods=['GET'])
@require_login
def list_notes():
    """List all meeting notes with pagination."""
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    status = request.args.get('status')

    with get_db() as db:
        q = db.query(MeetingNote)
        if status:
            q = q.filter(MeetingNote.processing_status == status)
        q = q.order_by(MeetingNote.created_at.desc())
        total = q.count()
        notes = q.offset((page - 1) * per_page).limit(per_page).all()
        notes_list = []
        for n in notes:
            d = {
                "id": n.id,
                "title": n.title,
                "source": n.source,
                "meeting_date": n.meeting_date.isoformat() if n.meeting_date else None,
                "processing_status": n.processing_status,
                "processed_at": n.processed_at.isoformat() if n.processed_at else None,
                "created_at": n.created_at.isoformat() if n.created_at else None,
                "entity_ids": n.entity_ids,
                "action_items_count": len(n.extracted_action_items or []),
                "contacts_count": len(n.extracted_contacts or []),
                "signals_count": len(n.extracted_signals or []),
                # Include brief preview of raw text
                "preview": (n.raw_text or '')[:200],
            }
            notes_list.append(d)

    return jsonify({
        "notes": notes_list,
        "total": total,
        "page": page,
        "per_page": per_page,
    })


@notes_bp.route('/api/notes/<int:note_id>', methods=['GET'])
@require_login
def get_note(note_id):
    """Get full extracted data for a meeting note."""
    with get_db() as db:
        note = db.query(MeetingNote).filter(MeetingNote.id == note_id).first()
        if not note:
            return jsonify({"error": "Note not found"}), 404

        result = note.to_dict()

        # Enrich with entity names
        if note.entity_ids:
            from models import Entity
            entities = db.query(Entity).filter(Entity.id.in_(note.entity_ids)).all()
            result["entities"] = [{"id": e.id, "name": e.name, "entity_type": e.entity_type} for e in entities]

        # Enrich with person names
        if note.person_ids:
            from models import Person
            people = db.query(Person).filter(Person.id.in_(note.person_ids)).all()
            result["people"] = [{"id": p.id, "first_name": p.first_name, "last_name": p.last_name, "title": p.title} for p in people]

    return jsonify({"note": result})


@notes_bp.route('/api/notes/<int:note_id>/reprocess', methods=['POST'])
@require_login
def reprocess_note(note_id):
    """Re-trigger AI processing for a note."""
    with get_db() as db:
        note = db.query(MeetingNote).filter(MeetingNote.id == note_id).first()
        if not note:
            return jsonify({"error": "Note not found"}), 404
        note.processing_status = "pending"

    t = threading.Thread(target=_process_note, args=(note_id,), daemon=True)
    t.start()

    return jsonify({"status": "reprocessing", "note_id": note_id}), 202
