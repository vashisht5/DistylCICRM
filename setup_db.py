"""Initialize the Distyl Intel database"""
import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from database import init_db, get_db
import models
from datetime import datetime

def seed_initial_data():
    """Seed known competitors and target accounts"""
    with get_db() as db:
        if db.query(models.Entity).count() > 0:
            print("Database already has data, skipping seed")
            return

        print("Seeding initial entities...")

        entities = [
            {
                "name": "Cohere",
                "entity_type": "competitor",
                "website": "https://cohere.com",
                "description": "Enterprise AI platform for NLP and text generation, strong in claims automation",
                "industry": "AI/ML",
                "primary_use_cases": ["Claims Automation", "Document Processing", "NLP"],
                "distyl_exposure": "high",
                "threat_level": "high",
                "status": "active"
            },
            {
                "name": "Google Cloud Healthcare AI",
                "entity_type": "competitor",
                "website": "https://cloud.google.com/healthcare-api",
                "description": "GCP healthcare AI suite -- strong in CX for Healthcare use cases",
                "industry": "Cloud/AI",
                "primary_use_cases": ["CX for Healthcare", "Clinical NLP", "Document AI"],
                "distyl_exposure": "high",
                "threat_level": "critical",
                "status": "active"
            },
            {
                "name": "IBM Watson Health",
                "entity_type": "competitor",
                "website": "https://www.ibm.com/watson-health",
                "description": "IBM AI for healthcare -- CX for Healthcare and clinical decision support",
                "industry": "Enterprise AI",
                "primary_use_cases": ["CX for Healthcare", "Clinical Analytics", "Prior Auth"],
                "distyl_exposure": "high",
                "threat_level": "high",
                "status": "active"
            },
            {
                "name": "Palantir",
                "entity_type": "competitor",
                "website": "https://www.palantir.com",
                "description": "Data analytics and AI operations platform, enterprise government and commercial",
                "industry": "AI/Analytics",
                "primary_use_cases": ["Healthcare Operations", "Clinical Data", "Compliance"],
                "distyl_exposure": "medium",
                "threat_level": "medium",
                "status": "active"
            },
        ]

        for e in entities:
            entity = models.Entity(**e)
            db.add(entity)

        db.commit()
        print(f"Seeded {len(entities)} entities")

if __name__ == "__main__":
    print("Initializing Distyl Intel database...")
    init_db()
    seed_initial_data()
    print("Database ready!")
