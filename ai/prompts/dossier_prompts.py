"""Prompts for all 12 dossier sections (A-L) + CEO Brief"""
from ai.prompts.context import DISTYL_SYSTEM_CONTEXT, DISTYL_PRODUCTS


def section_a_prompt(entity_name, entity_type):
    return f"""{DISTYL_SYSTEM_CONTEXT}

Generate Section A — Executive Synopsis for: **{entity_name}** (type: {entity_type})

Use web search for current information. Write a 6-8 sentence executive synopsis covering:
1. What they do and who they sell to
2. Their positioning in the healthcare AI / enterprise AI market
3. Current momentum (funding, clients, growth signals)
4. Primary threat or opportunity to Distyl
5. Confidence assessment

Cite every factual claim with [Source: URL, Date].
End with: CONFIDENCE: High/Medium/Low — [reason]

Write in professional intelligence briefing style. Be specific, not generic."""


def section_b_prompt(entity_name, section_a):
    return f"""{DISTYL_SYSTEM_CONTEXT}

Generate Section B — Business Model & Revenue Mix for: **{entity_name}**

Context from Section A:
{section_a[:600]}

Use web search. Cover:
1. How they make money (SaaS ARR / usage-based / professional services / licenses)
2. Revenue mix breakdown with estimated percentages (most recent fiscal year). Cite.
3. Key revenue drivers and growth levers
4. Unit economics signals (NRR, expansion, churn indicators)

Format: "SaaS ARR: ~70% | Professional Services: ~20% | Other: ~10%"
Cite sources. State CONFIDENCE: High/Medium/Low."""


def section_c_prompt(entity_name, section_a):
    return f"""{DISTYL_SYSTEM_CONTEXT}

Generate Section C — Products & Capabilities for: **{entity_name}**

Context from Section A:
{section_a[:600]}

Use web search. Cover:
1. Named products/solutions with descriptions
2. Core technical capabilities and differentiators
3. Healthcare-specific modules or certifications
4. Recent product launches or roadmap signals
5. Integration ecosystem

For each product: Name | Description | Target buyer | Key capability | Competitive position vs Distyl
Cite sources. State CONFIDENCE: High/Medium/Low."""


def section_d_prompt(entity_name, entity_type, sections_abc):
    return f"""{DISTYL_SYSTEM_CONTEXT}

Generate Section D — Known Clients & Use Cases for: **{entity_name}** (type: {entity_type})

Prior context:
{sections_abc[:1500]}

Use web search. Cover:
1. Named healthcare clients (health plans, hospital systems, TPAs, PBMs)
2. Specific use cases deployed at those clients
3. Case studies and proof points
4. Client concentration and logo quality
5. Any client wins competitive to Distyl accounts

List: [Client Name] | [Use Case] | [Outcome claimed] | [Source] | [Date]
Flag if any client overlaps with known Distyl prospects.
State CONFIDENCE: High/Medium/Low per client."""


def section_e_prompt(entity_name, sections_abcd):
    return f"""{DISTYL_SYSTEM_CONTEXT}

Generate Section E — GTM & Sales Motion for: **{entity_name}**

Prior context:
{sections_abcd[:2000]}

Cover (synthesize from prior sections):
1. Primary sales channels (direct enterprise, channel partners, marketplace)
2. Buyer persona targeted (CIO, CMO, VP Operations, clinical leadership)
3. Deal cycle typical length and complexity signals
4. Pricing model (per-seat, per-transaction, flat license)
5. Geographic focus
6. Sales team size signals

State CONFIDENCE: High/Medium/Low."""


def section_f_prompt(entity_name, section_a):
    return f"""{DISTYL_SYSTEM_CONTEXT}

Generate Section F — Executive Team for: **{entity_name}**

Context:
{section_a[:600]}

Use web search. For each executive (CEO, CTO, CPO, CRO, CMO, VP Healthcare):
Name | Title | Background | LinkedIn URL | Notable prior roles | Distyl relevance

Focus on:
1. Healthcare domain expertise
2. Prior vendor or health plan experience
3. Anyone who moved from a Distyl prospect account
4. Any known relationships with Distyl team

State CONFIDENCE: High/Medium/Low."""


def section_g_prompt(entity_name, sections_abc):
    return f"""{DISTYL_SYSTEM_CONTEXT}

Generate Section G — Financial Profile for: **{entity_name}**

Prior context:
{sections_abc[:1000]}

Use web search. Cover:
1. Funding history (rounds, amounts, investors, dates)
2. Total capital raised
3. Revenue estimates if public
4. Burn rate signals and runway
5. IPO or acquisition signals
6. Valuation history

Format: [Date] | [Round] | [Amount] | [Lead Investors]
State CONFIDENCE: High/Medium/Low."""


def section_h_prompt(entity_name, section_c):
    return f"""{DISTYL_SYSTEM_CONTEXT}

Generate Section H — Technology Stack for: **{entity_name}**

Products/capabilities context:
{section_c[:800]}

Cover:
1. Core AI/ML approach (fine-tuned LLMs, RAG, rule-based hybrid, foundation model wrapper)
2. Infrastructure (cloud provider, hosting)
3. Data layer (EHR integrations, HL7/FHIR, claims data)
4. Key technical differentiators claimed
5. Technical debt signals or architecture weaknesses
6. Patents or IP

State CONFIDENCE: High/Medium/Low."""


