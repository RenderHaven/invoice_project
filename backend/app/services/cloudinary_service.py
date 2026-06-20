import cloudinary
import cloudinary.uploader
from fastapi import UploadFile
from app.config import settings

cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET,
    secure=True,
)


async def upload_file(file: UploadFile, folder: str = "finance_platform") -> dict:
    """Upload a file to Cloudinary and return the result dict with url and public_id."""
    contents = await file.read()
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


def delete_file(public_id: str) -> None:
    """Delete a file from Cloudinary by public_id."""
    cloudinary.uploader.destroy(public_id, resource_type="auto")
