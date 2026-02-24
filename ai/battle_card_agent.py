"""Battle card generator for AEs"""
from ai.base_agent import BaseIntelAgent
from ai.prompts.context import DISTYL_SYSTEM_CONTEXT, DISTYL_PRODUCTS, COMPETITIVE_FRAMEWORKS


class BattleCardAgent(BaseIntelAgent):

    def generate(self, entity_id, dossier_id=None, use_case=None, distyl_product=None):
        """Generate an AE battle card"""
        from database import get_db
        import models

        entity_name = "Unknown"
        dossier_context = ""

        with get_db() as db:
            entity = db.query(models.Entity).filter(models.Entity.id == entity_id).first()
            if entity:
                entity_name = entity.name

            if dossier_id:
                dossier = db.query(models.Dossier).filter(models.Dossier.id == dossier_id).first()
                if dossier:
                    parts = []
                    if dossier.section_j_competitive:
                        parts.append(f"Competitive positioning: {dossier.section_j_competitive[:1000]}")
                    if dossier.section_c_products:
                        parts.append(f"Their products: {dossier.section_c_products[:400]}")
                    if dossier.section_k_threats:
                        parts.append(f"Threat: {dossier.section_k_threats[:400]}")
                    dossier_context = "\n\n".join(parts)

        sections = COMPETITIVE_FRAMEWORKS['BATTLECARD_SECTIONS']
        prompt = f"""{DISTYL_SYSTEM_CONTEXT}

Generate a battle card for Distyl AEs competing against: **{entity_name}**
Use Case: {use_case or 'General'}
Distyl Product: {distyl_product or 'General Platform'}

{f"Dossier context:{chr(10)}{dossier_context}" if dossier_context else "Use your knowledge of this competitor."}

9-section battle card:
{chr(10).join(f"{i+1}. {s}" for i, s in enumerate(sections))}

Return as JSON:
{{
  "entity_name": "{entity_name}",
  "use_case": "{use_case or 'General'}",
  "distyl_product": "{distyl_product or 'Platform'}",
  "one_line_positioning": "...",
  "where_we_win": ["point 1", "point 2", "point 3"],
  "where_they_win": ["point 1", "point 2"],
  "trap_setting_questions": ["Q1", "Q2", "Q3"],
  "proof_points": ["proof 1", "proof 2"],
  "landmines_to_avoid": ["landmine 1", "landmine 2"],
  "pricing_framing": "...",
  "champion_enablement": ["talking point 1", "talking point 2"],
  "escalation_path": "...",
  "confidence": "High/Medium/Low"
}}"""

        response_text, error = self._call_claude(prompt, use_web_search=False, max_tokens=2500)
        if error:
            return {"error": error, "entity_name": entity_name}
        try:
            return self._extract_json(response_text)
        except Exception as e:
            return {"raw": response_text, "parse_error": str(e), "entity_name": entity_name}
