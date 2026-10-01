from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.schemas.officer import OfficerCreate, OfficerResponse, OfficerRecommendRequest, OfficerRecommendResponse
from app.schemas.assignment import AssignmentCreate, AssignmentResponse
from app.schemas.escalation import EscalationCreate, EscalationResponse
from app.schemas.duplicate_group import DuplicateGroupCreate, DuplicateGroupResponse, RootCauseStatusUpdate
from app.services.admin_service import (
    create_officer, get_all_officers, assign_officer_to_complaint,
    escalate_complaint, create_duplicate_group, get_duplicate_groups,
    update_root_cause_status, trigger_group_root_cause_analysis,
    recommend_officer_for_complaint
)
from app.services.auth_service import get_current_admin_user
from app.models.user import User

router = APIRouter()

@router.post("/officers", response_model=OfficerResponse, status_code=status.HTTP_201_CREATED)
def register_officer(
    officer_in: OfficerCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    return create_officer(db, officer_in)

@router.get("/officers", response_model=List[OfficerResponse])
def list_officers(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    return get_all_officers(db)

@router.get("/officers/workload-summary")
def get_officers_workload(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Returns full Officer Workload Management summary including:
    Officer name, department, assigned complaints, pending complaints, critical complaints,
    average resolution time, workload indicators, and assigned complaint list.
    """
    from app.services.admin_service import get_officers_workload_summary
    return get_officers_workload_summary(db)

@router.post("/assign", response_model=AssignmentResponse)
def assign_officer(
    assignment_in: AssignmentCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    return assign_officer_to_complaint(db, assignment_in, admin_user.id)

@router.post("/reassign")
def reassign_officer(
    complaint_id: str,
    new_officer_id: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Reassigns a complaint to a new officer with manual admin confirmation.
    """
    from app.services.admin_service import reassign_officer_to_complaint
    return reassign_officer_to_complaint(db, complaint_id, new_officer_id, admin_user.id)

@router.post("/escalate", response_model=EscalationResponse)
def escalate(
    escalation_in: EscalationCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    return escalate_complaint(db, escalation_in, admin_user.id)

@router.post("/duplicates/groups", response_model=DuplicateGroupResponse)
def add_duplicate_group(
    group_in: DuplicateGroupCreate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    return create_duplicate_group(db, group_in)

@router.get("/duplicates/groups", response_model=List[DuplicateGroupResponse])
def list_duplicate_groups(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    return get_duplicate_groups(db)

@router.put("/duplicates/groups/{group_id}/root-cause-status", response_model=DuplicateGroupResponse)
def update_group_root_cause_status(
    group_id: str,
    payload: RootCauseStatusUpdate,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Updates the verification status of an AI-generated root cause hypothesis for a duplicate group.
    Admin can mark status as: Confirmed | Rejected | Needs Investigation
    """
    return update_root_cause_status(db, group_id, payload.status)

@router.post("/duplicates/groups/{group_id}/analyze-root-cause", response_model=DuplicateGroupResponse)
def reanalyze_group_root_cause(
    group_id: str,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Triggers/refreshes AI Root Cause Analysis for a cluster/group of complaints.
    """
    return trigger_group_root_cause_analysis(db, group_id)

@router.post("/recommend-officer", response_model=OfficerRecommendResponse)
def recommend_smart_officer(
    payload: OfficerRecommendRequest,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Evaluates department, area, officer specialization, current workload,
    and complaint priority to suggest the optimal field officer.
    
    Admin retains 100% final manual assignment control.
    """
    return recommend_officer_for_complaint(
        db=db,
        complaint_id=payload.complaint_id,
        complaint_data=payload.dict(exclude_none=True)
    )

@router.get("/sla/config")
def get_sla_config_matrix(
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Get configurable SLA matrix by category and priority.
    """
    from app.services.sla_engine import SLAEngine
    return {"sla_matrix": SLAEngine.get_sla_matrix()}

@router.put("/sla/config")
def update_sla_config_matrix(
    category: str,
    priority: str,
    hours: float,
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Update SLA threshold (in hours) for specific category and priority.
    """
    from app.services.sla_engine import SLAEngine
    updated_matrix = SLAEngine.update_sla_matrix(category, priority, hours)
    return {"status": "success", "message": f"SLA for {category} ({priority}) set to {hours}h", "sla_matrix": updated_matrix}

@router.post("/sla/check-escalations")
def trigger_sla_escalation_check(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Scans active open complaints against SLA deadlines.
    Triggers automatic Level 1 (Officer), Level 2 (Supervisor), or Level 3 (Senior Authority) escalations.
    """
    from app.services.sla_engine import SLAEngine
    escalated = SLAEngine.check_and_escalate_complaints(db)
    return {
        "status": "success",
        "escalated_count": len(escalated),
        "escalated_complaints": escalated
    }

@router.get("/escalations/pending")
def list_pending_escalations(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Returns list of pending escalated complaints for the Admin Escalations Dashboard.
    Contains level 1 (Officer), Level 2 (Supervisor), Level 3 (Senior Authority) details.
    """
    from app.models.complaint import Complaint
    from app.models.escalation import Escalation
    
    # Ensure any new SLA breaches are evaluated
    from app.services.sla_engine import SLAEngine
    SLAEngine.check_and_escalate_complaints(db)

    escalated_complaints = db.query(Complaint).filter(
        Complaint.status == "ESCALATED"
    ).order_by(Complaint.updated_at.desc()).all()

    results = []
    for comp in escalated_complaints:
        esc_history = db.query(Escalation).filter(
            Escalation.complaint_id == comp.id
        ).order_by(Escalation.timestamp.desc()).first()

        results.append({
            "complaint_id": comp.id,
            "title": comp.title,
            "category": comp.category or "General",
            "department": comp.department or "Roads",
            "priority": comp.priority or "MEDIUM",
            "status": comp.status,
            "is_sla_breached": comp.is_sla_breached,
            "escalation_level": comp.escalation_level or (esc_history.current_level if esc_history else 1),
            "escalated_to": esc_history.escalated_to if esc_history else "Supervisor",
            "reason": esc_history.reason if esc_history else "SLA threshold exceeded",
            "sla_hours": comp.sla_hours or 48.0,
            "created_at": comp.created_at.isoformat() if comp.created_at else None,
            "sla_deadline": comp.sla_deadline.isoformat() if comp.sla_deadline else None
        })

    return results


@router.post("/demo-data/generate")
def generate_demo_dataset(
    count: int = 100,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Generates 100 realistic synthetic citizen complaints, AI analysis records,
    duplicate groups, officer assignments, and escalations.
    All records are explicitly tagged with [DEMO DATA].
    """
    from app.services.demo_data_generator import DemoDataGenerator
    return DemoDataGenerator.generate_demo_dataset(db, count=count)


@router.delete("/demo-data/clear")
def clear_demo_dataset(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    """
    Clears all synthetic demo dataset records from the database.
    Does not touch real user records.
    """
    from app.services.demo_data_generator import DemoDataGenerator
    return DemoDataGenerator.clear_demo_data(db)
