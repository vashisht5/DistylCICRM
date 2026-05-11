"""
Seed script: sample companies, deals, stakeholder profiles, deal intel, and a wargame.
Safe to re-run — checks for existing records before inserting.
"""
from datetime import datetime, timedelta
from database import get_db, init_db
import models

def run():
    init_db()
    with get_db() as db:
        _seed_entities(db)
        _seed_deals(db)
        _seed_profiles(db)
        _seed_deal_intel(db)
        _seed_wargame(db)
    print("\n✅ Sample data seeded successfully!")
    print("   → Open http://localhost:5173/stakeholders to see profiles")
    print("   → Open http://localhost:5173/wargame to see the wargame")
    print("   → Open http://localhost:5173/pipeline to see deals")


# ── Entities ─────────────────────────────────────────────────────

def _seed_entities(db):
    targets = [
        {
            "name": "Meridian Health Systems",
            "entity_type": "target",
            "description": "Large regional health system with 12 hospitals and 80+ clinics. Actively modernizing their data infrastructure.",
            "headquarters": "Nashville, TN",
            "employee_count": "18,000",
            "industry": "Healthcare",
            "website": "https://meridianhealth.example.com",
        },
        {
            "name": "Apex Financial Group",
            "entity_type": "target",
            "description": "Mid-market asset management firm. Running a 3-vendor RFP for an AI analytics platform.",
            "headquarters": "Chicago, IL",
            "employee_count": "3,200",
            "industry": "Financial Services",
            "website": "https://apexfg.example.com",
        },
        {
            "name": "ClearRoute Logistics",
            "entity_type": "target",
            "description": "Top-20 logistics company. Champion inside is VP of Engineering. Budget cycle Q2 FY26.",
            "headquarters": "Dallas, TX",
            "employee_count": "9,500",
            "industry": "Logistics",
            "website": "https://clearroute.example.com",
        },
    ]
    for t in targets:
        if not db.query(models.Entity).filter(models.Entity.name == t["name"]).first():
            db.add(models.Entity(status="active", threat_level="monitor", **t))
            print(f"  + Entity: {t['name']}")
    db.flush()


# ── Deals ─────────────────────────────────────────────────────────

def _seed_deals(db):
    deals_data = [
        {
            "account_name": "Meridian Health Systems",
            "deal_name": "Clinical AI Platform — Phase 1",
            "stage": "negotiation",
            "value_usd": 1_200_000,
            "owner": "Alex Rivera",
            "distyl_product": "platform",
            "close_date": datetime.utcnow() + timedelta(days=45),
        },
        {
            "account_name": "Apex Financial Group",
            "deal_name": "Analytics Intelligence Suite",
            "stage": "technical_eval",
            "value_usd": 480_000,
            "owner": "Alex Rivera",
            "distyl_product": "analytics",
            "close_date": datetime.utcnow() + timedelta(days=75),
        },
        {
            "account_name": "ClearRoute Logistics",
            "deal_name": "Supply Chain AI Pilot",
            "stage": "pricing",
            "value_usd": 320_000,
            "owner": "Alex Rivera",
            "distyl_product": "platform",
            "close_date": datetime.utcnow() + timedelta(days=30),
        },
    ]
    for d in deals_data:
        if not db.query(models.Deal).filter(models.Deal.account_name == d["account_name"]).first():
            db.add(models.Deal(**d))
            print(f"  + Deal: {d['account_name']} ({d['stage']})")
    db.flush()


# ── Stakeholder Profiles ──────────────────────────────────────────

