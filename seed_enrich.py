"""
Full enrichment seed — competitors, people, signals, news, battle cards,
dossiers, partnerships, deal competitors, digests, war room data, and users.
Safe to re-run (checks existence before inserting).
"""
from datetime import datetime, timedelta
import json
from database import get_db, init_db
import models

ADMIN_USER_ID = 1

def run():
    init_db()
    with get_db() as db:
        _enrich_competitors(db)
        _seed_people(db)
        _seed_signals(db)
        _seed_news(db)
        _seed_partnerships(db)
        _seed_deal_competitors(db)
        _seed_battle_cards(db)
        _seed_dossiers(db)
        _seed_digests(db)
        _seed_meeting_notes(db)
        _seed_extra_wargames(db)
    print("\n✅ Full enrichment complete!")
    _print_summary()


# ── Enrich existing competitors ───────────────────────────────────

def _enrich_competitors(db):
    updates = {
        "Cohere": {
            "description": "Enterprise AI company specializing in LLMs for business. Strong NLP APIs, RAG pipelines, and embeddings. Growing fast in financial services.",
            "website": "https://cohere.com",
            "headquarters": "Toronto, Canada",
            "employee_count": "450",
            "funding_stage": "Series C ($270M)",
            "primary_use_cases": ["Document intelligence", "Semantic search", "Customer support automation", "Financial document processing"],
            "known_clients": ["Oracle", "Salesforce", "McKinsey", "HubSpot"],
            "products": [{"name": "Command R+", "description": "Enterprise RAG-optimized LLM"}, {"name": "Embed v3", "description": "State-of-the-art embeddings"}, {"name": "Rerank", "description": "Search relevance reranking"}],
            "distyl_exposure": "high",
            "threat_level": "high",
            "tech_stack": {"cloud": "AWS/Azure/GCP", "deployment": "API + VPC", "frameworks": ["LangChain", "LlamaIndex"]},
            "icp_score": 82,
            "icp_rationale": "Strong overlap in enterprise NLP use cases. Targeting same FS and healthcare buyers. Differentiated on pure language tasks but weaker on structured data.",
            "key_challenges": ["Lacks domain-specific fine-tuning for clinical data", "No native workflow automation", "Pricing per-token model creates cost uncertainty at scale"],
        },
        "Google Cloud Healthcare AI": {
            "description": "Google's healthcare AI suite including MedPaLM 2, Healthcare Data Engine, and DICOM/FHIR APIs. Massive distribution advantage through GCP customers.",
            "website": "https://cloud.google.com/healthcare",
            "headquarters": "Mountain View, CA",
            "employee_count": "180,000 (GCP division ~8,000)",
            "funding_stage": "Public (Alphabet)",
            "primary_use_cases": ["Clinical NLP", "Medical imaging AI", "FHIR interoperability", "Population health analytics"],
            "known_clients": ["Mayo Clinic", "Ascension", "HCA Healthcare", "NHS UK"],
            "products": [{"name": "MedPaLM 2", "description": "Medical LLM, passing USMLE"}, {"name": "Healthcare Data Engine", "description": "FHIR-native data platform"}, {"name": "Vertex AI Medical Imaging", "description": "Radiology AI"}],
            "distyl_exposure": "critical",
            "threat_level": "critical",
            "tech_stack": {"cloud": "GCP-native", "standards": ["HL7 FHIR", "DICOM"], "certifications": ["HIPAA BAA", "HITRUST"]},
            "icp_score": 91,
            "icp_rationale": "Direct overlap in healthcare AI. Distribution advantage through existing GCP/Epic relationships. Key differentiator: Distyl has deeper clinical workflow integration and doesn't lock into GCP.",
            "key_challenges": ["Requires full GCP commitment (lock-in risk)", "Generic models need heavy customization for specific specialties", "Support model is self-serve for mid-market", "Sales cycle complexity deters sub-$500K deals"],
        },
        "IBM Watson Health": {
            "description": "IBM's healthcare AI division (rebranded to Merative). Legacy market position but declining momentum. Strong in claims and utilization management.",
            "website": "https://www.merative.com",
            "headquarters": "Ann Arbor, MI",
            "employee_count": "1,400",
            "funding_stage": "Divested (formerly IBM, now Francisco Partners)",
            "primary_use_cases": ["Clinical decision support", "Claims processing", "Utilization management", "Drug discovery"],
            "known_clients": ["Truven Health", "Phytel", "Merge Healthcare"],
            "products": [{"name": "Watson for Oncology", "description": "Clinical decision support (declining)"}, {"name": "Micromedex", "description": "Drug information platform"}, {"name": "Merge PACS", "description": "Medical imaging"}],
            "distyl_exposure": "medium",
            "threat_level": "low",
            "tech_stack": {"cloud": "IBM Cloud + hybrid", "deployment": "On-prem heavy"},
            "icp_score": 44,
            "icp_rationale": "Declining threat. Merative brand transition created confusion. Modern health systems actively replacing Watson solutions. Competitive displacement opportunity.",
            "key_challenges": ["Brand damage from Watson for Oncology failures", "Technology debt from legacy architecture", "Talent exodus post-IBM divestiture", "Limited modern LLM capabilities"],
        },
        "Palantir": {
            "description": "Data analytics and AI platform serving defense, intelligence, and enterprise verticals. AIP platform adds LLM layer on Foundry. Aggressive enterprise sales motion.",
            "website": "https://palantir.com",
            "headquarters": "Denver, CO",
            "employee_count": "3,800",
            "funding_stage": "Public (NYSE: PLTR)",
            "primary_use_cases": ["Operations intelligence", "Supply chain analytics", "Financial risk", "Defense & intelligence"],
            "known_clients": ["US Army", "NHS UK", "Airbus", "BP", "Morgan Stanley"],
            "products": [{"name": "Foundry", "description": "Enterprise data platform"}, {"name": "AIP", "description": "AI Platform with LLM integration"}, {"name": "Gotham", "description": "Government intelligence platform"}],
            "distyl_exposure": "high",
            "threat_level": "high",
            "tech_stack": {"cloud": "Multi-cloud + on-prem", "ai": ["LLM integration via AIP", "Ontology layer"]},
            "icp_score": 71,
            "icp_rationale": "Strong in logistics and FS verticals — direct overlap with ClearRoute and Apex. AIP is a credible LLM wrapper. Weakness: expensive, complex, long deployment timelines.",
            "key_challenges": ["$1M+ minimum deal size alienates mid-market", "18-24 month implementation timelines", "Requires dedicated Palantir engineers on-site", "Perception as 'government surveillance tech' in some buyers"],
        },
    }

    for name, data in updates.items():
        e = db.query(models.Entity).filter(models.Entity.name == name).first()
        if e:
            for k, v in data.items():
                setattr(e, k, v)
            print(f"  ✓ Enriched: {name}")

    # Add two new competitors
    new_comps = [
        {
            "name": "Scale AI",
            "entity_type": "competitor",
            "description": "AI data platform and model deployment. RLHF training pipelines, data labeling at scale. Recently expanding into enterprise AI applications.",
            "website": "https://scale.com",
            "headquarters": "San Francisco, CA",
            "employee_count": "1,200",
            "funding_stage": "Series F ($1B)",
            "industry": "AI/ML",
            "primary_use_cases": ["AI training data", "Model evaluation", "Enterprise AI deployment", "Autonomous systems"],
            "known_clients": ["OpenAI", "Meta", "Toyota", "Microsoft DoD"],
            "products": [{"name": "Spellbook", "description": "Enterprise LLM deployment"}, {"name": "Donovan", "description": "Government AI platform"}, {"name": "Data Engine", "description": "AI training data pipeline"}],
            "distyl_exposure": "medium",
            "threat_level": "medium",
            "tech_stack": {"cloud": "AWS/Azure", "frameworks": ["PyTorch", "custom RLHF"]},
            "icp_score": 55,
            "icp_rationale": "Growing into enterprise applications. Not a direct competitor today but expanding into verticals. Watch for 12-18 months.",
            "key_challenges": ["Not known for vertical-specific deployments", "Primary business still data labeling", "Enterprise AI product is early-stage"],
            "status": "active",
        },
        {
            "name": "Abridge",
            "entity_type": "competitor",
            "description": "Clinical AI company focused on ambient AI and medical documentation. UCSF-spinout. Strong in Epic's App Orchard. Direct competitor in healthcare documentation use case.",
            "website": "https://abridge.com",
            "headquarters": "Pittsburgh, PA",
            "employee_count": "185",
            "funding_stage": "Series C ($150M)",
            "industry": "Healthcare AI",
            "primary_use_cases": ["Ambient clinical documentation", "Visit summarization", "Clinical note generation"],
            "known_clients": ["UPMC", "Kaiser Permanente", "Mayo Clinic", "Epic App Orchard partner"],
            "products": [{"name": "Abridge Clinical AI", "description": "Ambient documentation platform"}, {"name": "Epic integration", "description": "Native Epic App Orchard"}],
            "distyl_exposure": "critical",
            "threat_level": "critical",
            "tech_stack": {"cloud": "AWS", "integrations": ["Epic", "Cerner"], "certifications": ["HIPAA", "SOC2"]},
            "icp_score": 88,
            "icp_rationale": "Most direct competitor in healthcare documentation. Native Epic integration is their strongest card. Distyl needs to differentiate on breadth beyond documentation.",
            "key_challenges": ["Narrow use case (documentation only)", "No analytics or population health capabilities", "Small team limits enterprise support capacity"],
            "status": "active",
        },
    ]
    for c in new_comps:
        if not db.query(models.Entity).filter(models.Entity.name == c["name"]).first():
            db.add(models.Entity(**c))
            print(f"  + Competitor: {c['name']}")
    db.flush()


