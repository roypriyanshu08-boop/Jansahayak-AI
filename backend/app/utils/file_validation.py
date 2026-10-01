from fastapi import UploadFile, HTTPException, status
from typing import Set

# Allowed MIME Types
ALLOWED_IMAGE_TYPES: Set[str] = {
    "image/jpeg", "image/png", "image/webp", "image/gif", "image/jpg"
}

ALLOWED_AUDIO_TYPES: Set[str] = {
    "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/webm"
}

ALLOWED_MIME_TYPES: Set[str] = ALLOWED_IMAGE_TYPES.union(ALLOWED_AUDIO_TYPES)

# Maximum file size: 10 Megabytes
MAX_FILE_SIZE_BYTES: int = 10 * 1024 * 1024  # 10 MB

def validate_uploaded_file(file: UploadFile, max_size_mb: int = 10) -> bytes:
    """
    Validates uploaded file MIME type and enforces file size limit.
    Returns file contents in bytes if valid; raises HTTPException otherwise.
    """
    if not file:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file uploaded."
        )

    content_type = (file.content_type or "").lower()
    if content_type not in ALLOWED_MIME_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type '{content_type}'. Allowed types: JPEG, PNG, WEBP, GIF, MP3, WAV, OGG, WEBM."
        )

    try:
        content = file.file.read()
        file_length = len(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read uploaded file: {str(e)}"
        )

    limit_bytes = max_size_mb * 1024 * 1024
    if file_length > limit_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size ({round(file_length / (1024*1024), 2)} MB) exceeds maximum allowed limit of {max_size_mb} MB."
        )

    return content
