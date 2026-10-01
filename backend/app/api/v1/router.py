from fastapi import APIRouter
from app.api.v1.endpoints import auth, users, complaints, admin, ai, analytics, notifications

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(complaints.router, prefix="/complaints", tags=["Complaints"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin Management"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI Layer Service"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["Analytics Service"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notification System"])
