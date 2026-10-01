from typing import Dict, Any, List, Optional
from datetime import datetime, timezone

class PriorityScoringEngine:
    """
    AI & Rule-Based Priority Scoring Engine for JanSahayak AI.
    
    Calculates transparent priority score (0-100) and assigns priority levels (LOW, MEDIUM, HIGH, CRITICAL)
    based on 7 core civic parameters:
    1. Severity
    2. Safety Risk
    3. Number of potentially affected citizens
    4. Location sensitivity (Schools, Hospitals, Major Transit)
    5. Complaint Age
    6. Repeated complaints / Duplicates
    7. AI Detected Issue (Vision AI)
    """

    @classmethod
    def calculate_priority(
        cls,
        title: str = "",
        description: str = "",
        category: str = "",
        severity: str = "Medium",
        address: str = "",
        created_at: Optional[datetime] = None,
        duplicate_count: int = 0,
        duplicate_probability: float = 0.0,
        photo_analysis: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        
        score = 0.0
        reasons: List[str] = []

        combined_text = f"{title or ''} {description or ''} {address or ''}".lower()

        # 1. Severity Evaluation (Base Points: 5 to 25)
        sev_norm = str(severity).lower()
        if any(w in sev_norm for w in ["critical", "hazardous", "extreme"]):
            score += 25
            reasons.append("High Severity: Issue classified as Critical/Hazardous severity")
        elif any(w in sev_norm for w in ["high", "serious", "severe"]):
            score += 20
            reasons.append("High Severity: Issue classified as High severity")
        elif any(w in sev_norm for w in ["medium", "moderate"]):
            score += 12
            reasons.append("Moderate Severity: Standard civic issue requiring intervention")
        else:
            score += 5
            reasons.append("Low Severity: Minor maintenance request")

        # 2. Safety Risk Evaluation (Points: 10 to 25)
        safety_keywords_high = ["spark", "sparking", "electric", "current", "hazard", "danger", "khatra", "flood", "accident", "open drain", "naali", "sewer", "leakage", "rupture", "fire"]
        safety_keywords_med = ["gaddha", "pothole", "loose wire", "smell", "badboo", "broken", "overflow"]

        if any(w in combined_text for w in safety_keywords_high):
            score += 22
            reasons.append("Safety Risk: High public safety hazard detected (Electrical/Drainage/Flooding risk)")
        elif any(w in combined_text for w in safety_keywords_med):
            score += 12
            reasons.append("Safety Risk: Public safety hazard present")

        # 3. Potentially Affected Citizens (Points: 8 to 20)
        high_density_keywords = ["market", "school", "hospital", "ring road", "main road", "bus stop", "station", "block", "sector", "colony", "residential", "highway"]
        if any(w in combined_text for w in high_density_keywords):
            score += 18
            reasons.append("Affected Citizens: High population impact area (> 500 citizens in commercial/residential zone)")
        else:
            score += 8
            reasons.append("Affected Citizens: Medium local population impact")

        # 4. Location Sensitivity (Points: 10 to 20)
        sensitive_keywords = ["school", "hospital", "clinic", "dispensary", "playground", "govt", "government", "railway", "metro", "bus terminal"]
        if any(w in combined_text for w in sensitive_keywords):
            score += 18
            reasons.append("Location Sensitivity: Located near sensitive public area (School / Hospital / Transit Hub)")

        # 5. Complaint Age Escalation (Points: 0 to 15)
        if created_at:
            now = datetime.now(timezone.utc) if created_at.tzinfo else datetime.utcnow()
            hours_old = (now - created_at).total_seconds() / 3600.0
            if hours_old > 48:
                score += 15
                reasons.append(f"Complaint Age: Unresolved for > 48 hours ({int(hours_old)} hrs pending)")
            elif hours_old > 24:
                score += 8
                reasons.append(f"Complaint Age: Pending for > 24 hours ({int(hours_old)} hrs)")

        # 6. Repeated Complaints / Duplicates (Points: 10 to 20)
        if duplicate_count > 1 or duplicate_probability > 40.0:
            score += 18
            reasons.append(f"Repeated Complaints: Multiple duplicate reports registered in same locality ({duplicate_count} reports)")
        elif duplicate_count == 1 or duplicate_probability > 20.0:
            score += 10
            reasons.append("Repeated Complaints: Similar issue reported by nearby citizens")

        # 7. AI Vision Detected Issue (Points: 8 to 18)
        if photo_analysis and photo_analysis.get("detected_issue"):
            issue = photo_analysis.get("detected_issue")
            conf_pct = photo_analysis.get("confidence_percentage", "90%")
            if issue == "Pothole":
                score += 15
                reasons.append(f"AI Vision: Identified active road Pothole (Confidence {conf_pct})")
            elif issue == "Open drain":
                score += 18
                reasons.append(f"AI Vision: Identified uncovered Open Drain hazard (Confidence {conf_pct})")
            elif issue == "Water leakage":
                score += 16
                reasons.append(f"AI Vision: Identified active Water Leakage (Confidence {conf_pct})")
            elif issue == "Garbage":
                score += 12
                reasons.append(f"AI Vision: Identified overflowing Garbage dump (Confidence {conf_pct})")
            elif issue == "Fallen tree":
                score += 16
                reasons.append(f"AI Vision: Identified Fallen Tree blocking thoroughfare (Confidence {conf_pct})")
            elif issue == "Damaged streetlight":
                score += 10
                reasons.append(f"AI Vision: Identified Damaged Streetlight dark spot (Confidence {conf_pct})")
            else:
                score += 8
                reasons.append(f"AI Vision: Identified visual civic issue '{issue}' (Confidence {conf_pct})")

        # Normalize score between 0.0 and 100.0
        final_score = round(min(100.0, max(15.0, score)), 1)

        # Assign Priority Level based on transparent thresholds
        if final_score >= 85.0:
            priority_level = "CRITICAL"
        elif final_score >= 65.0:
            priority_level = "HIGH"
        elif final_score >= 40.0:
            priority_level = "MEDIUM"
        else:
            priority_level = "LOW"

        return {
            "priority": priority_level,
            "priority_score": final_score,
            "priority_reasons": reasons
        }