def section_i_prompt(entity_name, sections_abcfg):
    return f"""{DISTYL_SYSTEM_CONTEXT}

Generate Section I — Key Partnerships for: **{entity_name}**

Prior context:
{sections_abcfg[:2000]}

Use web search. Cover:
1. Technology partnerships (EHR vendors, cloud providers, data partners)
2. Channel partnerships (resellers, implementation partners)
3. Strategic alliances (co-sell, OEM)
4. Investment-based partnerships
5. Partnership implications for Distyl (does any partnership block us?)

List: [Partner] | [Type] | [What they do together] | [Distyl implication] | [Source]
State CONFIDENCE: High/Medium/Low."""


def section_j_prompt(entity_name, entity_type, all_prior_sections):
    return f"""{DISTYL_SYSTEM_CONTEXT}

Generate Section J — Competitive Positioning vs Distyl for: **{entity_name}** (type: {entity_type})

All prior context:
{all_prior_sections[:3000]}

This is the most critical section. Cover:
1. Where we beat them (specific use cases, technical capabilities, proof points)
2. Where they beat us (be honest — where do we lose?)
3. How they position against us (their talking points about us)
4. Our counter-narrative (what we say back)
5. Trap-setting questions AEs should ask prospects evaluating both

Use HC/FX framework: Goals, Usage, Expectations, Blockers, NRR, NNR
Reference Distyl products: Eagle, Tower, Penny, Platform

Be honest and specific. Sales reps need to win, not be misled.
State CONFIDENCE: High/Medium/Low."""


def section_k_prompt(entity_name, entity_type, all_prior_sections):
    return f"""{DISTYL_SYSTEM_CONTEXT}

Generate Section K — Threat Assessment for: **{entity_name}** (type: {entity_type})

All prior context:
{all_prior_sections[:3000]}

Cover:
1. Current threat level: Critical / High / Medium / Low / Monitor
2. Threat trajectory: Rising / Stable / Declining (with rationale)
3. Specific deals where this entity is most dangerous
4. Upcoming threats (roadmap items, partnerships, hires that signal intent)
5. Distyl's strategic response recommendation
6. Time horizon: when does this threat peak?

Be forward-looking. This informs Distyl's product roadmap priorities.
State CONFIDENCE: High/Medium/Low."""


def section_l_prompt(all_prior_sections, entity_name):
    return f"""Compile Section L — Source Citations for dossier on: **{entity_name}**

Review all prior sections and extract every cited source URL and date.
Return as JSON array:
[
  {{"url": "...", "date": "...", "section": "A", "claim_summary": "..."}},
  ...
]

Prior sections:
{all_prior_sections[:4000]}

Extract ONLY sources actually cited (with URLs). Do not invent sources.
Return ONLY the JSON array, no other text."""


CEO_BRIEF_PROMPT = """You are generating a CEO-level 1-page brief for a meeting with a prospect/account.
This brief is used by Distyl's CEO or a senior executive before a first meeting.

{system_context}

Generate a CEO Brief for: **{entity_name}**

Use web search for current, accurate information. Structure exactly as follows:

**SECTION 1: What the business is and how it makes money**
3-5 sentences. Include revenue mix breakdown with percentages (most recent fiscal year). Cite sources.

**SECTION 2: How the business works** (simple lifecycle)
7-10 numbered steps from acquisition/intake → adjudication/fulfillment → servicing → compliance.
Plain language. Cite where possible.

**SECTION 3: What they are optimizing for right now (Distyl-relevant)**
2-4 sentences tied to outcomes: growth, cost-to-serve, risk/compliance, change velocity.

**SECTION 4: AI and automation signals** (real, not hype)
3-5 bullets: confirmed AI/automation programs and platforms. Cite.
If unknown, say so and point to best proxy evidence (hiring, speeches, vendor pages).

**SECTION 5: Where Distyl has the highest-probability wedge**
1 sentence: governed workflow automation with correctness, auditability, and production ownership.

**SECTION 6: Three wedge motions** (CEO-ready)
For each of 3 motions:
- Workflow (and where it sits in the org)
- Why now (timing trigger)
- Success metrics
- Blockers
- Competitive dynamic
Include confidence on inferences. Cite rationale.

**SECTION 7: Buying centers** (who owns budget and who blocks)
4-6 bullets: economic buyer, technical buyer, operator buyer, risk/compliance gatekeepers, "production owner"

**SECTION 8: Recommended outreach angle** (two sentences)
Sentence 1: why now, tied to their stated priorities.
Sentence 2: what Distyl uniquely delivers vs point vendors.

Return as JSON:
{{
  "entity_name": "{entity_name}",
  "brief_date": "YYYY-MM-DD",
  "section_1_business_model": "text with citations",
  "section_2_business_lifecycle": ["step 1", "step 2", "..."],
  "section_3_optimization_focus": "text",
  "section_4_ai_signals": ["bullet 1", "bullet 2", "..."],
  "section_5_wedge_summary": "one sentence",
  "section_6_wedge_motions": [
    {{"workflow": "...", "why_now": "...", "success_metrics": "...", "blockers": "...", "competitive": "...", "confidence": "High/Medium/Low"}},
    {{"workflow": "...", "why_now": "...", "success_metrics": "...", "blockers": "...", "competitive": "...", "confidence": "High/Medium/Low"}},
    {{"workflow": "...", "why_now": "...", "success_metrics": "...", "blockers": "...", "competitive": "...", "confidence": "High/Medium/Low"}}
  ],
  "section_7_buying_centers": ["bullet 1", "bullet 2", "..."],
  "section_8_outreach_angle": "two sentences",
  "overall_confidence": "High/Medium/Low",
  "sources": ["url1", "url2", "..."]
}}
"""
