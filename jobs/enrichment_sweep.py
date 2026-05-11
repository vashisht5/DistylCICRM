"""
Enrichment sweep job — runs daily at 6am UTC
Enriches entities where last_enriched_at IS NULL or > 7 days ago.
Priority: active deal targets first, then competitors, then partners.
"""
from datetime import datetime, timedelta


def run_enrichment_sweep():
    """Daily sweep: enrich stale entities in priority order."""
    print(f"[enrichment_sweep] Starting at {datetime.utcnow().isoformat()}")

    try:
        from database import get_db
        from models import Entity, Deal

        cutoff = datetime.utcnow() - timedelta(days=7)

        with get_db() as db:
            # Get IDs of entities that appear in active deals (highest priority)
            active_deal_entity_ids = set()
            active_deals = db.query(Deal).filter(
                Deal.win_loss_status == None,
                Deal.stage.in_(['prospecting', 'discovery', 'eval', 'negotiation'])
            ).all()
            for deal in active_deals:
                for dc in deal.competitors:
                    active_deal_entity_ids.add(dc.entity_id)

            # Fetch all stale active entities
            stale_entities = db.query(Entity).filter(
                Entity.status == 'active',
                (Entity.last_enriched_at == None) | (Entity.last_enriched_at < cutoff)
            ).all()

            # Sort: deal-related first, then by entity_type priority
            type_priority = {'competitor': 1, 'target': 2, 'partner': 3}

            def sort_key(e):
                deal_priority = 0 if e.id in active_deal_entity_ids else 1
                type_prio = type_priority.get(e.entity_type, 9)
                return (deal_priority, type_prio)

            stale_entities.sort(key=sort_key)
            to_enrich = [{"id": e.id, "name": e.name, "type": e.entity_type} for e in stale_entities]

        if not to_enrich:
            print("[enrichment_sweep] No stale entities found.")
            return

        print(f"[enrichment_sweep] Found {len(to_enrich)} stale entities")

        from ai.enrichment_agent import EnrichmentAgent
        agent = EnrichmentAgent()

        for entity_info in to_enrich:
            try:
                print(f"[enrichment_sweep] Enriching {entity_info['name']} ({entity_info['type']})")
                result = agent.enrich(entity_info["id"])
                steps = result.get("steps_completed", [])
                errors = result.get("errors", [])
                print(f"[enrichment_sweep] {entity_info['name']}: completed={steps}, errors={errors}")
            except Exception as e:
                print(f"[enrichment_sweep] Failed {entity_info['name']}: {e}")

        print(f"[enrichment_sweep] Completed at {datetime.utcnow().isoformat()}")

    except Exception as e:
        print(f"[enrichment_sweep] Fatal error: {e}")
