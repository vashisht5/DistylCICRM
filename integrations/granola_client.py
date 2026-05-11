"""
Granola local note reader.
Attempts to read from Granola's local SQLite cache.
"""
import os
import json
import sqlite3
from datetime import datetime


class GranolaClient:
    CACHE_DB_PATH = os.path.expanduser('~/Library/Caches/com.granola.app/Cache.db')
    APP_SUPPORT_PATH = os.path.expanduser('~/Library/Application Support/Granola')

    def get_recent_notes(self, since_timestamp=None) -> list:
        """Read notes from Granola's local storage. Returns list of note dicts."""
        notes = []

        # Try cache DB first
        notes = self._try_cache_db(since_timestamp)
        if notes:
            return notes

        # Try Application Support
        notes = self._try_app_support(since_timestamp)
        if notes:
            return notes

        return []

    def get_notes_since(self, last_sync_time) -> list:
        return self.get_recent_notes(since_timestamp=last_sync_time)

    def _try_cache_db(self, since_timestamp=None) -> list:
        """Try to read notes from the URL cache DB."""
        if not os.path.exists(self.CACHE_DB_PATH):
            return []
        try:
            conn = sqlite3.connect(self.CACHE_DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            # Check available tables
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
            tables = [r[0] for r in cursor.fetchall()]

            # Look for note-like tables
            note_tables = [t for t in tables if any(kw in t.lower() for kw in ['note', 'doc', 'meeting', 'transcript'])]

            notes = []
            for table in note_tables:
                try:
                    cursor.execute(f"SELECT * FROM {table} LIMIT 50")
                    rows = cursor.fetchall()
                    for row in rows:
                        note = self._parse_cache_row(dict(row), since_timestamp)
                        if note:
                            notes.append(note)
                except Exception:
                    continue

            # Try to extract notes from cfurl_cache_response (may contain JSON payloads)
            if not notes and 'cfurl_cache_response' in tables:
                notes = self._extract_from_url_cache(cursor, since_timestamp)

            conn.close()
            return notes
        except Exception as e:
            print(f"Granola cache DB read error: {e}")
            return []

    def _extract_from_url_cache(self, cursor, since_timestamp=None) -> list:
        """Attempt to extract note data from URL cache responses."""
        notes = []
        try:
            cursor.execute("SELECT * FROM cfurl_cache_receiver_data LIMIT 100")
            rows = cursor.fetchall()
            for row in rows:
                try:
                    # Try to decode cached data as JSON
                    data = dict(row)
                    for key, val in data.items():
                        if isinstance(val, bytes):
                            try:
                                text = val.decode('utf-8', errors='ignore')
                                if '"title"' in text or '"content"' in text or '"notes"' in text:
                                    parsed = json.loads(text)
                                    if isinstance(parsed, dict) and ('title' in parsed or 'content' in parsed):
                                        notes.append({
                                            'title': parsed.get('title', 'Granola Note'),
                                            'content': parsed.get('content') or parsed.get('notes') or str(parsed),
                                            'created_at': parsed.get('created_at') or parsed.get('date'),
                                            'meeting_attendees': parsed.get('attendees') or [],
                                        })
                            except Exception:
                                pass
                except Exception:
                    continue
        except Exception:
            pass
        return notes

    def _try_app_support(self, since_timestamp=None) -> list:
        """Try Application Support folder for SQLite databases."""
        notes = []
        if not os.path.exists(self.APP_SUPPORT_PATH):
            return []
        for fname in os.listdir(self.APP_SUPPORT_PATH):
            if fname.endswith('.db') or fname.endswith('.sqlite'):
                db_path = os.path.join(self.APP_SUPPORT_PATH, fname)
                try:
                    conn = sqlite3.connect(db_path)
                    cursor = conn.cursor()
                    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
                    tables = [r[0] for r in cursor.fetchall()]
                    for table in tables:
                        if any(kw in table.lower() for kw in ['note', 'doc', 'meeting', 'transcript', 'content']):
                            try:
                                cursor.execute(f"SELECT * FROM {table} LIMIT 50")
                                rows = cursor.fetchall()
                                cols = [d[0] for d in cursor.description]
                                for row in rows:
                                    row_dict = dict(zip(cols, row))
                                    note = self._parse_cache_row(row_dict, since_timestamp)
                                    if note:
                                        notes.append(note)
                            except Exception:
                                continue
                    conn.close()
                except Exception:
                    continue
        return notes

    def _parse_cache_row(self, row: dict, since_timestamp=None):
        """Try to map a DB row to a note dict. Returns None if not note-like."""
        # Look for content-like fields
        content = None
        for key in ['content', 'text', 'notes', 'transcript', 'body', 'summary']:
            if key in row and row[key]:
                content = str(row[key])
                break

        if not content or len(content) < 20:
            return None

        title = None
        for key in ['title', 'name', 'subject', 'heading']:
            if key in row and row[key]:
                title = str(row[key])
                break

        created_at = None
        for key in ['created_at', 'date', 'timestamp', 'meeting_date', 'started_at']:
            if key in row and row[key]:
                created_at = row[key]
                break

        if since_timestamp and created_at:
            try:
                if isinstance(created_at, str):
                    ts = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    if ts.timestamp() < since_timestamp:
                        return None
            except Exception:
                pass

        return {
            'title': title or 'Granola Note',
            'content': content,
            'created_at': created_at,
            'meeting_attendees': row.get('attendees') or [],
        }

    def is_available(self) -> bool:
        """Check if Granola data is accessible."""
        return os.path.exists(self.CACHE_DB_PATH) or os.path.exists(self.APP_SUPPORT_PATH)

    def get_status(self) -> dict:
        """Return status info."""
        return {
            'cache_db_exists': os.path.exists(self.CACHE_DB_PATH),
            'app_support_exists': os.path.exists(self.APP_SUPPORT_PATH),
            'available': self.is_available(),
        }
