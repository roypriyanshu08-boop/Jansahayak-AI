from pydantic import BaseModel
from datetime import datetime

class EscalationCreate(BaseModel):
    complaint_id: str
    current_level: int = 1
    escalated_to: str
    reason: str

class EscalationResponse(BaseModel):
    id: str
    complaint_id: str
    current_level: int
    escalated_to: str
    reason: str
    timestamp: datetime

    class Config:
        from_attributes = True
