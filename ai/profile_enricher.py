"""
ProfileEnricher — enriches StakeholderProfile records from any text source.
"""
from ai.base_agent import BaseIntelAgent


class ProfileEnricher(BaseIntelAgent):

    def enrich_from_text(self, text: str, person_name: str, source_type: str,
                         existing_profile: dict = None) -> dict:
        """
        source_type: email|slack|meeting_notes|google_doc
        Returns: {field_updates, attributes_add, past_interactions_append, org_signals}
        """
        existing = existing_profile or {}
        prompt = f"""You are a CRM enrichment assistant. Given a piece of text from {source_type}, extract intelligence about the person named "{person_name}" to enrich their stakeholder profile.

EXISTING PROFILE SUMMARY:
{existing}

SOURCE TEXT ({source_type}):
{self._safe_truncate(text, 4000)}

Return a JSON object:
{{
  "field_updates": {{
    "title": "string or null",
    "company": "string or null",
    "department": "string or null",
    "decision_style": one of [analytical, intuitive, consensus, directive, relational] or null,
    "risk_tolerance": one of [risk_averse, moderate, risk_tolerant] or null,
    "ego_level": one of [low, medium, high] or null,
    "primary_motivation": one of [cost_reduction, risk_mitigation, career_advancement, innovation, compliance] or null,
    "budget_authority_usd": integer or null,
    "team_size": integer or null
  }},
  "attributes_add": {{"key": "value for new attributes discovered"}},
  "past_interactions_append": "1-2 sentence summary of interaction from this source to append to log, or null",
  "org_signals": [
    {{"person": "name", "reports_to": "manager or null", "budget_authority_usd": integer or null}}
  ]
}}

Only include fields where you have clear evidence from the text. Return ONLY valid JSON."""

        text_out, err = self._call_claude(prompt, max_tokens=1500)
        if err or not text_out:
            return {"field_updates": {}, "attributes_add": {}, "past_interactions_append": None, "org_signals": []}
        try:
            return self._extract_json(text_out)
        except Exception:
            return {"field_updates": {}, "attributes_add": {}, "past_interactions_append": None, "org_signals": []}
