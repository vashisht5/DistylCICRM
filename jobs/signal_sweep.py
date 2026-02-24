"""Every 6h: AI-score new news items, promote high-scorers to signals"""
from datetime import datetime


def run_signal_sweep():
    print(f"⚡ Signal sweep: {datetime.utcnow().isoformat()}")
    try:
        from database import get_db
        import models
        from ai.signal_agent import SignalAgent

        with get_db() as db:
            news_items = db.query(models.NewsItem).filter(
                models.NewsItem.promoted_to_signal == False,
                models.NewsItem.relevance_score == 0
            ).order_by(models.NewsItem.created_at.desc()).limit(50).all()

            if not news_items:
                print("  → No unscored items")
                return

            active_deals = db.query(models.Deal).filter(
                models.Deal.stage.notin_(['closed_won', 'closed_lost'])
            ).all()

        agent = SignalAgent()
        scores = agent.score_items(news_items, active_deals)

        promoted = 0
        with get_db() as db:
            for score_data in scores:
                news_id = score_data.get('id')
                score = score_data.get('score', 0)

                ni = db.query(models.NewsItem).filter(models.NewsItem.id == news_id).first()
                if ni:
                    ni.relevance_score = score

                if score >= 60:
                    ni_full = db.query(models.NewsItem).filter(models.NewsItem.id == news_id).first()
                    if ni_full:
                        sid = agent.promote_to_signal(ni_full, score_data)
                        promoted += 1

                        if score >= 80:
                            try:
                                from integrations.slack_client import SlackClient
                                entity = db.query(models.Entity).filter(models.Entity.id == ni_full.entity_id).first()
                                SlackClient().post_signal_alert(
                                    entity.name if entity else "Unknown",
                                    ni_full.headline, score, ni_full.url
                                )
                            except Exception as e:
                                print(f"  ⚠️  Slack alert failed: {e}")

            db.commit()

        print(f"✅ Signal sweep: scored {len(scores)}, promoted {promoted}")
    except Exception as e:
        print(f"❌ Signal sweep error: {e}")
