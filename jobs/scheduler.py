"""APScheduler setup — all background jobs"""
import os
from datetime import datetime

_scheduler = None


def start_scheduler():
    global _scheduler

    if _scheduler and _scheduler.running:
        return _scheduler

    from apscheduler.schedulers.background import BackgroundScheduler

    database_url = os.getenv('DATABASE_URL', 'sqlite:///distyl_intel.db')
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)

    try:
        from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
        jobstores = {'default': SQLAlchemyJobStore(url=database_url)}
    except Exception:
        jobstores = {}

    _scheduler = BackgroundScheduler(jobstores=jobstores, timezone='UTC')

    from jobs.news_refresh import run_news_refresh
    from jobs.signal_sweep import run_signal_sweep
    from jobs.autonomy_loop import run_autonomy_loop
    from jobs.people_sweep import run_people_sweep
    from jobs.digest_builder import run_digest_builder

    # Autonomy loop: every 30 minutes
    _scheduler.add_job(
        run_autonomy_loop, 'interval', minutes=30,
        id='autonomy_loop', replace_existing=True,
        next_run_time=datetime.utcnow()
    )

    # News refresh: every 2 hours
    _scheduler.add_job(
        run_news_refresh, 'interval', hours=2,
        id='news_refresh', replace_existing=True
    )

    # Signal sweep: every 6 hours
    _scheduler.add_job(
        run_signal_sweep, 'interval', hours=6,
        id='signal_sweep', replace_existing=True
    )

    # People sweep: daily 7am UTC
    _scheduler.add_job(
        run_people_sweep, 'cron', hour=7, minute=0,
        id='people_sweep', replace_existing=True
    )

    # Digest builder: bi-weekly Monday 8am UTC
    _scheduler.add_job(
        run_digest_builder, 'cron', day_of_week='mon', hour=8, minute=0,
        id='digest_builder', replace_existing=True
    )

    _scheduler.start()
    print(f"✅ Scheduler started with {len(_scheduler.get_jobs())} jobs")
    return _scheduler


def get_scheduler():
    return _scheduler
