"""
Entity Enrichment Agent
Enriches all fields of a tracked entity in 6 web-search steps:
  1. Profile  — description, HQ, headcount, funding, industry
  2. Products — products JSON, primary_use_cases, known_clients
  3. People   — key executives → auto-creates Person records
  4. Tech stack — current AI/ML vendors (new tech_stack JSON field)
  5. ICP analysis — icp_score 0-100 + icp_rationale + key_challenges (synthesis, no web search)
  6. Recent news — last 30 days → creates NewsItem records
"""
import os
from datetime import datetime
from ai.base_agent import BaseIntelAgent
from ai.prompts.context import DISTYL_PRODUCTS, DISTYL_POSITIONING


class EnrichmentAgent(BaseIntelAgent):

    def enrich(self, entity_id: int) -> dict:
        """
        Full enrichment run for a single entity.
        Returns dict with status + summary of what was updated.
        """
        from database import get_db
        from models import Entity, Person, NewsItem, Signal

        with get_db() as db:
            entity = db.query(Entity).filter(Entity.id == entity_id).first()
            if not entity:
                return {"error": f"Entity {entity_id} not found"}

            name = entity.name
            entity_type = entity.entity_type

        results = {
            "entity_id": entity_id,
            "entity_name": name,
            "steps_completed": [],
            "errors": [],
        }

        # Step 1: Profile
        try:
            profile = self._enrich_profile(name)
            if profile:
                with get_db() as db:
                    entity = db.query(Entity).filter(Entity.id == entity_id).first()
                    for field in ("description", "headquarters", "employee_count",
                                  "funding_stage", "industry"):
                        val = profile.get(field)
                        if val:
                            setattr(entity, field, val)
                results["steps_completed"].append("profile")
        except Exception as e:
            results["errors"].append(f"profile: {e}")

        # Step 2: Products
        try:
            products = self._enrich_products(name)
            if products:
                with get_db() as db:
                    entity = db.query(Entity).filter(Entity.id == entity_id).first()
                    for field in ("products", "primary_use_cases", "known_clients"):
                        val = products.get(field)
                        if val:
                            setattr(entity, field, val)
                results["steps_completed"].append("products")
        except Exception as e:
            results["errors"].append(f"products: {e}")

        # Step 3: People — auto-create Person records
        try:
            people_created = self._enrich_people(entity_id, name)
            results["people_created"] = people_created
            results["steps_completed"].append("people")
        except Exception as e:
            results["errors"].append(f"people: {e}")

        # Step 4: Tech stack
        try:
            tech = self._enrich_tech_stack(name)
            if tech:
                with get_db() as db:
                    entity = db.query(Entity).filter(Entity.id == entity_id).first()
                    entity.tech_stack = tech
                results["steps_completed"].append("tech_stack")
        except Exception as e:
            results["errors"].append(f"tech_stack: {e}")

        # Step 5: ICP analysis (synthesis only — no web search)
        try:
            icp = self._synthesize_icp(entity_id, name, entity_type)
            if icp:
                with get_db() as db:
                    entity = db.query(Entity).filter(Entity.id == entity_id).first()
                    entity.icp_score = icp.get("icp_score")
                    entity.icp_rationale = icp.get("icp_rationale")
                    entity.key_challenges = icp.get("key_challenges")
                results["steps_completed"].append("icp_analysis")
        except Exception as e:
            results["errors"].append(f"icp_analysis: {e}")

        # Step 6: Recent news → NewsItem records
        try:
            news_created = self._enrich_news(entity_id, name)
            results["news_created"] = news_created
            results["steps_completed"].append("recent_news")
        except Exception as e:
            results["errors"].append(f"recent_news: {e}")

        # Only mark last_enriched_at if at least one step produced real data
        # (prevents "enriched" stamp when all API calls failed)
        data_steps = [s for s in results["steps_completed"] if s in
                      ("profile", "products", "tech_stack", "icp_analysis", "recent_news")]
        if data_steps:
            try:
                with get_db() as db:
                    entity = db.query(Entity).filter(Entity.id == entity_id).first()
                    entity.last_enriched_at = datetime.utcnow()
            except Exception as e:
                results["errors"].append(f"timestamp_update: {e}")
        else:
            results["errors"].append("no_data: all API calls returned empty — check ANTHROPIC_API_KEY")

        results["enriched_at"] = datetime.utcnow().isoformat()
        return results

    # ── Step 1: Profile ───────────────────────────────────────────

    def _enrich_profile(self, name: str) -> dict:
        prompt = f"""Research the company "{name}" and return a JSON object with these fields:
- description: 2-3 sentence company description (what they do, who they serve)
- headquarters: city, country (e.g. "Toronto, Canada")
- employee_count: approximate headcount as string (e.g. "500-1000", "~5000")
- funding_stage: latest funding stage/amount (e.g. "Series C - $270M", "Public - NYSE:AI")
- industry: primary industry (e.g. "Enterprise AI", "Healthcare IT")

Return ONLY a JSON object, no other text."""
        text, err = self._call_claude(prompt, use_web_search=True, max_tokens=1000)
        if err or not text:
            return {}
        try:
            return self._extract_json(text)
        except Exception:
            return {}

    # ── Step 2: Products ─────────────────────────────────────────

    def _enrich_products(self, name: str) -> dict:
        prompt = f"""Research the company "{name}" and return a JSON object with these fields:
- products: list of their main product/service names (e.g. ["Command", "Embed", "Rerank"])
- primary_use_cases: list of primary use cases they target (e.g. ["RAG", "Search", "NLP"])
- known_clients: list of publicly known enterprise clients (max 10)

Return ONLY a JSON object, no other text."""
        text, err = self._call_claude(prompt, use_web_search=True, max_tokens=1000)
        if err or not text:
            return {}
        try:
            return self._extract_json(text)
        except Exception:
            return {}

    # ── Step 3: People ───────────────────────────────────────────

    def _enrich_people(self, entity_id: int, name: str) -> int:
        from database import get_db
        from models import Person

        prompt = f"""Research the leadership team at "{name}".
Return a JSON array of key executives. For each person include:
- first_name: string
- last_name: string
- title: their exact title (e.g. "CEO", "CTO", "VP Sales")
- linkedin_url: LinkedIn URL if known (or null)

Focus on C-suite and VP-level. Return max 10 people.
Return ONLY a JSON array, no other text."""
        text, err = self._call_claude(prompt, use_web_search=True, max_tokens=1500)
        if err or not text:
            return 0

        try:
            people_data = self._extract_json(text)
        except Exception:
            return 0

        if not isinstance(people_data, list):
            return 0

        created = 0
        with get_db() as db:
            for p in people_data:
                if not p.get("first_name") or not p.get("last_name"):
                    continue
                # Check if already exists
                existing = db.query(Person).filter(
                    Person.entity_id == entity_id,
                    Person.first_name == p["first_name"],
                    Person.last_name == p["last_name"],
                ).first()
                if existing:
                    existing.title = p.get("title", existing.title)
                    existing.linkedin_url = p.get("linkedin_url") or existing.linkedin_url
                else:
                    person = Person(
                        entity_id=entity_id,
                        first_name=p["first_name"],
                        last_name=p["last_name"],
                        title=p.get("title"),
                        current_company=name,
                        linkedin_url=p.get("linkedin_url"),
                        person_type="executive",
                        distyl_relationship="unknown",
                        status="active",
                    )
                    db.add(person)
                    created += 1

        return created

    # ── Step 4: Tech Stack ───────────────────────────────────────

    def _enrich_tech_stack(self, name: str) -> list:
        prompt = f"""Research "{name}" and identify their current AI/ML vendor stack.
Return a JSON array of objects, each with:
- vendor: vendor name (e.g. "AWS", "OpenAI", "Databricks")
- category: category (e.g. "Cloud", "LLM", "MLOps", "Vector DB", "Data Platform")
- notes: brief note on how they use this vendor (1 sentence, or null)

Return their ACTUAL known tech stack based on public information. Max 15 entries.
Return ONLY a JSON array, no other text."""
        text, err = self._call_claude(prompt, use_web_search=True, max_tokens=1500)
        if err or not text:
            return []
        try:
            result = self._extract_json(text)
            return result if isinstance(result, list) else []
        except Exception:
            return []

    # ── Step 5: ICP Analysis (synthesis, no web search) ─────────

    def _synthesize_icp(self, entity_id: int, name: str, entity_type: str) -> dict:
        from database import get_db
        from models import Entity

        with get_db() as db:
            entity = db.query(Entity).filter(Entity.id == entity_id).first()
            entity_data = entity.to_dict() if entity else {}

        prompt = f"""You are a strategic sales analyst at Distyl AI, an enterprise AI platform.

Distyl AI context:
{DISTYL_POSITIONING}

Products: {DISTYL_PRODUCTS}

Entity to analyze:
Name: {name}
Type: {entity_type}
Description: {entity_data.get('description', 'N/A')}
Products: {entity_data.get('products', [])}
Use cases: {entity_data.get('primary_use_cases', [])}
Industry: {entity_data.get('industry', 'N/A')}
Known clients: {entity_data.get('known_clients', [])}
Tech stack: {entity_data.get('tech_stack', [])}

For a TARGET entity: assess how well Distyl AI could serve this account.
For a COMPETITOR entity: assess their threat level and strategic importance.
For a PARTNER entity: assess partnership potential and synergies.

Return a JSON object with:
- icp_score: integer 0-100 (for targets: how strong an ICP fit; for competitors: threat score; for partners: partnership value score)
- icp_rationale: 2-3 sentence explanation of the score
- key_challenges: JSON array of 3-5 key challenges this entity faces that are relevant to Distyl AI

Return ONLY a JSON object, no other text."""
        text, err = self._call_claude(prompt, use_web_search=False, max_tokens=1000)
        if err or not text:
            return {}
        try:
            return self._extract_json(text)
        except Exception:
            return {}

    # ── Step 6: Recent News → NewsItem records ───────────────────

    def _enrich_news(self, entity_id: int, name: str) -> int:
        from database import get_db
        from models import NewsItem

        prompt = f"""Search for the most recent news about "{name}" from the last 30 days.
Return a JSON array of news items. For each item include:
- headline: article headline (string)
- summary: 1-2 sentence summary (string)
- url: source URL (string or null)
- source_name: publication name (string)
- published_at: date in ISO format YYYY-MM-DD (string or null)

Focus on: product launches, partnerships, funding, executive changes, customer wins, competitive moves.
Return max 10 items.
Return ONLY a JSON array, no other text."""
        text, err = self._call_claude(prompt, use_web_search=True, max_tokens=2000)
        if err or not text:
            return 0

        try:
            items = self._extract_json(text)
        except Exception:
            return 0

        if not isinstance(items, list):
            return 0

        created = 0
        with get_db() as db:
            for item in items:
                if not item.get("headline"):
                    continue
                url = item.get("url")
                # Deduplicate by URL
                if url:
                    existing = db.query(NewsItem).filter(NewsItem.url == url).first()
                    if existing:
                        continue

                published_at = None
                if item.get("published_at"):
                    try:
                        published_at = datetime.fromisoformat(item["published_at"])
                    except Exception:
                        pass

                news_item = NewsItem(
                    entity_id=entity_id,
                    headline=item["headline"],
                    summary=item.get("summary"),
                    url=url,
                    source_name=item.get("source_name", "Claude Web Search"),
                    source_type="claude_search",
                    published_at=published_at,
                    relevance_score=70,
                )
                db.add(news_item)
                created += 1

        return created
