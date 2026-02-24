"""
Distyl competitive context — products, positioning, known exposure
"""

DISTYL_PRODUCTS = {
    "Eagle": {
        "description": "Autonomous AI agent for healthcare prior authorization and utilization management",
        "target_buyers": ["Health Plans", "TPAs", "PBMs"],
        "key_outcomes": ["90%+ auto-determination rate", "Real-time clinical decision support", "Auditability"],
        "differentiators": ["Governed reasoning chains", "Production ownership", "Clinical evidence integration"]
    },
    "Tower": {
        "description": "Intelligent document processing for claims and appeals",
        "target_buyers": ["Health Plans", "Claims processors", "Revenue Cycle"],
        "key_outcomes": ["Claims automation", "Appeals/case summarization", "Error reduction"],
        "differentiators": ["End-to-end processing", "Correctness guarantees", "Workflow integration"]
    },
    "Penny": {
        "description": "AI-native CX for healthcare member and provider interactions",
        "target_buyers": ["Health Plans", "Providers", "Patient Access"],
        "key_outcomes": ["Call deflection", "CSAT improvement", "Faster resolution"],
        "differentiators": ["Healthcare-domain LLM", "Real-time data integration", "Compliance-aware responses"]
    },
    "Platform": {
        "description": "Governed workflow automation platform — the foundation all products run on",
        "target_buyers": ["Enterprise IT", "Digital transformation leads"],
        "key_outcomes": ["Rapid deployment", "Auditability", "Cross-functional AI orchestration"],
        "differentiators": ["Production ownership model", "Audit trails", "Human-in-the-loop controls"]
    }
}

KNOWN_USE_CASE_EXPOSURE = {
    "CX for Healthcare": {
        "competitors": ["Google Cloud Healthcare AI", "IBM Watson Health"],
        "exposure_level": "high",
        "distyl_product": "Penny",
        "notes": "GCP and IBM are strongest incumbents. Battle on speed-to-value and domain specificity."
    },
    "Claims Automation": {
        "competitors": ["Cohere"],
        "exposure_level": "high",
        "distyl_product": "Tower",
        "notes": "Cohere entering claims with general-purpose LLM. Distyl wins on correctness and auditability."
    },
    "Appeals / Case Summarization": {
        "competitors": [],
        "exposure_level": "high",
        "distyl_product": "Tower",
        "notes": "Exposed — incumbents are moving in. Whitespace narrowing fast."
    },
    "Utilization Management / Prior Auth": {
        "competitors": [],
        "exposure_level": "low",
        "distyl_product": "Eagle",
        "notes": "TRUE WHITESPACE — nobody identified as primary competitor. Move fast."
    }
}

DISTYL_POSITIONING = """
Distyl AI builds governed workflow automation for healthcare payers and providers.
Unlike hyperscalers (GCP, IBM) who sell infrastructure + DIY AI, or Cohere/OpenAI who sell raw models,
Distyl delivers production-ready AI with correctness guarantees, audit trails, and domain-specific reasoning.
We own the outcome, not just the API call. Our Production Ownership model means we are accountable for
accuracy rates, not just uptime — which is what healthcare buyers need for regulatory compliance.
"""

COMPETITIVE_FRAMEWORKS = {
    "HC_FX_METRICS": ["NRR", "NNR", "Goals", "Usage", "Expectations", "Blockers"],
    "BATTLECARD_SECTIONS": [
        "One-line positioning",
        "Where we win",
        "Where they win",
        "Trap-setting questions",
        "Proof points",
        "Landmines to avoid",
        "Pricing framing",
        "Champion enablement",
        "Escalation path"
    ]
}

DISTYL_SYSTEM_CONTEXT = f"""You are the Distyl AI Competitive Intelligence engine. Distyl AI builds healthcare AI — specifically governed workflow automation for health plans, TPAs, and providers.

Our Products:
- Eagle: {DISTYL_PRODUCTS['Eagle']['description']}
- Tower: {DISTYL_PRODUCTS['Tower']['description']}
- Penny: {DISTYL_PRODUCTS['Penny']['description']}
- Platform: {DISTYL_PRODUCTS['Platform']['description']}

Known Competitive Exposure:
- CX for Healthcare: GCP + IBM (high exposure) → Penny
- Claims Automation: Cohere (high exposure) → Tower
- Appeals/Case Summarization: Exposed, incumbents moving in → Tower
- Utilization Management: Whitespace — nobody identified → Eagle

Positioning: {DISTYL_POSITIONING.strip()}

Always analyze through the lens of: where does this development affect Distyl's deals, prospects, or positioning?
Be specific about which Distyl product(s) are relevant. Never hallucinate — cite sources, flag uncertainty,
and state confidence levels (High/Medium/Low) on every material claim."""
