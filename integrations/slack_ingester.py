"""
Slack channel ingester — reads messages from configured channels,
feeds deal-relevant content through notes and profile enrichment pipeline.
"""
import os
from datetime import datetime, timedelta


class SlackIngester:

    def __init__(self):
        from integrations.slack_client import SlackClient
        self.slack = SlackClient()

    def get_recent_messages(self, channel_id: str, since_hours: int = 6) -> list:
        """Fetch messages from a Slack channel from the last N hours."""
        oldest = (datetime.utcnow() - timedelta(hours=since_hours)).timestamp()
        try:
            result = self.slack.client.conversations_history(
                channel=channel_id,
                oldest=str(oldest),
                limit=100,
            )
            messages = result.get('messages', [])
            return [
                {
                    'text': m.get('text', ''),
                    'user': m.get('user', ''),
                    'ts': m.get('ts', ''),
                    'thread_ts': m.get('thread_ts'),
                }
                for m in messages
                if m.get('text') and len(m.get('text', '')) > 20
            ]
        except Exception as e:
            print(f"Slack ingester error for channel {channel_id}: {e}")
            return []

    def get_configured_channels(self) -> list:
        """Get list of channel IDs configured for intel sweeps."""
        channels_env = os.getenv('SLACK_INTEL_CHANNELS', '')
        if channels_env:
            return [c.strip() for c in channels_env.split(',') if c.strip()]
        # Default: use the intel channel if configured
        default = os.getenv('SLACK_INTEL_CHANNEL', '')
        if default and default.startswith('C'):  # Slack channel IDs start with C
            return [default]
        return []

    def ingest_channel(self, channel_id: str, since_hours: int = 6) -> list:
        """Ingest messages from a channel and return processed text chunks."""
        messages = self.get_recent_messages(channel_id, since_hours)
        if not messages:
            return []

        # Group nearby messages into chunks for processing
        chunks = []
        current_chunk = []
        for msg in messages:
            current_chunk.append(msg['text'])
            if len(current_chunk) >= 5:
                chunks.append({
                    'text': '\n'.join(current_chunk),
                    'source': f'slack:{channel_id}',
                    'timestamp': msg['ts'],
                })
                current_chunk = []

        if current_chunk:
            chunks.append({
                'text': '\n'.join(current_chunk),
                'source': f'slack:{channel_id}',
                'timestamp': messages[-1]['ts'] if messages else None,
            })

        return chunks
