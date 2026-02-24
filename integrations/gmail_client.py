"""Gmail API client"""
import base64
from typing import List, Dict, Optional


def get_gmail_service(access_token: str):
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    return build('gmail', 'v1', credentials=Credentials(token=access_token))


def list_messages(access_token: str, query: str = '', max_results: int = 20) -> List[Dict]:
    service = get_gmail_service(access_token)
    result = service.users().messages().list(userId='me', q=query, maxResults=max_results).execute()
    return result.get('messages', [])


def get_message(access_token: str, message_id: str) -> Dict:
    service = get_gmail_service(access_token)
    msg = service.users().messages().get(userId='me', id=message_id, format='full').execute()

    headers = {h['name']: h['value'] for h in msg.get('payload', {}).get('headers', [])}
    return {
        'message_id': message_id,
        'thread_id': msg.get('threadId', ''),
        'subject': headers.get('Subject', ''),
        'sender': headers.get('From', ''),
        'date': headers.get('Date', ''),
        'body': _extract_body(msg.get('payload', {})),
    }


def _extract_body(payload: Dict) -> str:
    body = ''
    if payload.get('body', {}).get('data'):
        body = base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8', errors='replace')
    elif payload.get('parts'):
        for part in payload['parts']:
            if part.get('mimeType') == 'text/plain' and part.get('body', {}).get('data'):
                body += base64.urlsafe_b64decode(part['body']['data']).decode('utf-8', errors='replace')
    return body[:3000]
