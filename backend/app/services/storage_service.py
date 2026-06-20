import os
import uuid
from pathlib import Path

import cloudinary
import cloudinary.uploader
from fastapi import UploadFile

from app.config import settings

# Local fallback directory (used when Cloudinary is unconfigured or the upload fails,
# e.g. the file exceeds the Cloudinary free-tier size limit).
UPLOAD_DIR = Path(__file__).resolve().parent.parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


def _cloudinary_ready() -> bool:
    name = settings.CLOUDINARY_CLOUD_NAME or ""
    return (
        bool(name)
        and not name.startswith("your_")
        and bool(settings.CLOUDINARY_API_KEY)
        and bool(settings.CLOUDINARY_API_SECRET)
    )


async def save_upload(file: UploadFile, folder: str = "finance_platform/documents") -> dict:
    """Store an uploaded file. Tries Cloudinary first; falls back to local disk so
    uploads keep working when Cloudinary is unconfigured or rejects the file."""
    contents = await file.read()
    ext = os.path.splitext(file.filename or "")[1].lower()

    if _cloudinary_ready():
        try:
            result = cloudinary.uploader.upload(
                contents,
                folder=folder,
                resource_type="auto",
                use_filename=True,
                unique_filename=True,
            )
            return {
                "file_url": result["secure_url"],
                "public_id": result["public_id"],
                "file_name": file.filename,
            }
        except Exception:
            # Fall through to local storage below.
            pass

    name = f"{uuid.uuid4().hex}{ext}"
    (UPLOAD_DIR / name).write_bytes(contents)
    return {
        "file_url": f"/api/v1/documents/files/{name}",
        "public_id": f"local:{name}",
        "file_name": file.filename,
    }


async def save_local(file: UploadFile) -> dict:
    """Store an upload on local disk and return a URL served by our own backend.
    Used for AI documents because Cloudinary blocks PDF delivery by default, which
    breaks both in-browser viewing and server-side extraction."""
    contents = await file.read()
    ext = os.path.splitext(file.filename or "")[1].lower()
    name = f"{uuid.uuid4().hex}{ext}"
    (UPLOAD_DIR / name).write_bytes(contents)
    return {
        "file_url": f"/api/v1/documents/files/{name}",
        "public_id": f"local:{name}",
        "file_name": file.filename,
    }


def is_local(public_id: str | None) -> bool:
    return bool(public_id) and public_id.startswith("local:")


def local_file_path(filename: str) -> Path:
    # accepts a bare filename or a "local:<name>" public_id
    if filename.startswith("local:"):
        filename = filename.split(":", 1)[1]
    return UPLOAD_DIR / filename


def delete_file(public_id: str) -> None:
    """Delete a previously stored file (Cloudinary or local)."""
    if public_id.startswith("local:"):
        path = UPLOAD_DIR / public_id.split(":", 1)[1]
        if path.exists():
            path.unlink()
        return
    cloudinary.uploader.destroy(public_id, resource_type="auto")