def _seed_profiles(db):
    profiles = [
        # ── Meridian Health Systems ──
        {
            "name": "Dr. Sarah Chen",
            "title": "Chief Digital Officer",
            "company": "Meridian Health Systems",
            "role": "exec",
            "department": "Digital Transformation",
            "budget_authority_usd": 2_000_000,
            "owns_budget_for": "Digital health platforms, AI/ML infrastructure, EHR modernization",
            "team_size": 45,
            "decision_style": "analytical",
            "risk_tolerance": "moderate",
            "ego_level": "medium",
            "orientation": "relational",
            "communication_style": "data_driven",
            "primary_motivation": "innovation",
            "influence_level": "key_decision_maker",
            "technical_depth": "moderate",
            "typical_opening_position": "We need to see peer-reviewed outcomes data before committing. We'll want a 90-day pilot first.",
            "hot_buttons": [
                "Patient outcomes above all else",
                "Needs 3 health-system reference calls",
                "HIPAA compliance is non-negotiable",
                "Dislikes vendor lock-in"
            ],
            "known_tactics": [
                "Delays decisions until board approval in Q2",
                "Uses competing vendor proposals as leverage",
                "Asks for extensive customization in pilots"
            ],
            "concession_pattern": "reciprocal",
            "typical_objectives": [
                "Reduce clinical documentation time by 30%",
                "Improve diagnostic accuracy",
                "Achieve ROI within 18 months"
            ],
            "typical_constraints": [
                "HIPAA & HITRUST compliance required",
                "Must integrate with Epic EHR",
                "Board approval needed above $1M"
            ],
            "past_interactions": "[2026-02-10 meeting] Attended our clinical AI webinar. Asked pointed questions about FDA clearance pathways. Warm but cautious.\n[2026-02-28 email] Replied to outreach within 24h. Confirmed budget exists for Q2. Wants pilot proposal by March 15.",
            "attributes": {
                "epic_instance": "Epic Cosmos",
                "board_approval_threshold": "$1M",
                "pilot_requirement": "90-day proof of concept required",
                "preferred_meeting_format": "Video, bi-weekly cadence",
                "linkedin": "linkedin.com/in/sarahchen-cdo"
            },
            "win_rate": 0.62,
        },
        {
            "name": "Marcus Webb",
            "title": "VP of IT & Infrastructure",
            "company": "Meridian Health Systems",
            "role": "technical",
            "department": "Information Technology",
            "budget_authority_usd": 500_000,
            "owns_budget_for": "IT infrastructure, cloud, security tools",
            "team_size": 120,
            "decision_style": "analytical",
            "risk_tolerance": "risk_averse",
            "ego_level": "medium",
            "orientation": "transactional",
            "communication_style": "direct",
            "primary_motivation": "risk_mitigation",
            "influence_level": "high",
            "technical_depth": "deep_technical",
            "typical_opening_position": "Walk me through your security architecture and data residency model first. Everything else is secondary.",
            "hot_buttons": [
                "Security and data sovereignty above everything",
                "Dislikes SaaS-only models",
                "Wants on-prem or VPC deployment option",
                "Skeptical of AI 'black boxes'"
            ],
            "known_tactics": [
                "Creates extensive technical questionnaires",
                "Delays sign-off pending security review",
                "Often surfaces new requirements late in deal"
            ],
            "concession_pattern": "never_first",
            "typical_objectives": [
                "Zero data leaving the hospital network",
                "Seamless Epic integration",
                "SLA of 99.9% uptime"
            ],
            "typical_constraints": [
                "On-prem or dedicated VPC required",
                "Must pass internal security review (6-8 weeks)",
                "Change freeze periods block deployments"
            ],
            "past_interactions": "[2026-02-28 meeting] Technical deep-dive call. Grilled us on encryption at rest/transit, audit logs, and SOC2 Type II. Came away satisfied but wants pen test results.",
            "attributes": {
                "security_review_duration": "6-8 weeks",
                "preferred_deployment": "VPC or on-prem",
                "change_freeze": "Q4 (Oct-Dec)"
            },
            "win_rate": 0.55,
        },
        {
            "name": "Priya Nair",
            "title": "Director of Procurement",
            "company": "Meridian Health Systems",
            "role": "procurement",
            "department": "Finance & Procurement",
            "budget_authority_usd": 250_000,
            "owns_budget_for": "Vendor contracts, SaaS renewals",
            "team_size": 8,
            "decision_style": "directive",
            "risk_tolerance": "risk_averse",
            "ego_level": "low",
            "orientation": "transactional",
            "communication_style": "direct",
            "primary_motivation": "cost_reduction",
            "influence_level": "medium",
            "technical_depth": "non_technical",
            "typical_opening_position": "We have a 3-vendor RFP process. All pricing must go through me. I'll need your best and final by week 3.",
            "hot_buttons": [
                "Price is the primary lever",
                "Wants multi-year discount upfront",
                "Suspicious of professional services upsells",
                "Needs vendor risk assessment completed"
            ],
            "known_tactics": [
                "Last-minute price renegotiation",
                "Claims competitor offered 20% less",
                "Delays countersigning for leverage"
            ],
            "concession_pattern": "strategic_early",
            "typical_objectives": [
                "15-20% discount from list price",
                "Capped annual price increases (3%)",
                "60-day payment terms"
            ],
            "typical_constraints": [
                "Must run 3-vendor RFP for contracts >$100K",
                "Legal review adds 2-3 weeks",
                "FY budget cycle closes March 31"
            ],
            "past_interactions": "[2026-03-01 email] Sent standard vendor questionnaire (47 questions). Requested SOC2 report, insurance certs, and references.",
            "attributes": {
                "rfp_deadline": "March 15, 2026",
                "payment_terms": "Net-60 preferred",
                "vendor_questionnaire": "47-item questionnaire sent"
            },
            "win_rate": 0.58,
        },

        # ── Apex Financial Group ──
        {
            "name": "Jordan Kessler",
            "title": "Chief Data Officer",
            "company": "Apex Financial Group",
            "role": "champion",
            "department": "Data & Analytics",
            "budget_authority_usd": 600_000,
            "owns_budget_for": "Data platform, analytics tools, ML infrastructure",
            "team_size": 28,
            "decision_style": "consensus",
            "risk_tolerance": "moderate",
            "ego_level": "low",
            "orientation": "relational",
            "communication_style": "diplomatic",
            "primary_motivation": "innovation",
            "influence_level": "high",
            "technical_depth": "deep_technical",
            "typical_opening_position": "I love the vision. I need to bring this to my CTO and CFO — help me build the internal case.",
            "hot_buttons": [
                "Loves being the internal AI champion",
                "Needs seller to build exec deck for him",
                "Responds well to peer benchmarks in finance",
                "Dislikes being surprised in committee meetings"
            ],
            "known_tactics": [
                "Needs air cover — gets stakeholders to 'independently' raise the same vendor",
                "Asks for favors (early access, custom features)"
            ],
            "concession_pattern": "reciprocal",
            "typical_objectives": [
                "Modernize data stack within 12 months",
                "Reduce time-to-insight from weeks to hours",
                "Build internal ML competency"
            ],
            "typical_constraints": [
                "CTO has final technical sign-off",
                "CFO controls discretionary budget",
                "Must complete internal 'AI governance' review"
            ],
            "past_interactions": "[2026-01-15 meeting] First call — immediately enthusiastic. Asked for a custom demo focused on portfolio analytics. Very collaborative.\n[2026-02-20 demo] Excellent demo session. Jordan brought his 3 senior data engineers. All technical questions answered well.",
            "attributes": {
                "internal_sponsor": "True champion",
                "preferred_proof_point": "Peer FS company case studies",
                "governance_review": "AI governance board must approve"
            },
            "win_rate": 0.71,
        },
        {
            "name": "Patricia Huang",
            "title": "Chief Financial Officer",
            "company": "Apex Financial Group",
            "role": "finance",
            "department": "Finance",
            "budget_authority_usd": 5_000_000,
            "owns_budget_for": "All capital expenditure, technology budget",
            "team_size": 35,
            "decision_style": "analytical",
            "risk_tolerance": "risk_averse",
            "ego_level": "high",
            "orientation": "transactional",
            "communication_style": "data_driven",
            "primary_motivation": "cost_reduction",
            "influence_level": "key_decision_maker",
            "technical_depth": "non_technical",
            "typical_opening_position": "Show me the ROI model. I need payback within 24 months and hard dollar savings, not soft benefits.",
            "hot_buttons": [
                "ROI must be quantifiable with hard numbers",
                "Skeptical of AI hype",
                "Has been burned by vendor over-promises before",
                "Will negotiate hard on payment terms"
            ],
            "known_tactics": [
                "Defers to independent ROI validation",
                "Requests multi-year payment options to test commitment",
                "Uses budget freeze threat to extract concessions"
            ],
            "concession_pattern": "never_first",
            "typical_objectives": [
                "Payback period under 24 months",
                "Annual savings >$500K",
                "Flexible exit clauses in year 1"
            ],
            "typical_constraints": [
                "Board approval for contracts >$500K",
                "Prefers OpEx over CapEx",
                "Annual budget locked in December"
            ],
            "past_interactions": "[2026-02-25 meeting] Joined late for last 15 min. Asked two hard ROI questions. Jordan handled them but she wants a formal business case before proceeding.",
            "attributes": {
                "roi_threshold": "24-month payback",
                "capex_opex_preference": "OpEx strongly preferred",
                "board_approval_threshold": "$500K"
            },
            "win_rate": 0.44,
        },

        # ── ClearRoute Logistics ──
        {
            "name": "Devon Okafor",
            "title": "VP of Engineering",
            "company": "ClearRoute Logistics",
            "role": "champion",
            "department": "Engineering",
            "budget_authority_usd": 400_000,
            "owns_budget_for": "Engineering tools, data platform, AI/ML",
            "team_size": 65,
            "decision_style": "intuitive",
            "risk_tolerance": "risk_tolerant",
            "ego_level": "medium",
            "orientation": "relational",
            "communication_style": "direct",
            "primary_motivation": "innovation",
            "influence_level": "high",
            "technical_depth": "deep_technical",
            "typical_opening_position": "I've already done my research. I think you're the right fit. Let's talk pricing and timeline.",
            "hot_buttons": [
                "Moves fast — dislikes slow procurement cycles",
                "Wants a dedicated technical CSM",
                "Responds well to founder/engineering team access",
                "Hates being handed off to junior AEs"
            ],
            "known_tactics": [
                "Creates urgency artificially to force lower prices",
                "Threatens to build in-house if price is too high"
            ],
            "concession_pattern": "strategic_early",
            "typical_objectives": [
                "Reduce route optimization latency by 40%",
                "Automate demand forecasting",
                "Ship proof-of-concept in 6 weeks"
            ],
            "typical_constraints": [
                "COO must approve contracts >$250K",
                "Q2 budget cycle (ends June 30)",
                "Must launch pilot before Q3 planning"
            ],
            "past_interactions": "[2026-02-05 email] Inbound inquiry — found us via LinkedIn. Already compared 3 vendors.\n[2026-02-18 call] 45-minute discovery. Devon already sold internally. Just needs pricing to complete the business case for COO.\n[2026-03-01 meeting] Pricing discussion. Pushed back on annual prepay. Wants monthly billing first year.",
            "attributes": {
                "decision_timeline": "Wants to close by April 15",
                "pilot_scope": "Route optimization for Southeast region",
                "internal_approval_needed": "COO sign-off"
            },
            "win_rate": 0.78,
        },
        {
            "name": "Sandra Millbrook",
            "title": "Chief Operating Officer",
            "company": "ClearRoute Logistics",
            "role": "exec",
            "department": "Operations",
            "budget_authority_usd": 2_000_000,
            "owns_budget_for": "Operations, technology, fleet management",
            "team_size": 850,
            "decision_style": "directive",
            "risk_tolerance": "risk_averse",
            "ego_level": "high",
            "orientation": "transactional",
            "communication_style": "direct",
            "primary_motivation": "risk_mitigation",
            "influence_level": "key_decision_maker",
            "technical_depth": "non_technical",
            "typical_opening_position": "Devon is my champion but I sign the check. Tell me how this reduces my downside risk, not your upside story.",
            "hot_buttons": [
                "Operational continuity above all",
                "Dislikes unproven technology",
                "Wants performance guarantees in contract",
                "Short on time — 30 min max meetings"
            ],
            "known_tactics": [
                "Uses exec-level escalation to reset pricing",
                "Requests penalty clauses for missed SLAs"
            ],
            "concession_pattern": "reciprocal",
            "typical_objectives": [
                "Zero operational disruption during rollout",
                "Performance improvement guaranteed in SLA",
                "Exit clause if KPIs not met in 90 days"
            ],
            "typical_constraints": [
                "Peak season blackout (Nov-Jan) — no new deployments",
                "Legal team adds 3-4 weeks to any contract",
                "Requires 2 reference customer calls from logistics sector"
            ],
            "past_interactions": "[2026-03-01 meeting] Brief intro call (20 min). Asked about logistics-specific case studies. Devon was present. Sandra warmed up when we mentioned the FedEx reference.",
            "attributes": {
                "reference_requirement": "2 logistics-sector reference calls",
                "sla_requirement": "Performance penalty clauses expected",
                "deployment_blackout": "Nov-Jan peak season"
            },
            "win_rate": 0.52,
        },
    ]

    for p_data in profiles:
        if db.query(models.StakeholderProfile).filter(
            models.StakeholderProfile.name == p_data["name"],
            models.StakeholderProfile.company == p_data["company"],
        ).first():
            continue
        profile = models.StakeholderProfile(**p_data)
        db.add(profile)
        print(f"  + Profile: {p_data['name']} ({p_data['company']})")

    db.flush()