# ── People ────────────────────────────────────────────────────────

def _seed_people(db):
    # Get entity IDs
    def eid(name):
        e = db.query(models.Entity).filter(models.Entity.name == name).first()
        return e.id if e else None

    people = [
        # Cohere
        {"entity_id": eid("Cohere"), "first_name": "Aidan", "last_name": "Gomez", "title": "CEO & Co-founder", "current_company": "Cohere", "person_type": "executive", "distyl_relationship": "competitor", "linkedin_url": "https://linkedin.com/in/aidan-gomez", "notes": "Oxford PhD, former Google Brain. Very active on AI safety/enterprise panels. Often cited in press."},
        {"entity_id": eid("Cohere"), "first_name": "Nick", "last_name": "Frosst", "title": "Co-founder & VP Research", "current_company": "Cohere", "person_type": "executive", "distyl_relationship": "competitor", "notes": "Former Google Brain. Leads model research."},
        {"entity_id": eid("Cohere"), "first_name": "Sara", "last_name": "Hooker", "title": "VP of Research", "current_company": "Cohere", "person_type": "executive", "distyl_relationship": "known", "notes": "Former Google Brain. Conference circuit speaker. Strong academic credibility."},
        # Google Cloud Healthcare AI
        {"entity_id": eid("Google Cloud Healthcare AI"), "first_name": "Karen", "last_name": "DeSalvo", "title": "Chief Health Officer", "current_company": "Google", "person_type": "executive", "distyl_relationship": "competitor", "linkedin_url": "https://linkedin.com/in/karendesalvo", "notes": "Former US Assistant Secretary for Health. Key validator for Google's healthcare credibility."},
        {"entity_id": eid("Google Cloud Healthcare AI"), "first_name": "Michael", "last_name": "Howell", "title": "Chief Clinical Officer, Google Health", "current_company": "Google", "person_type": "executive", "distyl_relationship": "competitor", "notes": "MD/PhD. Published MedPaLM papers. Conference speaker on clinical AI."},
        # Palantir
        {"entity_id": eid("Palantir"), "first_name": "Alex", "last_name": "Karp", "title": "CEO", "current_company": "Palantir", "person_type": "executive", "distyl_relationship": "competitor", "linkedin_url": "https://linkedin.com/in/alexkarp", "notes": "Very public CEO. Philosophical, provocative. Strong government/defense relationships."},
        {"entity_id": eid("Palantir"), "first_name": "Shyam", "last_name": "Sankar", "title": "CTO", "current_company": "Palantir", "person_type": "executive", "distyl_relationship": "competitor", "notes": "Leads technical strategy. AIP platform architect. Former NSA connection."},
        {"entity_id": eid("Palantir"), "first_name": "Kevin", "last_name": "Kawasaki", "title": "Chief Business Affairs Officer", "current_company": "Palantir", "person_type": "executive", "distyl_relationship": "known", "notes": "Enterprise commercial lead. Previously met at JP Morgan conference."},
        # Abridge
        {"entity_id": eid("Abridge"), "first_name": "Shiv", "last_name": "Rao", "title": "CEO & Co-founder", "current_company": "Abridge", "person_type": "executive", "distyl_relationship": "competitor", "notes": "Cardiologist + Stanford AI. Founded Abridge. Very well-regarded in clinical AI circles. Frequently quoted in WSJ/NEJM."},
        {"entity_id": eid("Abridge"), "first_name": "Zack", "last_name": "Lipton", "title": "Chief Scientist", "current_company": "Abridge", "person_type": "executive", "distyl_relationship": "competitor", "notes": "CMU ML professor. Academic credibility is a key sales asset for Abridge."},
        # Meridian Health Systems people
        {"entity_id": eid("Meridian Health Systems"), "first_name": "Thomas", "last_name": "Hargrove", "title": "Chief Information Officer", "current_company": "Meridian Health Systems", "person_type": "target_contact", "distyl_relationship": "unknown", "notes": "CIO — not yet engaged. Rumored to favor Google Cloud. Key blocker risk. Reports to CEO."},
        {"entity_id": eid("Meridian Health Systems"), "first_name": "Dr. James", "last_name": "Whitfield", "title": "Chief Medical Officer", "current_company": "Meridian Health Systems", "person_type": "target_contact", "distyl_relationship": "warm", "notes": "CMO. Met briefly at HIMSS. Enthusiastic about clinical AI reducing physician burnout. Could be secondary champion."},
        # Apex Financial Group people
        {"entity_id": eid("Apex Financial Group"), "first_name": "David", "last_name": "Cho", "title": "Chief Technology Officer", "current_company": "Apex Financial Group", "person_type": "target_contact", "distyl_relationship": "unknown", "notes": "CTO — Jordan's boss. Has final technical sign-off. Engineering background, ex-Two Sigma. Skeptical of vendor solutions."},
        # ClearRoute people
        {"entity_id": eid("ClearRoute Logistics"), "first_name": "Ray", "last_name": "Fontaine", "title": "Chief Executive Officer", "current_company": "ClearRoute Logistics", "person_type": "target_contact", "distyl_relationship": "unknown", "notes": "CEO. Not involved yet. If Sandra escalates the deal to CEO level, this is who we'd meet."},
    ]

    added = 0
    for p in people:
        if not p["entity_id"]:
            continue
        exists = db.query(models.Person).filter(
            models.Person.entity_id == p["entity_id"],
            models.Person.first_name == p["first_name"],
            models.Person.last_name == p["last_name"],
        ).first()
        if not exists:
            db.add(models.Person(status="active", **p))
            added += 1
    print(f"  + {added} people added")
    db.flush()


# ── Signals ───────────────────────────────────────────────────────

