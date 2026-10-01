from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class RootCauseStatusUpdate(BaseModel):
    status: str  # Confirmed, Rejected, Needs Investigation (or CONFIRMED, REJECTED, NEEDS_INVESTIGATION)

class DuplicateGroupCreate(BaseModel):
    complaint_ids: List[str]
    similarity_score: float
    similarity_percentage: Optional[str] = None
    common_issue: Optional[str] = None
    category: Optional[str] = None
    affected_citizen_count: Optional[int] = 1
    possible_root_cause: Optional[str] = None
    root_cause_confidence: Optional[str] = "Medium"
    recommended_investigation: Optional[str] = None
    root_cause_status: Optional[str] = "Needs Investigation"
    analysis_summary: Optional[str] = None

class DuplicateGroupResponse(BaseModel):
    group_id: str
    complaint_ids: List[str]
    similarity_score: float
    similarity_percentage: Optional[str] = None
    common_issue: Optional[str] = None
    category: Optional[str] = None
    status: Optional[str] = "ACTIVE"
    affected_citizen_count: Optional[int] = 1
    
    # AI Root Cause Analysis Fields
    possible_root_cause: Optional[str] = None
    root_cause_confidence: Optional[str] = "Medium"
    recommended_investigation: Optional[str] = None
    root_cause_status: Optional[str] = "Needs Investigation"  # Confirmed, Rejected, Needs Investigation
    analysis_summary: Optional[str] = None
    is_ai_hypothesis: Optional[bool] = True

    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True
