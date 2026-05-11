"""
Slack sweep — runs every 6 hours.
Reads configured channels, feeds deal-relevant messages through enrichment.
"""
import os
from datetime import datetime


def run_slack_sweep():
    """Sweep configured Slack channels for intel."""
    print(f"[slack_sweep] Starting at {datetime.utcnow().isoformat()}")

    try:
        from integrations.slack_ingester import SlackIngester
        ingester = SlackIngester()
        channels = ingester.get_configured_channels()

        if not channels:
            print("[slack_sweep] No channels configured (set SLACK_INTEL_CHANNELS env var)")
            return

        total_chunks = 0
        for channel_id in channels:
            try:
                chunks = ingester.ingest_channel(channel_id, since_hours=6)
                for chunk in chunks:
                    _process_slack_chunk(chunk)
                total_chunks += len(chunks)
            except Exception as e:
                print(f"[slack_sweep] Error on channel {channel_id}: {e}")

        print(f"[slack_sweep] Done. Processed {total_chunks} message chunks.")

    except Exception as e:
        print(f"[slack_sweep] Error: {e}")


def _process_slack_chunk(chunk: dict):
    """Process a Slack message chunk through notes + profile enrichment."""
    text = chunk.get('text', '')
    if not text or len(text) < 30:
        return

    from jobs.content_sweep import _process_content_note
    _process_content_note(
        title=f"Slack: {chunk.get('source', 'unknown')} @ {chunk.get('timestamp', '')}",
        content=text,
        source='slack',
        meeting_date=None,
    )