def _seed_signals(db):
    def eid(name):
        e = db.query(models.Entity).filter(models.Entity.name == name).first()
        return e.id if e else None

    signals = [
        # Cohere signals
        {
            "entity_id": eid("Cohere"), "signal_type": "partnership",
            "title": "Cohere signs enterprise partnership with Oracle Cloud Infrastructure",
            "summary": "Cohere's Command R+ models are now natively available on Oracle Cloud, giving them access to Oracle's 430,000 enterprise customers. This significantly expands their distribution in financial services and healthcare verticals where Oracle has deep penetration.",
            "source_url": "https://techcrunch.com/2026/02/15/cohere-oracle",
            "source_name": "TechCrunch", "source_type": "news",
            "source_date": datetime.utcnow() - timedelta(days=17),
            "score": 85, "score_rationale": "High relevance — Oracle presence in healthcare creates direct competitive overlap with Meridian deal.",
            "status": "new",
        },
        {
            "entity_id": eid("Cohere"), "signal_type": "product_launch",
            "title": "Cohere launches Command R+ with RAG optimization for enterprise documents",
            "summary": "New model features 128K context window, structured data extraction, and 30% improvement on financial document benchmarks. Pricing at $2.50/1M tokens — aggressive positioning against GPT-4o.",
            "source_url": "https://cohere.com/blog/command-r-plus",
            "source_name": "Cohere Blog", "source_type": "vendor_blog",
            "source_date": datetime.utcnow() - timedelta(days=8),
            "score": 78, "score_rationale": "Product improvement relevant to Apex Financial eval — we should update our benchmarks.",
            "status": "new",
        },
        # Google Healthcare signals
        {
            "entity_id": eid("Google Cloud Healthcare AI"), "signal_type": "customer_win",
            "title": "Google MedPaLM 2 deployed at Mayo Clinic for clinical documentation",
            "summary": "Mayo Clinic announced production deployment of MedPaLM 2 for 2,000 physicians. Results: 45-minute reduction in daily documentation time per physician. This is a direct reference story Google will use against us in all healthcare deals.",
            "source_url": "https://nejm.org/google-medpalm-mayo",
            "source_name": "NEJM AI", "source_type": "journal",
            "source_date": datetime.utcnow() - timedelta(days=22),
            "score": 95, "score_rationale": "CRITICAL — Mayo Clinic is a Tier 1 reference. Google will weaponize this in every healthcare deal we're in. Must prepare counter-narrative.",
            "status": "new",
        },
        {
            "entity_id": eid("Google Cloud Healthcare AI"), "signal_type": "exec_change",
            "title": "Google Cloud Healthcare names new GM focused on health system enterprise sales",
            "summary": "Former Epic executive Michael Torres joins Google as GM of Healthcare. His Epic pedigree will accelerate Google's penetration into Epic-native environments — directly threatening our EHR integration differentiation.",
            "source_url": "https://healthcareitnews.com/google-gm",
            "source_name": "Healthcare IT News", "source_type": "news",
            "source_date": datetime.utcnow() - timedelta(days=5),
            "score": 88, "score_rationale": "Exec hire with Epic background is a major competitive signal. Meridian deal at risk.",
            "status": "new",
        },
        # Palantir signals
        {
            "entity_id": eid("Palantir"), "signal_type": "product_launch",
            "title": "Palantir AIP Bootcamp expands to logistics and supply chain verticals",
            "summary": "Palantir's 5-day AIP bootcamp program now available for logistics companies. Quick deployment model reduces the traditional 18-month implementation barrier. ClearRoute could be a target for this accelerated approach.",
            "source_url": "https://palantir.com/aip-logistics",
            "source_name": "Palantir Blog", "source_type": "vendor_blog",
            "source_date": datetime.utcnow() - timedelta(days=12),
            "score": 82, "score_rationale": "Direct risk to ClearRoute deal. Palantir reducing their time-to-value objection.",
            "status": "new",
        },
        {
            "entity_id": eid("Palantir"), "signal_type": "funding",
            "title": "Palantir Q4 earnings: commercial revenue up 32% YoY, US enterprise growing fastest",
            "summary": "Palantir reports $608M revenue, beat by 4%. US commercial segment +55% driven by AIP adoption. CFO guided 25%+ growth for FY26. Hiring 400 enterprise sales reps in H1. Competitive intensity will increase significantly.",
            "source_url": "https://wsj.com/palantir-q4",
            "source_name": "WSJ", "source_type": "news",
            "source_date": datetime.utcnow() - timedelta(days=30),
            "score": 75, "score_rationale": "Increased sales investment means more competitive pressure in enterprise deals.",
            "status": "reviewed",
        },
        # Abridge signals
        {
            "entity_id": eid("Abridge"), "signal_type": "funding",
            "title": "Abridge raises $150M Series C to expand ambient AI beyond documentation",
            "summary": "New funding will fund expansion into clinical decision support, care gap identification, and population health. This directly threatens our differentiated positioning in clinical analytics. Lead investor: Andreessen Horowitz Bio Fund.",
            "source_url": "https://techcrunch.com/abridge-series-c",
            "source_name": "TechCrunch", "source_type": "news",
            "source_date": datetime.utcnow() - timedelta(days=14),
            "score": 91, "score_rationale": "HIGH PRIORITY — Abridge moving into our analytics turf. Update competitive battle card immediately.",
            "status": "new",
        },
        {
            "entity_id": eid("Abridge"), "signal_type": "partnership",
            "title": "Abridge deepens Epic integration — launches in 50 new health systems",
            "summary": "Abridge announces native Epic integration with auto-documentation in Epic's inbox and schedule views. 50 new health systems signed in Q1. Meridian Health Systems confirmed on their expansion list.",
            "source_url": "https://abridge.com/epic-expansion",
            "source_name": "Abridge Press Release", "source_type": "press_release",
            "source_date": datetime.utcnow() - timedelta(days=3),
            "score": 97, "score_rationale": "CRITICAL — Meridian is named on Abridge's expansion list. Immediate action required on Meridian deal.",
            "status": "new",
        },
        # Scale AI signal
        {
            "entity_id": eid("Scale AI"), "signal_type": "exec_change",
            "title": "Scale AI poaches Google Cloud's head of enterprise healthcare sales",
            "summary": "Strategic hire suggests Scale AI accelerating into healthcare vertical with deep pockets. Not an immediate threat but signals medium-term competitive intent.",
            "source_url": "https://linkedin.com/posts/scaleai-hire",
            "source_name": "LinkedIn", "source_type": "social",
            "source_date": datetime.utcnow() - timedelta(days=9),
            "score": 62, "score_rationale": "Watch signal — 12-18 month competitive threat developing.",
            "status": "new",
        },
    ]

    added = 0
    for s in signals:
        if not s["entity_id"]:
            continue
        exists = db.query(models.Signal).filter(
            models.Signal.title == s["title"]
        ).first()
        if not exists:
            db.add(models.Signal(ingested_at=datetime.utcnow(), created_at=datetime.utcnow(), **s))
            added += 1
    print(f"  + {added} signals added")
    db.flush()


# ── News ──────────────────────────────────────────────────────────

def _seed_news(db):
    def eid(name):
        e = db.query(models.Entity).filter(models.Entity.name == name).first()
        return e.id if e else None

    news = [
        {"entity_id": eid("Cohere"), "headline": "Cohere valuation hits $5.5B in secondary market trades ahead of rumored IPO", "summary": "Secondary market transactions value Cohere at $5.5B, up from $2.1B Series C valuation in 2023. IPO speculation mounting for H2 2026.", "url": "https://ft.com/cohere-valuation-2026", "source_name": "Financial Times", "source_type": "news", "published_at": datetime.utcnow() - timedelta(days=6), "relevance_score": 72},
        {"entity_id": eid("Cohere"), "headline": "Cohere's enterprise focus pays off: 40% of Fortune 500 now using their APIs", "summary": "Cohere reports reaching 40% of Fortune 500 via direct sales and cloud marketplace channels. Healthcare and financial services the fastest-growing segments.", "url": "https://venturebeat.com/cohere-fortune500", "source_name": "VentureBeat", "source_type": "news", "published_at": datetime.utcnow() - timedelta(days=20), "relevance_score": 80},
        {"entity_id": eid("Google Cloud Healthcare AI"), "headline": "Google DeepMind's AlphaFold 3 approved for clinical protein structure research", "summary": "FDA grants breakthrough device designation for AlphaFold applications in drug design. Strengthens Google's scientific credibility in healthcare buyer conversations.", "url": "https://nature.com/alphafold3-fda", "source_name": "Nature", "source_type": "journal", "published_at": datetime.utcnow() - timedelta(days=11), "relevance_score": 68},
        {"entity_id": eid("Google Cloud Healthcare AI"), "headline": "Google Cloud signs 10-year deal with NHS England for AI-powered diagnostics", "summary": "£1.2B contract to bring AI diagnostics to 140 NHS trusts. Includes radiology, pathology, and clinical documentation. Creates powerful European healthcare reference.", "url": "https://theguardian.com/google-nhs-deal", "source_name": "The Guardian", "source_type": "news", "published_at": datetime.utcnow() - timedelta(days=25), "relevance_score": 85},
        {"entity_id": eid("Palantir"), "headline": "Palantir AIP becomes most-adopted AI platform at US logistics companies per Gartner survey", "summary": "Gartner survey of 200 logistics CIOs puts Palantir AIP as #1 for operational AI. 28% market share vs. 12% for nearest competitor. ClearRoute's CEO cited in the survey.", "url": "https://gartner.com/palantir-logistics-survey", "source_name": "Gartner", "source_type": "research", "published_at": datetime.utcnow() - timedelta(days=18), "relevance_score": 88},
        {"entity_id": eid("Palantir"), "headline": "Palantir stock up 34% YTD on strong AIP commercial traction", "summary": "Wall Street upgrade cycle as AIP commercial deals accelerate. Three new sell-side analysts initiate with Buy rating. Karp confirms 200+ active enterprise AIP deployments.", "url": "https://barrons.com/palantir-upgrade", "source_name": "Barron's", "source_type": "news", "published_at": datetime.utcnow() - timedelta(days=4), "relevance_score": 65},
        {"entity_id": eid("Abridge"), "headline": "NEJM study: Abridge reduces documentation burden by 5.5 hours/week per physician", "summary": "Landmark randomized study at UPMC shows Abridge cuts documentation time by 5.5 hours/week, reduces burnout scores by 23%, no degradation in note quality. Will become gold-standard reference story.", "url": "https://nejm.org/abridge-rct-2026", "source_name": "NEJM", "source_type": "journal", "published_at": datetime.utcnow() - timedelta(days=7), "relevance_score": 94},
        {"entity_id": eid("Abridge"), "headline": "Abridge joins Epic App Orchard's Elite Partner tier alongside Dragon Medical", "summary": "Abridge achieves Epic Elite Partner status, meaning auto-inclusion in Epic's EHR upgrade bundles. This gives them passive distribution into every Epic upgrade cycle.", "url": "https://epicshare.com/abridge-elite", "source_name": "Epic Share", "source_type": "partner_news", "published_at": datetime.utcnow() - timedelta(days=2), "relevance_score": 96},
        {"entity_id": eid("Scale AI"), "headline": "Scale AI's Donovan platform wins $250M US Air Force contract for AI operations", "summary": "DOD contract validates Scale AI's government platform. Enterprise version of Donovan launching commercially Q2 2026 targeting logistics and financial services.", "url": "https://defensenews.com/scale-usaf", "source_name": "Defense News", "source_type": "news", "published_at": datetime.utcnow() - timedelta(days=15), "relevance_score": 58},
    ]

    added = 0
    for n in news:
        if not n["entity_id"]:
            continue
        if not db.query(models.NewsItem).filter(models.NewsItem.url == n["url"]).first():
            db.add(models.NewsItem(fetched_at=datetime.utcnow(), created_at=datetime.utcnow(), **n))
            added += 1
    print(f"  + {added} news items added")
    db.flush()


# ── Partnerships ──────────────────────────────────────────────────

