from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
import base64
from app.core.database import get_db
from app.schemas.ai_analysis import (
    AIAnalysisResponse, PhotoAnalysisRequest, PhotoAnalysisResponse,
    EvidenceVerificationRequest, EvidenceVerificationResponse,
    ResolutionEstimateRequest, ResolutionEstimateResponse
)
from app.services.ai_service import AIServiceLayer
from app.services.priority_engine import PriorityScoringEngine
from app.services.impact_engine import ImpactScoringEngine
from app.services.evidence_verification_engine import EvidenceVerificationEngine
from app.services.resolution_engine import ResolutionTimeEngine
from app.services.complaint_service import get_complaint_by_id
from app.services.auth_service import get_current_user
from app.models.user import User
from pydantic import BaseModel

router = APIRouter()

class UnderstandRequest(BaseModel):
    text: str

class PriorityCalculateRequest(BaseModel):
    title: str
    description: str
    category: Optional[str] = None
    severity: Optional[str] = "Medium"
    address: Optional[str] = None
    duplicate_count: Optional[int] = 0
    photo_analysis: Optional[Dict[str, Any]] = None

class ImpactCalculateRequest(BaseModel):
    title: str
    description: str
    category: Optional[str] = None
    severity: Optional[str] = "Medium"
    address: Optional[str] = None
    similar_complaint_count: Optional[int] = 1
    photo_analysis: Optional[Dict[str, Any]] = None

@router.post("/understand")
def understand_complaint_text(
    payload: UnderstandRequest,
):
    return AIServiceLayer.process_text_understanding(payload.text)

from app.utils.file_validation import validate_uploaded_file

@router.post("/analyze-photo", response_model=PhotoAnalysisResponse)
def analyze_complaint_photo(
    payload: Optional[PhotoAnalysisRequest] = None,
    file: Optional[UploadFile] = File(None),
    image_url: Optional[str] = Form(None)
):
    b64_str = None
    target_url = None

    if file:
        content = validate_uploaded_file(file, max_size_mb=10)
        b64_str = base64.b64encode(content).decode("utf-8")
    elif image_url:
        target_url = image_url
    elif payload and payload.image_url:
        target_url = payload.image_url
    elif payload and payload.image_base64:
        b64_str = payload.image_base64

    result = AIServiceLayer.analyze_photo(image_url=target_url, image_base64=b64_str)
    return result

@router.post("/calculate-priority")
def calculate_complaint_priority(
    payload: PriorityCalculateRequest
):
    return PriorityScoringEngine.calculate_priority(
        title=payload.title,
        description=payload.description,
        category=payload.category or "General",
        severity=payload.severity or "Medium",
        address=payload.address or "",
        duplicate_count=payload.duplicate_count or 0,
        photo_analysis=payload.photo_analysis
    )

@router.post("/calculate-impact")
def calculate_citizen_impact(
    payload: ImpactCalculateRequest
):
    """
    Executes Citizen Impact Scoring Engine and returns:
    impact_score (0-100), impact_level (Low, Medium, High, Critical),
    impact_factors list, and clear estimate disclaimer label.
    """
    return ImpactScoringEngine.calculate_impact(
        title=payload.title,
        description=payload.description,
        category=payload.category or "General",
        severity=payload.severity or "Medium",
        address=payload.address or "",
        similar_complaint_count=payload.similar_complaint_count or 1,
        photo_analysis=payload.photo_analysis
    )

@router.post("/analyze/{complaint_id}", response_model=AIAnalysisResponse)
def trigger_ai_analysis(
    complaint_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    complaint = get_complaint_by_id(db, complaint_id)
    return AIServiceLayer.analyze_complaint(db, complaint)

@router.get("/detect-duplicates/{complaint_id}")
def check_duplicate_probability(
    complaint_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    complaint = get_complaint_by_id(db, complaint_id)
    return AIServiceLayer.detect_duplicates(db, complaint)

@router.post("/verify-evidence", response_model=EvidenceVerificationResponse)
def verify_complaint_evidence(
    payload: EvidenceVerificationRequest
):
    """
    Cross-verifies complaint text, image analysis, location, category,
    and previous related complaints to generate Evidence Status:
    SUPPORTED | PARTIALLY_SUPPORTED | NEEDS_HUMAN_VERIFICATION
    
    NEVER automatically rejects a complaint based on AI.
    """
    return EvidenceVerificationEngine.verify_evidence(
        complaint_text=payload.complaint_text,
        category=payload.category,
        photo_analysis=payload.photo_analysis,
        latitude=payload.latitude,
        longitude=payload.longitude,
        address=payload.address,
        previous_complaints_count=payload.previous_complaints_count or 0
    )

@router.post("/estimate-resolution", response_model=ResolutionEstimateResponse)
def estimate_grievance_resolution_time(
    payload: ResolutionEstimateRequest,
    db: Session = Depends(get_db)
):
    """
    Calculates Estimated Resolution Time based on category, priority, department,
    current workload, address location, and historical resolved complaint data.
    
    Returns clearly labelled estimates and disclaimers.
    """
    return ResolutionTimeEngine.calculate_estimated_resolution(
        category=payload.category,
        department=payload.department,
        priority=payload.priority,
        address=payload.address,
        current_workload=payload.current_workload or 5,
        db=db
    )

class AskAssistantRequest(BaseModel):
    query: str
    language: Optional[str] = "en"

@router.post("/ask-assistant")
def ask_jansahayak_assistant(
    payload: AskAssistantRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user)
):
    """
    Ask JanSahayak AI Virtual Assistant Endpoint.
    Answers citizen questions using grounded application data and public-service information.
    
    For complaint-specific questions:
    - Authenticates user
    - Retrieves user's actual registered complaints from DB
    - Never exposes another citizen's private data
    - Never invents complaint status
    """
    from app.services.assistant_service import JanSahayakAssistantService
    return JanSahayakAssistantService.answer_query(
        query=payload.query,
        user=current_user,
        db=db,
        language=payload.language or "en"
    )
