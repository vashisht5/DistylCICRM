"""Every 30 min: AI autonomy engine"""
def run_autonomy_loop():
    try:
        from ai.autonomy_engine import AutonomyEngine
        AutonomyEngine().run()
    except Exception as e:
        print(f"❌ Autonomy loop error: {e}")