def _seed_partnerships(db):
    def eid(name):
        e = db.query(models.Entity).filter(models.Entity.name == name).first()
        return e.id if e else None

    partnerships = [
        {"entity_a_id": eid("Cohere"), "entity_b_id": eid("Google Cloud Healthcare AI"), "partnership_type": "integration", "description": "Cohere models available on Google Vertex AI. Both companies compete in healthcare and finance but cooperate on cloud distribution.", "strength": "medium"},
        {"entity_a_id": eid("Palantir"), "entity_b_id": eid("IBM Watson Health"), "partnership_type": "reseller", "description": "Palantir Foundry integrates with IBM/Merative clinical data assets for health system analytics. Legacy partnership from IBM Watson era.", "strength": "weak"},
        {"entity_a_id": eid("Abridge"), "entity_b_id": eid("Google Cloud Healthcare AI"), "partnership_type": "technology", "description": "Abridge runs on Google Cloud and co-markets with Google Health. Google invested in Abridge's Series B.", "strength": "strong"},
    ]

    added = 0
    for p in partnerships:
        if not p["entity_a_id"] or not p["entity_b_id"]:
            continue
        exists = db.query(models.Partnership).filter(
            models.Partnership.entity_a_id == p["entity_a_id"],
            models.Partnership.entity_b_id == p["entity_b_id"],
        ).first()
        if not exists:
            db.add(models.Partnership(created_at=datetime.utcnow(), **p))
            added += 1
    print(f"  + {added} partnerships added")
    db.flush()


# ── Deal Competitors ──────────────────────────────────────────────

def _seed_deal_competitors(db):
    def eid(name):
        e = db.query(models.Entity).filter(models.Entity.name == name).first()
        return e.id if e else None

    def did(name):
        d = db.query(models.Deal).filter(models.Deal.account_name == name).first()
        return d.id if d else None

    deal_comps = [
        # Meridian — Google Cloud and Abridge are in the mix
        {"deal_id": did("Meridian Health Systems"), "entity_id": eid("Google Cloud Healthcare AI"), "involvement": "shortlisted", "source": "customer_intel"},
        {"deal_id": did("Meridian Health Systems"), "entity_id": eid("Abridge"), "involvement": "shortlisted", "source": "signal_alert"},
        {"deal_id": did("Meridian Health Systems"), "entity_id": eid("Cohere"), "involvement": "evaluated", "source": "customer_intel"},
        # Apex — Palantir and in-house
        {"deal_id": did("Apex Financial Group"), "entity_id": eid("Palantir"), "involvement": "shortlisted", "source": "customer_intel"},
        {"deal_id": did("Apex Financial Group"), "entity_id": eid("Cohere"), "involvement": "evaluated", "source": "customer_intel"},
        # ClearRoute — Palantir
        {"deal_id": did("ClearRoute Logistics"), "entity_id": eid("Palantir"), "involvement": "shortlisted", "source": "customer_intel"},
    ]

    added = 0
    for dc in deal_comps:
        if not dc["deal_id"] or not dc["entity_id"]:
            continue
        exists = db.query(models.DealCompetitor).filter(
            models.DealCompetitor.deal_id == dc["deal_id"],
            models.DealCompetitor.entity_id == dc["entity_id"],
        ).first()
        if not exists:
            db.add(models.DealCompetitor(added_at=datetime.utcnow(), **dc))
            added += 1
    print(f"  + {added} deal competitors added")
    db.flush()


# ── Battle Cards ──────────────────────────────────────────────────

def _seed_battle_cards(db):
    def eid(name):
        e = db.query(models.Entity).filter(models.Entity.name == name).first()
        return e.id if e else None

    cards = [
        {
            "entity_id": eid("Google Cloud Healthcare AI"),
            "use_case": "Clinical Documentation & EHR Integration",
            "distyl_product": "platform",
            "status": "approved",
            "content": {
                "competitor_summary": "Google Cloud Healthcare AI (MedPaLM 2 + Healthcare Data Engine). Enormous brand and distribution. Native FHIR APIs. Just deployed at Mayo Clinic for 2,000 physicians. Growing through Epic partnership.",
                "our_strengths": [
                    "True Epic-native integration — no middleware, no export/import cycle",
                    "Specialty-specific fine-tuning (cardiology, oncology, ED) vs. Google's general medical model",
                    "No GCP lock-in — deploy on any cloud or on-prem",
                    "Dedicated clinical success team (not self-serve)",
                    "Faster time-to-value: 8 weeks vs. Google's 6-12 month implementation",
                ],
                "their_strengths": [
                    "Mayo Clinic and NHS reference stories",
                    "MedPaLM 2 passing USMLE creates clinical credibility",
                    "Unlimited R&D resources",
                    "GCP distribution to existing healthcare customers",
                ],
                "landmines": [
                    "Ask: 'What percentage of your implementation is on GCP vs. on-prem?' (Forces GCP lock-in admission)",
                    "Ask: 'Can you show a reference at a health system our size with comparable Epic configuration?' (Mayo is atypical)",
                    "Ask: 'What is your dedicated CSM-to-customer ratio?' (Google is 1:50+, we are 1:8)",
                    "Ask: 'How do you handle custom Epic workflows not in their standard templates?' (They can't)",
                ],
                "objection_handling": {
                    "Google has Mayo Clinic": "Mayo is a unique institution with 200 dedicated data scientists. Ask them to show a reference from a 5-10 hospital regional system like yours. We have three.",
                    "Google has unlimited resources": "That's why their minimum engagement is $2M and 12 months. We right-size to your timeline and budget.",
                    "MedPaLM passed USMLE": "USMLE tests medical knowledge, not clinical workflow integration. Our benchmark is 30% reduction in documentation time in production — in your specialty.",
                },
                "win_themes": [
                    "Epic-native depth, not breadth",
                    "Right-sized for regional health systems",
                    "No cloud lock-in",
                    "Clinical specialty expertise",
                ],
                "trap_questions": [
                    "How many health systems your size are in production with MedPaLM today?",
                    "What is the full implementation timeline and cost including GCP migration?",
                    "How does your model handle our Epic Cosmos configuration specifically?",
                ],
            },
        },
        {
            "entity_id": eid("Abridge"),
            "use_case": "Clinical Documentation & Physician Burnout",
            "distyl_product": "platform",
            "status": "approved",
            "content": {
                "competitor_summary": "Abridge — Epic Elite Partner, ambient AI documentation focused. NEJM study showing 5.5 hrs/week saved. Series C $150M. Growing into clinical decision support. Direct threat in healthcare documentation use case.",
                "our_strengths": [
                    "Full clinical analytics platform — documentation is one of 6 modules, not the only one",
                    "Population health, quality reporting, and care gap identification built-in",
                    "Abridge requires add-on licensing for each use case; we bundle",
                    "Our model is fine-tuned per specialty AND per Epic instance configuration",
                    "Broader ROI story: $4.2M/year vs. Abridge's documentation-only $1.8M",
                ],
                "their_strengths": [
                    "NEJM RCT is gold-standard clinical evidence",
                    "Epic Elite Partner = passive distribution in every upgrade",
                    "Narrower product = faster implementation (4 weeks vs. our 8)",
                    "Shiv Rao's clinical credibility opens CMO doors we struggle with",
                ],
                "landmines": [
                    "Ask: 'When you expand beyond documentation, do you license additional modules or is it included?' (Nickels and dimes)",
                    "Ask: 'What does your roadmap look like for population health and quality reporting?' (Not on their roadmap)",
                    "Ask: 'Can you show the ROI from analytics beyond documentation time savings?' (They can't)",
                    "Ask: 'What happens when your Epic Elite status creates a conflict with Epic's own AI features?'",
                ],
                "objection_handling": {
                    "Abridge has the NEJM study": "We welcome rigorous clinical evidence — we have 3 peer-reviewed studies on our platform outcomes. And our ROI extends well beyond documentation into quality and population health.",
                    "Abridge is already in Epic App Orchard": "Epic App Orchard presence means basic integration. We are Epic-native at the data model level — not a middleware connector. Ask them to show you their HL7 FHIR schema for your Epic instance.",
                    "Abridge is focused only on documentation": "Exactly. When you expand to care gap identification, quality reporting, and prior auth automation next year, you'll need to buy a separate platform or replace Abridge.",
                },
                "win_themes": [
                    "Platform breadth vs. point solution",
                    "Total ROI beyond documentation",
                    "Epic-native at data model level",
                    "Single vendor for full clinical AI roadmap",
                ],
                "trap_questions": [
                    "What is your 3-year total cost including all clinical AI use cases, not just documentation?",
                    "How do you handle care gap identification and population health — is that in scope?",
                    "What is your integration model with our specific Epic Cosmos build?",
                ],
            },
        },
        {
            "entity_id": eid("Palantir"),
            "use_case": "Enterprise AI Platform — Logistics & Financial Services",
            "distyl_product": "platform",
            "status": "approved",
            "content": {
                "competitor_summary": "Palantir AIP — Foundry + LLM layer. Strong in logistics (Gartner #1) and financial services. AIP Bootcamp reduces implementation time. Alex Karp's aggressive positioning creates deal pressure. $1M+ minimum.",
                "our_strengths": [
                    "No $1M minimum — right-sized for $250K-$500K mid-market deals",
                    "Deployment in 6 weeks vs. Palantir's 6-18 months",
                    "No dedicated Palantir engineers required on-site (reduces dependency)",
                    "Transparent pricing — no 'bootcamp' plus license plus PS confusion",
                    "Vertical-specific ML models vs. Palantir's general Ontology layer",
                ],
                "their_strengths": [
                    "Gartner #1 in logistics AI — powerful reference in ClearRoute conversations",
                    "Alex Karp's media presence creates executive-level brand recognition",
                    "AIP Bootcamp reduces time-to-value objection",
                    "Strong government references create enterprise credibility",
                ],
                "landmines": [
                    "Ask: 'What is the total 3-year cost including bootcamp, licensing, PS, and dedicated FTEs?' (Often 3-4x the headline)",
                    "Ask: 'What is the typical ratio of Palantir engineers to customer engineers required post-deployment?' (Customers often need 2-3 dedicated FTEs)",
                    "Ask: 'Can you show a reference of a company our size that went live in under 6 months?' (Rare)",
                    "Ask: 'What happens to our data and models if we decide not to renew?' (Lock-in)",
                ],
                "objection_handling": {
                    "Palantir is Gartner #1 in logistics": "For $100M+ companies running 12-18 month programs. Ask them for three references under $5B revenue who went live in under 6 months. We'll show you five.",
                    "We already know Palantir from their bootcamp": "Bootcamps are sales tools. Get the total 3-year cost in writing before comparing. Factor in the 2-3 FTEs you'll need to maintain their Ontology layer.",
                    "Palantir has government references": "Government programs have unlimited budgets and timelines. Show me a commercial logistics company that achieved your specific KPIs within your budget.",
                },
                "win_themes": [
                    "Faster time-to-value (6 weeks vs. 18 months)",
                    "True total cost of ownership transparency",
                    "Right-sized for mid-market without Palantir tax",
                    "No ongoing dependency on vendor engineers",
                ],
                "trap_questions": [
                    "What is the total 3-year cost including all services, licenses, and required staffing?",
                    "How many customer engineers are needed post-deployment to maintain the system?",
                    "Can you show a logistics reference that achieved our specific KPIs in under 6 months?",
                ],
            },
        },
        {
            "entity_id": eid("Cohere"),
            "use_case": "Enterprise NLP & Document Intelligence",
            "distyl_product": "analytics",
            "status": "approved",
            "content": {
                "competitor_summary": "Cohere — best-in-class enterprise NLP APIs. Command R+ with RAG optimization. Strong in document processing, semantic search. Not a full platform — API-first, requires significant engineering to build workflows.",
                "our_strengths": [
                    "End-to-end platform vs. Cohere's API building blocks",
                    "No in-house ML engineering team required",
                    "Pre-built workflow connectors (Salesforce, Snowflake, Oracle, SAP)",
                    "Vertical-specific fine-tuning included vs. Cohere's generic model",
                    "Managed service with SLAs vs. Cohere's best-effort API",
                ],
                "their_strengths": [
                    "State-of-the-art NLP benchmarks — Command R+ leads on MTEB",
                    "More flexibility for teams who want to build custom",
                    "Per-token pricing can be cheaper at small scale",
                    "Oracle and Salesforce distribution",
                ],
                "landmines": [
                    "Ask: 'Who on your team will own the RAG pipeline, vector DB, chunking strategy, and prompt engineering?' (Requires an ML engineer)",
                    "Ask: 'What is your total cost when you add engineering time, infrastructure, and ongoing maintenance?' (Often 5-10x the token cost)",
                    "Ask: 'What happens when the model is updated and your prompts break?'",
                ],
                "objection_handling": {
                    "Cohere's benchmarks are better": "Benchmarks measure generic language tasks. Our benchmark is your specific workflow — document extraction accuracy on your contract formats, or answer quality on your product documentation.",
                    "We want flexibility to build our own": "Absolutely — and budget 2 ML engineers for 6 months to build it. Our platform exists for teams who want outcomes in 6 weeks, not capabilities in 6 months.",
                },
                "win_themes": [
                    "Platform outcomes vs. API building blocks",
                    "No ML engineering overhead",
                    "Faster time-to-value",
                    "Vertical-specific accuracy",
                ],
                "trap_questions": [
                    "Who will own the ML engineering to build and maintain your RAG pipeline?",
                    "What is your total build cost including 2 years of engineering and infrastructure?",
                    "How will you handle model versioning and prompt maintenance when Cohere updates their models?",
                ],
            },
        },
    ]

    added = 0
    for card in cards:
        if not card["entity_id"]:
            continue
        exists = db.query(models.BattleCard).filter(
            models.BattleCard.entity_id == card["entity_id"],
            models.BattleCard.use_case == card["use_case"],
        ).first()
        if not exists:
            db.add(models.BattleCard(
                version=1,
                generated_at=datetime.utcnow(),
                approved_by=ADMIN_USER_ID,
                **card
            ))
            added += 1
    print(f"  + {added} battle cards added")
    db.flush()


