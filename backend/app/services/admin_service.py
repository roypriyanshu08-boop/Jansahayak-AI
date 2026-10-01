from sqlalchemy.orm import Session
from typing import List
from fastapi import HTTPException, status
from app.models.officer import Officer
from app.models.assignment import ComplaintAssignment
from app.models.escalation import Escalation
from app.models.duplicate_group import DuplicateGroup
from app.schemas.officer import OfficerCreate
from app.schemas.assignment import AssignmentCreate
from app.schemas.escalation import EscalationCreate
from app.schemas.duplicate_group import DuplicateGroupCreate
from app.models.complaint import Complaint
from app.services.complaint_service import update_complaint_status, get_complaint_by_id
from app.services.root_cause_engine import AIRootCauseEngine
from app.services.smart_officer_assignment import SmartOfficerAssignmentEngine

def create_officer(db: Session, officer_in: OfficerCreate) -> Officer:
    db_officer = Officer(
        name=officer_in.name,
        department=officer_in.department,
        assigned_area=officer_in.assigned_area,
        current_workload=officer_in.current_workload or 0,
        specialization=getattr(officer_in, "specialization", "General Maintenance") or "General Maintenance"
    )
    db.add(db_officer)
    db.commit()
    db.refresh(db_officer)
    return db_officer

def get_all_officers(db: Session) -> List[Officer]:
    return db.query(Officer).all()

def get_officers_workload_summary(db: Session) -> List[dict]:
    officers = db.query(Officer).all()
    results = []

    for off in officers:
        assignments = db.query(ComplaintAssignment).filter(ComplaintAssignment.officer_id == off.id).all()
        assigned_ids = [a.complaint_id for a in assignments]
        
        assigned_complaints = []
        if assigned_ids:
            assigned_complaints = db.query(Complaint).filter(Complaint.id.in_(assigned_ids)).all()

        total_assigned = len(assigned_complaints)
        pending_count = sum(1 for c in assigned_complaints if (c.status or "").upper() not in ["RESOLVED", "CLOSED"])
        critical_count = sum(1 for c in assigned_complaints if (c.priority or "").upper() == "CRITICAL")
        
        # Calculate average resolution time
        sla_vals = [c.sla_hours for c in assigned_complaints if c.sla_hours]
        avg_res_time = f"{round(sum(sla_vals)/len(sla_vals), 1)} Hours" if sla_vals else "24.0 Hours"

        # Determine workload indicator
        w_indicator = "Optimal"
        if pending_count > 25 or off.current_workload > 25:
            w_indicator = "Overloaded"
        elif pending_count > 10 or off.current_workload > 10:
            w_indicator = "Moderate"

        results.append({
            "id": off.id,
            "name": off.name,
            "department": off.department,
            "assigned_area": off.assigned_area,
            "specialization": getattr(off, "specialization", "General Maintenance") or "General Maintenance",
            "current_workload": off.current_workload or pending_count,
            "assigned_complaints_count": total_assigned or off.current_workload,
            "pending_complaints_count": pending_count or off.current_workload,
            "critical_complaints_count": critical_count,
            "average_resolution_time": avg_res_time,
            "workload_indicator": w_indicator,
            "assigned_complaints": [
                {
                    "id": c.id,
                    "title": c.title,
                    "category": c.category,
                    "priority": c.priority,
                    "status": c.status,
                    "address": c.address
                }
                for c in assigned_complaints
            ]
        })

    return results

from app.services.notification_service import NotificationService

def assign_officer_to_complaint(db: Session, assignment_in: AssignmentCreate, admin_id: str) -> ComplaintAssignment:
    officer = db.query(Officer).filter(Officer.id == assignment_in.officer_id).first()
    if not officer:
        raise HTTPException(status_code=404, detail="Officer not found")
    
    complaint = get_complaint_by_id(db, assignment_in.complaint_id)
    
    assignment = ComplaintAssignment(
        complaint_id=assignment_in.complaint_id,
        officer_id=assignment_in.officer_id
    )
    db.add(assignment)
    officer.current_workload += 1
    
    db.commit()
    db.refresh(assignment)

    # Update complaint status to IN_PROGRESS or ASSIGNED
    update_complaint_status(
        db,
        assignment_in.complaint_id,
        "IN_PROGRESS",
        f"Assigned to Officer {officer.name} ({officer.department})",
        admin_id
    )

    # Trigger In-App Notification: Officer Assigned
    NotificationService.notify_complaint_assigned(db, complaint.user_id, complaint, officer.name)

    return assignment

