from sqlalchemy import Column, String, Text, Float, DateTime, ForeignKey, Boolean, Integer
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.core.database import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=True)
    subcategory = Column(String, nullable=True)
    department = Column(String, nullable=True)
    priority = Column(String, default="MEDIUM")  # LOW, MEDIUM, HIGH, CRITICAL
    priority_score = Column(Float, default=0.0)
    status = Column(String, default="SUBMITTED")  # SUBMITTED, AI_ANALYSED, ASSIGNED, IN_PROGRESS, UNDER_VERIFICATION, RESOLVED, CLOSED, ESCALATED
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    accuracy = Column(Float, nullable=True)
    address = Column(String, nullable=True)
    location_timestamp = Column(DateTime, nullable=True)
    image_url = Column(String, nullable=True)
    audio_url = Column(String, nullable=True)
    detected_language = Column(String, nullable=True)
    impact_score = Column(Float, nullable=True, default=0.0)
    sla_hours = Column(Float, default=48.0)
    sla_deadline = Column(DateTime, nullable=True)
    is_sla_breached = Column(Boolean, default=False)
    escalation_level = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="complaints")
    ai_analysis = relationship("AIAnalysis", back_populates="complaint", uselist=False)
    assignments = relationship("ComplaintAssignment", back_populates="complaint")
    histories = relationship("ComplaintHistory", back_populates="complaint")
    escalations = relationship("Escalation", back_populates="complaint")