# ── Dossiers ──────────────────────────────────────────────────────

def _seed_dossiers(db):
    def eid(name):
        e = db.query(models.Entity).filter(models.Entity.name == name).first()
        return e.id if e else None

    dossiers = [
        {
            "entity_id": eid("Abridge"),
            "version": 1,
            "generation_status": "complete",
            "overall_confidence": "high",
            "source_count": 24,
            "section_a_synopsis": "Abridge is a clinical AI company founded in 2018, spun out of Carnegie Mellon and UPMC. Specializes in ambient AI for medical documentation — recording patient-physician conversations and auto-generating clinical notes. Now the #2 clinical documentation AI after Nuance/DAX. $150M Series C (a16z bio). ~185 employees. Epic Elite Partner as of March 2026.",
            "section_b_business_model": "Subscription SaaS per physician per year ($3,000-$5,000/yr). Volume discounts at enterprise scale. Professional services for Epic integration. Recent expansion into annual platform licensing for 'full clinical AI suite.' Revenue estimated $45-60M ARR, growing ~200% YoY.",
            "section_c_products": "1) Abridge Clinical AI — ambient documentation platform, real-time note generation during patient visits. 2) Epic App Orchard Integration — native connector, now Elite tier. 3) Abridge Insights (beta) — population health analytics layer. NEJM-validated outcomes: 5.5 hrs/week documentation savings per physician.",
            "section_d_clients": "UPMC (original design partner, 4,500 physicians), Kaiser Permanente (~22,000 physicians), Mayo Clinic (pilot), Duke Health, Stanford Medicine. 50 new health systems announced Q1 2026. Meridian Health Systems reportedly on their expansion list.",
            "section_e_gtm": "Bottom-up land via CMO or Chief Digital Officer. NEJM study is primary sales asset. Conference presence at HIMSS, AMA. Epic co-sell via App Orchard. Typical land: 1 hospital, 200 physicians. Expand: full health system.",
            "section_f_exec_team": "Shiv Rao (CEO, cardiologist + Stanford AI PhD), Zack Lipton (Chief Scientist, CMU ML professor), Brian Cheung (VP Engineering, ex-Google Brain), Sarah Ng (VP Sales, ex-Nuance). Strong clinical credibility is core to their sales motion.",
            "section_g_financials": "Series C: $150M (a16z bio, March 2026). Total raised: $212M. Estimated ARR: $50-65M. Burn rate: ~$8M/month. Runway: ~18 months. Path to profitability depends on health system expansion velocity.",
            "section_h_technology": "Proprietary transformer model fine-tuned on de-identified clinical conversations. AWS infrastructure. Epic FHIR R4 integration via certified APIs. SOC2 Type II, HIPAA BAA available. Mobile app (iOS/Android) for physicians.",
            "section_i_partnerships": "Epic Elite Partner (key moat). Google Cloud infrastructure. a16z bio portfolio (connects to 40+ health system portfolio companies). UPMC Enterprises strategic partner.",
            "section_j_competitive": "Competes primarily with: Nuance DAX (Microsoft), Suki AI, DeepScribe, and now us. Nuance is the incumbent with ~60% market share. Abridge is fastest growing challenger. Our differentiation: platform breadth beyond documentation.",
            "section_k_threats": "1) Epic building own ambient documentation (Project Cosmos AI) could commoditize Abridge's core. 2) Nuance/Microsoft bundling DAX in M365 contracts. 3) Over-reliance on single use case as they try to expand. 4) Clinical accuracy incidents at scale could damage brand.",
            "ceo_brief": {
                "threat_level": "CRITICAL",
                "one_line": "Abridge is our most dangerous direct competitor in healthcare — NEJM-validated, Epic Elite, and now expanding into our analytics turf.",
                "immediate_actions": [
                    "Update Meridian battle card — Abridge named them on their expansion list",
                    "Brief Sarah Chen (Meridian CDO) on our analytics breadth vs. Abridge's documentation focus",
                    "Accelerate our own Epic Elite partnership application",
                ],
            },
            "eval_score": 91,
            "generated_at": datetime.utcnow() - timedelta(days=2),
            "generated_by": ADMIN_USER_ID,
        },
        {
            "entity_id": eid("Palantir"),
            "version": 2,
            "generation_status": "complete",
            "overall_confidence": "high",
            "source_count": 38,
            "section_a_synopsis": "Palantir Technologies (NYSE: PLTR) — data analytics and AI platform company. Founded 2003 by Peter Thiel, Alex Karp, and others. Core products: Gotham (government/defense), Foundry (enterprise), AIP (AI Platform). $2.3B revenue FY25. 3,800 employees. Aggressive enterprise expansion post-AIP launch.",
            "section_b_business_model": "Enterprise SaaS with significant professional services. Average ACV: $8M (government), $2.5M (commercial). AIP Bootcamp is a 5-day land-and-expand sales motion. Requires significant Palantir FTE involvement. Revenue mix: 55% government, 45% commercial (and shifting).",
            "section_c_products": "1) Foundry — data integration and ontology platform. 2) AIP — LLM layer on Foundry, launched 2023. 3) Gotham — government intelligence. 4) Apollo — continuous delivery system. 5) AIP Bootcamp — 5-day rapid deployment program.",
            "section_d_clients": "US Army, USAF, NHS UK, Airbus, BP, Morgan Stanley, Rio Tinto, Ferrari. Commercial clients generally $500M-$50B revenue. Growing US commercial: 182 customers, up 55% YoY.",
            "section_e_gtm": "Government-seeded enterprise credibility. AIP Bootcamp as commercial entry. High-touch, high-cost sales model. Alex Karp as public face creates executive-level attention. Requires 2-4 dedicated Palantir engineers post-sale.",
            "section_f_exec_team": "Alex Karp (CEO, public intellectual persona), Shyam Sankar (CTO, NSA pedigree), Ryan Taylor (President, commercial lead), David Glazer (CFO). Intentionally opaque org structure.",
            "section_g_financials": "FY25: $2.3B revenue, +29% YoY. Q4 US commercial: +55% YoY. Profitable (GAAP) since Q3 2023. Market cap ~$80B. Stock +34% YTD 2026.",
            "section_h_technology": "Ontology layer is proprietary moat — data model abstraction that creates significant switching costs. AIP adds LLM reasoning on top. Multi-cloud and on-prem deployment. Robust security clearance capabilities.",
            "section_i_partnerships": "IBM (legacy integration), Microsoft (AIP + Azure), AWS Marketplace. No Epic partnership (weakness in healthcare).",
            "section_j_competitive": "Competes with: Databricks, Snowflake, us (in logistics/FS), Microsoft Fabric. Generally wins on government credibility + ontology depth. Loses on cost, speed, and mid-market fit.",
            "section_k_threats": "1) AIP Bootcamp driving faster commercial growth than expected. 2) Gartner #1 in logistics AI — ClearRoute reference risk. 3) Karp's provocative public statements occasionally alienate buyers. 4) Reliance on government contracts creates perception issues.",
            "ceo_brief": {
                "threat_level": "HIGH",
                "one_line": "Palantir is accelerating commercial expansion but their cost and complexity creates a clear mid-market gap we should exploit in every ClearRoute and Apex conversation.",
                "immediate_actions": [
                    "Use total cost of ownership calculator in ClearRoute pricing conversation",
                    "Find and brief Palantir customers who churned due to cost/complexity",
                    "Update logistics battle card with AIP Bootcamp counter-messaging",
                ],
            },
            "eval_score": 87,
            "generated_at": datetime.utcnow() - timedelta(days=10),
            "generated_by": ADMIN_USER_ID,
        },
    ]

    added = 0
    for d in dossiers:
        if not d["entity_id"]:
            continue
        exists = db.query(models.Dossier).filter(
            models.Dossier.entity_id == d["entity_id"],
            models.Dossier.version == d["version"],
        ).first()
        if not exists:
            db.add(models.Dossier(created_at=datetime.utcnow(), **d))
            added += 1
    print(f"  + {added} dossiers added")
    db.flush()


