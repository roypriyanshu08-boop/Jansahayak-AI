from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class HistoryCreate(BaseModel):
    complaint_id: str
    status: str
    comment: Optional[str] = None
    changed_by: str

class HistoryResponse(BaseModel):
    id: str
    complaint_id: str
    status: str
    comment: Optional[str] = None
    changed_by: str
    timestamp: datetime

    class Config:
        from_attributes = True