# ── Deal Intel ────────────────────────────────────────────────────

def _seed_deal_intel(db):
    intel_data = [
        {
            "account_name": "Meridian Health Systems",
            "intel": {
                "presales_stage": "negotiation",
                "metrics": "30% reduction in clinical documentation time. 15% improvement in diagnostic accuracy. ROI positive within 18 months ($2.4M projected savings in year 2).",
                "economic_buyer_notes": "Dr. Sarah Chen is the CDO and budget owner. Board approval required above $1M.",
                "decision_criteria": [
                    "HIPAA & HITRUST compliance",
                    "Epic EHR integration (must be native, not middleware)",
                    "90-day pilot with measurable outcomes",
                    "SOC2 Type II certification",
                    "3 health system reference calls",
                ],
                "decision_process": "CDO (Sarah Chen) + CIO own the eval. IT Security (Marcus Webb) must approve. Procurement (Priya Nair) runs formal RFP. Board approval required for final contract. Timeline: RFP closes March 15, board vote April 10.",
                "identified_pain": "Clinical staff spending 40% of time on documentation. Epic integration is brittle and expensive. Previous AI vendor failed HIPAA audit — CDO is cautious.",
                "champion_notes": "Dr. Chen is our champion. She attended our webinar, replied to email within 24h, confirmed budget exists. Key risk: she's navigating internal politics with the CIO who favors a competing vendor.",
                "seller_batna": "Push the Q3 Apex deal forward as priority. Could also propose a scaled-down $750K deal to avoid board approval requirement.",
                "buyer_batna_estimate": "Cohere Health has a competing proposal. Google Cloud also in the mix. But neither has Epic-native integration — this is our strongest differentiator.",
                "key_risks": [
                    "CIO is not aligned — favors Google Cloud",
                    "Marcus Webb's security review could add 6-8 weeks",
                    "Procurement RFP process could commoditize the deal",
                    "Board approval adds 3-4 week delay"
                ],
                "next_steps": [
                    "Deliver pilot proposal by March 15 (RFP deadline)",
                    "Schedule security deep-dive with Marcus Webb",
                    "Arrange reference call with Stanford Health (Epic-native case study)",
                    "Prepare board-ready ROI presentation for Sarah Chen"
                ],
                "stakeholder_map": [],
                "attributes": {
                    "budget_cycle": "Q2 FY26 (closes June 30)",
                    "procurement_process": "3-vendor RFP",
                    "contract_term_preference": "3-year with annual CPI increases",
                    "legal_review_duration": "2-3 weeks",
                    "pilot_structure": "3 hospitals, 90 days, 200 clinicians"
                },
            }
        },
        {
            "account_name": "Apex Financial Group",
            "intel": {
                "presales_stage": "technical_eval",
                "metrics": "Time-to-insight from 2 weeks to 2 hours. Automated 80% of manual reporting. Projected $600K annual savings from analyst productivity.",
                "economic_buyer_notes": "Patricia Huang (CFO) controls the budget. Requires 24-month payback ROI model and hard dollar savings. Board approval for contracts >$500K.",
                "decision_criteria": [
                    "Quantifiable ROI with hard dollar savings",
                    "SOC2 Type II + FINRA/SEC compliance",
                    "Integration with existing data stack (Snowflake + dbt)",
                    "Reference customers in asset management",
                    "OpEx pricing model preferred"
                ],
                "decision_process": "Jordan Kessler (CDO) leads the eval. CTO does final technical sign-off. CFO Patricia Huang approves the budget. AI governance board must review before contract. 3-vendor comparison (us, Palantir, in-house build).",
                "identified_pain": "Data team of 28 spends 60% of time on data wrangling, not analysis. Portfolio managers waiting 2 weeks for reports. Regulatory reporting is manual and error-prone.",
                "champion_notes": "Jordan Kessler is an ideal champion — enthusiastic, technical, politically savvy. Risk: Jordan tends to over-promise internally, which creates expectation gaps.",
                "seller_batna": "If Apex stalls, redirect to the ClearRoute close which is more advanced. Apex deal can wait for Q3.",
                "buyer_batna_estimate": "In-house build is their main alternative — Jordan estimates 18 months and $2M+. Palantir is in consideration but perceived as overly complex for their size.",
                "key_risks": [
                    "CFO Patricia Huang is skeptical of AI vendors after a bad experience",
                    "AI governance board is new and process is undefined",
                    "In-house build narrative is gaining traction with the CTO"
                ],
                "next_steps": [
                    "Deliver executive ROI model for Patricia Huang by March 10",
                    "Schedule CTO technical deep-dive",
                    "Connect Jordan with our FS reference customer (Bridgewater case study)",
                    "Prepare AI governance board submission template"
                ],
                "attributes": {
                    "budget_cycle": "FY budget set in December, discretionary available now",
                    "data_stack": "Snowflake + dbt + Looker",
                    "competitors_in_rfp": "Palantir, in-house build option",
                    "governance_review": "AI governance board (new process, 2-4 weeks)"
                },
            }
        },
        {
            "account_name": "ClearRoute Logistics",
            "intel": {
                "presales_stage": "pricing",
                "metrics": "40% reduction in route optimization compute time. 12% fuel cost reduction. $4.2M projected annual savings across Southeast region fleet.",
                "economic_buyer_notes": "Sandra Millbrook (COO) is the economic buyer. Highly operational focus. Will demand performance SLAs and exit clause if KPIs not met in 90 days.",
                "decision_criteria": [
                    "Proven logistics-sector references",
                    "Performance guarantees in SLA",
                    "90-day pilot with measurable route efficiency gains",
                    "Monthly billing option (COO opposed to annual prepay)",
                    "Zero disruption deployment plan"
                ],
                "decision_process": "Devon Okafor (VP Eng) runs the eval. COO Sandra Millbrook signs the contract. Legal review adds 3-4 weeks. Devon wants to close by April 15 to launch pilot before Q3 planning.",
                "identified_pain": "Current route optimization (in-house) is 6 hours behind real-time. Fuel costs up 18% YoY. Engineers maintaining the system full-time instead of building new features.",
                "champion_notes": "Devon is a very strong champion — inbound, already sold internally, moving fast. Main risk is the COO's risk aversion and demand for penalty clauses.",
                "seller_batna": "If ClearRoute stalls on pricing, propose a 60-day paid pilot at $40K to get in the door.",
                "buyer_batna_estimate": "Devon has threatened in-house build but his team is already at capacity. Estimated 12+ months to build. No serious competitive alternative identified.",
                "key_risks": [
                    "COO Sandra Millbrook may demand penalty clauses we can't accept",
                    "Legal review timeline risks missing April 15 target",
                    "Monthly billing request significantly impacts our cash flow"
                ],
                "next_steps": [
                    "Send revised pricing proposal with monthly billing option by March 6",
                    "Arrange reference call with our logistics customer (Werner case study)",
                    "Get legal to draft SLA with performance commitments",
                    "Schedule exec briefing with Sandra Millbrook"
                ],
                "attributes": {
                    "budget_cycle": "Q2 (ends June 30), wants to close April 15",
                    "billing_preference": "Monthly billing, year 1",
                    "pilot_region": "Southeast (Atlanta, Miami, Charlotte)",
                    "sla_requirement": "90-day performance guarantee with exit clause"
                },
            }
        },
    ]

    for item in intel_data:
        deal = db.query(models.Deal).filter(
            models.Deal.account_name == item["account_name"]
        ).first()
        if not deal:
            continue

        existing = db.query(models.DealIntel).filter(
            models.DealIntel.deal_id == deal.id
        ).first()
        if existing:
            continue

        # Match champion and economic buyer to profiles
        intel = item["intel"].copy()
        champ_name = {"Meridian Health Systems": "Dr. Sarah Chen", "Apex Financial Group": "Jordan Kessler", "ClearRoute Logistics": "Devon Okafor"}.get(item["account_name"])
        eb_name = {"Meridian Health Systems": "Dr. Sarah Chen", "Apex Financial Group": "Patricia Huang", "ClearRoute Logistics": "Sandra Millbrook"}.get(item["account_name"])

        if champ_name:
            p = db.query(models.StakeholderProfile).filter(models.StakeholderProfile.name == champ_name).first()
            if p:
                intel["champion_profile_id"] = p.id

        if eb_name:
            p = db.query(models.StakeholderProfile).filter(models.StakeholderProfile.name == eb_name).first()
            if p:
                intel["economic_buyer_profile_id"] = p.id

        # Build stakeholder map
        company_profiles = db.query(models.StakeholderProfile).filter(
            models.StakeholderProfile.company == item["account_name"]
        ).all()
        stake_map = []
        stances = {
            "Dr. Sarah Chen": "champion", "Devon Okafor": "champion", "Jordan Kessler": "champion",
            "Marcus Webb": "neutral", "Priya Nair": "neutral",
            "Patricia Huang": "blocker", "Sandra Millbrook": "neutral",
        }
        for cp in company_profiles:
            stake_map.append({
                "profile_id": cp.id,
                "role_in_deal": cp.role,
                "influence": cp.influence_level,
                "stance": stances.get(cp.name, "neutral"),
            })
        intel["stakeholder_map"] = stake_map

        db.add(models.DealIntel(deal_id=deal.id, **intel))
        print(f"  + DealIntel: {item['account_name']}")

    db.flush()