# ── Digests ───────────────────────────────────────────────────────

def _seed_digests(db):
    if db.query(models.Digest).count() > 0:
        return

    digests = [
        {
            "digest_type": "weekly",
            "week_number": 9,
            "year": 2026,
            "subject": "Competitive Intel Digest — Week 9: Abridge at Meridian, Palantir Logistics Push",
            "status": "sent",
            "slack_posted": True,
            "posted_at": datetime.utcnow() - timedelta(days=3),
            "content": {
                "summary": "Critical week: Abridge named Meridian Health Systems on their expansion list. Palantir's AIP Bootcamp now targeting logistics (ClearRoute risk). Google poaches Epic executive. Three immediate actions required.",
                "top_signals": [
                    {"title": "CRITICAL: Abridge names Meridian on expansion list", "score": 97, "action": "Brief Sarah Chen immediately on platform breadth differentiation"},
                    {"title": "Google hires former Epic executive as GM Healthcare", "score": 88, "action": "Update Google battle card, prep Marcus Webb briefing"},
                    {"title": "Palantir AIP Bootcamp expands to logistics", "score": 82, "action": "Add TCO calculator to ClearRoute proposal"},
                ],
                "deal_updates": [
                    {"deal": "Meridian Health Systems", "status": "AT RISK", "note": "Abridge now in the picture. RFP deadline March 15. Immediate action needed."},
                    {"deal": "ClearRoute Logistics", "status": "ON TRACK", "note": "Devon moving fast. Palantir is shortlisted but Devon prefers us. Close by April 15."},
                    {"deal": "Apex Financial Group", "status": "PROGRESSING", "note": "Jordan building internal case. Need CFO ROI model by March 10."},
                ],
                "entities_to_watch": ["Abridge", "Google Cloud Healthcare AI"],
                "recommended_actions": [
                    "Update Abridge battle card with $150M Series C data",
                    "Schedule urgent call with Dr. Sarah Chen before Abridge reaches out",
                    "Get ClearRoute proposal out before Palantir's bootcamp pitch",
                ],
            },
        },
        {
            "digest_type": "weekly",
            "week_number": 8,
            "year": 2026,
            "subject": "Competitive Intel Digest — Week 8: Google Mayo Clinic Win, Cohere Oracle Deal",
            "status": "sent",
            "slack_posted": True,
            "posted_at": datetime.utcnow() - timedelta(days=10),
            "content": {
                "summary": "Google's Mayo Clinic deployment creates a powerful reference story. Cohere's Oracle partnership extends their distribution. Both require updated battle card messaging.",
                "top_signals": [
                    {"title": "Google MedPaLM 2 live at Mayo Clinic — 2,000 physicians", "score": 95, "action": "Prepare counter-narrative: Mayo is atypical, need regional health system references"},
                    {"title": "Cohere + Oracle enterprise partnership", "score": 85, "action": "Update Cohere battle card with Oracle distribution risk"},
                    {"title": "Abridge NEJM study published", "score": 91, "action": "URGENT: Counter-position on platform breadth vs. documentation point solution"},
                ],
                "deal_updates": [
                    {"deal": "Meridian Health Systems", "status": "ACTIVE", "note": "RFP submitted. Google and Abridge both in the process. Technical review with Marcus next week."},
                    {"deal": "ClearRoute Logistics", "status": "NEGOTIATING", "note": "Devon sent pricing counter-proposal. Monthly billing request needs response."},
                ],
                "entities_to_watch": ["Google Cloud Healthcare AI", "Abridge", "Cohere"],
                "recommended_actions": [
                    "Book reference calls from regional health systems (not Mayo)",
                    "Run analytics use case demo for Meridian — show beyond documentation",
                    "Respond to ClearRoute pricing counter before Palantir bootcamp pitch",
                ],
            },
        },
    ]

    added = 0
    for d in digests:
        db.add(models.Digest(generated_at=datetime.utcnow(), **d))
        added += 1
    print(f"  + {added} digests added")
    db.flush()


# ── Meeting Notes ─────────────────────────────────────────────────

