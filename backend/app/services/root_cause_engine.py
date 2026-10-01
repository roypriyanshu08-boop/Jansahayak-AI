import json
import os
import re
import httpx
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.complaint import Complaint
from app.models.duplicate_group import DuplicateGroup
from app.core.config import settings

class AIRootCauseEngine:
    """
    AI Root Cause Analysis Engine for JanSahayak AI.
    Analyzes clusters/groups of similar complaints occurring in the same area/category
    to identify underlying infrastructure root causes.

    IMPORTANT SAFETY & INTEGRITY MANDATES:
      1. Root cause must always be presented as an AI-generated hypothesis, not a confirmed fact.
      2. Admin controls can mark the hypothesis status as:
         - CONFIRMED (Confirmed)
         - REJECTED (Rejected)
         - NEEDS_INVESTIGATION (Needs Investigation)
    """

    @classmethod
    def analyze_group_root_cause(cls, db: Session, group: DuplicateGroup) -> Dict[str, Any]:
        """
        Analyzes all complaints within a DuplicateGroup to synthesize an AI Root Cause Hypothesis.
        """
        complaint_ids = group.complaint_ids or []
        complaints = db.query(Complaint).filter(Complaint.id.in_(complaint_ids)).all() if complaint_ids else []

        if not complaints:
            return cls._heuristic_root_cause_analysis(
                category=group.category or "General",
                common_issue=group.common_issue or "Civic grievance cluster",
                count=group.affected_citizen_count or 1,
                sample_texts=[]
            )

        sample_texts = [f"{c.title or ''}. {c.description or ''}" for c in complaints]
        addresses = [c.address for c in complaints if c.address]
        categories = [c.category for c in complaints if c.category]

        primary_category = group.category or (categories[0] if categories else "General")
        common_issue = group.common_issue or complaints[0].title
        count = max(len(complaints), group.affected_citizen_count or 1)

        # Call Gemini API for AI Root Cause Analysis
        res = cls._call_gemini_root_cause_api(
            category=primary_category,
            common_issue=common_issue,
            count=count,
            sample_texts=sample_texts,
            addresses=addresses
        )

        if not res:
            res = cls._heuristic_root_cause_analysis(
                category=primary_category,
                common_issue=common_issue,
                count=count,
                sample_texts=sample_texts,
                addresses=addresses
            )

        res["is_ai_hypothesis"] = True
        res["disclaimer"] = "AI-generated hypothesis for field investigation, not a confirmed fact."
        return res

    @staticmethod
    def _call_gemini_root_cause_api(
        category: str,
        common_issue: str,
        count: int,
        sample_texts: List[str],
        addresses: Optional[List[str]] = None
    ) -> Optional[Dict[str, Any]]:
        api_key = (
            getattr(settings, "GEMINI_API_KEY", None) or
            getattr(settings, "GOOGLE_API_KEY", None) or
            os.getenv("GEMINI_API_KEY") or
            os.getenv("GOOGLE_API_KEY")
        )
        if not api_key:
            return None

        addr_summary = f"Location context: {', '.join(addresses[:3])}" if addresses else "Same sector"
        texts_str = "\n- ".join(sample_texts[:5])

        prompt = (
            "You are the JanSahayak AI Root Cause Analysis Engine for municipal civic infrastructure.\n"
            f"Analyze this cluster of {count} citizen complaints reported in the same location and category.\n\n"
            f"Cluster Topic: {common_issue}\n"
            f"Category: {category}\n"
            f"Location Context: {addr_summary}\n"
            f"Sample Complaint Texts:\n- {texts_str}\n\n"
            "Identify the possible common root cause as an AI hypothesis.\n"
            "Return a STRICT JSON object with no markdown formatting:\n"
            "{\n"
            '  "possible_root_cause": "Damaged water pipeline",\n'
            '  "confidence": "Medium",\n'
            '  "recommended_investigation": "Inspect underground pipeline near affected area.",\n'
            '  "analysis_summary": "30 complaints on same road within 7 days with water leakage mentioned.",\n'
            '  "contributing_patterns": ["High complaint density", "Localized water logging reports", "Frequent supply pressure drops"]\n'
            "}"
        )

        model_name = getattr(settings, "AI_MODEL_NAME", "gemini-1.5-flash")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.1,
                "response_mime_type": "application/json"
            }
        }

        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                    clean_text = re.sub(r"^```json\s*", "", raw_text.strip(), flags=re.MULTILINE)
                    clean_text = re.sub(r"```$", "", clean_text.strip(), flags=re.MULTILINE)
                    return json.loads(clean_text)
        except Exception as e:
            print(f"[Root Cause Engine] Gemini API call skipped/failed: {e}")

        return None

    @staticmethod
    def _heuristic_root_cause_analysis(
        category: str,
        common_issue: str,
        count: int,
        sample_texts: List[str],
        addresses: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        combined = f"{category} {common_issue} {' '.join(sample_texts)}".lower()
        addr_str = addresses[0] if addresses else "affected road / sector"

        # 1. Water Leakage / Pipeline
        if any(w in combined for w in ["water", "pipe", "leak", "paani", "pani", "supply", "jal", "tanker"]):
            return {
                "possible_root_cause": "Damaged water pipeline",
                "confidence": "Medium" if count < 10 else "High",
                "recommended_investigation": f"Inspect underground pipeline near affected area.",
                "analysis_summary": f"{count} complaints on {addr_str} mentioning water leakage.",
                "contributing_patterns": [
                    f"{count} complaints in same week",
                    f"Location cluster: {addr_str}",
                    "Water leakage mentioned"
                ]
            }

        # 2. Potholes / Broken Road
        if any(w in combined for w in ["pothole", "gaddha", "road", "sadak", "crack", "asphalt", "pavement"]):
            return {
                "possible_root_cause": "Sub-surface road base erosion and heavy traffic asphalt wear",
                "confidence": "High" if count >= 4 else "Medium",
                "recommended_investigation": f"Deploy PWD pavement inspection team for asphalt core sample testing near {addr_str}.",
                "analysis_summary": f"{count} complaints on {addr_str} reporting recurring road surface damage.",
                "contributing_patterns": [
                    f"{count} reports on same road corridor",
                    "Sub-surface asphalt degradation",
                    "Heavy vehicular traffic flow"
                ]
            }

        # 3. Garbage Accumulation / Waste Dump
        if any(w in combined for w in ["garbage", "kachra", "trash", "dumpster", "waste", "safai", "dump"]):
            return {
                "possible_root_cause": "Dumpster capacity overflow and missed municipal collection route",
                "confidence": "High" if count >= 3 else "Medium",
                "recommended_investigation": f"Audit sanitation compactor vehicle dispatch schedule for {addr_str} zone.",
                "analysis_summary": f"{count} complaints in {addr_str} reporting uncollected solid waste heap.",
                "contributing_patterns": [
                    f"{count} reports in same sector",
                    "Overfilled dumpster capacity",
                    "Pedestrian pathway blockage"
                ]
            }

        # 4. Open Drain / Sewer Overflow
        if any(w in combined for w in ["drain", "sewer", "naali", "nali", "gutter", "overflow", "clog"]):
            return {
                "possible_root_cause": "Main municipal drain line siltation clog and missing concrete cover slabs",
                "confidence": "Medium",
                "recommended_investigation": f"Dispatch suction tanker and de-silt main drainage channel near {addr_str}.",
                "analysis_summary": f"{count} reports indicating drainage overflow and uncovered storm drain hazards.",
                "contributing_patterns": [
                    f"{count} complaints on same drain line",
                    "Debris culvert blockage",
                    "Uncovered concrete slab hazard"
                ]
            }

        # 5. Streetlight / Electrical Pole
        if any(w in combined for w in ["light", "pole", "lamp", "khamba", "dark", "wire", "power"]):
            return {
                "possible_root_cause": "Feeder line voltage drop or faulty streetlight LED circuit control unit",
                "confidence": "Medium",
                "recommended_investigation": f"Inspect transformer feeder junction box and luminaire wiring near {addr_str}.",
                "analysis_summary": f"{count} reports of non-functional streetlights creating dark zone.",
                "contributing_patterns": [
                    f"{count} reports in same lighting grid",
                    "Loose wiring junction box",
                    "Nighttime safety hazard"
                ]
            }

        # Default Fallback
        return {
            "possible_root_cause": f"Underlying systemic {category} maintenance failure",
            "confidence": "Medium",
            "recommended_investigation": f"Conduct joint municipal field inspection near {addr_str}.",
            "analysis_summary": f"{count} citizen grievances clustered in category '{category}'.",
            "contributing_patterns": [
                f"{count} complaints in same area",
                f"Common category: {category}"
            ]
        }
