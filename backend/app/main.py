from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.core.config import settings
from app.core.database import engine, Base
from app.api.v1.router import api_router
from app.models import *  # Ensure all models are registered with Base

# Setup logger for server-side security audit logging
logger = logging.getLogger("jansahayak.security")
logging.basicConfig(level=logging.INFO)

# Initialize Database Tables
Base.metadata.create_all(bind=engine)

def _ensure_db_schema():
    with engine.connect() as conn:
        try:
            from sqlalchemy import text
            # AI Analyses check
            result = conn.execute(text("PRAGMA table_info(ai_analyses)")).fetchall()
            existing_cols = [row[1] for row in result]
            if existing_cols:
                cols_to_add = [
                    ("subcategory", "VARCHAR"),
                    ("summary", "TEXT"),
                    ("priority_score", "FLOAT DEFAULT 0.0"),
                    ("priority_reasons", "TEXT"),
                    ("impact_level", "VARCHAR"),
                    ("impact_factors", "TEXT"),
                    ("detected_issue", "VARCHAR"),
                    ("confidence", "FLOAT DEFAULT 0.0"),
                    ("photo_analysis", "TEXT"),
                    ("evidence_status", "VARCHAR DEFAULT 'SUPPORTED'"),
                    ("evidence_verification_score", "FLOAT DEFAULT 0.0"),
                    ("evidence_verification_details", "TEXT"),
                    ("human_review_flagged", "VARCHAR DEFAULT 'false'"),
                    ("human_review_reason", "TEXT"),
                    ("resolution_estimation_details", "TEXT"),
                ]
                for col_name, col_type in cols_to_add:
                    if col_name not in existing_cols:
                        conn.execute(text(f"ALTER TABLE ai_analyses ADD COLUMN {col_name} {col_type}"))
                conn.commit()

            # Complaints check
            comp_result = conn.execute(text("PRAGMA table_info(complaints)")).fetchall()
            comp_cols = [row[1] for row in comp_result]
            if comp_cols:
                comp_cols_to_add = [
                    ("priority_score", "FLOAT DEFAULT 0.0"),
                    ("sla_hours", "FLOAT DEFAULT 48.0"),
                    ("sla_deadline", "DATETIME"),
                    ("is_sla_breached", "BOOLEAN DEFAULT 0"),
                    ("escalation_level", "INTEGER DEFAULT 0"),
                    ("accuracy", "FLOAT"),
                    ("location_timestamp", "DATETIME"),
                    ("detected_language", "VARCHAR"),
                ]
                for col_name, col_type in comp_cols_to_add:
                    if col_name not in comp_cols:
                        conn.execute(text(f"ALTER TABLE complaints ADD COLUMN {col_name} {col_type}"))
                conn.commit()

            # Duplicate Groups check
            dup_result = conn.execute(text("PRAGMA table_info(duplicate_groups)")).fetchall()
            dup_cols = [row[1] for row in dup_result]
            if dup_cols:
                dup_cols_to_add = [
                    ("category", "VARCHAR"),
                    ("common_issue", "TEXT"),
                    ("status", "VARCHAR DEFAULT 'ACTIVE'"),
                    ("similarity_percentage", "VARCHAR"),
                    ("affected_citizen_count", "INTEGER DEFAULT 1"),
                    ("possible_root_cause", "TEXT"),
                    ("root_cause_confidence", "VARCHAR DEFAULT 'Medium'"),
                    ("recommended_investigation", "TEXT"),
                    ("root_cause_status", "VARCHAR DEFAULT 'NEEDS_INVESTIGATION'"),
                    ("analysis_summary", "TEXT"),
                    ("is_ai_hypothesis", "VARCHAR DEFAULT 'true'"),
                    ("created_at", "DATETIME"),
                ]
                for col_name, col_type in dup_cols_to_add:
                    if col_name not in dup_cols:
                        conn.execute(text(f"ALTER TABLE duplicate_groups ADD COLUMN {col_name} {col_type}"))
                conn.commit()

            # Users check
            user_result = conn.execute(text("PRAGMA table_info(users)")).fetchall()
            user_cols = [row[1] for row in user_result]
            if user_cols:
                if "has_logged_in_before" not in user_cols:
                    conn.execute(text("ALTER TABLE users ADD COLUMN has_logged_in_before BOOLEAN DEFAULT 0"))
                conn.commit()

            # Officers check
            off_result = conn.execute(text("PRAGMA table_info(officers)")).fetchall()
            off_cols = [row[1] for row in off_result]
            if off_cols:
                if "specialization" not in off_cols:
                    conn.execute(text("ALTER TABLE officers ADD COLUMN specialization VARCHAR DEFAULT 'General Maintenance'"))
                conn.commit()
        except Exception as e:
            logger.warning(f"[DB Schema Check] Warning: {e}")

_ensure_db_schema()

import os
from fastapi.staticfiles import StaticFiles

os.makedirs("uploads", exist_ok=True)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    description="JanSahayak AI - Citizen Grievance & Technical Architecture Foundation API"
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Global Sanitized Error Handler (Security hardening: Never expose raw stack trace)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing request {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An internal server error occurred while processing your request. The issue has been logged securely."
        }
    )

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {
        "message": "Welcome to JanSahayak AI Architecture Foundation API",
        "docs": "/docs",
        "version": "1.0.0"
    }

@app.get("/api/v1/health")
def health_check():
    return {"status": "ok", "service": "JanSahayak AI Backend Core"}