def _seed_meeting_notes(db):
    if db.query(models.MeetingNote).count() > 3:
        return

    def did(name):
        d = db.query(models.Deal).filter(models.Deal.account_name == name).first()
        return d.id if d else None

    notes = [
        {
            "title": "Meridian Health — Pilot Proposal Review Call",
            "raw_text": """Meeting Notes — Meridian Health Systems
Date: March 3, 2026
Attendees: Dr. Sarah Chen (CDO), Marcus Webb (VP IT), Priya Nair (Procurement), Alex Rivera (Distyl AE)

Sarah opened by saying she reviewed our proposal and found it compelling, particularly the Epic-native integration story. She mentioned that she has been approached by Abridge and asked how we differentiate.

Key discussion points:
- Sarah confirmed budget of $1.2M is approved, but board sign-off needed above $1M threshold
- Marcus raised concerns about our SOC2 report being from 2024 — wants updated 2025 audit. Timeline concern: their security review takes 6-8 weeks minimum.
- Priya asked for our best and final pricing by March 15 (RFP deadline). She mentioned two other vendors are being evaluated.
- Sarah is interested in a 90-day pilot at 3 hospitals. Wants measurable outcome: 30% documentation time reduction.

Competitive intel:
- Google Cloud is in the RFP. Sarah said Google pitched hard on the Mayo Clinic reference but she's concerned about GCP lock-in.
- Abridge reached out last week — Sarah described them as "narrowly focused on documentation."
- Thomas Hargrove (CIO) is rumored to favor Google. Sarah is managing this internally.

Action items:
- Alex: Deliver pilot proposal and best-and-final pricing by March 15
- Alex: Arrange reference call with Stanford Health (Epic Cosmos, regional health system)
- Alex: Provide updated SOC2 Type II certificate
- Marcus: Will initiate internal security review upon receipt of updated SOC2
- Sarah: Will prepare board presentation for April 10 vote

Next steps: Follow-up call March 12 to review proposal before submission.""",
            "source": "manual",
            "meeting_date": datetime.utcnow() - timedelta(days=1),
            "deal_ids": [did("Meridian Health Systems")],
            "processing_status": "done",
            "processed_at": datetime.utcnow() - timedelta(hours=2),
            "extracted_contacts": [
                {"name": "Dr. Sarah Chen", "title": "CDO", "company": "Meridian Health Systems"},
                {"name": "Marcus Webb", "title": "VP IT", "company": "Meridian Health Systems"},
                {"name": "Priya Nair", "title": "Director of Procurement", "company": "Meridian Health Systems"},
            ],
            "extracted_action_items": [
                "Deliver pilot proposal and best-and-final pricing by March 15",
                "Arrange reference call with Stanford Health",
                "Provide updated SOC2 Type II certificate",
                "Follow-up call March 12 to review proposal",
            ],
            "extracted_deal_data": {"stage": "negotiation", "value_usd": 1200000, "competitors": ["Google Cloud Healthcare AI", "Abridge"]},
            "extracted_signals": [
                {"title": "Abridge approaching Meridian", "summary": "Abridge reached out to Meridian CDO", "entity_name": "Abridge", "signal_type": "customer_win"},
                {"title": "Google pushing GCP lock-in at Meridian", "summary": "Google pitched Mayo Clinic reference, concerned about GCP lock-in", "entity_name": "Google Cloud Healthcare AI", "signal_type": "customer_win"},
            ],
        },
        {
            "title": "ClearRoute — Pricing Negotiation Call",
            "raw_text": """Meeting Notes — ClearRoute Logistics Pricing Discussion
Date: March 1, 2026
Attendees: Devon Okafor (VP Engineering), Sandra Millbrook (COO), Alex Rivera (Distyl AE), Jordan T. (Distyl SE)

Call started 10 min late — Sandra joined at the 15-min mark.

Devon opened by saying they are ready to move but the COO needs two things resolved:
1. Monthly billing option (vs. our standard annual prepay)
2. Performance SLA with exit clause if KPIs not met in 90 days

Sandra said directly: "I've been burned by AI vendors before. I need you to put skin in the game with a performance guarantee, or I'll push this to Q3."

Devon jumped in to keep things moving — he's clearly sold and wants to close this month.

Our current pricing: $320K annual, prepay. Devon's counter: $280K with monthly billing.

Key competitive intel:
- Devon confirmed Palantir pitched them an AIP Bootcamp last week ($180K for the bootcamp, then $500K/year license). Devon said "their total cost was insane" — our TCO comparison is working.
- Devon said he demoed us to a peer VP at XPO Logistics — positive word of mouth.

Resolution path discussed:
- We can potentially offer monthly billing Year 1 only, then annual from Year 2
- Performance SLA: 90-day pilot with defined KPIs, pro-rated credit if KPIs missed by >15%
- Floor price: $295K annual equivalent

Action items:
- Alex: Send revised proposal with monthly billing Year 1 option by March 6
- Alex: Arrange reference call with Werner Enterprises (logistics, live in production)
- Legal: Draft SLA performance guarantee language
- Devon: Schedule exec briefing for Sandra with Werner CEO reference
- Sandra: Will share ClearRoute's standard vendor terms template

Next meeting: March 8 to review revised proposal.""",
            "source": "manual",
            "meeting_date": datetime.utcnow() - timedelta(days=3),
            "deal_ids": [did("ClearRoute Logistics")],
            "processing_status": "done",
            "processed_at": datetime.utcnow() - timedelta(hours=6),
            "extracted_contacts": [
                {"name": "Devon Okafor", "title": "VP Engineering", "company": "ClearRoute Logistics"},
                {"name": "Sandra Millbrook", "title": "COO", "company": "ClearRoute Logistics"},
            ],
            "extracted_action_items": [
                "Send revised proposal with monthly billing Year 1 option by March 6",
                "Arrange reference call with Werner Enterprises",
                "Legal: Draft SLA performance guarantee language",
                "Next meeting March 8 to review revised proposal",
            ],
            "extracted_deal_data": {"stage": "pricing", "value_usd": 320000, "competitors": ["Palantir"], "next_steps": "Monthly billing Year 1, performance SLA, reference call"},
            "extracted_signals": [
                {"title": "Palantir AIP Bootcamp pitched to ClearRoute", "summary": "Palantir pitched $180K bootcamp + $500K license. Devon found total cost too high.", "entity_name": "Palantir", "signal_type": "customer_win"},
            ],
        },
        {
            "title": "Apex Financial — CFO ROI Meeting",
            "raw_text": """Apex Financial Group — Internal Strategy Notes
Date: February 25, 2026
Attendees: Jordan Kessler (CDO), Patricia Huang (CFO), David Cho (CTO), Alex Rivera (Distyl)

Patricia joined for the last 15 minutes. Before she arrived, Jordan briefed us: "Patricia is very ROI-focused. She had a bad experience with a Palantir engagement 2 years ago that went over budget by 3x. Lead with hard numbers."

CTO David Cho was skeptical throughout. He asked detailed questions about:
- Our model architecture and whether we use proprietary data
- Multi-tenancy vs. dedicated instances
- How we handle model drift over time

Patricia arrived, reviewed the ROI slide, and asked two direct questions:
1. "What is the payback period with your best-case and worst-case numbers?"
2. "If we don't hit the projected savings, what recourse do we have?"

Jordan handled both questions smoothly — he's clearly been prepping the internal case.

Patricia said: "I need a formal business case document, not a sales deck. Jordan will coordinate."
She left after 5 minutes.

Key intel:
- Palantir is still in the mix — David Cho had a follow-up call with them last week
- Jordan confirmed their data stack: Snowflake + dbt + Looker. No Databricks.
- AI governance board is a new process — first vendor to go through it. Jordan expects 2-4 weeks.
- Budget: Patricia confirmed $480K is "earmarked but not committed" — needs business case to lock it

Action items:
- Alex: Deliver CFO-grade business case with best/worst case ROI by March 10
- Alex: Prepare AI governance board submission (Jordan will share template)
- Jordan: Set up Snowflake integration technical review with David Cho's team
- Jordan: Identify 2 FS reference customers (not hedge funds — wealth management preferred)

Next step: Jordan to schedule governance board submission after business case is approved.""",
            "source": "manual",
            "meeting_date": datetime.utcnow() - timedelta(days=7),
            "deal_ids": [did("Apex Financial Group")],
            "processing_status": "done",
            "processed_at": datetime.utcnow() - timedelta(days=6),
            "extracted_contacts": [
                {"name": "Jordan Kessler", "title": "CDO", "company": "Apex Financial Group"},
                {"name": "Patricia Huang", "title": "CFO", "company": "Apex Financial Group"},
                {"name": "David Cho", "title": "CTO", "company": "Apex Financial Group"},
            ],
            "extracted_action_items": [
                "Deliver CFO-grade business case by March 10",
                "Prepare AI governance board submission",
                "Jordan to schedule governance board submission",
                "Set up Snowflake integration technical review",
            ],
            "extracted_deal_data": {"stage": "technical_eval", "value_usd": 480000, "competitors": ["Palantir"]},
            "extracted_signals": [
                {"title": "Palantir still active in Apex Financial deal", "summary": "CTO David Cho had follow-up call with Palantir last week", "entity_name": "Palantir", "signal_type": "customer_win"},
            ],
        },
    ]

    added = 0
    for n in notes:
        if not db.query(models.MeetingNote).filter(models.MeetingNote.title == n["title"]).first():
            db.add(models.MeetingNote(created_at=datetime.utcnow(), **n))
            added += 1
    print(f"  + {added} meeting notes added")
    db.flush()


# ── Additional Wargames ───────────────────────────────────────────

