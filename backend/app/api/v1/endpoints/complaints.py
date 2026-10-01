import os
import uuid
import shutil
from fastapi import APIRouter, Depends, status, Query, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.schemas.complaint import ComplaintCreate, ComplaintResponse, ComplaintUpdate
from app.schemas.history import HistoryResponse
from app.services.complaint_service import (
    create_complaint, get_complaint_by_id, get_user_complaints,
    get_all_complaints, update_complaint_status
)
from app.services.auth_service import get_current_user
from app.models.user import User

router = APIRouter()

@router.post("/upload-photo")
async def upload_photo(file: UploadFile = File(...)):
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/jpg"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Unsupported format. Only JPG, JPEG, PNG, and WEBP image files are allowed."
        )
    os.makedirs("uploads", exist_ok=True)
    filename = f"{uuid.uuid4().hex}_{file.filename}"
    filepath = os.path.join("uploads", filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    file_url = f"http://localhost:8000/uploads/{filename}"
    return {"url": file_url, "filename": filename}

@router.post("/", response_model=ComplaintResponse, status_code=status.HTTP_201_CREATED)
def submit_complaint(
    complaint_in: ComplaintCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return create_complaint(db, complaint_in, current_user.id)

@router.get("/my", response_model=List[ComplaintResponse])
def get_my_complaints(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns grievances belonging strictly to the authenticated citizen.
    """
    return get_user_complaints(db, current_user.id)

@router.get("/", response_model=List[ComplaintResponse])
def list_complaints(
    skip: int = 0,
    limit: int = 100,
    status: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Lists complaints. Admins can view all database complaints with filtering;
    Citizens are restricted strictly to their own registered complaints.
    """
    if current_user.role != "admin":
        return get_user_complaints(db, current_user.id)
    return get_all_complaints(db, skip=skip, limit=limit, status_filter=status, department_filter=department)

@router.get("/{complaint_id}", response_model=ComplaintResponse)
def read_complaint(
    complaint_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves complaint details by ID with strict privacy verification.
    Citizens can only view their own complaint details.
    """
    complaint = get_complaint_by_id(db, complaint_id)
    if current_user.role != "admin" and complaint.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You can only view your own complaints."
        )
    return complaint

@router.patch("/{complaint_id}/status", response_model=ComplaintResponse)
def update_status(
    complaint_id: str,
    new_status: str,
    comment: Optional[str] = "Status updated",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Status update endpoint. Only Admins can modify grievance status.
    """
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative authority required to update grievance status."
        )
    return update_complaint_status(db, complaint_id, new_status, comment, current_user.id)

@router.get("/{complaint_id}/timeline")
def get_complaint_timeline(
    complaint_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns step-by-step complaint timeline history for citizen & admin.
    Citizens can only view timelines of their own complaints.
    """
    complaint = get_complaint_by_id(db, complaint_id)
    if current_user.role != "admin" and complaint.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: You can only view timeline logs for your own complaints."
        )
    from app.services.sla_engine import SLAEngine
    return SLAEngine.get_timeline_log(db, complaint_id)
