from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.analytics_service import get_platform_analytics
from app.services.auth_service import get_current_user
from app.models.user import User

router = APIRouter()

from typing import Optional
from fastapi import Query

@router.get("/summary")
def get_analytics_summary(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    date_range: Optional[str] = Query("all"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_platform_analytics(
        db=db,
        search_query=search,
        category=category,
        department=department,
        priority=priority,
        status=status,
        date_range=date_range
    )

@router.get("/predictive-hotspots")
def get_predictive_hotspot_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Predictive Public-Service Analytics Engine.
    Analyzes historical complaint frequencies, category trends, recent complaint velocity,
    and seasonal patterns to project future hotspot risks.
    
    Returns area predictions clearly labeled as AI Estimates.
    """
    from app.services.predictive_analytics_engine import PredictiveAnalyticsEngine
    return PredictiveAnalyticsEngine.predict_future_hotspots(db)