def _seed_extra_wargames(db):
    def did(name):
        d = db.query(models.Deal).filter(models.Deal.account_name == name).first()
        return d.id if d else None

    def pid(name):
        p = db.query(models.StakeholderProfile).filter(models.StakeholderProfile.name == name).first()
        return p.id if p else None

    # Meridian wargame — multi-stakeholder
    if not db.query(models.Wargame).filter(models.Wargame.name == "Meridian — Final Negotiation Prep").first():
        game = models.Wargame(
            name="Meridian — Final Negotiation Prep",
            deal_id=did("Meridian Health Systems"),
            presales_stage="negotiation",
            scenario_type="standard",
            status="setup",
            max_rounds=10,
            deal_context={
                "account": "Meridian Health Systems",
                "product": "Clinical AI Platform",
                "deal_size": "$1.2M annual",
                "our_ask": "$1.2M, 3-year contract, annual prepay",
                "buyer_opening": "Want pilot first, board approval needed, Abridge is also in the picture",
                "our_target": "Close at $1.1M minimum, 3-year term",
                "our_walkaway": "Below $900K or pilot-only with no path to full deployment",
                "key_differentiators": ["Epic-native depth", "No GCP lock-in", "Specialty fine-tuning", "Regional health system references"],
                "competitive_threats": ["Google Cloud", "Abridge"],
                "scenario_notes": "RFP deadline March 15. Board vote April 10. CIO Thomas Hargrove is not aligned.",
            },
        )
        db.add(game)
        db.flush()

        # Sarah Chen as champion-turned-negotiator
        sarah_id = pid("Dr. Sarah Chen")
        priya_id = pid("Priya Nair")
        marcus_id = pid("Marcus Webb")

        if sarah_id:
            db.add(models.WargameParticipant(
                wargame_id=game.id, profile_id=sarah_id, team="buyer",
                opening_notes="Sarah — CDO, our champion. But in this negotiation she's also managing board risk and procurement process. Will push for pilot structure before full commitment.",
                current_trust_score=70, engagement_level="high",
            ))
        if priya_id:
            db.add(models.WargameParticipant(
                wargame_id=game.id, profile_id=priya_id, team="buyer",
                opening_notes="Priya — Procurement. Will anchor hard on price and demand best-and-final on first ask. March 15 deadline is real.",
                current_trust_score=45, engagement_level="moderate",
            ))
        if marcus_id:
            db.add(models.WargameParticipant(
                wargame_id=game.id, profile_id=marcus_id, team="buyer",
                opening_notes="Marcus — VP IT. Will gate on security review. Skeptical of AI black boxes. Can delay deal by 6-8 weeks if not handled correctly.",
                current_trust_score=50, engagement_level="low",
            ))

        print(f"  + Wargame: Meridian Final Negotiation Prep (ID: {game.id})")

    # A completed/archived Apex wargame as a reference example
    if not db.query(models.Wargame).filter(models.Wargame.name == "Apex — CFO Objection Handling Practice").first():
        game2 = models.Wargame(
            name="Apex — CFO Objection Handling Practice",
            deal_id=did("Apex Financial Group"),
            presales_stage="pricing",
            scenario_type="budget_freeze",
            status="completed",
            current_round=6,
            max_rounds=8,
            outcome="won",
            outcome_summary="Seller successfully addressed CFO ROI objections by anchoring on hard dollar savings and providing a guaranteed payback model. Patricia Huang agreed to proceed to AI governance board review.",
            analysis={
                "executive_summary": "Strong performance. Seller effectively countered the 'Palantir burned us' objection by leading with reference customers and transparent TCO. ROI anchoring at $600K savings/year was the turning point.",
                "outcome": "won",
                "win_probability_final": 72,
                "key_turning_points": [
                    "Round 2: Seller proactively addressed Palantir trauma with transparent pricing",
                    "Round 4: Hard dollar savings calculator ($600K/year) turned Patricia from skeptic to interested",
                    "Round 6: Commitment to guaranteed 90-day ROI milestone closed the conceptual agreement",
                ],
                "seller_strengths": ["ROI quantification", "Palantir counter-narrative", "Patient pacing"],
                "seller_weaknesses": ["Late to address AI governance board process", "Should have brought CTO case study earlier"],
                "recommended_strategies": [
                    "Lead every CFO conversation with the hard-dollar savings model upfront",
                    "Always address past AI vendor trauma before pitching",
                    "Identify and neutralize the CTO skeptic before the CFO meeting",
                ],
                "confidence": "high",
            },
            deal_context={
                "account": "Apex Financial Group",
                "scenario": "Budget freeze threat — CFO Patricia Huang threatening to defer to Q3",
            },
            monte_carlo_results={
                "total_runs": 20,
                "outcomes": {"won": 13, "lost": 4, "stalled": 3, "walkaway": 0},
                "win_rate": 0.65,
                "avg_rounds_to_close": 6.2,
                "avg_discount_needed": 0.08,
                "risk_factors": ["CFO past trauma with AI vendors", "CTO in-house build option", "AI governance board unknown process"],
                "success_patterns": ["Hard-dollar ROI anchoring", "Reference customer social proof", "Transparent total cost"],
                "confidence_interval": {"low": 0.52, "high": 0.78},
                "scenario_breakdown": [
                    {"scenario": "CFO approves Q1", "win_rate": 0.78, "description": "ROI model accepted, governance board moves fast"},
                    {"scenario": "Budget freeze Q3", "win_rate": 0.45, "description": "CFO defers — risk of Palantir winning in interim"},
                ],
            },
            monte_carlo_status="complete",
        )
        db.add(game2)
        db.flush()

        jordan_id = pid("Jordan Kessler")
        patricia_id = pid("Patricia Huang")

        if jordan_id:
            db.add(models.WargameParticipant(
                wargame_id=game2.id, profile_id=jordan_id, team="buyer",
                opening_notes="Jordan — CDO, champion. Trying to help seller navigate Patricia's objections.",
                current_trust_score=75, engagement_level="high",
            ))
        if patricia_id:
            db.add(models.WargameParticipant(
                wargame_id=game2.id, profile_id=patricia_id, team="buyer",
                opening_notes="Patricia — CFO. Opens with budget freeze threat. Needs hard ROI.",
                current_trust_score=55, engagement_level="moderate",
            ))

        # Add some sample turns for the completed game
        sample_turns = [
            {"round_number": 0, "actor_label": "Jordan Kessler", "action_type": "intelligence_briefing",
             "content": {"message": "The CFO had a very bad experience with Palantir 2 years ago — project went 3x over budget. Lead with hard dollar savings and a guaranteed payback model. She will ask for worst-case scenario numbers.", "persona": {"opening_position": "Show me the ROI model first. I'm not interested in demos."}}},
            {"round_number": 1, "actor_label": "Seller", "action_type": "offer",
             "content": {"message": "Patricia, I want to start with numbers, not slides. Our analytics platform drives $600K/year in hard savings through two levers: 80% reduction in manual analyst work ($380K) and regulatory reporting automation ($220K). Payback period at your contract size is 9.6 months.", "terms_proposed": {"annual_value": 480000, "payback_months": 9.6}}},
            {"round_number": 1, "actor_label": "Patricia Huang", "action_type": "information_request",
             "content": {"message": "Those numbers sound optimistic. What's the worst-case? And I'll need a contractual commitment — not projections. We had a vendor promise us $2M in savings from Palantir. We got $200K and a $4M bill.", "questions": ["What is worst-case ROI?", "Can you contractually guarantee the savings?"]}},
            {"round_number": 2, "actor_label": "Seller", "action_type": "concession",
             "content": {"message": "Fair point. Worst case: $320K/year if your team only deploys 60% of the automation modules. Here's our offer: we'll commit to a 90-day KPI milestone. If you haven't seen at least $80K in measurable savings in 90 days, we pro-rate that quarter's fee. No risk to you in the first 90 days."}},
            {"round_number": 2, "actor_label": "Adjudicator", "action_type": "adjudication",
             "content": {"summary": "Turning point. Seller's 90-day guarantee directly addressed Patricia's Palantir trauma. Trust score improving.", "deal_momentum": "advancing", "coaching_tips": ["Good move — the guarantee shifts risk to seller which CFO respects", "Follow up with the reference customer story next round"]}},
        ]

        for t_data in sample_turns:
            db.add(models.WargameTurn(wargame_id=game2.id, created_at=datetime.utcnow(), **t_data))

        print(f"  + Wargame: Apex CFO Practice (completed, with turns, ID: {game2.id})")

    db.flush()


def _print_summary():
    from database import get_db
    from models import Entity, Deal, Person, Signal, NewsItem, BattleCard, Dossier, Partnership, StakeholderProfile, Wargame, MeetingNote
    with get_db() as db:
        print("\n📊 Database Summary:")
        print(f"   Entities:            {db.query(Entity).count()} ({db.query(Entity).filter(Entity.entity_type=='competitor').count()} competitors, {db.query(Entity).filter(Entity.entity_type=='target').count()} targets)")
        print(f"   Deals:               {db.query(Deal).count()}")
        print(f"   People:              {db.query(Person).count()}")
        print(f"   Signals:             {db.query(Signal).count()}")
        print(f"   News Items:          {db.query(NewsItem).count()}")
        print(f"   Battle Cards:        {db.query(BattleCard).count()}")
        print(f"   Dossiers:            {db.query(Dossier).count()}")
        print(f"   Partnerships:        {db.query(Partnership).count()}")
        print(f"   Stakeholder Profiles:{db.query(StakeholderProfile).count()}")
        print(f"   Wargames:            {db.query(Wargame).count()}")
        print(f"   Meeting Notes:       {db.query(MeetingNote).count()}")
        print(f"\n🔗 Quick links:")
        print(f"   War Room:       http://localhost:5173/war-room")
        print(f"   Battle Cards:   http://localhost:5173/battle-cards")
        print(f"   Signals:        http://localhost:5173/signals")
        print(f"   Stakeholders:   http://localhost:5173/stakeholders")
        print(f"   Wargame:        http://localhost:5173/wargame")
        print(f"   Pipeline:       http://localhost:5173/pipeline")
        print(f"   People:         http://localhost:5173/people")
        print(f"   Notes:          http://localhost:5173/notes")


if __name__ == "__main__":
    run()
