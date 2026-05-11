"""
Content sweep — runs every 2 hours.
Pulls new content from Granola and Google Docs, feeds through enrichment pipeline.
"""
import json
import os
from datetime import datetime


SYNC_STATE_FILE = os.path.join(os.path.dirname(__file__), '..', 'sync_state.json')


def _load_sync_state() -> dict:
    try:
        if os.path.exists(SYNC_STATE_FILE):
            with open(SYNC_STATE_FILE) as f:
                return json.load(f)
    except Exception:
        pass
    return {}


def _save_sync_state(state: dict):
    try:
        with open(SYNC_STATE_FILE, 'w') as f:
            json.dump(state, f, default=str)
    except Exception as e:
        print(f"Failed to save sync state: {e}")


def run_content_sweep():
    """Main sweep — pull Granola + Google Docs, enrich profiles and deals."""
    print(f"[content_sweep] Starting at {datetime.utcnow().isoformat()}")
    state = _load_sync_state()

    granola_synced = _sweep_granola(state)
    gdocs_synced = _sweep_gdocs(state)

    state['content_sweep_last_run'] = datetime.utcnow().isoformat()
    _save_sync_state(state)

    print(f"[content_sweep] Done. Granola notes: {granola_synced}, GDocs: {gdocs_synced}")


def _sweep_granola(state: dict) -> int:
    """Pull new Granola notes and process them."""
    try:
        from integrations.granola_client import GranolaClient
        client = GranolaClient()

        if not client.is_available():
            return 0

        last_sync = state.get('granola_last_sync')
        since_ts = None
        if last_sync:
            try:
                since_ts = datetime.fromisoformat(last_sync).timestamp()
            except Exception:
                pass

        notes = client.get_recent_notes(since_timestamp=since_ts)
        if not notes:
            state['granola_last_sync'] = datetime.utcnow().isoformat()
            return 0

        processed = 0
        for note in notes:
            try:
                _process_content_note(
                    title=note.get('title', 'Granola Note'),
                    content=note.get('content', ''),
                    source='granola',
                    meeting_date=note.get('created_at'),
                )
                processed += 1
            except Exception as e:
                print(f"[content_sweep] Error processing Granola note: {e}")

        state['granola_last_sync'] = datetime.utcnow().isoformat()
        return processed

    except Exception as e:
        print(f"[content_sweep] Granola sweep error: {e}")
        return 0


def _sweep_gdocs(state: dict) -> int:
    """Pull recently modified Google Docs and process them."""
    try:
        folder_id = os.getenv('GDOCS_INTEL_FOLDER_ID', '')
        if not folder_id:
            return 0

        # Get a user with Google OAuth token
        from database import get_db
        from models import User, OAuthToken
        with get_db() as db:
            token_rec = db.query(OAuthToken).filter(
                OAuthToken.provider == 'google',
                OAuthToken.access_token != None,
            ).first()
            if not token_rec:
                return 0
            access_token = token_rec.access_token

        last_sync = state.get('gdocs_last_sync')
        since_dt = None
        if last_sync:
            try:
                since_dt = datetime.fromisoformat(last_sync)
            except Exception:
                pass

        if not since_dt:
            from datetime import timedelta
            since_dt = datetime.utcnow() - timedelta(days=1)

        from integrations.drive_client import get_recently_modified_docs, get_file_text
        files = get_recently_modified_docs(access_token, folder_id, since_dt)

        processed = 0
        for f in files:
            try:
                text = get_file_text(access_token, f['id'], f.get('mimeType', ''))
                if text and len(text) > 100:
                    _process_content_note(
                        title=f.get('name', 'Google Doc'),
                        content=text,
                        source='google_doc',
                        meeting_date=f.get('modifiedTime'),
                    )
                    processed += 1
            except Exception as e:
                print(f"[content_sweep] Error processing GDoc {f.get('name')}: {e}")

        state['gdocs_last_sync'] = datetime.utcnow().isoformat()
        return processed

    except Exception as e:
        print(f"[content_sweep] GDocs sweep error: {e}")
        return 0


def _process_content_note(title: str, content: str, source: str, meeting_date=None):
    """Save a note as MeetingNote and trigger processing pipeline."""
    if not content or len(content.strip()) < 50:
        return

    from database import get_db
    from models import MeetingNote
    from datetime import datetime as dt

    with get_db() as db:
        # Check for duplicate by title + source
        existing = db.query(MeetingNote).filter(
            MeetingNote.title == title,
            MeetingNote.source == source,
        ).first()
        if existing:
            return

        parsed_date = None
        if meeting_date:
            try:
                if isinstance(meeting_date, str):
                    parsed_date = dt.fromisoformat(meeting_date.replace('Z', '+00:00').replace('+00:00', ''))
            except Exception:
                pass

        note = MeetingNote(
            title=title,
            raw_text=content,
            source=source,
            meeting_date=parsed_date,
            processing_status='pending',
        )
        db.add(note)
        db.flush()
        note_id = note.id

    # Process asynchronously
    import threading
    def _process():
        try:
            from ai.notes_agent import NotesAgent
            agent = NotesAgent()
            agent.process(note_id)
        except Exception as e:
            print(f"[content_sweep] Notes processing error for note {note_id}: {e}")

    t = threading.Thread(target=_process, daemon=True)
    t.start()


def get_sync_status() -> dict:
    """Return current sync state for API."""
    state = _load_sync_state()
    return {
        'granola_last_sync': state.get('granola_last_sync'),
        'gdocs_last_sync': state.get('gdocs_last_sync'),
        'content_sweep_last_run': state.get('content_sweep_last_run'),
    }
