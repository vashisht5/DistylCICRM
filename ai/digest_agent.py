"""Bi-weekly digest composer"""
from datetime import datetime, timedelta
from ai.base_agent import BaseIntelAgent
from ai.prompts.context import DISTYL_SYSTEM_CONTEXT


class DigestAgent(BaseIntelAgent):

    def generate(self):
        from database import get_db
        import models

        week_number = datetime.utcnow().isocalendar()[1]
        year = datetime.utcnow().year
        digest_type = 'client_focus' if week_number % 2 == 0 else 'competitor_focus'
        since = datetime.utcnow() - timedelta(days=14)

        print(f"📰 Generating {digest_type} digest for week {week_number}/{year}")

        with get_db() as db:
            signals = db.query(models.Signal).filter(
                models.Signal.created_at >= since,
                models.Signal.score >= 50
            ).order_by(models.Signal.score.desc()).limit(20).all()

            deals = db.query(models.Deal).filter(
                models.Deal.stage.notin_(['closed_won', 'closed_lost'])
            ).all()

            signal_summaries = []
            for s in signals:
                entity = db.query(models.Entity).filter(models.Entity.id == s.entity_id).first()
                signal_summaries.append(f"[{s.score}] {entity.name if entity else '?'}: {s.title}")

            deal_summaries = [f"{d.account_name} ({d.stage})" for d in deals[:10]]

        prompt = f"""{DISTYL_SYSTEM_CONTEXT}

Generate a {digest_type} bi-weekly competitive intelligence digest.
Week: {week_number}, Year: {year}

Top signals (last 14 days):
{chr(10).join(signal_summaries[:15]) or "No signals"}

Active pipeline:
{chr(10).join(deal_summaries) or "No active deals"}

Return JSON:
{{
  "digest_type": "{digest_type}",
  "week_number": {week_number},
  "year": {year},
  "subject": "Distyl Intel — Week {week_number}: [one-line headline]",
  "headline": "...",
  "top_signals": [{{"entity": "...", "signal": "...", "implication": "..."}}],
  "pipeline_highlights": [{{"deal": "...", "development": "..."}}],
  "exec_movements": [],
  "action_items": [{{"action": "...", "owner": "...", "urgency": "high/medium/low"}}],
  "watch_next": "..."
}}"""

        response_text, error = self._call_claude(prompt, use_web_search=False, max_tokens=2500)
        if error:
            print(f"❌ Digest error: {error}")
            return

        try:
            content = self._extract_json(response_text)
        except Exception as e:
            content = {"raw": response_text, "error": str(e)}

        with get_db() as db:
            digest = models.Digest(
                digest_type=digest_type,
                week_number=week_number,
                year=year,
                subject=content.get('subject', f'Distyl Intel Week {week_number}'),
                content=content,
                status='draft',
                generated_at=datetime.utcnow()
            )
            db.add(digest)
            db.commit()
            print(f"✅ Digest {digest.id} generated")