def reassign_officer_to_complaint(db: Session, complaint_id: str, new_officer_id: str, admin_id: str) -> ComplaintAssignment:
    complaint = get_complaint_by_id(db, complaint_id)
    new_officer = db.query(Officer).filter(Officer.id == new_officer_id).first()
    if not new_officer:
        raise HTTPException(status_code=404, detail="New Officer not found")

    # Find existing assignment and reduce previous officer's workload if applicable
    existing_assignment = db.query(ComplaintAssignment).filter(ComplaintAssignment.complaint_id == complaint_id).first()
    if existing_assignment:
        prev_officer = db.query(Officer).filter(Officer.id == existing_assignment.officer_id).first()
        if prev_officer and prev_officer.current_workload > 0:
            prev_officer.current_workload -= 1
        db.delete(existing_assignment)
        db.commit()

    # Create new assignment
    new_assignment = ComplaintAssignment(
        complaint_id=complaint_id,
        officer_id=new_officer_id
    )
    db.add(new_assignment)
    new_officer.current_workload += 1
    db.commit()
    db.refresh(new_assignment)

    update_complaint_status(
        db,
        complaint_id,
        "IN_PROGRESS",
        f"Reassigned to Officer {new_officer.name} ({new_officer.department})",
        admin_id
    )

    # Trigger In-App Notification: Officer Reassigned
    NotificationService.notify_complaint_assigned(db, complaint.user_id, complaint, new_officer.name)

    return new_assignment

def escalate_complaint(db: Session, escalation_in: EscalationCreate, admin_id: str) -> Escalation:
    complaint = get_complaint_by_id(db, escalation_in.complaint_id)
    
    escalation = Escalation(
        complaint_id=escalation_in.complaint_id,
        current_level=escalation_in.current_level,
        escalated_to=escalation_in.escalated_to,
        reason=escalation_in.reason
    )
    db.add(escalation)
    db.commit()
    db.refresh(escalation)

    update_complaint_status(
        db,
        escalation_in.complaint_id,
        "ESCALATED",
        f"Escalated (Level {escalation_in.current_level}) to {escalation_in.escalated_to}. Reason: {escalation_in.reason}",
        admin_id
    )

    return escalation

def create_duplicate_group(db: Session, group_in: DuplicateGroupCreate) -> DuplicateGroup:
    group = DuplicateGroup(
        complaint_ids=group_in.complaint_ids,
        similarity_score=group_in.similarity_score,
        similarity_percentage=group_in.similarity_percentage or f"{int(group_in.similarity_score * 100)}%",
        common_issue=group_in.common_issue,
        category=group_in.category,
        affected_citizen_count=group_in.affected_citizen_count or len(group_in.complaint_ids),
        possible_root_cause=group_in.possible_root_cause,
        root_cause_confidence=group_in.root_cause_confidence or "Medium",
        recommended_investigation=group_in.recommended_investigation,
        root_cause_status=group_in.root_cause_status or "Needs Investigation",
        analysis_summary=group_in.analysis_summary
    )
    db.add(group)
    db.commit()
    db.refresh(group)

    if not group.possible_root_cause:
        rc_res = AIRootCauseEngine.analyze_group_root_cause(db, group)
        group.possible_root_cause = rc_res.get("possible_root_cause")
        group.root_cause_confidence = rc_res.get("confidence", "Medium")
        group.recommended_investigation = rc_res.get("recommended_investigation")
        group.analysis_summary = rc_res.get("analysis_summary")
        db.commit()
        db.refresh(group)

    return group

def get_duplicate_groups(db: Session) -> List[DuplicateGroup]:
    groups = db.query(DuplicateGroup).all()
    for grp in groups:
        if not grp.possible_root_cause:
            rc_res = AIRootCauseEngine.analyze_group_root_cause(db, grp)
            grp.possible_root_cause = rc_res.get("possible_root_cause")
            grp.root_cause_confidence = rc_res.get("confidence", "Medium")
            grp.recommended_investigation = rc_res.get("recommended_investigation")
            grp.analysis_summary = rc_res.get("analysis_summary")
            db.commit()
            db.refresh(grp)
    return groups

def update_root_cause_status(db: Session, group_id: str, new_status: str) -> DuplicateGroup:
    group = db.query(DuplicateGroup).filter(DuplicateGroup.group_id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Duplicate group not found")

    # Standardize status to: Confirmed, Rejected, Needs Investigation
    status_clean = new_status.strip().lower()
    if "confirm" in status_clean:
        target_status = "Confirmed"
    elif "reject" in status_clean:
        target_status = "Rejected"
    else:
        target_status = "Needs Investigation"

    group.root_cause_status = target_status
    db.commit()
    db.refresh(group)
    return group

def trigger_group_root_cause_analysis(db: Session, group_id: str) -> DuplicateGroup:
    group = db.query(DuplicateGroup).filter(DuplicateGroup.group_id == group_id).first()
    if not group:
        raise HTTPException(status_code=404, detail="Duplicate group not found")

    rc_res = AIRootCauseEngine.analyze_group_root_cause(db, group)
    group.possible_root_cause = rc_res.get("possible_root_cause")
    group.root_cause_confidence = rc_res.get("confidence", "Medium")
    group.recommended_investigation = rc_res.get("recommended_investigation")
    group.analysis_summary = rc_res.get("analysis_summary")
    db.commit()
    db.refresh(group)
    return group

def recommend_officer_for_complaint(
    db: Session,
    complaint_id: str = None,
    complaint_data: dict = None
) -> dict:
    complaint = None
    if complaint_id:
        complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()

    return SmartOfficerAssignmentEngine.recommend_officer(
        db=db,
        complaint=complaint,
        complaint_data=complaint_data
    )
