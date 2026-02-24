"""
Signal Agent — AI scoring for news items (anti-fatigue).
80+: Immediate Slack alert
60-79: Batch 6h notification
<60: DB only
"""
from datetime import datetime
from ai.base_agent import BaseIntelAgent
from ai.prompts.context import DISTYL_SYSTEM_CONTEXT


class SignalAgent(BaseIntelAgent):

    def score_items(self, news_items, active_deals=None):
        """Score a batch of news items. Returns list of score dicts."""
        if not news_items:
            return []

        deals_context = ""
        if active_deals:
            deals_context = "Active deals: " + ", ".join([d.account_name for d in active_deals[:10]])

        items_text = ""
        for item in news_items[:20]:
            items_text += f"\n[{item.id}] {item.headline} | Source: {item.source_name} | Date: {item.published_at}"

        prompt = f"""{DISTYL_SYSTEM_CONTEXT}

Score these news items for relevance to Distyl's competitive intelligence.

{deals_context}

News items:
{items_text}

Return JSON array:
[
  {{
    "id": <news_item_id>,
    "score": <1-100>,
    "signal_type": "news|product_launch|exec_change|hiring|partnership|funding|customer_win",
    "rationale": "1-2 sentence explanation",
    "deal_relevance": null or "account name if relevant"
  }},
  ...
]

Scoring:
- 90-100: Directly affects active deal account, exec change at prospect, major competitor announcement
- 70-89: Strong competitive signal, funding, major partnership, product competing with Distyl
- 50-69: Useful background, moderate competitive relevance
- 30-49: Industry news, low direct relevance
- 1-29: Noise, no healthcare/Distyl relevance

Return ONLY the JSON array."""

        response_text, error = self._call_claude(prompt, use_web_search=False, max_tokens=2000)
        if error or not response_text:
            return []

        try:
            return self._extract_json(response_text)
        except Exception:
            return []

    def promote_to_signal(self, news_item, score_data):
        """Create a Signal record from a scored NewsItem"""
        from database import get_db
        import models

        with get_db() as db:
            existing = db.query(models.Signal).filter(
                models.Signal.source_url == news_item.url
            ).first()
            if existing:
                return existing.id

            signal = models.Signal(
                entity_id=news_item.entity_id,
                signal_type=score_data.get('signal_type', 'news'),
                title=news_item.headline,
                summary=news_item.summary,
                source_url=news_item.url,
                source_name=news_item.source_name,
                source_type=news_item.source_type,
                source_date=news_item.published_at,
                score=score_data.get('score', 50),
                score_rationale=score_data.get('rationale'),
                deal_relevance={"account": score_data.get('deal_relevance')} if score_data.get('deal_relevance') else None,
            )
            db.add(signal)
            db.flush()

            ni = db.query(models.NewsItem).filter(models.NewsItem.id == news_item.id).first()
            if ni:
                ni.promoted_to_signal = True

            db.commit()
            return signal.id
