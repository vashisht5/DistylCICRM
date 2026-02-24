"""Bi-weekly Monday 8am: build digest"""
from datetime import datetime

def run_digest_builder():
    print(f"📰 Digest builder: {datetime.utcnow().isoformat()}")
    try:
        from ai.digest_agent import DigestAgent
        DigestAgent().generate()
    except Exception as e:
        print(f"❌ Digest builder error: {e}")
