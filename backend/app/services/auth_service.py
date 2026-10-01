import uuid
from datetime import datetime
from sqlalchemy.orm import Session
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from app.models.user import User
from app.schemas.user import UserCreate, UserLogin
from app.core.security import get_password_hash, verify_password, create_access_token, ALGORITHM
from app.core.config import settings
from app.core.database import get_db

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def seed_default_users_if_needed(db: Session):
    try:
        # Seed default admin user if missing
        admin_user = db.query(User).filter(User.email == "admin@jansahayak.gov.in").first()
        if not admin_user:
            admin_user = User(
                id="usr-admin-default",
                name="JanSahayak Administrator",
                email="admin@jansahayak.gov.in",
                phone="9999999999",
                role="admin",
                hashed_password=get_password_hash("admin123"),
                has_logged_in_before=True,
                created_at=datetime.utcnow()
            )
            db.add(admin_user)
            db.commit()

        # Seed default citizen user if missing
        citizen_user = db.query(User).filter(User.email == "citizen@jansahayak.gov.in").first()
        if not citizen_user:
            citizen_user = User(
                id="usr-citizen-default",
                name="JanSahayak Citizen",
                email="citizen@jansahayak.gov.in",
                phone="9876543210",
                role="citizen",
                hashed_password=get_password_hash("password123"),
                has_logged_in_before=True,
                created_at=datetime.utcnow()
            )
            db.add(citizen_user)
            db.commit()
    except Exception as e:
        print(f"[Auth Service] Default user seeding log: {e}")

def register_user(db: Session, user_in: UserCreate) -> User:
    clean_name = (user_in.name or "").strip()
    if not clean_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Full name is required."
        )

    clean_email = (user_in.email or "").strip().lower()
    if not clean_email or "@" not in clean_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please enter a valid email address."
        )

    if not user_in.password or len(user_in.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    existing_user = db.query(User).filter(User.email == clean_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists."
        )

    hashed_pwd = get_password_hash(user_in.password)
    user_id = f"usr-{uuid.uuid4().hex[:12]}"
    db_user = User(
        id=user_id,
        name=clean_name,
        email=clean_email,
        phone=(user_in.phone or "").strip() or None,
        role=user_in.role if user_in.role in ["citizen", "admin", "officer"] else "citizen",
        hashed_password=hashed_pwd,
        has_logged_in_before=False,
        created_at=datetime.utcnow()
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def authenticate_user(db: Session, credentials: UserLogin) -> dict:
    clean_email = (credentials.email or "").strip().lower()
    clean_password = (credentials.password or "").strip()

    if not clean_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is required."
        )

    if not clean_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password is required."
        )

    # Ensure default users are available for demo logins
    seed_default_users_if_needed(db)

    user = db.query(User).filter(User.email == clean_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Account not found. Please register first."
        )

    if not verify_password(clean_password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    was_logged_in_before = bool(user.has_logged_in_before)

    # Set flag to True in DB for subsequent logins
    if not user.has_logged_in_before:
        user.has_logged_in_before = True
        db.commit()

    access_token = create_access_token(subject=user.id)
    
    # Return user data with initial has_logged_in_before state for the current session
    user_data = {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "phone": user.phone,
        "role": user.role,
        "has_logged_in_before": was_logged_in_before,
        "created_at": user.created_at
    }

    return {"access_token": access_token, "token_type": "bearer", "user": user_data}

def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not token or token.startswith("guest-") or token.startswith("mock-"):
        raise credentials_exception

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_admin_user(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrative privileges required to access this resource."
        )
    return current_user
