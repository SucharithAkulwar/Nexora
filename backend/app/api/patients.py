from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends
from app.core.security import require_patient
from app.core.database import get_db
from app.models.schemas import PatientProfileUpdate, PatientProfileOut

router = APIRouter()


@router.get("/me/profile", response_model=PatientProfileOut)
async def get_patient_profile(current_user: dict = Depends(require_patient)):
    db = get_db()
    profile = await db["patient_profiles"].find_one({"user_id": current_user["user_id"]})
    if not profile:
        # Create empty profile if not found
        user = await db["users"].find_one({"_id": current_user["user_id"]})
        new_prof = {
            "_id": f"profile-{current_user['user_id']}",
            "user_id": current_user["user_id"],
            "full_name": user.get("full_name", "Patient") if user else "Patient",
            "city": "Kolhapur",
            "allergies": [],
            "medical_history": [],
            "current_medications": [],
            "onboarded": False,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db["patient_profiles"].insert_one(new_prof)
        return new_prof
    return profile


@router.put("/me/profile", response_model=PatientProfileOut)
async def update_patient_profile(data: PatientProfileUpdate, current_user: dict = Depends(require_patient)):
    db = get_db()
    update_fields = {}
    
    if data.full_name is not None:
        update_fields["full_name"] = data.full_name
        # Also update user collection
        await db["users"].update_one({"_id": current_user["user_id"]}, {"$set": {"full_name": data.full_name}})
    if data.age is not None:
        update_fields["age"] = data.age
    if data.gender is not None:
        update_fields["gender"] = data.gender
    if data.blood_group is not None:
        update_fields["blood_group"] = data.blood_group
    if data.contact_phone is not None:
        update_fields["contact_phone"] = data.contact_phone
    if data.city is not None:
        update_fields["city"] = data.city
    if data.locality is not None:
        update_fields["locality"] = data.locality
    if data.allergies is not None:
        update_fields["allergies"] = data.allergies
    if data.medical_history is not None:
        update_fields["medical_history"] = data.medical_history
    if data.current_medications is not None:
        update_fields["current_medications"] = data.current_medications
    if data.emergency_contact is not None:
        update_fields["emergency_contact"] = data.emergency_contact.model_dump()

    update_fields["onboarded"] = True
    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()

    await db["patient_profiles"].update_one(
        {"user_id": current_user["user_id"]},
        {"$set": update_fields},
        upsert=True
    )

    updated = await db["patient_profiles"].find_one({"user_id": current_user["user_id"]})
    return updated
