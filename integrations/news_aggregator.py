"""
Unified news aggregator — NewsAPI + Perplexity + RSS + Claude web search
"""
import os
import json
import requests
import feedparser
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from typing import List, Optional


@dataclass
class NewsItem:
    entity_id: int
    headline: str
    summary: str
    url: str
    source_name: str
    source_type: str
    published_at: Optional[datetime] = None


HEALTHCARE_RSS_FEEDS = [
    ("TechCrunch AI", "https://techcrunch.com/category/artificial-intelligence/feed/"),
    ("Fierce Healthcare", "https://www.fiercehealthcare.com/rss/xml"),
    ("STAT News", "https://www.statnews.com/feed/"),
    ("Modern Healthcare", "https://www.modernhealthcare.com/section/technology/rss"),
    ("VentureBeat AI", "https://venturebeat.com/category/ai/feed/"),
    ("Healthcare IT News", "https://www.healthcareitnews.com/rss.xml"),
    ("Becker's Health IT", "https://www.beckershospitalreview.com/rss/health-it.rss"),
]


class NewsAggregator:

    def __init__(self):
        self.newsapi_key = os.getenv('NEWSAPI_KEY')
        self.perplexity_key = os.getenv('PERPLEXITY_API_KEY')
        self.anthropic_key = os.getenv('ANTHROPIC_API_KEY')

    def fetch_all(self, entity_id: int, entity_name: str, entity_type: str = 'competitor',
                  use_cases: list = None) -> List[NewsItem]:
        results = []

        for fn, label in [(self.fetch_newsapi, 'NewsAPI'), (self.fetch_perplexity, 'Perplexity'),
                          (self.fetch_rss, 'RSS'), (self.fetch_claude_search, 'Claude')]:
            try:
                results += fn(entity_id, entity_name)
            except Exception as e:
                print(f"  ⚠️  {label} error for {entity_name}: {e}")

        return self._deduplicate(results)

    def fetch_newsapi(self, entity_id: int, entity_name: str) -> List[NewsItem]:
        if not self.newsapi_key:
            return []

        resp = requests.get("https://newsapi.org/v2/everything", params={
            "q": f'"{entity_name}"',
            "sortBy": "publishedAt",
            "pageSize": 10,
            "language": "en",
            "from": (datetime.utcnow() - timedelta(days=7)).strftime('%Y-%m-%d'),
            "apiKey": self.newsapi_key
        }, timeout=15)

        if resp.status_code != 200:
            return []

        items = []
        for a in resp.json().get('articles', []):
            if not a.get('url') or a['url'] == '[Removed]':
                continue
            items.append(NewsItem(
                entity_id=entity_id,
                headline=a.get('title', '')[:500],
                summary=(a.get('description') or '')[:1000],
                url=a['url'],
                source_name=a.get('source', {}).get('name', 'NewsAPI'),
                source_type='newsapi',
                published_at=self._parse_date(a.get('publishedAt'))
            ))
        return items

    def fetch_perplexity(self, entity_id: int, entity_name: str) -> List[NewsItem]:
        if not self.perplexity_key:
            return []

        resp = requests.post(
            "https://api.perplexity.ai/chat/completions",
            json={
                "model": "llama-3.1-sonar-small-128k-online",
                "messages": [{"role": "user", "content": f"Latest news about {entity_name} in the last 7 days. Include specific announcements, partnerships, funding, product launches."}]
            },
            headers={"Authorization": f"Bearer {self.perplexity_key}", "Content-Type": "application/json"},
            timeout=30
        )

        if resp.status_code != 200:
            return []

        data = resp.json()
        content = data.get('choices', [{}])[0].get('message', {}).get('content', '')
        citations = data.get('citations', [])

        if not content or len(content) < 50:
            return []

        return [NewsItem(
            entity_id=entity_id,
            headline=f"{entity_name} — Recent Developments (Perplexity)",
            summary=content[:1500],
            url=citations[0] if citations else f"https://perplexity.ai/search?q={entity_name.replace(' ', '+')}",
            source_name="Perplexity AI",
            source_type='perplexity',
            published_at=datetime.utcnow()
        )]

    def fetch_rss(self, entity_id: int, entity_name: str) -> List[NewsItem]:
        items = []
        entity_lower = entity_name.lower()

        for feed_name, feed_url in HEALTHCARE_RSS_FEEDS:
            try:
                feed = feedparser.parse(feed_url)
                for entry in feed.entries[:20]:
                    title = entry.get('title', '')
                    summary = entry.get('summary', '') or entry.get('description', '')
                    link = entry.get('link', '')

                    if entity_lower not in title.lower() and entity_lower not in summary.lower():
                        continue

                    published = None
                    if hasattr(entry, 'published_parsed') and entry.published_parsed:
                        published = datetime(*entry.published_parsed[:6])

                    items.append(NewsItem(
                        entity_id=entity_id,
                        headline=title[:500],
                        summary=summary[:1000],
                        url=link,
                        source_name=feed_name,
                        source_type='rss',
                        published_at=published
                    ))
            except Exception:
                continue

        return items

    def fetch_claude_search(self, entity_id: int, entity_name: str) -> List[NewsItem]:
        if not self.anthropic_key:
            return []

        resp = requests.post(
            "https://api.anthropic.com/v1/messages",
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 1000,
                "tools": [{"type": "web_search_20250305", "name": "web_search"}],
                "messages": [{"role": "user", "content": f"Find the latest news, announcements, and developments from {entity_name} in 2026. Focus on healthcare AI, partnerships, product launches, funding. Return 3-5 items as JSON: [{{\"headline\": \"...\", \"summary\": \"...\", \"url\": \"...\", \"date\": \"...\"}}]"}]
            },
            headers={
                "Content-Type": "application/json",
                "x-api-key": self.anthropic_key,
                "anthropic-version": "2023-06-01"
            },
            timeout=60
        )

        if resp.status_code != 200:
            return []

        data = resp.json()
        text_content = next((c['text'] for c in data.get('content', []) if c.get('type') == 'text'), '')

        items = []
        try:
            import re
            m = re.search(r'\[[\s\S]*\]', text_content)
            if m:
                for item in json.loads(m.group())[:5]:
                    items.append(NewsItem(
                        entity_id=entity_id,
                        headline=item.get('headline', '')[:500],
                        summary=item.get('summary', '')[:1000],
                        url=item.get('url', f"https://claude.ai/search/{entity_name.replace(' ', '+')}"),
                        source_name="Claude Web Search",
                        source_type='claude_search',
                        published_at=self._parse_date(item.get('date'))
                    ))
        except Exception:
            if text_content:
                items.append(NewsItem(
                    entity_id=entity_id,
                    headline=f"{entity_name} — Latest Developments",
                    summary=text_content[:1000],
                    url=f"https://claude.ai/search/{entity_name.replace(' ', '+')}",
                    source_name="Claude Web Search",
                    source_type='claude_search',
                    published_at=datetime.utcnow()
                ))

        return items

    def _deduplicate(self, items: List[NewsItem]) -> List[NewsItem]:
        seen_urls = set()
        seen_headlines = set()
        result = []

        for item in items:
            if not item.url or not item.headline:
                continue
            url_key = item.url.split('?')[0].rstrip('/')
            headline_key = item.headline[:60].lower().strip()

            if url_key in seen_urls or headline_key in seen_headlines:
                continue

            seen_urls.add(url_key)
            seen_headlines.add(headline_key)
            result.append(item)

        return result

    def _parse_date(self, date_str) -> Optional[datetime]:
        if not date_str:
            return None
        try:
            from dateutil import parser as dp
            return dp.parse(date_str)
        except Exception:
            try:
                return datetime.fromisoformat(str(date_str).replace('Z', '').replace('+00:00', ''))
            except Exception:
                return None
