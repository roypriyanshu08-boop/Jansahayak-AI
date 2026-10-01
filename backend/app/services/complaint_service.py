from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi import HTTPException, status
from datetime import datetime
from app.models.complaint import Complaint
from app.models.history import ComplaintHistory
from app.schemas.complaint import ComplaintCreate, ComplaintUpdate
from app.services.ai_service import AIServiceLayer
from app.services.sla_engine import SLAEngine
from app.services.notification_service import NotificationService

VALID_STATUSES = {
    "SUBMITTED", "AI_ANALYSED", "ASSIGNED", "IN_PROGRESS",
    "UNDER_VERIFICATION", "RESOLVED", "CLOSED", "ESCALATED"
}

def create_complaint(db: Session, complaint_in: ComplaintCreate, user_id: str) -> Complaint:
    created_now = datetime.utcnow()
    sla_hrs, deadline = SLAEngine.calculate_sla_deadline(
        created_now, complaint_in.category, complaint_in.priority or "MEDIUM"
    )

    db_complaint = Complaint(
        user_id=user_id,
        title=complaint_in.title,
        description=complaint_in.description,
        category=complaint_in.category,
        subcategory=complaint_in.subcategory,
        department=complaint_in.department,
        priority=complaint_in.priority or "MEDIUM",
        status="SUBMITTED",
        latitude=complaint_in.latitude,
        longitude=complaint_in.longitude,
        address=complaint_in.address,
        image_url=complaint_in.image_url,
        audio_url=complaint_in.audio_url,
        detected_language=complaint_in.detected_language,
        sla_hours=sla_hrs,
        sla_deadline=deadline,
        is_sla_breached=False,
        escalation_level=0,
        created_at=created_now
    )
    db.add(db_complaint)
    db.commit()
    db.refresh(db_complaint)

    # 1. Log initial Submitted timeline history
    hist_sub = ComplaintHistory(
        complaint_id=db_complaint.id,
        status="SUBMITTED",
        comment="Complaint Submitted",
        changed_by=user_id,
        timestamp=created_now
    )
    db.add(hist_sub)
    db.commit()

    # Trigger In-App Notification: Complaint Submitted
    NotificationService.notify_complaint_submitted(db, user_id, db_complaint)

    # 2. Automatically trigger baseline AI Analysis service layer
    AIServiceLayer.analyze_complaint(db, db_complaint)

    # 3. Log AI Analysis Completed timeline history
    ai_ts = datetime.utcnow()
    hist_ai = ComplaintHistory(
        complaint_id=db_complaint.id,
        status="AI_ANALYSED",
        comment="AI Analysis Completed",
        changed_by="AI_ENGINE",
        timestamp=ai_ts
    )
    db.add(hist_ai)
    
    # Update status to AI_ANALYSED if currently SUBMITTED
    if db_complaint.status == "SUBMITTED":
        db_complaint.status = "AI_ANALYSED"

    db.commit()
    db.refresh(db_complaint)

    # Trigger In-App Notification: AI Analysis Completed
    NotificationService.notify_ai_analysis_completed(db, user_id, db_complaint)

    return db_complaint

def get_complaint_by_id(db: Session, complaint_id: str) -> Complaint:
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Complaint not found")
    
    # Ensure SLA fields exist
    if not complaint.sla_hours or not complaint.sla_deadline:
        created = complaint.created_at or datetime.utcnow()
        sla_hrs, deadline = SLAEngine.calculate_sla_deadline(created, complaint.category, complaint.priority)
        complaint.sla_hours = sla_hrs
        complaint.sla_deadline = deadline
        db.commit()

    return complaint

def get_user_complaints(db: Session, user_id: str) -> List[Complaint]:
    return db.query(Complaint).filter(Complaint.user_id == user_id).order_by(Complaint.created_at.desc()).all()

def get_all_complaints(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    status_filter: Optional[str] = None,
    department_filter: Optional[str] = None
) -> List[Complaint]:
    query = db.query(Complaint)
    if status_filter:
        query = query.filter(Complaint.status == status_filter)
    if department_filter:
        query = query.filter(Complaint.department == department_filter)
    return query.order_by(Complaint.created_at.desc()).offset(skip).limit(limit).all()

def update_complaint_status(
    db: Session,
    complaint_id: str,
    new_status: str,
    comment: str,
    changed_by: str
) -> Complaint:
    complaint = get_complaint_by_id(db, complaint_id)
    old_status = complaint.status
    clean_status = new_status.upper().strip()
    
    if clean_status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{new_status}'. Allowed: {', '.join(VALID_STATUSES)}"
        )

    complaint.status = clean_status
    if clean_status in ["RESOLVED", "CLOSED"]:
        complaint.is_sla_breached = False

    history = ComplaintHistory(
        complaint_id=complaint_id,
        status=clean_status,
        comment=comment or f"Status updated to {clean_status}",
        changed_by=changed_by,
        timestamp=datetime.utcnow()
    )
    db.add(history)
    db.commit()
    db.refresh(complaint)

    # Trigger In-App Notification: Status Change / Resolution / Escalation
    if clean_status in ["RESOLVED", "CLOSED"]:
        NotificationService.notify_complaint_resolved(db, complaint.user_id, complaint)
    elif clean_status == "ESCALATED":
        NotificationService.notify_complaint_escalated(db, complaint.user_id, complaint, complaint.escalation_level or 1)
    elif old_status != clean_status:
        NotificationService.notify_status_changed(db, complaint.user_id, complaint, old_status, clean_status)

    return complaint
