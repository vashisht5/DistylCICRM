"""Google Drive API client"""
import io
from typing import List, Dict


def get_drive_service(access_token: str):
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    return build('drive', 'v3', credentials=Credentials(token=access_token))


def list_files_in_folder(access_token: str, folder_id: str) -> List[Dict]:
    service = get_drive_service(access_token)
    results = service.files().list(
        q=f"'{folder_id}' in parents and trashed=false",
        fields="files(id, name, mimeType, modifiedTime)",
        pageSize=50
    ).execute()
    return results.get('files', [])


def get_file_text(access_token: str, file_id: str, mime_type: str) -> str:
    service = get_drive_service(access_token)
    if mime_type == 'application/vnd.google-apps.document':
        content = service.files().export(fileId=file_id, mimeType='text/plain').execute()
        return content.decode('utf-8', errors='replace')[:10000]
    else:
        request = service.files().get_media(fileId=file_id)
        fh = io.BytesIO()
        from googleapiclient.http import MediaIoBaseDownload
        downloader = MediaIoBaseDownload(fh, request)
        done = False
        while not done:
            _, done = downloader.next_chunk()
        return fh.getvalue().decode('utf-8', errors='replace')[:10000]
