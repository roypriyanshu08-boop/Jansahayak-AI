import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models.complaint import Complaint
from app.core.config import settings

class ResolutionTimeEngine:
    """
    AI Estimated Resolution Time Engine for JanSahayak AI.
    Calculates expected grievance resolution timeframe using:
    1. Category & Department baseline resolution hours
    2. Historical resolved complaint durations (if >= 3 past resolved records exist)
    3. Complaint Priority urgency multiplier (CRITICAL/HIGH expedite timeframe)
    4. Current Officer / Department active pending workload
    5. Geographic location travel & logistics factor

    IMPORTANT SAFETY & TRANSPARENCY MANDATE:
      - If insufficient historical data exists, uses a clearly labelled demo/rule-based estimate.
      - Never presents synthetic predictions as real-world guarantees.
    """

    @classmethod
    def calculate_estimated_resolution(
        cls,
        category: Optional[str] = "Roads",
        department: Optional[str] = None,
        priority: Optional[str] = "MEDIUM",
        address: Optional[str] = None,
        current_workload: int = 5,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        cat_clean = (category or "General").strip().title()
        dept_clean = (department or "Municipal Corporation").strip()
        prio_clean = (priority or "MEDIUM").strip().upper()
        addr_clean = (address or "").strip().lower()

        factors: List[str] = []
        is_historical = False
        sample_size = 0
        historical_avg_hours = None

        # 1. Historical Resolution Data Lookup (if DB session provided)
        if db:
            try:
                resolved_complaints = db.query(Complaint).filter(
                    Complaint.status == "RESOLVED"
                ).all()

                # Filter matching category or department
                matching_resolved = [
                    c for c in resolved_complaints 
                    if (c.category and c.category.lower() == cat_clean.lower()) or 
                       (c.department and c.department.lower() == dept_clean.lower())
                ]

                if not matching_resolved:
                    matching_resolved = resolved_complaints

                durations = []
                for c in matching_resolved:
                    if c.created_at and c.updated_at:
                        hrs = (c.updated_at - c.created_at).total_seconds() / 3600.0
                        if 0.5 <= hrs <= 720.0:  # Ignore invalid/outlier durations
                            durations.append(hrs)

                if len(durations) >= 3:
                    is_historical = True
                    sample_size = len(durations)
                    historical_avg_hours = sum(durations) / sample_size
                    factors.append(f"Historical Baseline: {sample_size} past resolved cases in '{cat_clean}' (Avg {round(historical_avg_hours, 1)} hours).")
            except Exception as e:
                print(f"[Resolution Engine] Historical query fallback: {e}")

        # 2. Rule-Based Category Baseline (if insufficient historical data)
        category_baselines = {
            "Sanitation": 12.0,
            "Electricity": 12.0,
            "Water Supply": 24.0,
            "Sewage & Drainage": 24.0,
            "Road": 48.0,
            "Roads": 48.0,
            "General Civic": 36.0,
            "General": 36.0
        }

        if not is_historical or historical_avg_hours is None:
            base_hours = category_baselines.get(cat_clean, 36.0)
            factors.append(f"Category Baseline: {cat_clean} standard turnaround benchmark ({int(base_hours)} hours).")
            factors.append("Historical Data Status: Insufficient past resolved data (<3 records). Using Rule-Based Demonstration Estimate.")
        else:
            base_hours = historical_avg_hours

        # 3. Priority Urgency Multiplier
        # Expedite timeline for Critical & High priority grievances
        if prio_clean == "CRITICAL":
            prio_multiplier = 0.45
            factors.append("Priority Expedite: CRITICAL priority (-55% timeframe).")
        elif prio_clean == "HIGH":
            prio_multiplier = 0.70
            factors.append("Priority Expedite: HIGH priority (-30% timeframe).")
        elif prio_clean == "LOW":
            prio_multiplier = 1.30
            factors.append("Priority Adjustment: LOW priority (+30% timeframe).")
        else:
            prio_multiplier = 1.0
            factors.append("Priority Adjustment: MEDIUM standard priority timeline.")

        calc_hours = base_hours * prio_multiplier

        # 4. Active Workload Adjustment
        if current_workload > 5:
            workload_add = (current_workload - 5) * 1.5
            calc_hours += workload_add
            factors.append(f"Workload Adjustment: High pending queue of {current_workload} active cases (+{round(workload_add, 1)} hours).")
        elif current_workload <= 2:
            factors.append(f"Workload Adjustment: Optimal officer availability ({current_workload} pending cases).")

        # 5. Location / Logistics Adjustment
        if any(w in addr_clean for w in ["outer", "ring road", "suburb", "highway", "remote"]):
            calc_hours += 4.0
            factors.append("Location Adjustment: Outer zone transit & equipment logistics (+4 hours).")

        # Final Rounded Output
        final_hours = int(round(max(6.0, calc_hours)))

        # Confidence level evaluation
        if is_historical and sample_size >= 10:
            confidence = "High"
        elif is_historical or (final_hours >= 12 and final_hours <= 72):
            confidence = "Medium"
        else:
            confidence = "Low"

        # Formatted string output (e.g., "36 hours" or "24-36 Hours")
        if final_hours <= 12:
            display_str = f"{final_hours} hours"
        elif final_hours <= 24:
            display_str = "12-24 Hours"
        elif final_hours == 36:
            display_str = "36 hours"
        elif final_hours <= 48:
            display_str = "24-48 Hours"
        else:
            display_str = f"{final_hours} hours"

        estimate_label = (
            f"Historical Resolution Average ({sample_size} resolved cases)"
            if is_historical
            else "Rule-Based Demonstration Estimate"
        )

        return {
            "estimated_resolution": display_str,
            "estimated_hours": final_hours,
            "confidence": confidence,
            "is_historical_data_based": is_historical,
            "sample_size": sample_size,
            "estimate_label": estimate_label,
            "estimation_factors": factors,
            "disclaimer": "Predictive AI estimation for planning purposes only. Not a real-world completion guarantee."
        }
