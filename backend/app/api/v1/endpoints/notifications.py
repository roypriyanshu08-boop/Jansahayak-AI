from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.core.database import get_db
from app.services.auth_service import get_current_user
from app.services.notification_service import NotificationService
from app.services.complaint_service import get_complaint_by_id
from app.models.user import User

router = APIRouter()

class RequestInfoPayload(BaseModel):
    complaint_id: str
    info_prompt: str

@router.get("/")
def get_user_notifications(
    limit: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Retrieves authenticated user's in-app notifications and unread count.
    """
    notifs = NotificationService.get_user_notifications(db, current_user.id, limit=limit)
    unread_count = NotificationService.get_unread_count(db, current_user.id)
    
    return {
        "unread_count": unread_count,
        "notifications": [
            {
                "id": n.id,
                "complaint_id": n.complaint_id,
                "title": n.title,
                "message": n.message,
                "notification_type": n.notification_type,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat() if n.created_at else None
            }
            for n in notifs
        ]
    }

@router.put("/{notification_id}/read")
def mark_notification_read(
    notification_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Marks a single notification as read.
    """
    notif = NotificationService.mark_as_read(db, notification_id, current_user.id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"status": "success", "is_read": True}

@router.put("/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Marks all notifications for current user as read.
    """
    updated_count = NotificationService.mark_all_as_read(db, current_user.id)
    return {"status": "success", "updated_count": updated_count}

@router.post("/request-info")
def request_additional_information(
    payload: RequestInfoPayload,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Officer / Admin endpoint to request additional info from citizen on a complaint.
    Triggers an in-app notification to the complaint owner.
    """
    complaint = get_complaint_by_id(db, payload.complaint_id)
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    notif = NotificationService.notify_info_requested(
        db,
        user_id=complaint.user_id,
        complaint=complaint,
        info_prompt=payload.info_prompt
    )
    return {"status": "success", "notification_id": notif.id}
