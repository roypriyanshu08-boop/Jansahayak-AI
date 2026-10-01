from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.notification import Notification
from app.models.complaint import Complaint
from datetime import datetime

class NotificationService:
    """
    In-App Notification Service.
    Automatically generates citizen notifications for all complaint lifecycle events.
    """

    @classmethod
    def create_notification(
        cls,
        db: Session,
        user_id: str,
        title: str,
        message: str,
        notification_type: str = "GENERAL",
        complaint_id: Optional[str] = None
    ) -> Notification:
        notif = Notification(
            user_id=user_id,
            complaint_id=complaint_id,
            title=title,
            message=message,
            notification_type=notification_type,
            is_read=False
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        return notif

    @classmethod
    def notify_complaint_submitted(cls, db: Session, user_id: str, complaint: Complaint) -> Notification:
        title = "Grievance Successfully Filed"
        message = f"Your complaint '{complaint.title}' (ID: #{complaint.id[:8]}) has been received and queued for AI analysis."
        return cls.create_notification(db, user_id, title, message, "SUBMITTED", complaint.id)

    @classmethod
    def notify_ai_analysis_completed(cls, db: Session, user_id: str, complaint: Complaint) -> Notification:
        title = "AI Analysis Completed"
        message = f"AI Vision & Priority Engine analyzed complaint #{complaint.id[:8]}. Priority set to {complaint.priority}."
        return cls.create_notification(db, user_id, title, message, "AI_ANALYZED", complaint.id)

    @classmethod
    def notify_complaint_assigned(cls, db: Session, user_id: str, complaint: Complaint, officer_name: str) -> Notification:
        title = "Officer Dispatched & Assigned"
        message = f"Complaint #{complaint.id[:8]} has been assigned to Officer {officer_name} ({complaint.department})."
        return cls.create_notification(db, user_id, title, message, "ASSIGNED", complaint.id)

    @classmethod
    def notify_status_changed(cls, db: Session, user_id: str, complaint: Complaint, old_status: str, new_status: str) -> Notification:
        st_clean = new_status.replace("_", " ")
        title = f"Status Updated: {st_clean}"
        message = f"Status for complaint #{complaint.id[:8]} changed from {old_status} to {st_clean}."
        return cls.create_notification(db, user_id, title, message, "STATUS_CHANGE", complaint.id)

    @classmethod
    def notify_complaint_resolved(cls, db: Session, user_id: str, complaint: Complaint) -> Notification:
        title = "Grievance Resolved"
        message = f"Great news! Your complaint #{complaint.id[:8]} ('{complaint.title}') has been marked as Resolved by the department."
        return cls.create_notification(db, user_id, title, message, "RESOLVED", complaint.id)

    @classmethod
    def notify_complaint_escalated(cls, db: Session, user_id: str, complaint: Complaint, escalation_level: int = 1) -> Notification:
        title = f"SLA Triggered: Escalated (Level {escalation_level})"
        message = f"Complaint #{complaint.id[:8]} exceeded target SLA resolution limit and was escalated to Level {escalation_level} Authority."
        return cls.create_notification(db, user_id, title, message, "ESCALATED", complaint.id)

    @classmethod
    def notify_info_requested(cls, db: Session, user_id: str, complaint: Complaint, info_prompt: str) -> Notification:
        title = "Officer Requested Additional Information"
        message = f"The assigned field officer for #{complaint.id[:8]} requested clarification: '{info_prompt}'."
        return cls.create_notification(db, user_id, title, message, "INFO_REQUEST", complaint.id)

    @classmethod
    def get_user_notifications(cls, db: Session, user_id: str, limit: int = 20) -> List[Notification]:
        return db.query(Notification).filter(
            Notification.user_id == user_id
        ).order_by(Notification.created_at.desc()).limit(limit).all()

    @classmethod
    def get_unread_count(cls, db: Session, user_id: str) -> int:
        return db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).count()

    @classmethod
    def mark_as_read(cls, db: Session, notification_id: str, user_id: str) -> Optional[Notification]:
        notif = db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        if notif:
            notif.is_read = True
            db.commit()
            db.refresh(notif)
        return notif

    @classmethod
    def mark_all_as_read(cls, db: Session, user_id: str) -> int:
        count = db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).update({"is_read": True})
        db.commit()
        return count
