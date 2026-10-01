from sqlalchemy import Column, String, Float, Text, JSON, Integer, DateTime
from datetime import datetime
import uuid
from app.core.database import Base

class DuplicateGroup(Base):
    __tablename__ = "duplicate_groups"

    group_id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    complaint_ids = Column(JSON, nullable=False, default=list)  # List of complaint IDs
    similarity_score = Column(Float, nullable=False, default=0.0)
    similarity_percentage = Column(String, nullable=True) # e.g. "89%"
    common_issue = Column(Text, nullable=True)
    category = Column(String, nullable=True)
    status = Column(String, default="ACTIVE")
    affected_citizen_count = Column(Integer, default=1)
    
    # AI Root Cause Analysis Fields
    possible_root_cause = Column(Text, nullable=True)
    root_cause_confidence = Column(String, default="Medium")  # Low, Medium, High
    recommended_investigation = Column(Text, nullable=True)
    root_cause_status = Column(String, default="NEEDS_INVESTIGATION")  # CONFIRMED, REJECTED, NEEDS_INVESTIGATION (or Confirmed, Rejected, Needs Investigation)
    analysis_summary = Column(Text, nullable=True)
    is_ai_hypothesis = Column(String, default="true") # Always true indicating AI-generated hypothesis

    created_at = Column(DateTime, default=datetime.utcnow)
