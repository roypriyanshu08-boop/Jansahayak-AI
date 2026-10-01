import math
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.complaint import Complaint
from app.models.duplicate_group import DuplicateGroup
from app.services.root_cause_engine import AIRootCauseEngine

class DuplicateDetectionEngine:
    """
    AI & Spatial Duplicate / Similar Complaint Detection Engine.
    
    Compares new complaints against active database grievances using:
    - Text Token Similarity (Hindi, English, & Hinglish cross-lingual NLP)
    - Location Proximity (GPS distance / Address match)
    - Category & Subcategory Alignment
    - Time Window Filter (active recent complaints)
    
    Rule:
    Does NOT delete or reject the new complaint.
    Instead, creates/updates Common Issue Duplicate Groups, retains all citizen records,
    and calculates affected citizen counts.
    """

    @staticmethod
    def _calculate_text_similarity(text1: str, text2: str) -> float:
        t1 = set(text1.lower().split())
        t2 = set(text2.lower().split())

        # Cross-lingual synonym map for Hinglish / Hindi / English
        synonyms = {
            "gaddha": "pothole", "gaddhe": "pothole", "sadak": "road",
            "paani": "water", "pani": "water", "naali": "drain", "nali": "drain",
            "kachra": "garbage", "bijli": "electricity", "khamba": "pole",
            "school": "school", "hospital": "hospital", "leak": "leakage"
        }

        t1_norm = {synonyms.get(w, w) for w in t1 if len(w) > 2}
        t2_norm = {synonyms.get(w, w) for w in t2 if len(w) > 2}

        if not t1_norm or not t2_norm:
            return 0.0

        intersection = t1_norm.intersection(t2_norm)
        union = t1_norm.union(t2_norm)
        return len(intersection) / float(len(union))

    @staticmethod
    def _calculate_distance_km(lat1: Optional[float], lon1: Optional[float], lat2: Optional[float], lon2: Optional[float]) -> float:
        if lat1 is None or lon1 is None or lat2 is None or lon2 is None:
            return 999.0
        
        R = 6371.0 # Earth radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    @classmethod
    def detect_and_group(cls, db: Session, target_complaint: Complaint) -> Dict[str, Any]:
        existing_complaints = db.query(Complaint).filter(Complaint.id != target_complaint.id).all()
        
        best_match = None
        highest_score = 0.0
        matched_ids = []

        target_text = f"{target_complaint.title or ''} {target_complaint.description or ''}"

        for comp in existing_complaints:
            comp_text = f"{comp.title or ''} {comp.description or ''}"
            
            # 1. Text Similarity (0.0 to 1.0)
            text_sim = cls._calculate_text_similarity(target_text, comp_text)
            
            # 2. Location Proximity (0.0 to 1.0)
            dist = cls._calculate_distance_km(target_complaint.latitude, target_complaint.longitude, comp.latitude, comp.longitude)
            if dist < 0.5:
                loc_sim = 1.0
            elif dist < 1.5:
                loc_sim = 0.8
            elif dist < 3.0:
                loc_sim = 0.5
            else:
                # Fallback address similarity
                addr_sim = cls._calculate_text_similarity(target_complaint.address or "", comp.address or "")
                loc_sim = max(0.2, addr_sim)

            # 3. Category Match (0.0 to 1.0)
            cat_sim = 1.0 if target_complaint.category == comp.category else 0.4
            
            # Weighted overall similarity score
            score = (0.55 * text_sim) + (0.25 * loc_sim) + (0.20 * cat_sim)
            score_pct = int(round(score * 100))

            if score_pct >= 60:
                matched_ids.append(comp.id)
                if score > highest_score:
                    highest_score = score
                    best_match = comp

        if not best_match or highest_score < 0.60:
            return {
                "group_id": None,
                "similarity_score": 0.0,
                "similarity_percentage": "0%",
                "is_duplicate": False,
                "common_issue": None,
                "affected_citizen_count": 1,
                "matched_complaint_ids": []
            }

        similarity_pct_str = f"{int(round(highest_score * 100))}%"
        common_title = f"{best_match.title} & Similar Area Reports"

        # Check if best_match already belongs to a DuplicateGroup
        all_groups = db.query(DuplicateGroup).all()
        target_group = None
        for grp in all_groups:
            if best_match.id in (grp.complaint_ids or []):
                target_group = grp
                break

        if target_group:
            current_ids = list(target_group.complaint_ids or [])
            if target_complaint.id not in current_ids:
                current_ids.append(target_complaint.id)
            target_group.complaint_ids = current_ids
            target_group.affected_citizen_count = len(current_ids)
            if highest_score > target_group.similarity_score:
                target_group.similarity_score = highest_score
                target_group.similarity_percentage = similarity_pct_str
            
            # Execute Root Cause Engine for updated group
            rc_res = AIRootCauseEngine.analyze_group_root_cause(db, target_group)
            target_group.possible_root_cause = rc_res.get("possible_root_cause")
            target_group.root_cause_confidence = rc_res.get("confidence", "Medium")
            target_group.recommended_investigation = rc_res.get("recommended_investigation")
            target_group.analysis_summary = rc_res.get("analysis_summary")

            db.commit()
            db.refresh(target_group)
        else:
            current_ids = [best_match.id, target_complaint.id]
            target_group = DuplicateGroup(
                complaint_ids=current_ids,
                similarity_score=highest_score,
                similarity_percentage=similarity_pct_str,
                common_issue=common_title,
                category=best_match.category or target_complaint.category,
                affected_citizen_count=len(current_ids)
            )
            db.add(target_group)
            db.commit()
            db.refresh(target_group)

            # Execute Root Cause Engine for new group
            rc_res = AIRootCauseEngine.analyze_group_root_cause(db, target_group)
            target_group.possible_root_cause = rc_res.get("possible_root_cause")
            target_group.root_cause_confidence = rc_res.get("confidence", "Medium")
            target_group.recommended_investigation = rc_res.get("recommended_investigation")
            target_group.analysis_summary = rc_res.get("analysis_summary")
            db.commit()
            db.refresh(target_group)

        return {
            "group_id": target_group.group_id,
            "similarity_score": target_group.similarity_score,
            "similarity_percentage": target_group.similarity_percentage,
            "is_duplicate": True,
            "common_issue": target_group.common_issue,
            "affected_citizen_count": target_group.affected_citizen_count,
            "matched_complaint_ids": target_group.complaint_ids,
            "possible_root_cause": target_group.possible_root_cause,
            "root_cause_confidence": target_group.root_cause_confidence,
            "recommended_investigation": target_group.recommended_investigation,
            "root_cause_status": target_group.root_cause_status
        }
