from sqlalchemy import Column, String, Float, Text, ForeignKey
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base

class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_id = Column(String, ForeignKey("complaints.id"), unique=True, nullable=False)
    category = Column(String, nullable=True)
    subcategory = Column(String, nullable=True)
    department = Column(String, nullable=True)
    priority = Column(String, nullable=True)
    priority_score = Column(Float, default=0.0)
    priority_reasons = Column(Text, nullable=True) # JSON serialized list of reason strings
    severity = Column(String, nullable=True)
    summary = Column(Text, nullable=True)
    impact_score = Column(Float, default=0.0)
    impact_level = Column(String, nullable=True) # Low, Medium, High, Critical
    impact_factors = Column(Text, nullable=True) # JSON serialized list of impact factor strings
    duplicate_probability = Column(Float, default=0.0)
    estimated_resolution_time = Column(String, nullable=True)
    root_cause = Column(Text, nullable=True)
    recommended_action = Column(Text, nullable=True)
    
    # AI Photo Complaint Analysis Fields
    detected_issue = Column(String, nullable=True)
    confidence = Column(Float, default=0.0)
    photo_analysis = Column(Text, nullable=True) # Serialized JSON string of PhotoAnalysisResponse

    # AI Evidence Verification Fields
    evidence_status = Column(String, default="SUPPORTED") # SUPPORTED, PARTIALLY_SUPPORTED, NEEDS_HUMAN_VERIFICATION
    evidence_verification_score = Column(Float, default=0.0)
    evidence_verification_details = Column(Text, nullable=True) # Serialized JSON string of evidence details
    human_review_flagged = Column(String, default="false") # "true" or "false"
    human_review_reason = Column(Text, nullable=True)

    # AI Estimated Resolution Time Fields
    resolution_estimation_details = Column(Text, nullable=True) # Serialized JSON string of resolution details

    complaint = relationship("Complaint", back_populates="ai_analysis")
