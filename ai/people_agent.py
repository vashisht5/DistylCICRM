"""
People Agent — detects executive movements via AI web search.
Scans tracked people for role changes, company moves, and new titles.
"""
from datetime import datetime
from ai.base_agent import BaseIntelAgent
from database import get_db
import models


class PeopleAgent(BaseIntelAgent):

    def sweep_all(self):
        """Sweep all tracked people for exec movements. Called by people_sweep job."""
        with get_db() as db:
            people = db.query(models.Person).filter(
                models.Person.status == 'active'
            ).all()

        results = []
        for person in people:
            try:
                movement = self.check_person(person.id)
                if movement:
                    results.append(movement)
            except Exception as e:
                print(f"People sweep error for person {person.id}: {e}")

        print(f"People sweep: checked {len(people)} people, found {len(results)} movements")
        return results

    def check_person(self, person_id: int) -> dict | None:
        """Check a single person for recent role changes."""
        with get_db() as db:
            person = db.query(models.Person).filter(models.Person.id == person_id).first()
            if not person:
                return None
            entity = db.query(models.Entity).filter(models.Entity.id == person.entity_id).first()
            entity_name = entity.name if entity else "Unknown"

        full_name = f"{person.first_name} {person.last_name}"
        current_title = person.title or ''
        current_company = person.current_company or entity_name

        prompt = f"""Search for recent news about {full_name}, currently {current_title} at {current_company}.

Has this person recently:
- Changed jobs or companies?
- Been promoted or changed roles?
- Left or joined a board?
- Made any notable announcements?

Look for information from the last 90 days.

Return a JSON object:
{{
  "movement_detected": true/false,
  "new_company": "Company name or null",
  "new_title": "New title or null",
  "summary": "One sentence description of what changed",
  "source_url": "URL of source or null",
  "confidence": "High/Medium/Low"
}}

If no movement detected, return {{"movement_detected": false}}."""

        result = self._call_claude(prompt, use_web_search=True, max_tokens=500)
        data = self._extract_json(result)

        if not data or not data.get('movement_detected'):
            return None

        # Record the movement
        with get_db() as db:
            person = db.query(models.Person).filter(models.Person.id == person_id).first()
            if not person:
                return None

            old_company = person.current_company or entity_name
            old_title = person.title or ''

            # Create movement record
            movement = models.PersonMovement(
                person_id=person_id,
                from_company=old_company,
                from_title=old_title,
                to_company=data.get('new_company') or old_company,
                to_title=data.get('new_title') or old_title,
                detected_at=datetime.utcnow(),
                source_url=data.get('source_url'),
            )
            db.add(movement)

            # Update person record
            if data.get('new_company'):
                person.current_company = data['new_company']
            if data.get('new_title'):
                person.title = data['new_title']
            person.last_known_move = datetime.utcnow()

            # Create Signal
            signal = models.Signal(
                entity_id=person.entity_id,
                signal_type='exec_change',
                title=f"Exec move: {full_name} — {data.get('summary', 'Role change detected')}",
                summary=data.get('summary', ''),
                source_url=data.get('source_url'),
                source_type='claude_search',
                source_name='AI Web Search',
                source_date=datetime.utcnow(),
                ingested_at=datetime.utcnow(),
                score=85,  # Exec changes always high priority
                status='new',
                created_at=datetime.utcnow(),
            )
            db.add(signal)
            db.flush()

            movement.signal_id = signal.id
            db.commit()

            # Immediate Slack alert for exec changes
            try:
                from integrations.slack_client import SlackClient
                SlackClient().post_signal_alert(
                    entity_name=entity_name,
                    title=signal.title,
                    score=85,
                    source_url=data.get('source_url', ''),
                )
            except Exception:
                pass

            return {
                "person": full_name,
                "entity": entity_name,
                "from_company": old_company,
                "to_company": data.get('new_company'),
                "summary": data.get('summary'),
            }
