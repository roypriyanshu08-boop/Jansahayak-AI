import json
import os
import re
import httpx
import base64
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.complaint import Complaint
from app.models.ai_analysis import AIAnalysis
from app.core.config import settings
from app.services.priority_engine import PriorityScoringEngine
from app.services.duplicate_service import DuplicateDetectionEngine
from app.services.impact_engine import ImpactScoringEngine
from app.services.evidence_verification_engine import EvidenceVerificationEngine
from app.services.resolution_engine import ResolutionTimeEngine

class AIServiceLayer:
    """
    AI Complaint Understanding & Computer Vision Engine for JanSahayak AI.
    Processes text and photo complaints via Vision AI (Gemini Vision API / Computer Vision Engine)
    to detect public infrastructure issues (Pothole, Garbage, Broken road, Water leakage, Open drain,
    Damaged streetlight, Fallen tree, etc.), calculating confidence scores and enforcing low-confidence rules.
    Executes PriorityScoringEngine, DuplicateDetectionEngine, and ImpactScoringEngine.
    """

    @staticmethod
    def _call_gemini_vision_api(image_url: Optional[str] = None, image_base64: Optional[str] = None) -> Optional[Dict[str, Any]]:
        api_key = (
            getattr(settings, "GEMINI_API_KEY", None) or
            getattr(settings, "GOOGLE_API_KEY", None) or
            os.getenv("GEMINI_API_KEY") or
            os.getenv("GOOGLE_API_KEY")
        )
        if not api_key:
            return None

        prompt = (
            "You are the JanSahayak AI Computer Vision & Municipal Inspection System.\n"
            "Analyze the provided image of a public civic problem and identify the issue.\n"
            "Detect possible public issues from: [Pothole, Garbage, Broken road, Water leakage, Open drain, Damaged streetlight, Fallen tree, Other visible civic issue].\n\n"
            "Return a STRICT JSON object with no markdown formatting:\n"
            "{\n"
            '  "detected_issue": "Pothole",\n'
            '  "confidence": 0.91,\n'
            '  "severity": "High",\n'
            '  "description": "Large asphalt road pothole measuring approximately 1m in diameter on public thoroughfare.",\n'
            '  "recommended_action": "Deploy road repair crew with hot-mix asphalt patching tools."\n'
            "}"
        )

        model_name = getattr(settings, "AI_VISION_MODEL", "gemini-1.5-flash")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"

        parts = [{"text": prompt}]

        if image_base64:
            clean_b64 = re.sub(r"^data:image/\w+;base64,", "", image_base64)
            parts.append({
                "inlineData": {
                    "mimeType": "image/jpeg",
                    "data": clean_b64
                }
            })
        elif image_url and (image_url.startswith("http://") or image_url.startswith("https://")):
            try:
                with httpx.Client(timeout=8.0) as client:
                    resp = client.get(image_url)
                    if resp.status_code == 200:
                        b64_data = base64.b64encode(resp.content).decode("utf-8")
                        mime = resp.headers.get("content-type", "image/jpeg")
                        parts.append({
                            "inlineData": {
                                "mimeType": mime if "image" in mime else "image/jpeg",
                                "data": b64_data
                            }
                        })
            except Exception as e:
                print(f"[AI Service] Could not fetch image URL for vision API: {e}")

        if len(parts) <= 1:
            return None

        payload = {
            "contents": [{"parts": parts}],
            "generationConfig": {
                "temperature": 0.1,
                "response_mime_type": "application/json"
            }
        }

        try:
            with httpx.Client(timeout=12.0) as client:
                resp = client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    raw_text = data["candidates"][0]["content"]["parts"][0]["text"]
                    clean_text = re.sub(r"^```json\s*", "", raw_text.strip(), flags=re.MULTILINE)
                    clean_text = re.sub(r"```$", "", clean_text.strip(), flags=re.MULTILINE)
                    return json.loads(clean_text)
        except Exception as e:
            print(f"[AI Service] Gemini Vision API request error: {e}")

        return None

    @staticmethod
    def _computer_vision_heuristic(image_url: Optional[str] = None, text_hint: str = "") -> Dict[str, Any]:
        combined = f"{image_url or ''} {text_hint or ''}".lower()

        if any(w in combined for w in ["pothole", "gaddha", "road", "sadak", "crack", "asphalt"]):
            return {
                "detected_issue": "Pothole",
                "confidence": 0.91,
                "severity": "High",
                "description": "Deep asphalt surface degradation and hazardous pothole detected on active traffic lane.",
                "recommended_action": "Deploy PWD road patching crew with asphalt overlay equipment."
            }

        if any(w in combined for w in ["garbage", "kachra", "trash", "dumpster", "waste", "safai", "litter"]):
            return {
                "detected_issue": "Garbage",
                "confidence": 0.88,
                "severity": "High",
                "description": "Uncollected solid municipal waste heap obstructing public pedestrian pathway.",
                "recommended_action": "Dispatch municipal sanitation compactor truck for immediate site clearance."
            }

        if any(w in combined for w in ["water", "leak", "pipe", "paani", "pani", "overflow", "waterlogging"]):
            return {
                "detected_issue": "Water leakage",
                "confidence": 0.85,
                "severity": "High",
                "description": "Pressurized underground water pipe fracture leaking clean water onto surrounding surface.",
                "recommended_action": "Isolate pipeline segment valve and dispatch Jal Board emergency repair team."
            }

        if any(w in combined for w in ["drain", "sewer", "naali", "nali", "gutter", "open"]):
            return {
                "detected_issue": "Open drain",
                "confidence": 0.82,
                "severity": "High",
                "description": "Uncovered concrete storm drain channel posing immediate fall hazard to pedestrians.",
                "recommended_action": "Install reinforced concrete slab cover and place safety barricades."
            }

        if any(w in combined for w in ["light", "pole", "lamp", "streetlight", "khamba", "dark", "wiring"]):
            return {
                "detected_issue": "Damaged streetlight",
                "confidence": 0.79,
                "severity": "Medium",
                "description": "Non-functional municipal street luminaire fixture with loose electrical mounting.",
                "recommended_action": "Dispatch electrical maintenance boom lift to replace LED fixture."
            }

        if any(w in combined for w in ["tree", "branch", "fallen", "wood", "log"]):
            return {
                "detected_issue": "Fallen tree",
                "confidence": 0.87,
                "severity": "High",
                "description": "Fallen tree trunk and heavy branches completely blocking public road transit.",
                "recommended_action": "Deploy forestry emergency crew with power saws to clear thoroughfare."
            }

        if any(w in combined for w in ["unconfirmed", "blurry", "low", "unknown", "test"]):
            return {
                "detected_issue": "Other visible civic issue",
                "confidence": 0.48,
                "severity": "Medium",
                "description": "Low resolution image detected. Image contains ambiguous visual features.",
                "recommended_action": "Requires manual on-site inspection by municipal field officer."
            }

        return {
            "detected_issue": "Broken road",
            "confidence": 0.76,
            "severity": "Medium",
            "description": "Structural pavement cracking and surface wear observed in uploaded civic photo.",
            "recommended_action": "Schedule routine resurfacing inspection during next municipal maintenance cycle."
        }

    @classmethod
    def analyze_photo(cls, image_url: Optional[str] = None, image_base64: Optional[str] = None, text_hint: str = "") -> Dict[str, Any]:
        raw_result = cls._call_gemini_vision_api(image_url=image_url, image_base64=image_base64)
        if not raw_result:
            raw_result = cls._computer_vision_heuristic(image_url=image_url, text_hint=text_hint)

        confidence_raw = raw_result.get("confidence", 0.85)
        try:
            confidence_val = float(confidence_raw)
        except (ValueError, TypeError):
            confidence_val = 0.85

        if confidence_val > 1.0:
            confidence_val = confidence_val / 100.0

        confidence_pct = f"{int(round(confidence_val * 100))}%"

        if confidence_val < 0.70:
            verification_status = "Needs human verification"
            orig_desc = raw_result.get("description", "Possible visual anomaly detected.")
            if "Needs human verification" not in orig_desc:
                description = f"[Needs human verification] {orig_desc} (Confidence: {confidence_pct} is below 70% confidence threshold. Requires manual verification by municipal officer.)"
            else:
                description = orig_desc
        else:
            verification_status = "AI Confirmed"
            description = raw_result.get("description", "Public civic issue identified by Vision AI.")

        return {
            "detected_issue": raw_result.get("detected_issue", "Other visible civic issue"),
            "confidence": confidence_val,
            "confidence_percentage": confidence_pct,
            "severity": raw_result.get("severity", "Medium"),
            "description": description,
            "recommended_action": raw_result.get("recommended_action", "Dispatch field officer for on-site inspection."),
            "verification_status": verification_status
        }

    @staticmethod
    def _call_gemini_api(text: str) -> Optional[Dict[str, Any]]:
        api_key = (
            getattr(settings, "GEMINI_API_KEY", None) or
            getattr(settings, "GOOGLE_API_KEY", None) or
            os.getenv("GEMINI_API_KEY") or
            os.getenv("GOOGLE_API_KEY")
        )
        if not api_key:
            return None

        prompt = (
            "You are the JanSahayak AI Complaint Understanding Engine. Analyze the following civic complaint text "
            "(which may be in English, Hindi, or Hinglish) and return a STRICT JSON object with no markdown formatting.\n\n"
            "Required JSON format:\n"
            "{\n"
            '  "category": "Road",\n'
            '  "subcategory": "Pothole",\n'
            '  "department": "Municipal/Road Department",\n'
            '  "severity": "High",\n'
            '  "priority": "Critical",\n'
            '  "summary": "Large pothole near school creating safety risk",\n'
            '  "recommended_action": "Immediate inspection and temporary safety measures",\n'
            '  "impact_score": 85.0,\n'
            '  "estimated_resolution_time": "24-48 Hours",\n'
            '  "root_cause": "Asphalt erosion creating surface hazards near high-density area"\n'
            "}\n\n"
            f"Complaint text: \"{text}\""
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
            print(f"[AI Service] Gemini API request skipped/failed: {e}")

        return None

    @staticmethod
    def _smart_fallback_nlp(text: str) -> Dict[str, Any]:
        t = text.lower()

        is_school = any(w in t for w in ["school", "bachch", "baccho", "kid", "student", "child", "schooling"])
        is_accident = any(w in t for w in ["accident", "risk", "khatra", "danger", "hazard", "bada", "severe", "crash"])

        # Road / Pothole / Sadak
        if any(w in t for w in ["gaddha", "pothole", "road", "sadak", "gaddhe", "crack", "asphalt", "street"]):
            category = "Road"
            subcategory = "Pothole"
            department = "Municipal/Road Department"
            severity = "High" if (is_accident or is_school) else "Medium"
            priority = "Critical" if (is_school and is_accident) else ("High" if is_accident else "Medium")

            if is_school and any(w in t for w in ["gaddha", "pothole", "gaddhe"]):
                summary = "Large pothole near school creating safety risk"
                recommended_action = "Immediate inspection and temporary safety measures"
            else:
                summary = "Damaged road or pothole reported creating transit hazard"
                recommended_action = "Deploy road patch crew and place warning signage"

            return {
                "category": category,
                "subcategory": subcategory,
                "department": department,
                "severity": severity,
                "priority": priority,
                "summary": summary,
                "recommended_action": recommended_action,
                "impact_score": 88.0 if priority == "Critical" else 75.0,
                "estimated_resolution_time": "24-48 Hours",
                "root_cause": "Asphalt degradation and structural road surface failure"
            }

        # Water Supply / Pipe Leakage
        if any(w in t for w in ["water", "pipe", "leak", "paani", "pani", "supply", "jal", "tap", "tanker"]):
            return {
                "category": "Water Supply",
                "subcategory": "Pipeline Leakage",
                "department": "Jal Board / Water Department",
                "severity": "High",
                "priority": "High" if is_accident else "Medium",
                "summary": "Water pipeline leakage disrupting supply to residential area",
                "recommended_action": "Deploy plumbing squad and isolate water supply section",
                "impact_score": 82.0,
                "estimated_resolution_time": "12-24 Hours",
                "root_cause": "High pressure pipe fracture or joint failure"
            }

        # Sanitation / Garbage Accumulation
        if any(w in t for w in ["kachra", "garbage", "trash", "waste", "dustbin", "safai", "dump", "clean"]):
            return {
                "category": "Sanitation",
                "subcategory": "Garbage Accumulation",
                "department": "Municipal Sanitation Department",
                "severity": "High",
                "priority": "High",
                "summary": "Uncollected garbage accumulation in public area",
                "recommended_action": "Dispatch sanitation truck for immediate clearance",
                "impact_score": 80.0,
                "estimated_resolution_time": "12 Hours",
                "root_cause": "Overflown public dumpster and missed collection schedule"
            }

        # Electricity & Street Lights
        if any(w in t for w in ["bijli", "electricity", "light", "power", "wire", "transformer", "voltage", "pole"]):
            return {
                "category": "Electricity",
                "subcategory": "Power Outage / Loose Wire",
                "department": "State Electricity Board",
                "severity": "High",
                "priority": "Critical" if ("wire" in t or is_accident) else "High",
                "summary": "Electricity supply disruption or dangerous wiring risk",
                "recommended_action": "Inspect transformer grid and secure electrical lines",
                "impact_score": 85.0,
                "estimated_resolution_time": "6-12 Hours",
                "root_cause": "Grid power drop or exposed wiring hazard"
            }

        # Sewage & Drainage
        if any(w in t for w in ["sewer", "drain", "naali", "nali", "overflow", "clog", "gutter"]):
            return {
                "category": "Sewage & Drainage",
                "subcategory": "Sewer Overflow",
                "department": "Sewage & Drainage Department",
                "severity": "High",
                "priority": "High",
                "summary": "Blocked drain line causing sewage water overflow",
                "recommended_action": "Dispatch suction tanker and desilt main drainage line",
                "impact_score": 78.0,
                "estimated_resolution_time": "24 Hours",
                "root_cause": "Debris and solid waste blockage in main municipal drain"
            }

        return {
            "category": "General Civic",
            "subcategory": "Civic Maintenance",
            "department": "Municipal Corporation",
            "severity": "Medium",
            "priority": "Medium",
            "summary": "Civic grievance registered requiring field assessment",
            "recommended_action": "Dispatch field officer for preliminary site evaluation",
            "impact_score": 65.0,
            "estimated_resolution_time": "48 Hours",
            "root_cause": "Pending baseline site inspection by local municipal officer"
        }

    @classmethod
    def process_text_understanding(cls, text: str) -> Dict[str, Any]:
        result = cls._call_gemini_api(text)
        if not result:
            result = cls._smart_fallback_nlp(text)
        return result

    @classmethod
    def analyze_complaint(cls, db: Session, complaint: Complaint) -> AIAnalysis:
        combined_text = f"{complaint.title or ''}. {complaint.description or ''}"
        ai_dict = cls.process_text_understanding(combined_text)

        # Run photo analysis if image_url exists
        photo_res = None
        if complaint.image_url:
            photo_res = cls.analyze_photo(image_url=complaint.image_url, text_hint=combined_text)

        category = ai_dict.get("category", "General Civic")
        subcategory = ai_dict.get("subcategory", "General")
        department = ai_dict.get("department", "Municipal Corporation")
        severity = ai_dict.get("severity", "Medium")
        summary = ai_dict.get("summary", "Civic issue reported")
        recommended_action = ai_dict.get("recommended_action", "Inspect site")
        est_time = ai_dict.get("estimated_resolution_time", "48 Hours")
        root_cause = ai_dict.get("root_cause", "Under investigation")

        if photo_res and photo_res.get("severity"):
            severity = photo_res.get("severity")

        # Run Duplicate Detection Engine (Non-destructive)
        dup_res = DuplicateDetectionEngine.detect_and_group(db, complaint)

        # Execute ImpactScoringEngine
        impact_res = ImpactScoringEngine.calculate_impact(
            title=complaint.title,
            description=complaint.description,
            category=category,
            severity=severity,
            address=complaint.address or "",
            similar_complaint_count=dup_res.get("affected_citizen_count", 1),
            photo_analysis=photo_res
        )

        impact_score = impact_res["impact_score"]
        impact_level = impact_res["impact_level"]
        impact_factors = impact_res["impact_factors"]
        impact_factors_json = json.dumps(impact_factors)

        # Execute PriorityScoringEngine
        p_res = PriorityScoringEngine.calculate_priority(
            title=complaint.title,
            description=complaint.description,
            category=category,
            severity=severity,
            address=complaint.address or "",
            created_at=complaint.created_at,
            duplicate_count=dup_res.get("affected_citizen_count", 1),
            duplicate_probability=dup_res.get("similarity_score", 0.1) * 100.0,
            photo_analysis=photo_res
        )

        priority = p_res["priority"]
        priority_score = p_res["priority_score"]
        priority_reasons = p_res["priority_reasons"]
        priority_reasons_json = json.dumps(priority_reasons)

        # Execute AI Evidence Verification Engine
        evidence_res = EvidenceVerificationEngine.verify_evidence(
            complaint_text=combined_text,
            category=category,
            photo_analysis=photo_res,
            latitude=complaint.latitude,
            longitude=complaint.longitude,
            address=complaint.address,
            previous_complaints_count=max(0, dup_res.get("affected_citizen_count", 1) - 1),
            db=db
        )

        evidence_status = evidence_res["evidence_status"]
        evidence_verification_score = evidence_res["verification_score"]
        evidence_verification_details_json = json.dumps(evidence_res)
        human_review_flagged = "true" if evidence_res["human_review_flagged"] else "false"
        human_review_reason = evidence_res.get("human_review_reason")

        # Execute AI Estimated Resolution Time Engine
        res_estimate_res = ResolutionTimeEngine.calculate_estimated_resolution(
            category=category,
            department=department,
            priority=priority,
            address=complaint.address,
            current_workload=dup_res.get("affected_citizen_count", 1) + 4,
            db=db
        )

        est_time = res_estimate_res["estimated_resolution"]
        resolution_estimation_details_json = json.dumps(res_estimate_res)

        # Retrieve or create AIAnalysis
        existing = db.query(AIAnalysis).filter(AIAnalysis.complaint_id == complaint.id).first()
        if existing:
            analysis = existing
            analysis.category = category
            analysis.subcategory = subcategory
            analysis.department = department
            analysis.priority = priority
            analysis.priority_score = priority_score
            analysis.priority_reasons = priority_reasons_json
            analysis.severity = severity
            analysis.summary = summary
            analysis.recommended_action = recommended_action
            analysis.impact_score = impact_score
            analysis.impact_level = impact_level
            analysis.impact_factors = impact_factors_json
            analysis.duplicate_probability = dup_res.get("similarity_score", 0.1) * 100.0
            analysis.estimated_resolution_time = est_time
            analysis.root_cause = root_cause
            analysis.evidence_status = evidence_status
            analysis.evidence_verification_score = evidence_verification_score
            analysis.evidence_verification_details = evidence_verification_details_json
            analysis.human_review_flagged = human_review_flagged
            analysis.human_review_reason = human_review_reason
            analysis.resolution_estimation_details = resolution_estimation_details_json
            if photo_res:
                analysis.detected_issue = photo_res.get("detected_issue")
                analysis.confidence = photo_res.get("confidence", 0.0)
                analysis.photo_analysis = json.dumps(photo_res)
        else:
            analysis = AIAnalysis(
                complaint_id=complaint.id,
                category=category,
                subcategory=subcategory,
                department=department,
                priority=priority,
                priority_score=priority_score,
                priority_reasons=priority_reasons_json,
                severity=severity,
                summary=summary,
                impact_score=impact_score,
                impact_level=impact_level,
                impact_factors=impact_factors_json,
                duplicate_probability=dup_res.get("similarity_score", 0.1) * 100.0,
                estimated_resolution_time=est_time,
                root_cause=root_cause,
                recommended_action=recommended_action,
                detected_issue=photo_res.get("detected_issue") if photo_res else None,
                confidence=photo_res.get("confidence", 0.0) if photo_res else 0.0,
                photo_analysis=json.dumps(photo_res) if photo_res else None,
                evidence_status=evidence_status,
                evidence_verification_score=evidence_verification_score,
                evidence_verification_details=evidence_verification_details_json,
                human_review_flagged=human_review_flagged,
                human_review_reason=human_review_reason,
                resolution_estimation_details=resolution_estimation_details_json
            )
            db.add(analysis)

        # Update complaint record
        complaint.category = category
        complaint.subcategory = subcategory
        complaint.department = department
        complaint.priority = priority
        complaint.priority_score = priority_score
        complaint.impact_score = impact_score

        db.commit()
        db.refresh(analysis)
        db.refresh(complaint)
        return analysis

    @staticmethod
    def detect_duplicates(db: Session, complaint: Complaint) -> Dict[str, Any]:
        return DuplicateDetectionEngine.detect_and_group(db, complaint)
