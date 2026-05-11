"""
Meeting Notes Agent
Accepts raw text (meeting notes, email pastes, call transcripts) and extracts:
  - Company names → finds/creates Entity records
  - People (name, title, company) → finds/creates Person records
  - Deal info (stage, value, competitors, next steps) → creates/updates Deal records
  - Competitive intel → creates Signal records
  - Action items list
"""
from datetime import datetime
from ai.base_agent import BaseIntelAgent


class NotesAgent(BaseIntelAgent):

    def process(self, note_id: int) -> dict:
        """
        Process a MeetingNote record by ID.
        Runs extraction and saves all structured data back to the note + related records.
        Returns a summary dict.
        """
        from database import get_db
        from models import MeetingNote

        with get_db() as db:
            note = db.query(MeetingNote).filter(MeetingNote.id == note_id).first()
            if not note:
                return {"error": f"Note {note_id} not found"}
            raw_text = note.raw_text
            note.processing_status = "processing"

        results = {
            "note_id": note_id,
            "entities_found": [],
            "people_created": 0,
            "deals_updated": 0,
            "signals_created": 0,
            "action_items": [],
            "errors": [],
        }

        # Run extraction
        try:
            extracted = self._extract_all(raw_text)
        except Exception as e:
            self._mark_failed(note_id, str(e))
            return {"error": str(e)}

        # Process entities
        entity_ids = []
        try:
            entity_ids = self._process_entities(extracted.get("companies", []))
            results["entities_found"] = extracted.get("companies", [])
        except Exception as e:
            results["errors"].append(f"entities: {e}")

        # Process people
        person_ids = []
        try:
            person_ids, people_count = self._process_people(extracted.get("people", []), entity_ids)
            results["people_created"] = people_count
        except Exception as e:
            results["errors"].append(f"people: {e}")

        # Process deals
        deal_ids = []
        try:
            deal_ids, deals_updated = self._process_deals(extracted.get("deals", []), entity_ids)
            results["deals_updated"] = deals_updated
        except Exception as e:
            results["errors"].append(f"deals: {e}")

        # Create signals for competitive intel
        try:
            signals_created = self._process_signals(extracted.get("signals", []), entity_ids)
            results["signals_created"] = signals_created
        except Exception as e:
            results["errors"].append(f"signals: {e}")

        action_items = extracted.get("action_items", [])
        results["action_items"] = action_items

        # Enrich stakeholder profiles
        try:
            self._enrich_stakeholder_profiles(raw_text, person_ids)
        except Exception as e:
            results["errors"].append(f"profile_enrich: {e}")

        # Update DealIntel for matched deals
        try:
            self._enrich_deal_intel(raw_text, deal_ids)
        except Exception as e:
            results["errors"].append(f"deal_intel: {e}")

        # Save all extracted data back to the note
        try:
            from database import get_db
            from models import MeetingNote
            with get_db() as db:
                note = db.query(MeetingNote).filter(MeetingNote.id == note_id).first()
                note.entity_ids = entity_ids
                note.person_ids = person_ids
                note.deal_ids = deal_ids
                note.extracted_contacts = extracted.get("people", [])
                note.extracted_action_items = action_items
                note.extracted_deal_data = extracted.get("deals", [])
                note.extracted_signals = extracted.get("signals", [])
                note.processing_status = "done"
                note.processed_at = datetime.utcnow()
        except Exception as e:
            results["errors"].append(f"save: {e}")

        return results

    # ── Core extraction ───────────────────────────────────────────

    def _extract_all(self, raw_text: str) -> dict:
        """Single Claude call to extract all structured data from raw notes."""
        truncated = self._safe_truncate(raw_text, 8000)

        prompt = f"""You are a CRM data extraction assistant. Read the following meeting notes/transcript and extract structured information.

NOTES:
{truncated}

Return a single JSON object with these keys:

"companies": list of company names mentioned (strings only, e.g. ["Acme Corp", "IBM"])

"people": list of people mentioned. Each item: {{"name": "Full Name", "title": "their title or null", "company": "their company or null", "email": "email or null"}}

"deals": list of deal/opportunity information. Each item: {{
  "account_name": "company name",
  "deal_name": "deal or project name or null",
  "stage": one of [prospecting, discovery, eval, negotiation, closed_won, closed_lost] or null,
  "value_usd": integer dollar amount or null,
  "competitors": list of competitor names,
  "next_steps": "next steps string or null"
}}

"signals": list of competitive intelligence signals. Each item: {{
  "title": "brief signal title",
  "summary": "1-2 sentence description",
  "entity_name": "company this signal is about",
  "signal_type": one of [news, product_launch, exec_change, hiring, partnership, funding, customer_win] or "news"
}}

"action_items": list of action items as plain strings (e.g. ["Follow up with John by Friday", "Send proposal to Acme"])

Return ONLY a valid JSON object. If a section has nothing, use an empty list."""

        text, err = self._call_claude(prompt, use_web_search=False, max_tokens=3000)
        if err or not text:
            raise RuntimeError(f"Claude extraction failed: {err}")

        return self._extract_json(text)

    # ── Entity processing ─────────────────────────────────────────

    def _process_entities(self, company_names: list) -> list:
        """Find or stub-create Entity records for mentioned companies. Returns list of entity IDs."""
        if not company_names:
            return []

        from database import get_db
        from models import Entity

        entity_ids = []
        with get_db() as db:
            for name in company_names:
                if not name or not name.strip():
                    continue
                name = name.strip()
                entity = db.query(Entity).filter(
                    Entity.name.ilike(f"%{name}%")
                ).first()
                if entity:
                    entity_ids.append(entity.id)

        return entity_ids

    # ── People processing ─────────────────────────────────────────

    def _process_people(self, people_data: list, entity_ids: list) -> tuple:
        """Find or create Person records. Returns (list of person IDs, count created)."""
        if not people_data:
            return [], 0

        from database import get_db
        from models import Person, Entity

        person_ids = []
        created = 0

        with get_db() as db:
            for p in people_data:
                if not p.get("name"):
                    continue
                parts = p["name"].strip().split(" ", 1)
                first = parts[0]
                last = parts[1] if len(parts) > 1 else ""

                # Try to find entity_id from company name
                person_entity_id = None
                if p.get("company") and entity_ids:
                    entity = db.query(Entity).filter(
                        Entity.name.ilike(f"%{p['company']}%")
                    ).first()
                    if entity:
                        person_entity_id = entity.id
                elif entity_ids:
                    person_entity_id = entity_ids[0]

                if not person_entity_id:
                    continue

                # Find existing by name + entity
                existing = db.query(Person).filter(
                    Person.entity_id == person_entity_id,
                    Person.first_name.ilike(first),
                    Person.last_name.ilike(last) if last else Person.last_name == None,
                ).first()

                if existing:
                    if p.get("title"):
                        existing.title = p["title"]
                    if p.get("email"):
                        existing.email = p["email"]
                    person_ids.append(existing.id)
                else:
                    person = Person(
                        entity_id=person_entity_id,
                        first_name=first,
                        last_name=last,
                        title=p.get("title"),
                        current_company=p.get("company"),
                        email=p.get("email"),
                        person_type="target_contact",
                        distyl_relationship="unknown",
                        status="active",
                    )
                    db.add(person)
                    db.flush()
                    person_ids.append(person.id)
                    created += 1

        return person_ids, created

    # ── Deal processing ───────────────────────────────────────────

    def _process_deals(self, deals_data: list, entity_ids: list) -> tuple:
        """Find or create Deal records. Returns (list of deal IDs, count updated)."""
        if not deals_data:
            return [], 0

        from database import get_db
        from models import Deal, DealCompetitor, Entity

        deal_ids = []
        updated = 0

        with get_db() as db:
            for d in deals_data:
                if not d.get("account_name"):
                    continue

                # Try to find existing deal
                deal = db.query(Deal).filter(
                    Deal.account_name.ilike(f"%{d['account_name']}%")
                ).first()

                if deal:
                    if d.get("stage"):
                        deal.stage = d["stage"]
                    if d.get("value_usd"):
                        deal.value_usd = d["value_usd"]
                    updated += 1
                else:
                    deal = Deal(
                        account_name=d["account_name"],
                        deal_name=d.get("deal_name"),
                        stage=d.get("stage", "prospecting"),
                        value_usd=d.get("value_usd"),
                    )
                    db.add(deal)
                    db.flush()
                    updated += 1

                deal_ids.append(deal.id)

                # Add competitors
                for comp_name in (d.get("competitors") or []):
                    comp_entity = db.query(Entity).filter(
                        Entity.name.ilike(f"%{comp_name}%")
                    ).first()
                    if comp_entity:
                        existing_dc = db.query(DealCompetitor).filter(
                            DealCompetitor.deal_id == deal.id,
                            DealCompetitor.entity_id == comp_entity.id,
                        ).first()
                        if not existing_dc:
                            db.add(DealCompetitor(
                                deal_id=deal.id,
                                entity_id=comp_entity.id,
                                involvement="shortlisted",
                                source="meeting_notes",
                            ))

        return deal_ids, updated

    # ── Signal processing ─────────────────────────────────────────

    def _process_signals(self, signals_data: list, entity_ids: list) -> int:
        """Create Signal records for competitive intel. Returns count created."""
        if not signals_data:
            return 0

        from database import get_db
        from models import Signal, Entity

        created = 0
        with get_db() as db:
            for s in signals_data:
                if not s.get("title") or not s.get("entity_name"):
                    continue

                entity = db.query(Entity).filter(
                    Entity.name.ilike(f"%{s['entity_name']}%")
                ).first()

                if not entity:
                    continue

                signal = Signal(
                    entity_id=entity.id,
                    signal_type=s.get("signal_type", "news"),
                    title=s["title"],
                    summary=s.get("summary"),
                    source_type="meeting_notes",
                    source_name="Meeting Notes",
                    score=60,
                    score_rationale="Extracted from meeting notes",
                    status="new",
                )
                db.add(signal)
                created += 1

        return created

    def _enrich_stakeholder_profiles(self, raw_text: str, person_ids: list):
        """Enrich StakeholderProfile records for people mentioned in notes."""
        if not person_ids:
            return
        from database import get_db
        from models import Person, StakeholderProfile
        from ai.profile_enricher import ProfileEnricher

        enricher = ProfileEnricher()
        with get_db() as db:
            for pid in person_ids:
                person = db.query(Person).filter(Person.id == pid).first()
                if not person:
                    continue
                full_name = f"{person.first_name or ''} {person.last_name or ''}".strip()
                if not full_name:
                    continue

                profile = db.query(StakeholderProfile).filter(
                    StakeholderProfile.name.ilike(f'%{full_name}%')
                ).first()

                if profile:
                    enrichment = enricher.enrich_from_text(
                        text=raw_text[:4000],
                        person_name=full_name,
                        source_type='meeting_notes',
                        existing_profile={'name': profile.name, 'title': profile.title},
                    )
                    if enrichment.get('past_interactions_append'):
                        existing = profile.past_interactions or ''
                        from datetime import datetime
                        ts = datetime.utcnow().strftime('%Y-%m-%d')
                        profile.past_interactions = f"{existing}\n[{ts} meeting] {enrichment['past_interactions_append']}".strip()
                    if enrichment.get('attributes_add'):
                        attrs = profile.attributes or {}
                        attrs.update(enrichment['attributes_add'])
                        profile.attributes = attrs

    def _enrich_deal_intel(self, raw_text: str, deal_ids: list):
        """Update DealIntel records for matched deals."""
        if not deal_ids:
            return
        from database import get_db
        from models import DealIntel
        from ai.attribute_parser import AttributeParser

        parser = AttributeParser()
        with get_db() as db:
            for did in deal_ids:
                intel = db.query(DealIntel).filter(DealIntel.deal_id == did).first()
                if not intel:
                    intel = DealIntel(deal_id=did)
                    db.add(intel)
                    db.flush()

                result = parser.parse_deal_notes(raw_text[:4000], {
                    'presales_stage': intel.presales_stage,
                })
                field_updates = result.get('field_updates', {})
                for field in ['metrics', 'identified_pain', 'decision_process']:
                    if field in field_updates and field_updates[field] and not getattr(intel, field):
                        setattr(intel, field, field_updates[field])
                if field_updates.get('decision_criteria') and not intel.decision_criteria:
                    intel.decision_criteria = field_updates['decision_criteria']

    # ── Helpers ───────────────────────────────────────────────────

    def _mark_failed(self, note_id: int, error: str):
        from database import get_db
        from models import MeetingNote
        try:
            with get_db() as db:
                note = db.query(MeetingNote).filter(MeetingNote.id == note_id).first()
                if note:
                    note.processing_status = "failed"
                    note.processed_at = datetime.utcnow()
        except Exception:
            pass
