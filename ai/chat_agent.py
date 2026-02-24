"""Chat agent — NL interface for competitive intel queries"""
from ai.base_agent import BaseIntelAgent
from ai.prompts.context import DISTYL_SYSTEM_CONTEXT


class ChatAgent(BaseIntelAgent):

    def chat(self, message, history=None):
        """Process a chat message with competitive intel context"""
        from database import get_db
        import models

        context_parts = [DISTYL_SYSTEM_CONTEXT]

        try:
            with get_db() as db:
                entities = db.query(models.Entity).filter(models.Entity.status == 'active').all()
                context_parts.append(f"\nTracked entities: {', '.join(e.name for e in entities)}")

                deals = db.query(models.Deal).filter(
                    models.Deal.stage.notin_(['closed_won', 'closed_lost'])
                ).limit(10).all()
                if deals:
                    context_parts.append(f"Active deals: {', '.join(f'{d.account_name} ({d.stage})' for d in deals)}")
        except Exception:
            pass

        system = "\n".join(context_parts) + """

You are the Distyl Intel assistant. Answer questions about competitors, deals, signals, and strategy.
Be specific, cite sources when available, and tie answers to Distyl's business context.
If you don't know something, say so — never hallucinate facts."""

        # Build conversation history as a single prompt
        conv = ""
        for h in (history or [])[-6:]:
            role = "Human" if h.get('role') == 'user' else "Assistant"
            conv += f"\n{role}: {h.get('content', '')}\n"
        conv += f"\nHuman: {message}\n"

        response_text, error = self._call_claude(
            conv,
            use_web_search=True,
            max_tokens=2000,
            system=system
        )

        if error:
            return f"Error: {error}"
        return response_text or "Unable to generate response."
