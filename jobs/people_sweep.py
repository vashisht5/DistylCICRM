"""Daily 7am: exec movement detection"""
from datetime import datetime

def run_people_sweep():
    print(f"👥 People sweep: {datetime.utcnow().isoformat()}")
    try:
        from database import get_db
        import models
        with get_db() as db:
            count = db.query(models.Person).filter(models.Person.status == 'active').count()
        print(f"  → {count} people tracked (LinkedIn integration pending)")
    except Exception as e:
        print(f"❌ People sweep error: {e}")
