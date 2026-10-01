from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.complaint import Complaint
from app.models.history import ComplaintHistory
from app.models.escalation import Escalation

# In-memory configurable SLA matrix (Category -> Priority -> Hours)
DEFAULT_SLA_CONFIG: Dict[str, Dict[str, float]] = {
    "Roads": {"CRITICAL": 12.0, "HIGH": 24.0, "MEDIUM": 48.0, "LOW": 72.0},
    "Water Supply": {"CRITICAL": 12.0, "HIGH": 24.0, "MEDIUM": 36.0, "LOW": 72.0},
    "Sanitation": {"CRITICAL": 8.0, "HIGH": 18.0, "MEDIUM": 36.0, "LOW": 48.0},
    "Electricity": {"CRITICAL": 6.0, "HIGH": 18.0, "MEDIUM": 36.0, "LOW": 48.0},
    "Sewage": {"CRITICAL": 12.0, "HIGH": 24.0, "MEDIUM": 48.0, "LOW": 72.0},
    "DEFAULT": {"CRITICAL": 12.0, "HIGH": 24.0, "MEDIUM": 48.0, "LOW": 72.0}
}

SLA_CONFIG_STORE = DEFAULT_SLA_CONFIG.copy()

class SLAEngine:
    @staticmethod
    def get_sla_matrix() -> Dict[str, Dict[str, float]]:
        """Returns current configurable SLA matrix."""
        return SLA_CONFIG_STORE

    @staticmethod
    def update_sla_matrix(category: str, priority: str, hours: float) -> Dict[str, Dict[str, float]]:
        """Updates SLA threshold for a category and priority."""
        cat_key = category.strip() if category else "DEFAULT"
        prio_key = priority.upper().strip() if priority else "MEDIUM"
        if cat_key not in SLA_CONFIG_STORE:
            SLA_CONFIG_STORE[cat_key] = {"CRITICAL": 12.0, "HIGH": 24.0, "MEDIUM": 48.0, "LOW": 72.0}
        SLA_CONFIG_STORE[cat_key][prio_key] = max(0.5, float(hours))
        return SLA_CONFIG_STORE

    @staticmethod
    def calculate_sla_hours(category: Optional[str], priority: Optional[str]) -> float:
        """Calculates SLA hours for given category & priority based on configured rules."""
        prio_key = (priority or "MEDIUM").upper().strip()
        cat_key = (category or "DEFAULT").strip()
        
        if cat_key in SLA_CONFIG_STORE and prio_key in SLA_CONFIG_STORE[cat_key]:
            return SLA_CONFIG_STORE[cat_key][prio_key]
        
        if "DEFAULT" in SLA_CONFIG_STORE and prio_key in SLA_CONFIG_STORE["DEFAULT"]:
            return SLA_CONFIG_STORE["DEFAULT"][prio_key]
        
        # Fallbacks
        prio_defaults = {"CRITICAL": 12.0, "HIGH": 24.0, "MEDIUM": 48.0, "LOW": 72.0}
        return prio_defaults.get(prio_key, 48.0)

    @staticmethod
    def calculate_sla_deadline(created_at: datetime, category: Optional[str], priority: Optional[str]) -> tuple[float, datetime]:
        sla_hours = SLAEngine.calculate_sla_hours(category, priority)
        deadline = created_at + timedelta(hours=sla_hours)
        return sla_hours, deadline

    @staticmethod
    def check_and_escalate_complaints(db: Session) -> List[Dict[str, Any]]:
        """
        Scans all active complaints and automatically triggers multi-level escalations
        if SLA limits have been crossed.
        
        Level 1 -> Officer (Breached SLA > 0%)
        Level 2 -> Supervisor (Breached SLA > 50%)
        Level 3 -> Senior Authority (Breached SLA > 100%)
        """
        active_complaints = db.query(Complaint).filter(
            Complaint.status.notin_(["RESOLVED", "CLOSED"])
        ).all()

        escalated_records = []
        now = datetime.utcnow()

        for complaint in active_complaints:
            created = complaint.created_at or now
            if not complaint.sla_hours or not complaint.sla_deadline:
                sla_hrs, deadline = SLAEngine.calculate_sla_deadline(created, complaint.category, complaint.priority)
                complaint.sla_hours = sla_hrs
                complaint.sla_deadline = deadline
                db.commit()

            deadline = complaint.sla_deadline
            sla_hours = complaint.sla_hours or 48.0

            # Calculate breach & ratio
            if now > deadline:
                elapsed_seconds = (now - created).total_seconds()
                sla_seconds = sla_hours * 3600.0
                ratio = elapsed_seconds / sla_seconds if sla_seconds > 0 else 2.5
                hours_overdue = round((now - deadline).total_seconds() / 3600.0, 1)

                target_level = 1
                escalated_to = "Officer"
                if ratio >= 2.0:
                    target_level = 3
                    escalated_to = "Senior Authority"
                elif ratio >= 1.5:
                    target_level = 2
                    escalated_to = "Supervisor"

                current_level = complaint.escalation_level or 0

                # Trigger escalation if level has increased or not flagged yet
                if target_level > current_level or not complaint.is_sla_breached:
                    complaint.is_sla_breached = True
                    complaint.escalation_level = target_level
                    complaint.status = "ESCALATED"

                    reason = f"SLA of {sla_hours}h crossed ({hours_overdue}h overdue). SLA Ratio: {round(ratio, 2)}x."

                    # Record Escalation table entry
                    esc_entry = Escalation(
                        complaint_id=complaint.id,
                        current_level=target_level,
                        escalated_to=escalated_to,
                        reason=reason,
                        timestamp=now
                    )
                    db.add(esc_entry)

                    # Record Complaint History timeline log
                    hist_entry = ComplaintHistory(
                        complaint_id=complaint.id,
                        status="ESCALATED",
                        comment=f"SLA Breached: Auto-escalated to Level {target_level} ({escalated_to}). {hours_overdue} hours overdue.",
                        changed_by="SLA_ENGINE",
                        timestamp=now
                    )
                    db.add(hist_entry)

                    db.commit()
                    db.refresh(complaint)

                    escalated_records.append({
                        "complaint_id": complaint.id,
                        "title": complaint.title,
                        "level": target_level,
                        "escalated_to": escalated_to,
                        "hours_overdue": hours_overdue,
                        "category": complaint.category,
                        "priority": complaint.priority
                    })

        return escalated_records

    @staticmethod
    def get_timeline_log(db: Session, complaint_id: str) -> List[Dict[str, Any]]:
        """
        Generates structured timeline log with formatted date/time for citizen view.
        Example format: 23 Sep 10:30 - Complaint Submitted
        """
        histories = db.query(ComplaintHistory).filter(
            ComplaintHistory.complaint_id == complaint_id
        ).order_by(ComplaintHistory.timestamp.asc()).all()

        timeline = []
        for h in histories:
            ts = h.timestamp or datetime.utcnow()
            formatted_dt = ts.strftime("%d %b %H:%M")
            
            # Readable action title
            action_title = SLAEngine._map_status_to_action(h.status, h.comment)

            timeline.append({
                "id": h.id,
                "status": h.status,
                "action_title": action_title,
                "comment": h.comment,
                "changed_by": h.changed_by,
                "timestamp": ts.isoformat(),
                "formatted_datetime": formatted_dt
            })

        return timeline

    @staticmethod
    def _map_status_to_action(status: str, comment: Optional[str]) -> str:
        s = (status or "").upper()
        if s == "SUBMITTED":
            return "Complaint Submitted"
        elif s == "AI_ANALYSED":
            return "AI Analysis Completed"
        elif s == "ASSIGNED":
            if comment and "Assigned to" in comment:
                return comment.split(".")[0]
            return "Assigned to Department"
        elif s == "IN_PROGRESS":
            return "Officer Started Work"
        elif s == "UNDER_VERIFICATION":
            return "Submitted for Verification"
        elif s == "RESOLVED":
            return "Complaint Resolved"
        elif s == "CLOSED":
            return "Complaint Closed"
        elif s == "ESCALATED":
            return "Escalation Triggered"
        return f"Status Updated to {status.capitalize()}"
