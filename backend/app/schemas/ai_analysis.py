from pydantic import BaseModel, field_validator
from typing import Optional, Dict, Any, List
import json

class PhotoAnalysisRequest(BaseModel):
    image_url: Optional[str] = None
    image_base64: Optional[str] = None

class PhotoAnalysisResponse(BaseModel):
    detected_issue: str
    confidence: float
    confidence_percentage: str
    severity: str
    description: str
    recommended_action: str
    verification_status: str

class EvidenceVerificationRequest(BaseModel):
    complaint_text: str
    category: Optional[str] = None
    photo_analysis: Optional[Dict[str, Any]] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    address: Optional[str] = None
    previous_complaints_count: Optional[int] = 0

class EvidenceVerificationResponse(BaseModel):
    evidence_status: str  # SUPPORTED, PARTIALLY_SUPPORTED, NEEDS_HUMAN_VERIFICATION
    verification_score: float
    comparisons: Dict[str, Any]
    conflicts: List[str]
    supportive_factors: List[str]
    human_review_flagged: bool
    human_review_reason: Optional[str] = None
    safety_guarantee: str

class ResolutionEstimateRequest(BaseModel):
    category: Optional[str] = "Roads"
    department: Optional[str] = None
    priority: Optional[str] = "MEDIUM"
    address: Optional[str] = None
    current_workload: Optional[int] = 5

class ResolutionEstimateResponse(BaseModel):
    estimated_resolution: str
    estimated_hours: int
    confidence: str
    is_historical_data_based: bool
    sample_size: int = 0
    estimate_label: str
    estimation_factors: List[str]
    disclaimer: str

class AIAnalysisBase(BaseModel):
    category: Optional[str] = None
    subcategory: Optional[str] = None
    department: Optional[str] = None
    priority: Optional[str] = None
    priority_score: Optional[float] = 0.0
    priority_reasons: Optional[List[str]] = []
    severity: Optional[str] = None
    summary: Optional[str] = None
    impact_score: Optional[float] = 0.0
    impact_level: Optional[str] = "Medium"
    impact_factors: Optional[List[str]] = []
    duplicate_probability: Optional[float] = 0.0
    estimated_resolution_time: Optional[str] = None
    root_cause: Optional[str] = None
    recommended_action: Optional[str] = None
    
    # Photo analysis fields
    detected_issue: Optional[str] = None
    confidence: Optional[float] = 0.0
    photo_analysis: Optional[Dict[str, Any]] = None

    # AI Evidence Verification fields
    evidence_status: Optional[str] = "SUPPORTED"
    evidence_verification_score: Optional[float] = 0.0
    evidence_verification_details: Optional[Dict[str, Any]] = None
    human_review_flagged: Optional[bool] = False
    human_review_reason: Optional[str] = None

    # AI Estimated Resolution Time details
    resolution_estimation_details: Optional[Dict[str, Any]] = None

    @field_validator("resolution_estimation_details", "evidence_verification_details", "photo_analysis", mode="before")
    @classmethod
    def parse_json_dict(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return None
        return v

    @field_validator("priority_reasons", "impact_factors", mode="before")
    @classmethod
    def parse_json_list(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v

    @field_validator("human_review_flagged", mode="before")
    @classmethod
    def parse_bool(cls, v):
        if isinstance(v, str):
            return v.lower() == "true"
        return v

class AIAnalysisCreate(AIAnalysisBase):
    complaint_id: str

class AIAnalysisResponse(AIAnalysisBase):
    id: str
    complaint_id: str

    class Config:
        from_attributes = True
