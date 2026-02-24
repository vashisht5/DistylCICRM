"""Slack Web API client"""
import os


class SlackClient:
    def __init__(self):
        self.bot_token = os.getenv('SLACK_BOT_TOKEN')
        self._client = None

    @property
    def client(self):
        if not self._client and self.bot_token:
            from slack_sdk import WebClient
            self._client = WebClient(token=self.bot_token)
        return self._client

    def post_message(self, channel: str, text: str, blocks=None):
        if not self.client:
            print(f"[SLACK MOCK] {channel}: {text[:100]}")
            return None
        try:
            kwargs = {"channel": channel, "text": text}
            if blocks:
                kwargs["blocks"] = blocks
            resp = self.client.chat_postMessage(**kwargs)
            return resp.get("ts")
        except Exception as e:
            print(f"Slack error: {e}")
            return None

    def send_dm(self, user_id: str, text: str, blocks=None):
        if not self.client:
            print(f"[SLACK MOCK DM] {user_id}: {text[:100]}")
            return None
        try:
            conv = self.client.conversations_open(users=[user_id])
            channel_id = conv["channel"]["id"]
            return self.post_message(channel_id, text, blocks)
        except Exception as e:
            print(f"Slack DM error: {e}")
            return None

    def post_signal_alert(self, entity_name: str, title: str, score: int,
                          source_url: str, channel: str = "#competitive-intel"):
        emoji = "🔴" if score >= 80 else "🟡" if score >= 60 else "⚪"
        text = f"{emoji} *{entity_name}* [{score}/100]: {title}"
        blocks = [
            {"type": "section", "text": {"type": "mrkdwn", "text": text}},
            {"type": "section", "text": {"type": "mrkdwn", "text": f"<{source_url}|View source>"}},
        ]
        return self.post_message(channel, text, blocks)
