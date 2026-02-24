"""
Dossier Agent — 12-section Universal Dossier generation + CEO Brief.
Section-by-section: each gets full attention, later sections reference earlier outputs.
"""
from datetime import datetime
from ai.base_agent import BaseIntelAgent
from ai.prompts.dossier_prompts import (
    section_a_prompt, section_b_prompt, section_c_prompt, section_d_prompt,
    section_e_prompt, section_f_prompt, section_g_prompt, section_h_prompt,
    section_i_prompt, section_j_prompt, section_k_prompt, section_l_prompt,
    CEO_BRIEF_PROMPT
)
from ai.prompts.context import DISTYL_SYSTEM_CONTEXT


class DossierAgent(BaseIntelAgent):

    def generate(self, dossier_id, entity_id):
        """Generate all 12 sections. Called in background thread."""
        from database import get_db
        import models

        print(f"📋 Dossier generation starting: dossier={dossier_id}, entity={entity_id}")

        try:
            with get_db() as db:
                dossier = db.query(models.Dossier).filter(models.Dossier.id == dossier_id).first()
                entity = db.query(models.Entity).filter(models.Entity.id == entity_id).first()
                if not dossier or not entity:
                    print(f"❌ Dossier or entity not found")
                    return
                dossier.generation_status = 'in_progress'
                db.commit()
                entity_name = entity.name
                entity_type = entity.entity_type

            sections = {}

            # Sections A-D: use web search
            print(f"  → A: Executive Synopsis")
            sections['a'], _ = self._call_claude(
                section_a_prompt(entity_name, entity_type),
                use_web_search=True, max_tokens=2000
            )

            print(f"  → B: Business Model")
            sections['b'], _ = self._call_claude(
                section_b_prompt(entity_name, sections.get('a', '')),
                use_web_search=True, max_tokens=2000
            )

            print(f"  → C: Products")
            sections['c'], _ = self._call_claude(
                section_c_prompt(entity_name, sections.get('a', '')),
                use_web_search=True, max_tokens=2500
            )

            sections_abc = f"A: {sections.get('a','')}\n\nB: {sections.get('b','')}\n\nC: {sections.get('c','')}"

            print(f"  → D: Clients")
            sections['d'], _ = self._call_claude(
                section_d_prompt(entity_name, entity_type, sections_abc),
                use_web_search=True, max_tokens=2500
            )

            sections_abcd = sections_abc + f"\n\nD: {sections.get('d','')}"

            # Sections E-K: synthesize (no web search)
            print(f"  → E: GTM")
            sections['e'], _ = self._call_claude(
                section_e_prompt(entity_name, sections_abcd),
                use_web_search=False, max_tokens=1500
            )

            print(f"  → F: Exec Team")
            sections['f'], _ = self._call_claude(
                section_f_prompt(entity_name, sections.get('a', '')),
                use_web_search=True, max_tokens=2000
            )

            print(f"  → G: Financials")
            sections['g'], _ = self._call_claude(
                section_g_prompt(entity_name, sections_abc),
                use_web_search=True, max_tokens=1500
            )

            print(f"  → H: Technology")
            sections['h'], _ = self._call_claude(
                section_h_prompt(entity_name, sections.get('c', '')),
                use_web_search=False, max_tokens=1500
            )

            sections_abcfg = sections_abcd + f"\n\nF: {sections.get('f','')}\n\nG: {sections.get('g','')}"

            print(f"  → I: Partnerships")
            sections['i'], _ = self._call_claude(
                section_i_prompt(entity_name, sections_abcfg),
                use_web_search=True, max_tokens=2000
            )

            all_prior = "\n\n".join([f"Section {k.upper()}: {v}" for k, v in sections.items() if v])

            print(f"  → J: Competitive Positioning")
            sections['j'], _ = self._call_claude(
                section_j_prompt(entity_name, entity_type, all_prior),
                use_web_search=False, max_tokens=2500
            )

            print(f"  → K: Threat Assessment")
            sections['k'], _ = self._call_claude(
                section_k_prompt(entity_name, entity_type, all_prior),
                use_web_search=False, max_tokens=1500
            )

            # Section L: compile citations
            all_text = "\n\n".join([f"Section {k.upper()}: {v}" for k, v in sections.items() if v])
            print(f"  → L: Citations")
            citations_text, _ = self._call_claude(
                section_l_prompt(all_text, entity_name),
                use_web_search=False, max_tokens=2000
            )
            try:
                section_l = self._extract_json(citations_text) if citations_text else []
            except Exception:
                section_l = []

            confidence = self._assess_confidence(sections)
            source_count = len(section_l) if isinstance(section_l, list) else 0

            with get_db() as db:
                d = db.query(models.Dossier).filter(models.Dossier.id == dossier_id).first()
                if d:
                    d.section_a_synopsis = sections.get('a')
                    d.section_b_business_model = sections.get('b')
                    d.section_c_products = sections.get('c')
                    d.section_d_clients = sections.get('d')
                    d.section_e_gtm = sections.get('e')
                    d.section_f_exec_team = sections.get('f')
                    d.section_g_financials = sections.get('g')
                    d.section_h_technology = sections.get('h')
                    d.section_i_partnerships = sections.get('i')
                    d.section_j_competitive = sections.get('j')
                    d.section_k_threats = sections.get('k')
                    d.section_l_appendix = section_l
                    d.overall_confidence = confidence
                    d.source_count = source_count
                    d.generation_status = 'completed'
                    d.generated_at = datetime.utcnow()
                    db.commit()

                e = db.query(models.Entity).filter(models.Entity.id == entity_id).first()
                if e:
                    e.last_enriched_at = datetime.utcnow()
                    db.commit()

            print(f"✅ Dossier {dossier_id} complete. Confidence: {confidence}, Sources: {source_count}")

        except Exception as e:
            print(f"❌ Dossier generation failed: {e}")
            try:
                from database import get_db
                import models
                with get_db() as db:
                    d = db.query(models.Dossier).filter(models.Dossier.id == dossier_id).first()
                    if d:
                        d.generation_status = 'failed'
                        db.commit()
            except Exception:
                pass

    def generate_ceo_brief(self, dossier_id, entity_name):
        """Generate CEO 1-page brief for a meeting."""
        print(f"📄 CEO Brief: {entity_name}")

        dossier_context = ""
        try:
            from database import get_db
            import models
            with get_db() as db:
                dossier = db.query(models.Dossier).filter(models.Dossier.id == dossier_id).first()
                if dossier:
                    parts = []
                    if dossier.section_a_synopsis:
                        parts.append(f"Synopsis: {dossier.section_a_synopsis[:600]}")
                    if dossier.section_c_products:
                        parts.append(f"Products: {dossier.section_c_products[:400]}")
                    if dossier.section_d_clients:
                        parts.append(f"Clients: {dossier.section_d_clients[:400]}")
                    dossier_context = "\n\n".join(parts)
        except Exception:
            pass

        prompt = CEO_BRIEF_PROMPT.format(
            entity_name=entity_name,
            system_context=DISTYL_SYSTEM_CONTEXT
        )

        response_text, error = self._call_claude(prompt, use_web_search=True, max_tokens=4000)

        if error:
            return {"error": error, "entity_name": entity_name, "generated_at": datetime.utcnow().isoformat()}

        try:
            brief = self._extract_json(response_text)
            brief['generated_at'] = datetime.utcnow().isoformat()
            return brief
        except Exception as e:
            return {
                "entity_name": entity_name,
                "raw_brief": response_text,
                "generated_at": datetime.utcnow().isoformat(),
                "parse_error": str(e)
            }

    def _assess_confidence(self, sections):
        filled = sum(1 for v in sections.values() if v and len(v) > 100)
        total = len(sections)
        has_citations = any('[Source:' in (v or '') for v in sections.values())
        if filled >= total * 0.8 and has_citations:
            return 'High'
        elif filled >= total * 0.5:
            return 'Medium'
        return 'Low'
