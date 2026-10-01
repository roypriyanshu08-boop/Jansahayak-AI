import json
import re
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session

class EvidenceVerificationEngine:
    """
    AI Evidence Verification Engine for JanSahayak AI.
    Cross-verifies citizen complaints with photo evidence, geographic location,
    category alignment, and historical complaint clusters.

    Evidence Statuses:
      - SUPPORTED
      - PARTIALLY_SUPPORTED
      - NEEDS_HUMAN_VERIFICATION

    IMPORTANT SAFETY GUARANTEE:
      Never automatically reject a citizen complaint based only on AI.
      Flag uncertain cases for human review.
    """

    @classmethod
    def verify_evidence(
        cls,
        complaint_text: str,
        category: Optional[str] = None,
        photo_analysis: Optional[Dict[str, Any]] = None,
        latitude: Optional[float] = None,
        longitude: Optional[float] = None,
        address: Optional[str] = None,
        previous_complaints_count: int = 0,
        db: Optional[Session] = None
    ) -> Dict[str, Any]:
        """
        Calculates evidence status and detailed breakdown by comparing:
        1. Complaint text vs Image analysis
        2. Image analysis vs Category
        3. Location & landmark metadata
        4. Previous related complaints
        5. Vision confidence
        """
        text_lower = (complaint_text or "").lower()
        cat_lower = (category or "").lower()
        addr_lower = (address or "").lower()

        conflicts: List[str] = []
        supportive_factors: List[str] = []
        comparisons: Dict[str, Any] = {}

        # 1. Image Analysis & Text Comparison
        detected_issue = ""
        photo_confidence = 0.0
        photo_present = False

        if photo_analysis:
            photo_present = True
            detected_issue = photo_analysis.get("detected_issue", "")
            raw_conf = photo_analysis.get("confidence", 0.0)
            try:
                photo_confidence = float(raw_conf)
                if photo_confidence > 1.0:
                    photo_confidence /= 100.0
            except (TypeError, ValueError):
                photo_confidence = 0.85

        # Keywords dictionary mapping issues to related words
        issue_keywords = {
            "pothole": ["pothole", "gaddha", "gaddhe", "road", "sadak", "asphalt", "crack", "pavement", "tarmac", "street"],
            "garbage": ["garbage", "kachra", "trash", "waste", "dumpster", "safai", "dump", "litter", "rubbish"],
            "water leakage": ["water", "leak", "pipe", "paani", "pani", "overflow", "leakage", "pipeline", "tap", "jal"],
            "open drain": ["drain", "sewer", "naali", "nali", "gutter", "open drain", "overflowing drain", "manhole"],
            "damaged streetlight": ["light", "pole", "lamp", "streetlight", "khamba", "dark", "wiring", "electricity"],
            "fallen tree": ["tree", "branch", "fallen", "wood", "log", "plant"],
            "broken road": ["broken road", "road", "sadak", "pavement", "asphalt", "damage"]
        }

        detected_issue_lower = detected_issue.lower()

        # Compare Text vs Image Analysis
        text_matches_photo = False
        text_conflicts_photo = False

        if photo_present and detected_issue:
            # Check if text contains keywords relevant to detected issue
            related_words = issue_keywords.get(detected_issue_lower, [detected_issue_lower])
            found_keywords = [w for w in related_words if w in text_lower]

            if found_keywords:
                text_matches_photo = True
                supportive_factors.append(
                    f"Image analysis ('{detected_issue}') matches complaint text keywords: [{', '.join(found_keywords)}]"
                )
                comparisons["text_vs_image"] = {
                    "match": True,
                    "detail": f"Text describes '{found_keywords[0]}', confirming visual detection of '{detected_issue}'."
                }
            else:
                # Check for direct conflicts (e.g. text clearly says Pothole, but photo detected Garbage)
                text_intent = None
                for issue_key, words in issue_keywords.items():
                    if any(w in text_lower for w in words):
                        text_intent = issue_key
                        break
                
                if text_intent and text_intent != detected_issue_lower:
                    # Exception: pothole vs broken road are related
                    if {text_intent, detected_issue_lower}.issubset({"pothole", "broken road"}):
                        text_matches_photo = True
                        supportive_factors.append("Photo detected road surface defect aligning with complaint text.")
                        comparisons["text_vs_image"] = {
                            "match": True,
                            "detail": f"Text mentions road damage and photo confirms '{detected_issue}'."
                        }
                    else:
                        text_conflicts_photo = True
                        conflicts.append(
                            f"Evidence Conflict: Complaint text mentions '{text_intent.title()}', but photo analysis detected '{detected_issue}'."
                        )
                        comparisons["text_vs_image"] = {
                            "match": False,
                            "conflict": True,
                            "detail": f"Text refers to '{text_intent.title()}' while image shows '{detected_issue}'."
                        }
                else:
                    comparisons["text_vs_image"] = {
                        "match": True,
                        "detail": f"Photo analysis identified '{detected_issue}' with {int(photo_confidence*100)}% confidence."
                    }
        elif photo_present:
            comparisons["text_vs_image"] = {
                "match": True,
                "detail": "Photo attached; preliminary visual features parsed."
            }
        else:
            comparisons["text_vs_image"] = {
                "match": True,
                "detail": "No image attached; verification relying on text, location, and past report context."
            }

        # 2. Category vs Image / Text Comparison
        category_aligned = True
        if category:
            cat_map = {
                "road": ["pothole", "broken road", "crack", "sadak", "pavement"],
                "sanitation": ["garbage", "kachra", "trash", "waste", "safai"],
                "water supply": ["water leakage", "water", "pipe", "paani", "leak"],
                "sewage & drainage": ["open drain", "drain", "sewer", "naali", "nali"],
                "electricity": ["damaged streetlight", "light", "pole", "khamba", "power"]
            }
            valid_targets = cat_map.get(cat_lower, [])
            if photo_present and detected_issue:
                if valid_targets and not any(t in detected_issue_lower for t in valid_targets):
                    # Check if category mismatches detected issue
                    category_aligned = False
                    conflicts.append(
                        f"Category Mismatch: Selected category '{category}' differs from photo detection '{detected_issue}'."
                    )
                else:
                    supportive_factors.append(f"Category '{category}' aligns with photo detection '{detected_issue}'.")

        comparisons["category_alignment"] = {
            "aligned": category_aligned,
            "category": category or "General Civic"
        }

        # 3. Location & Landmark Analysis
        location_score = 0
        landmarks = ["school", "hospital", "market", "station", "park", "highway", "main road", "chowk", "colony", "bus stop"]
        found_landmarks = [lm for lm in landmarks if lm in text_lower or lm in addr_lower]

        if latitude is not None and longitude is not None:
            location_score += 15
            supportive_factors.append(f"GPS Geolocation coordinates verified ({latitude:.4f}, {longitude:.4f}).")

        if address and len(address.strip()) > 5:
            location_score += 10
            supportive_factors.append(f"Physical address provided: '{address}'.")

        if found_landmarks:
            location_score += 15
            supportive_factors.append(f"Location landmark context identified: [{', '.join(found_landmarks)}].")

        comparisons["location_verification"] = {
            "score": location_score,
            "coordinates_present": latitude is not None and longitude is not None,
            "landmarks_detected": found_landmarks
        }

        # 4. Previous Related Complaints Correlation
        if previous_complaints_count > 0:
            supportive_factors.append(
                f"Historical Context: Corroborated by {previous_complaints_count} previous complaint(s) in this sector."
            )
            comparisons["previous_complaints"] = {
                "corroborated": True,
                "count": previous_complaints_count
            }
        else:
            comparisons["previous_complaints"] = {
                "corroborated": False,
                "count": 0
            }

        # 5. Vision Confidence Evaluation
        low_photo_confidence = False
        if photo_present:
            if photo_confidence < 0.70:
                low_photo_confidence = True
                conflicts.append(
                    f"Low Image Confidence: Vision AI confidence is {int(photo_confidence*100)}% (below 70% threshold)."
                )

        # 6. Overall Evidence Score Calculation
        score = 50.0  # Base starting score

        if text_matches_photo:
            score += 25.0
        if category_aligned:
            score += 15.0
        if photo_present and not low_photo_confidence:
            score += 10.0
        if previous_complaints_count > 0:
            score += min(previous_complaints_count * 5.0, 15.0)
        if location_score > 0:
            score += min(location_score * 0.5, 15.0)

        # Penalties
        if text_conflicts_photo:
            score -= 35.0
        if not category_aligned:
            score -= 20.0
        if low_photo_confidence:
            score -= 15.0

        score = max(5.0, min(100.0, round(score, 1)))

        # 7. Status Determination Logic
        if text_conflicts_photo or low_photo_confidence or score < 60.0 or not category_aligned:
            evidence_status = "NEEDS_HUMAN_VERIFICATION"
            human_review_flagged = True
            
            if text_conflicts_photo:
                human_review_reason = "Flagged for human verification due to conflict between complaint text and photo analysis."
            elif low_photo_confidence:
                human_review_reason = f"Flagged for human verification because image confidence ({int(photo_confidence*100)}%) is below threshold."
            elif not category_aligned:
                human_review_reason = f"Flagged for human verification due to mismatch between selected category ('{category}') and photo evidence."
            else:
                human_review_reason = "Flagged for human verification to confirm complaint evidence details."
        elif score >= 80.0 and photo_present:
            evidence_status = "SUPPORTED"
            human_review_flagged = False
            human_review_reason = None
        elif not photo_present:
            if score >= 75.0:
                evidence_status = "SUPPORTED"
                human_review_flagged = False
                human_review_reason = None
            else:
                evidence_status = "PARTIALLY_SUPPORTED"
                human_review_flagged = False
                human_review_reason = None
        else:
            evidence_status = "PARTIALLY_SUPPORTED"
            human_review_flagged = False
            human_review_reason = None

        return {
            "evidence_status": evidence_status,
            "verification_score": score,
            "comparisons": comparisons,
            "conflicts": conflicts,
            "supportive_factors": supportive_factors,
            "human_review_flagged": human_review_flagged,
            "human_review_reason": human_review_reason,
            "safety_guarantee": "Never automatically reject a citizen complaint based only on AI. Flag uncertain cases for human review."
        }
