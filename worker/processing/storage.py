import json
import os
import tempfile
import firebase_admin
from firebase_admin import credentials, storage


_app_initialized = False


def _init_firebase():
    """Initialize Firebase Admin SDK if not already done."""
    global _app_initialized
    if _app_initialized:
        return

    project_id = os.environ.get("FIREBASE_PROJECT_ID")
    client_email = os.environ.get("FIREBASE_CLIENT_EMAIL")
    private_key = os.environ.get("FIREBASE_PRIVATE_KEY", "").replace("\\n", "\n")

    if project_id and client_email and private_key:
        cred = credentials.Certificate({
            "type": "service_account",
            "project_id": project_id,
            "client_email": client_email,
            "private_key": private_key,
            "token_uri": "https://oauth2.googleapis.com/token",
        })
        firebase_admin.initialize_app(cred, {
            "storageBucket": f"{project_id}.appspot.com",
        })
    else:
        firebase_admin.initialize_app(options={
            "storageBucket": f"{project_id}.appspot.com" if project_id else "",
        })

    _app_initialized = True


def upload_json(data: dict, filename: str) -> str:
    """Upload JSON data to Firebase Storage and return the public URL."""
    _init_firebase()

    bucket = storage.bucket()
    blob = bucket.blob(filename)

    fd, path = tempfile.mkstemp(suffix=".json")
    try:
        with os.fdopen(fd, "w") as f:
            json.dump(data, f)
        blob.upload_from_filename(path, content_type="application/json")
    finally:
        os.unlink(path)

    blob.make_public()
    return blob.public_url
