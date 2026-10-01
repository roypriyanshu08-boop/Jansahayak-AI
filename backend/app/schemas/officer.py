from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class OfficerBase(BaseModel):
    name: str
    department: str
    assigned_area: str
    current_workload: Optional[int] = 0
    specialization: Optional[str] = "General Maintenance"

class OfficerCreate(OfficerBase):
    pass

class OfficerResponse(OfficerBase):
    id: str

    class Config:
        from_attributes = True

class OfficerRecommendRequest(BaseModel):
    complaint_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    address: Optional[str] = None
    priority: Optional[str] = "MEDIUM"

class OfficerRecommendResponse(BaseModel):
    recommended_officer: Dict[str, Any]
    reason: str
    current_workload: int
    all_ranked_officers: List[Dict[str, Any]]
    admin_override_allowed: bool = True
