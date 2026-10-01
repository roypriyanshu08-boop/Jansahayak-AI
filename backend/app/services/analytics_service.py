from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from app.models.complaint import Complaint
from app.models.officer import Officer
from app.models.duplicate_group import DuplicateGroup

def get_platform_analytics(
    db: Session,
    search_query: Optional[str] = None,
    category: Optional[str] = None,
    department: Optional[str] = None,
    priority: Optional[str] = None,
    status: Optional[str] = None,
    date_range: Optional[str] = "all"
) -> Dict[str, Any]:
    query = db.query(Complaint)

    # 1. Search Query Filter
    if search_query:
        q = f"%{search_query.strip()}%"
        query = query.filter(
            or_(
                Complaint.title.ilike(q),
                Complaint.description.ilike(q),
                Complaint.address.ilike(q),
                Complaint.id.ilike(q),
                Complaint.category.ilike(q),
                Complaint.department.ilike(q)
            )
        )

    # 2. Category Filter
    if category and category.lower() != "all":
        query = query.filter(Complaint.category.ilike(f"%{category.strip()}%"))

    # 3. Department Filter
    if department and department.lower() != "all":
        query = query.filter(Complaint.department.ilike(f"%{department.strip()}%"))

    # 4. Priority Filter
    if priority and priority.lower() != "all":
        query = query.filter(Complaint.priority.ilike(priority.strip()))

    # 5. Status Filter
    if status and status.lower() != "all":
        query = query.filter(Complaint.status.ilike(status.strip()))

    # 6. Date Range Filter
    now = datetime.utcnow()
    if date_range == "7d":
        query = query.filter(Complaint.created_at >= now - timedelta(days=7))
    elif date_range == "30d":
        query = query.filter(Complaint.created_at >= now - timedelta(days=30))
    elif date_range == "90d":
        query = query.filter(Complaint.created_at >= now - timedelta(days=90))

    complaints = query.all()
    total_complaints = len(complaints)

    # Calculate Top KPI Metrics
    pending_count = sum(1 for c in complaints if (c.status or "").upper() not in ["RESOLVED", "CLOSED"])
    resolved_count = sum(1 for c in complaints if (c.status or "").upper() in ["RESOLVED", "CLOSED"])
    critical_count = sum(1 for c in complaints if (c.priority or "").upper() == "CRITICAL")
    escalated_count = sum(1 for c in complaints if (c.status or "").upper() == "ESCALATED" or c.is_sla_breached)

    avg_sla = 0.0
    sla_vals = [c.sla_hours for c in complaints if c.sla_hours]
    if sla_vals:
        avg_sla = sum(sla_vals) / len(sla_vals)
        avg_resolution_str = f"{round(avg_sla, 1)} Hours"
    else:
        avg_resolution_str = "N/A"

    # Chart 1: Complaints by Category
    by_category: Dict[str, int] = {}
    for c in complaints:
        cat_name = c.category or "General"
        by_category[cat_name] = by_category.get(cat_name, 0) + 1

    # Chart 2: Complaints by Department
    by_department: Dict[str, int] = {}
    for c in complaints:
        dept_name = c.department or "Public Works"
        by_department[dept_name] = by_department.get(dept_name, 0) + 1

    # Chart 3: Priority Distribution
    by_priority: Dict[str, int] = {"CRITICAL": 0, "HIGH": 0, "MEDIUM": 0, "LOW": 0}
    for c in complaints:
        prio = (c.priority or "MEDIUM").upper()
        if prio in by_priority:
            by_priority[prio] += 1
        else:
            by_priority[prio] = 1

    # Chart 4: Status Distribution
    valid_statuses = ["SUBMITTED", "AI_ANALYSED", "ASSIGNED", "IN_PROGRESS", "UNDER_VERIFICATION", "RESOLVED", "CLOSED", "ESCALATED"]
    by_status: Dict[str, int] = {st: 0 for st in valid_statuses}
    for c in complaints:
        st = (c.status or "SUBMITTED").upper()
        if st in by_status:
            by_status[st] += 1
        else:
            by_status[st] = 1

    # Chart 5: Complaints Over Time (grouped by date)
    date_map: Dict[str, int] = {}
    for c in complaints:
        dt_str = (c.created_at or now).strftime("%d %b")
        date_map[dt_str] = date_map.get(dt_str, 0) + 1
    
    over_time = [{"date": k, "count": v} for k, v in date_map.items()]

    # Chart 6: Resolution Time by Category (Average SLA target/turnaround)
    cat_sla_map: Dict[str, List[float]] = {}
    for c in complaints:
        cat_name = c.category or "General"
        val = c.sla_hours or 36.0
        if cat_name not in cat_sla_map:
            cat_sla_map[cat_name] = []
        cat_sla_map[cat_name].append(val)

    resolution_time_by_category = {
        cat: round(sum(vals) / len(vals), 1)
        for cat, vals in cat_sla_map.items()
    }

    # Chart 7: Duplicate Complaint Groups Stats
    dup_groups = db.query(DuplicateGroup).all()
    total_dup_groups = len(dup_groups)
    confirmed_root_causes = sum(1 for g in dup_groups if "confirm" in (g.root_cause_status or "").lower())
    total_affected_citizens = sum(g.affected_citizen_count or len(g.complaint_ids or []) for g in dup_groups)
    
    dup_summary = {
        "total_groups": total_dup_groups,
        "confirmed_root_causes": confirmed_root_causes,
        "total_affected_citizens": total_affected_citizens,
        "groups": [
            {
                "group_id": g.group_id,
                "common_issue": g.common_issue or "Similar civic issue",
                "category": g.category or "General",
                "count": len(g.complaint_ids or []),
                "possible_root_cause": g.possible_root_cause or "Underlying infrastructure defect",
                "root_cause_status": g.root_cause_status or "Needs Investigation"
            }
            for g in dup_groups
        ]
    }

    return {
        "kpis": {
            "total_complaints": total_complaints,
            "pending": pending_count,
            "resolved": resolved_count,
            "critical": critical_count,
            "escalated": escalated_count,
            "average_resolution_time": avg_resolution_str
        },
        "by_category": by_category,
        "by_department": by_department,
        "by_priority": by_priority,
        "by_status": by_status,
        "over_time": over_time,
        "resolution_time_by_category": resolution_time_by_category,
        "duplicate_groups": dup_summary,
        "total_officers": db.query(Officer).count()
    }
