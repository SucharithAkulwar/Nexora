from typing import List
from fastapi import APIRouter, Depends
from app.core.security import require_doctor_or_admin, get_current_user
from app.core.database import get_db

router = APIRouter()


@router.get("/logs")
async def get_audit_logs(current_user: dict = Depends(get_current_user)):
    """Retrieve security audit logs for sensitive record access and compliance."""
    db = get_db()
    user_id = current_user["user_id"]
    role = current_user.get("role")

    query = {}
    if role == "patient":
        # Patients see audit logs concerning their own identity
        query = {"$or": [{"user_id": user_id}, {"resource_id": user_id}]}
    elif role == "doctor":
        # Doctors see audit actions they performed or consultations they held
        query = {"user_id": user_id}

    cursor = db["audit_logs"].find(query).sort("timestamp", -1)
    logs = await cursor.to_list(length=50)
    return logs
