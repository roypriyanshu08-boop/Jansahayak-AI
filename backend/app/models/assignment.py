from sqlalchemy import Column, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base

class ComplaintAssignment(Base):
    __tablename__ = "complaint_assignments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id = Column(String, ForeignKey("complaints.id"), nullable=False)
    officer_id = Column(String, ForeignKey("officers.id"), nullable=False)
    assigned_at = Column(DateTime, default=datetime.utcnow)

    complaint = relationship("Complaint", back_populates="assignments")
    officer = relationship("Officer", back_populates="assignments")
