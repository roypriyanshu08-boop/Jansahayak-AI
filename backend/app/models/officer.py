from sqlalchemy import Column, String, Integer
from sqlalchemy.orm import relationship
import uuid
from app.core.database import Base

class Officer(Base):
    __tablename__ = "officers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    department = Column(String, nullable=False)
    assigned_area = Column(String, nullable=False)
    current_workload = Column(Integer, default=0)
    specialization = Column(String, nullable=True, default="General Maintenance")

    assignments = relationship("ComplaintAssignment", back_populates="officer")