# ── Wargame ───────────────────────────────────────────────────────

def _seed_wargame(db):
    if db.query(models.Wargame).count() > 0:
        return

    deal = db.query(models.Deal).filter(models.Deal.account_name == "ClearRoute Logistics").first()

    game = models.Wargame(
        name="ClearRoute Pricing Negotiation — Practice Run",
        deal_id=deal.id if deal else None,
        presales_stage="pricing",
        scenario_type="standard",
        status="setup",
        max_rounds=8,
        deal_context={
            "account": "ClearRoute Logistics",
            "product": "Supply Chain AI Platform",
            "our_ask": "$320,000 annual contract, 1-year prepay",
            "buyer_anchor": "Monthly billing, want 20% discount",
            "our_target": "Annual prepay at $295K minimum",
            "our_walkaway": "Below $260K or monthly billing for full contract",
            "key_value_props": ["40% route optimization improvement", "$4.2M projected savings", "6-week deployment"],
            "competitive_threats": ["In-house build narrative"],
        },
    )
    db.add(game)
    db.flush()

    # Add Devon Okafor (champion/champion) as buyer participant
    devon = db.query(models.StakeholderProfile).filter(models.StakeholderProfile.name == "Devon Okafor").first()
    sandra = db.query(models.StakeholderProfile).filter(models.StakeholderProfile.name == "Sandra Millbrook").first()

    if devon:
        db.add(models.WargameParticipant(
            wargame_id=game.id,
            profile_id=devon.id,
            team="buyer",
            opening_notes="Devon — VP Engineering. Technically sold, but needs monthly billing to get COO approval. Will push hard on payment terms.",
            current_trust_score=65,
            engagement_level="high",
        ))

    if sandra:
        db.add(models.WargameParticipant(
            wargame_id=game.id,
            profile_id=sandra.id,
            team="buyer",
            opening_notes="Sandra — COO. Risk-averse. Will demand performance SLA and exit clause. Unlikely to agree to annual prepay without guarantees.",
            current_trust_score=40,
            engagement_level="low",
        ))

    print(f"  + Wargame: ClearRoute Pricing Negotiation (ID: {game.id})")
    db.flush()


if __name__ == "__main__":
    run()
