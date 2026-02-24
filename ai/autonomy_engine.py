"""
The AI Autonomy Engine — core loop.
Every 30 min: reads all new signals, decides what matters, pushes to humans.
"""
from datetime import datetime, timedelta
from ai.base_agent import BaseIntelAgent
from ai.prompts.context import DISTYL_SYSTEM_CONTEXT


class AutonomyEngine(BaseIntelAgent):

    def run(self):
        print(f"🤖 Autonomy Engine: {datetime.utcnow().isoformat()}")
        from database import get_db
        import models

        since = datetime.utcnow() - timedelta(minutes=35)

        with get_db() as db:
            unreviewed = db.query(models.Signal).filter(
                models.Signal.created_at >= since,
                models.Signal.status == 'new'
            ).all()

            active_deals = db.query(models.Deal).filter(
                models.Deal.stage.notin_(['closed_won', 'closed_lost'])
            ).all()

            entities = db.query(models.Entity).filter(models.Entity.status == 'active').all()

            signals_data = [{"id": s.id, "title": s.title, "score": s.score,
                             "entity_id": s.entity_id, "signal_type": s.signal_type}
                           for s in unreviewed]
            deals_data = [{"id": d.id, "account_name": d.account_name, "stage": d.stage}
                         for d in active_deals]
            entities_data = [{"id": e.id, "name": e.name, "entity_type": e.entity_type,
                              "threat_level": e.threat_level}
                            for e in entities]

        if not signals_data:
            print("  → No new signals")
            return

        print(f"  → Processing {len(signals_data)} signals")
        decisions = self._should_surface_batch(signals_data[:10], deals_data, entities_data)

        pushed = 0
        for decision in decisions:
            if decision.get('surface'):
                self._push(decision)
                pushed += 1
            if decision.get('dossier_update_needed'):
                print(f"  📋 Dossier update queued: {decision['dossier_update_needed']}")

        self._calibrate_thresholds()
        print(f"  → Pushed {pushed} notifications")

    def _should_surface_batch(self, signals, deals, entities):
        if not signals:
            return []

        signals_text = "\n".join([f"[{s['id']}] Score:{s['score']} Type:{s['signal_type']} - {s['title']}" for s in signals])
        deals_text = "\n".join([f"- {d['account_name']} ({d['stage']})" for d in deals[:10]])
        entities_text = "\n".join([f"- {e['name']} ({e['entity_type']}, {e['threat_level']})" for e in entities[:15]])

        prompt = f"""{DISTYL_SYSTEM_CONTEXT}

Evaluate which signals should be surfaced to the Distyl team NOW.

Active deals:
{deals_text or "None"}

Tracked entities:
{entities_text}

New signals:
{signals_text}

For each signal return:
[
  {{
    "signal_id": <id>,
    "surface": true/false,
    "urgency": "immediate|batch|store_only",
    "audience": ["analysts"],
    "action_suggestion": "one sentence action for a human",
    "dossier_update_needed": null or "EntityName Section X — reason",
    "rationale": "..."
  }}
]"""

        response_text, error = self._call_claude(prompt, use_web_search=False, max_tokens=2000)
        if error or not response_text:
            return []
        try:
            return self._extract_json(response_text)
        except Exception:
            return []

    def _push(self, decision):
        try:
            from integrations.slack_client import SlackClient
            from database import get_db
            import models

            with get_db() as db:
                signal = db.query(models.Signal).filter(
                    models.Signal.id == decision.get('signal_id')
                ).first()
                if not signal:
                    return

                entity = db.query(models.Entity).filter(models.Entity.id == signal.entity_id).first()
                entity_name = entity.name if entity else "Unknown"

                msg = (
                    f"🧠 *Distyl Intel — Action Suggested*\n\n"
                    f"*{entity_name}*: {signal.title}\n\n"
                    f"*Why it matters:* {decision.get('rationale', '')}\n\n"
                    f"*Suggested action:* {decision.get('action_suggestion', '')}\n\n"
                    f"Score: {signal.score}/100 | Type: {signal.signal_type}"
                )

                slack = SlackClient()
                slack.post_message("#competitive-intel", msg)

                signal.notified_slack = True
                db.commit()

        except Exception as e:
            print(f"  ⚠️  Push failed: {e}")

    def _calibrate_thresholds(self):
        try:
            from database import get_db
            import models
            with get_db() as db:
                total = db.query(models.PushFeedback).count()
                if total < 10:
                    return
                acted = db.query(models.PushFeedback).filter(
                    models.PushFeedback.action == 'acted_on'
                ).count()
                print(f"  📊 Feedback: {acted}/{total} acted on ({acted/total:.0%})")
        except Exception:
            pass
