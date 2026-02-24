"""Every 2h: fetch news for all active entities"""
from datetime import datetime


def run_news_refresh():
    print(f"📰 News refresh: {datetime.utcnow().isoformat()}")
    try:
        from database import get_db
        import models
        from integrations.news_aggregator import NewsAggregator

        with get_db() as db:
            entities = db.query(models.Entity).filter(models.Entity.status == 'active').all()
            entities_data = [(e.id, e.name, e.entity_type, e.primary_use_cases) for e in entities]

        aggregator = NewsAggregator()
        total_new = 0
        for eid, ename, etype, use_cases in entities_data:
            count = refresh_entity_news(eid, ename, etype, use_cases, aggregator)
            total_new += count
            print(f"  → {ename}: {count} new items")

        print(f"✅ News refresh complete: {total_new} new items")
    except Exception as e:
        print(f"❌ News refresh error: {e}")


def refresh_entity_news(entity_id, entity_name=None, entity_type=None,
                        use_cases=None, aggregator=None):
    """Refresh news for a single entity. Returns count of new items."""
    from database import get_db
    import models
    from integrations.news_aggregator import NewsAggregator

    if not aggregator:
        aggregator = NewsAggregator()

    if not entity_name:
        with get_db() as db:
            e = db.query(models.Entity).filter(models.Entity.id == entity_id).first()
            if not e:
                return 0
            entity_name = e.name
            entity_type = e.entity_type
            use_cases = e.primary_use_cases

    items = aggregator.fetch_all(entity_id, entity_name, entity_type or 'competitor', use_cases or [])

    count = 0
    with get_db() as db:
        for item in items:
            existing = db.query(models.NewsItem).filter(models.NewsItem.url == item.url).first()
            if existing:
                continue
            ni = models.NewsItem(
                entity_id=entity_id,
                headline=item.headline,
                summary=item.summary,
                url=item.url,
                source_name=item.source_name,
                source_type=item.source_type,
                published_at=item.published_at,
                fetched_at=datetime.utcnow(),
            )
            db.add(ni)
            count += 1
        db.commit()

    return count
