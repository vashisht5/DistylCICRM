"""
AttributeParser — converts free-text notes into structured fields + attributes JSON.
Used for StakeholderProfile.raw_notes and DealIntel.raw_notes.
"""
from ai.base_agent import BaseIntelAgent


class AttributeParser(BaseIntelAgent):

    def parse_stakeholder_notes(self, raw_text: str, existing_fields: dict = None) -> dict:
        """Parse free-text about a person → structured fields + attributes JSON."""
        existing = existing_fields or {}
        prompt = f"""You are a sales intelligence assistant. Parse the following free-text notes about a stakeholder into structured fields.

EXISTING FIELDS (for context, do not overwrite unless the new text is more specific):
{existing}

FREE-TEXT NOTES:
{self._safe_truncate(raw_text, 3000)}

Return a JSON object with:
{{
  "field_updates": {{
    "title": "string or null",
    "company": "string or null",
    "department": "string or null",
    "role": one of [procurement, legal, champion, exec, finance, technical, board, user_buyer] or null,
    "decision_style": one of [analytical, intuitive, consensus, directive, relational] or null,
    "risk_tolerance": one of [risk_averse, moderate, risk_tolerant] or null,
    "ego_level": one of [low, medium, high] or null,
    "orientation": one of [transactional, relational] or null,
    "communication_style": one of [direct, diplomatic, data_driven, political, emotional] or null,
    "primary_motivation": one of [cost_reduction, risk_mitigation, career_advancement, innovation, compliance] or null,
    "influence_level": one of [low, medium, high, key_decision_maker] or null,
    "technical_depth": one of [non_technical, moderate, deep_technical] or null,
    "budget_authority_usd": integer or null,
    "owns_budget_for": "string or null",
    "team_size": integer or null,
    "concession_pattern": one of [never_first, reciprocal, random, strategic_early] or null,
    "typical_opening_position": "string or null",
    "reports_to_name": "name of manager if mentioned or null"
  }},
  "attributes": {{
    "key": "value pairs for anything else notable (reference_requirements, preferred_format, etc.)"
  }},
  "hot_buttons": ["array of hot button strings or empty array"],
  "known_tactics": ["array of known tactic strings or empty array"],
  "typical_objectives": ["array of objective strings or empty array"],
  "typical_constraints": ["array of constraint strings or empty array"],
  "confidence": {{"field_name": 0.0-1.0}}
}}

Only include non-null fields in field_updates. Return ONLY valid JSON."""

        text, err = self._call_claude(prompt, max_tokens=2000)
        if err or not text:
            return {"field_updates": {}, "attributes": {}, "hot_buttons": [], "known_tactics": [],
                    "typical_objectives": [], "typical_constraints": [], "confidence": {}}
        try:
            return self._extract_json(text)
        except Exception:
            return {"field_updates": {}, "attributes": {}, "hot_buttons": [], "known_tactics": [],
                    "typical_objectives": [], "typical_constraints": [], "confidence": {}}

    def parse_deal_notes(self, raw_text: str, existing_fields: dict = None) -> dict:
        """Parse free-text about a deal → MEDDIC fields + attributes JSON."""
        existing = existing_fields or {}
        prompt = f"""You are a sales intelligence assistant. Parse the following free-text deal notes into MEDDIC fields.

EXISTING FIELDS (for context):
{existing}

FREE-TEXT NOTES:
{self._safe_truncate(raw_text, 3000)}

Return a JSON object with:
{{
  "field_updates": {{
    "presales_stage": one of [discovery, qualification, technical_eval, pricing, negotiation, close] or null,
    "metrics": "measurable success criteria string or null",
    "identified_pain": "identified pain points string or null",
    "decision_criteria": ["list of decision criteria strings"] or null,
    "decision_process": "description of decision process string or null",
    "seller_batna": "our best alternative string or null",
    "buyer_batna_estimate": "their best alternative estimate or null",
    "economic_buyer_name": "name of economic buyer if mentioned or null",
    "champion_name": "name of champion if mentioned or null"
  }},
  "attributes": {{
    "budget_cycle": "e.g. Q2 FY26",
    "procurement_process": "e.g. 3-vendor RFP"
  }},
  "key_risks": ["array of risk strings or empty"],
  "next_steps": ["array of next step strings or empty"],
  "confidence": {{"field_name": 0.0-1.0}}
}}

Only include non-null fields in field_updates. Return ONLY valid JSON."""

        text, err = self._call_claude(prompt, max_tokens=2000)
        if err or not text:
            return {"field_updates": {}, "attributes": {}, "key_risks": [], "next_steps": [], "confidence": {}}
        try:
            return self._extract_json(text)
        except Exception:
            return {"field_updates": {}, "attributes": {}, "key_risks": [], "next_steps": [], "confidence": {}}

    def extract_org_signals(self, text: str) -> list:
        """Extract org hierarchy signals from text."""
        prompt = f"""Extract organizational hierarchy information from this text.

TEXT:
{self._safe_truncate(text, 3000)}

Return a JSON array of org signals found:
[
  {{
    "person": "person name",
    "reports_to": "manager name or null",
    "budget_authority_usd": integer or null,
    "owns_budget_for": "description or null",
    "title": "title or null",
    "company": "company or null"
  }}
]

Return ONLY a valid JSON array. If nothing found, return []."""

        text_out, err = self._call_claude(prompt, max_tokens=1000)
        if err or not text_out:
            return []
        try:
            return self._extract_json(text_out)
        except Exception:
            return []
