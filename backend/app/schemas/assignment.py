from pydantic import BaseModel
from datetime import datetime

class AssignmentCreate(BaseModel):
    complaint_id: str
    officer_id: str

class AssignmentResponse(BaseModel):
    id: str
    complaint_id: str
    officer_id: str
    assigned_at: datetime

    class Config:
        from_attributes = True
