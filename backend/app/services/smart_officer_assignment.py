from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.complaint import Complaint
from app.models.officer import Officer

class SmartOfficerAssignmentEngine:
    """
    AI Smart Officer Assignment Engine for JanSahayak AI.
    Recommends the optimal field officer when a complaint is created or assigned using:
      1. Department matching
      2. Area / Ward location alignment
      3. Officer specialization fit
      4. Current workload balancing (favoring lower pending complaints)
      5. Complaint priority urgency multiplier

    ADMIN MANDATE:
      Admin retains 100% final control and can manually select or override assignments.
    """

    @classmethod
    def recommend_officer(
        cls,
        db: Optional[Session] = None,
        complaint: Optional[Complaint] = None,
        complaint_data: Optional[Dict[str, Any]] = None,
        officers_list: Optional[List[Officer]] = None
    ) -> Dict[str, Any]:
        # Extract complaint parameters
        if complaint:
            title = complaint.title or ""
            desc = complaint.description or ""
            category = complaint.category or ""
            subcategory = complaint.subcategory or ""
            address = complaint.address or ""
            priority = (complaint.priority or "MEDIUM").upper()
        elif complaint_data:
            title = complaint_data.get("title", "")
            desc = complaint_data.get("description", "")
            category = complaint_data.get("category", "")
            subcategory = complaint_data.get("subcategory", "")
            address = complaint_data.get("address", "")
            priority = (complaint_data.get("priority", "MEDIUM")).upper()
        else:
            title, desc, category, subcategory, address, priority = "", "", "Roads", "", "Ward 12", "MEDIUM"

        # Fetch officers from DB if not provided
        if not officers_list and db:
            officers_list = db.query(Officer).all()

        if not officers_list:
            officers_list = cls._get_seed_officers()

        ranked_officers = []
        combined_text = f"{title} {desc} {subcategory} {category}".lower()
        address_lower = address.lower()

        for officer in officers_list:
            score = 0.0
            reasons = []

            off_dept = (getattr(officer, "department", "") or "").lower()
            off_area = (getattr(officer, "assigned_area", "") or "").lower()
            off_spec = (getattr(officer, "specialization", "") or "").lower()
            workload = getattr(officer, "current_workload", 0) or 0

            # 1. Department Alignment (40 pts)
            cat_lower = category.lower()
            if cat_lower and (cat_lower in off_dept or off_dept in cat_lower):
                score += 40.0
                reasons.append(f"Department match ({getattr(officer, 'department', 'Dept')})")
            elif any(w in off_dept for w in ["road", "pwd"]) and any(w in cat_lower for w in ["road", "pothole"]):
                score += 35.0
                reasons.append("Roads/PWD department match")
            elif any(w in off_dept for w in ["jal", "water"]) and any(w in cat_lower for w in ["water", "pipe"]):
                score += 35.0
                reasons.append("Water department match")
            elif any(w in off_dept for w in ["sanitation", "waste", "garbage"]) and any(w in cat_lower for w in ["sanitation", "garbage"]):
                score += 35.0
                reasons.append("Sanitation department match")
            elif any(w in off_dept for w in ["electricity", "power"]) and any(w in cat_lower for w in ["electricity", "light"]):
                score += 35.0
                reasons.append("Electricity department match")

            # 2. Area / Ward Location Alignment (30 pts)
            if off_area and off_area in address_lower:
                score += 30.0
                reasons.append(f"Exact Area/Ward match ({getattr(officer, 'assigned_area', 'Area')})")
            elif address_lower and any(part in off_area for part in address_lower.split() if len(part) > 3):
                score += 20.0
                reasons.append(f"Sector/Zone proximity ({getattr(officer, 'assigned_area', 'Area')})")

            # 3. Specialization Alignment (20 pts)
            if off_spec and any(kw in combined_text for kw in off_spec.split() if len(kw) > 3):
                score += 20.0
                reasons.append(f"Specialization fit ({getattr(officer, 'specialization', 'Spec')})")

            # 4. Workload Balancing Penalty
            workload_weight = 2.5 if priority in ["CRITICAL", "HIGH"] else 1.8
            workload_penalty = workload * workload_weight
            score -= workload_penalty

            reasons.append(f"Current pending workload: {workload} cases")

            ranked_officers.append({
                "officer_id": str(getattr(officer, "id", f"off-{score}")),
                "name": getattr(officer, "name", "Field Officer"),
                "department": getattr(officer, "department", "General"),
                "assigned_area": getattr(officer, "assigned_area", "Zone 1"),
                "current_workload": workload,
                "specialization": getattr(officer, "specialization", "General Maintenance"),
                "match_score": round(max(0.0, score), 1),
                "reasons": reasons
            })

        # Sort by highest match score
        ranked_officers.sort(key=lambda x: x["match_score"], reverse=True)
        recommended = ranked_officers[0] if ranked_officers else None

        if recommended and len(ranked_officers) > 1:
            runner_up = ranked_officers[1]
            if recommended["current_workload"] < runner_up["current_workload"]:
                reason_summary = (
                    f"Department ({recommended['department']}) & Area ({recommended['assigned_area']}) match "
                    f"with significantly lower pending workload ({recommended['current_workload']} pending vs "
                    f"{runner_up['current_workload']} pending for {runner_up['name']})."
                )
            else:
                reason_summary = (
                    f"Highest domain match for {recommended['department']} in {recommended['assigned_area']} "
                    f"with active workload of {recommended['current_workload']} pending cases."
                )
        elif recommended:
            reason_summary = f"Optimal officer for {recommended['department']} in {recommended['assigned_area']} with workload of {recommended['current_workload']} cases."
        else:
            reason_summary = "General dispatch assignment."

        return {
            "recommended_officer": recommended,
            "reason": reason_summary,
            "current_workload": recommended["current_workload"] if recommended else 0,
            "all_ranked_officers": ranked_officers,
            "admin_override_allowed": True
        }

    @staticmethod
    def _get_seed_officers():
        class MockOff:
            def __init__(self, id, name, dept, area, workload, spec):
                self.id = id
                self.name = name
                self.department = dept
                self.assigned_area = area
                self.current_workload = workload
                self.specialization = spec

        return [
            MockOff("off-A", "Officer A", "Roads", "Ward 12", 8, "Potholes & Asphalt Repair"),
            MockOff("off-B", "Officer B", "Roads", "Ward 12", 31, "Heavy Road Surfacing"),
            MockOff("off-203", "Inspector Rajesh Verma", "Jal Board", "Zone 1 - North District", 4, "Pipeline Leakage"),
            MockOff("off-204", "Executive Eng. Sunita Nair", "PWD", "Zone 2 - Central Ring Road", 6, "Bridge & Road Surface"),
            MockOff("off-205", "Superintendent Vikas Gupta", "Sanitation", "Zone 3 - East Commercial", 2, "Waste Dumpster Logistics")
        ]
