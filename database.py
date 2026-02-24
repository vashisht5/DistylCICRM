"""
Database connection and session management for Distyl Intel Portal
Supports both PostgreSQL (production) and SQLite (local testing)
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, scoped_session
from contextlib import contextmanager

DATABASE_URL = os.getenv('DATABASE_URL')

if not DATABASE_URL:
    DATABASE_URL = 'sqlite:///distyl_intel.db'
    print("Using SQLite database (distyl_intel.db)")
elif DATABASE_URL.startswith('postgres://'):
    DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
    print(f"Using PostgreSQL: {DATABASE_URL.split('@')[0]}@***")
elif DATABASE_URL.startswith('postgresql://'):
    print(f"Using PostgreSQL: {DATABASE_URL.split('@')[0]}@***")
else:
    print(f"Using database: {DATABASE_URL}")

if DATABASE_URL.startswith('sqlite'):
    engine = create_engine(
        DATABASE_URL,
        connect_args={'check_same_thread': False},
        echo=False
    )
else:
    engine = create_engine(
        DATABASE_URL,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        echo=False
    )

SessionLocal = scoped_session(sessionmaker(autocommit=False, autoflush=False, bind=engine))
Base = declarative_base()

def init_db():
    """Initialize database - create all tables"""
    Base.metadata.create_all(bind=engine)
    print("Database tables created/verified")

@contextmanager
def get_db():
    """Context manager for database sessions"""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

def get_db_session():
    """Get a new database session"""
    return SessionLocal()
