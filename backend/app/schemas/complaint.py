from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from app.schemas.ai_analysis import AIAnalysisResponse

class ComplaintBase(BaseModel):
    title: str
    description: str
    category: Optional[str] = None
    subcategory: Optional[str] = None
    department: Optional[str] = None
    priority: Optional[str] = "MEDIUM"
    priority_score: Optional[float] = 0.0
    status: Optional[str] = "SUBMITTED"
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    accuracy: Optional[float] = None
    address: Optional[str] = None
    location_timestamp: Optional[datetime] = None
    image_url: Optional[str] = None
    audio_url: Optional[str] = None
    detected_language: Optional[str] = None

class ComplaintCreate(ComplaintBase):
    pass

class ComplaintUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    department: Optional[str] = None
    priority: Optional[str] = None
    priority_score: Optional[float] = None
    status: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    accuracy: Optional[float] = None
    address: Optional[str] = None
    location_timestamp: Optional[datetime] = None
    detected_language: Optional[str] = None
    impact_score: Optional[float] = None

class ComplaintResponse(ComplaintBase):
    id: str
    user_id: str
    impact_score: Optional[float] = 0.0
    sla_hours: Optional[float] = 48.0
    sla_deadline: Optional[datetime] = None
    is_sla_breached: Optional[bool] = False
    escalation_level: Optional[int] = 0
    created_at: datetime
    updated_at: datetime
    ai_analysis: Optional[AIAnalysisResponse] = None

    class Config:
        from_attributes = True
