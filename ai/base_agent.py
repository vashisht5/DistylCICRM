"""
Base AI agent — shared _call_claude(), _extract_json(), _record_eval()
All agents inherit from this.
"""
import os
import json
import re
import requests
from datetime import datetime

ANTHROPIC_URL = "https://api.anthropic.com/v1/messages"
MODEL = "claude-sonnet-4-20250514"


class BaseIntelAgent:
    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv('ANTHROPIC_API_KEY')
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY required")

    def _call_claude(self, prompt, use_web_search=False, max_tokens=4000, system=None):
        """Call Claude API with optional web search tool"""
        tools = []
        if use_web_search:
            tools.append({
                "type": "web_search_20250305",
                "name": "web_search"
            })

        payload = {
            "model": MODEL,
            "max_tokens": max_tokens,
            "messages": [{"role": "user", "content": prompt}]
        }

        if system:
            payload["system"] = system
        if tools:
            payload["tools"] = tools

        headers = {
            "Content-Type": "application/json",
            "x-api-key": self.api_key,
            "anthropic-version": "2023-06-01"
        }

        try:
            response = requests.post(ANTHROPIC_URL, json=payload, headers=headers, timeout=180)

            if response.status_code != 200:
                return None, f"API error {response.status_code}: {response.text[:300]}"

            data = response.json()
            # Extract all text content blocks (web search returns tool_use + text blocks)
            text_parts = [c['text'] for c in data.get('content', []) if c.get('type') == 'text']
            text_content = '\n'.join(text_parts)
            return text_content, None

        except requests.Timeout:
            return None, "API timeout (180s)"
        except Exception as e:
            return None, str(e)

    def _extract_json(self, text):
        """Extract JSON from text, handling markdown fences"""
        if not text:
            raise ValueError("Empty response")

        text = text.strip()

        # Strip markdown fences
        if '```json' in text:
            m = re.search(r'```json\s*([\s\S]*?)\s*```', text)
            if m:
                text = m.group(1)
        elif '```' in text:
            m = re.search(r'```\s*([\s\S]*?)\s*```', text)
            if m:
                text = m.group(1)

        # Find JSON object or array
        m = re.search(r'(\{[\s\S]*\}|\[[\s\S]*\])', text)
        if m:
            text = m.group(1)

        return json.loads(text)

    def _record_eval(self, entity_id, section, prompt_version, response_text, confidence):
        """Record prompt evaluation for quality tracking"""
        pass  # Future: write to eval_logs table

    def _safe_truncate(self, text, max_chars=2000):
        if not text:
            return ""
        return text[:max_chars] + ("..." if len(text) > max_chars else "")
