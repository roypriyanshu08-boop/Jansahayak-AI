from typing import Dict, Any, List, Optional

class ImpactScoringEngine:
    """
    Citizen Impact Scoring Engine for JanSahayak AI.
    
    Estimates public impact score (0-100) and Impact Level (Low, Medium, High, Critical)
    based on:
    - Number of similar complaints
    - Location type (Highway, Commercial Market, Residential, Suburban)
    - Severity
    - Safety risk
    - Critical public locations (Schools, Hospitals, Major Transit)
    - Estimated population density calculation notice (clearly labeled as estimate/demo calculation)
    """

    @classmethod
    def calculate_impact(
        cls,
        title: str = "",
        description: str = "",
        category: str = "",
        severity: str = "Medium",
        address: str = "",
        similar_complaint_count: int = 1,
        photo_analysis: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        
        score = 0.0
        factors: List[str] = []

        combined = f"{title or ''} {description or ''} {address or ''}".lower()

        # 1. Number of Similar Complaints (0 to 25 pts)
        if similar_complaint_count >= 4:
            score += 25
            factors.append(f"High Report Volume: {similar_complaint_count} similar complaints registered (+25 pts)")
        elif similar_complaint_count >= 2:
            score += 16
            factors.append(f"Cluster Density: {similar_complaint_count} citizen complaints in immediate zone (+16 pts)")
        else:
            score += 8
            factors.append("Single Citizen Report: Initial grievance submission (+8 pts)")

        # 2. Location Type (0 to 20 pts)
        if any(w in combined for w in ["highway", "flyover", "ring road", "expressway", "arterial"]):
            score += 20
            factors.append("Location Type: High-density arterial highway / flyover transit (+20 pts)")
        elif any(w in combined for w in ["market", "bazaar", "commercial", "station", "mall"]):
            score += 16
            factors.append("Location Type: High footfall commercial market zone (+16 pts)")
        elif any(w in combined for w in ["sector", "block", "colony", "residential", "vihar", "nagar"]):
            score += 12
            factors.append("Location Type: Dense residential colony (+12 pts)")
        else:
            score += 8
            factors.append("Location Type: Suburban civic area (+8 pts)")

        # 3. Severity (0 to 20 pts)
        sev_norm = str(severity).lower()
        if any(w in sev_norm for w in ["critical", "hazardous", "extreme"]):
            score += 20
            factors.append("Severity: Critical structural/environmental severity (+20 pts)")
        elif any(w in sev_norm for w in ["high", "serious", "severe"]):
            score += 15
            factors.append("Severity: High operational disruption (+15 pts)")
        elif any(w in sev_norm for w in ["medium", "moderate"]):
            score += 10
            factors.append("Severity: Moderate operational impact (+10 pts)")
        else:
            score += 5
            factors.append("Severity: Minor localized impact (+5 pts)")

        # 4. Safety Risk (0 to 15 pts)
        safety_words = ["spark", "electric", "current", "hazard", "danger", "khatra", "flood", "accident", "open drain", "naali", "sewer", "rupture"]
        if any(w in combined for w in safety_words):
            score += 15
            factors.append("Safety Risk: Active public safety hazard present (+15 pts)")
        else:
            score += 6
            factors.append("Safety Risk: General civic convenience risk (+6 pts)")

        # 5. Critical Public Locations (Schools, Hospitals, Major Transit) (0 to 20 pts)
        if any(w in combined for w in ["school", "hospital", "dispensary", "clinic", "health center"]):
            score += 20
            factors.append("Critical Location: Immediate proximity to School or Hospital zone (+20 pts)")
        elif any(w in combined for w in ["railway", "metro", "bus terminal", "bus stop", "station"]):
            score += 15
            factors.append("Critical Location: Proximity to Major Public Transport Hub (+15 pts)")
        elif any(w in combined for w in ["park", "community center", "playground"]):
            score += 10
            factors.append("Critical Location: Near Public Park / Community Facility (+10 pts)")
        else:
            score += 5
            factors.append("Critical Location: Standard municipal zone (+5 pts)")

        # Calculate final 0-100 impact score
        final_score = round(min(100.0, max(10.0, score)), 1)

        # Impact Level Mapping
        if final_score >= 85.0:
            impact_level = "Critical"
        elif final_score >= 65.0:
            impact_level = "High"
        elif final_score >= 40.0:
            impact_level = "Medium"
        else:
            impact_level = "Low"

        # Mandatory Rule: Clearly label as estimate/demo calculation
        disclaimer = "Estimated Public Impact Calculation (Based on spatial proximity heuristics & report density algorithm. Live municipal census integration simulated)."

        return {
            "impact_score": final_score,
            "impact_level": impact_level,
            "impact_factors": factors,
            "is_estimate": True,
            "disclaimer": disclaimer
        }
