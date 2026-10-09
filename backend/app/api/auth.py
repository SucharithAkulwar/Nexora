import uuid
import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status, Depends
from app.core.config import settings
from app.core.security import verify_password, get_password_hash, create_access_token, get_current_user
from app.core.database import get_db
from app.models.schemas import UserRegister, UserLogin, DevLoginRequest, TokenResponse, UserOut

logger = logging.getLogger("nexora.auth")
router = APIRouter()


@router.post("/register", response_model=TokenResponse)
async def register(user_in: UserRegister):
    db = get_db()
    users_coll = db["users"]
    
    existing = await users_coll.find_one({"email": user_in.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    user_id = f"user-{uuid.uuid4().hex[:12]}"
    user_doc = {
        "_id": user_id,
        "email": user_in.email.lower(),
        "full_name": user_in.full_name,
        "role": user_in.role,
        "hashed_password": get_password_hash(user_in.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True
    }
    await users_coll.insert_one(user_doc)

    # Initialize empty profile based on role
    if user_in.role == "patient":
        await db["patient_profiles"].insert_one({
            "_id": f"profile-{user_id}",
            "user_id": user_id,
            "full_name": user_in.full_name,
            "city": "Kolhapur",
            "allergies": [],
            "medical_history": [],
            "current_medications": [],
            "onboarded": False,
            "updated_at": datetime.now(timezone.utc).isoformat()
        })
    elif user_in.role == "doctor":
        hosp_name = user_in.hospital_name or "Chhatrapati Pramila Raje (CPR) Hospital"
        hosp_id = user_in.hospital_id
        if not hosp_id:
            hosp_id = "hosp-" + "".join(c.lower() if c.isalnum() else "-" for c in hosp_name).strip("-")
            
        await db["doctor_profiles"].insert_one({
            "_id": f"profile-{user_id}",
            "user_id": user_id,
            "full_name": user_in.full_name,
            "specialty": user_in.specialty or "General Medicine",
            "experience_years": user_in.experience_years or 5,
            "qualifications": user_in.qualifications or "MBBS",
            "hospital_id": hosp_id,
            "hospital_name": hosp_name,
            "locality": "Kolhapur",
            "consultation_fee_inr": user_in.consultation_fee_inr or 300,
            "available_days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
            "available_time_slots": ["09:30 AM", "10:30 AM", "04:00 PM", "05:30 PM"],
            "rating": 5.0,
            "review_count": 0
        })

    token = create_access_token(subject=user_id, role=user_in.role)
    return TokenResponse(
        access_token=token,
        role=user_in.role,
        user_id=user_id,
        full_name=user_in.full_name,
        email=user_in.email.lower()
    )


@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    db = get_db()
    user = await db["users"].find_one({"email": credentials.email.lower()})
    if not user or not verify_password(credentials.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User account is deactivated."
        )

    token = create_access_token(subject=user["_id"], role=user["role"])
    return TokenResponse(
        access_token=token,
        role=user["role"],
        user_id=user["_id"],
        full_name=user["full_name"],
        email=user["email"]
    )


@router.post("/dev-login", response_model=TokenResponse)
async def dev_login(req: DevLoginRequest):
    """
    Disabled in production/clean database mode.
    """
    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Pre-installed proxy profiles have been removed. Please sign up or log in with your account."
    )



@router.get("/me")
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    db = get_db()
    user = await db["users"].find_one({"_id": current_user["user_id"]})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    profile = None
    if user["role"] == "patient":
        profile = await db["patient_profiles"].find_one({"user_id": user["_id"]})
    elif user["role"] == "doctor":
        profile = await db["doctor_profiles"].find_one({"user_id": user["_id"]})

    return {
        "user_id": user["_id"],
        "email": user["email"],
        "full_name": user["full_name"],
        "role": user["role"],
        "profile": profile
    }
