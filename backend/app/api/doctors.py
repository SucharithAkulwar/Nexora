from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, Query, status
from app.core.security import require_doctor, get_current_user
from app.core.database import get_db
from app.models.schemas import DoctorProfileOut, DoctorProfileUpdate

router = APIRouter()


@router.get("/", response_model=List[DoctorProfileOut])
async def list_doctors(
    hospital_id: Optional[str] = None,
    specialty: Optional[str] = None
):
    """List all verified participating doctors in Nexora network."""
    db = get_db()
    query = {}
    if hospital_id:
        query["hospital_id"] = hospital_id
    if specialty:
        query["specialty"] = {"$regex": specialty, "$options": "i"}

    cursor = db["doctor_profiles"].find(query)
    docs = await cursor.to_list(length=100)
    return docs


@router.get("/me/profile", response_model=DoctorProfileOut)
async def get_my_doctor_profile(current_user: dict = Depends(require_doctor)):
    """Retrieve logged-in doctor's clinical profile."""
    db = get_db()
    profile = await db["doctor_profiles"].find_one({"user_id": current_user["user_id"]})
    if not profile:
        raise HTTPException(status_code=404, detail="Doctor profile not found.")
    return profile


@router.put("/me/profile", response_model=DoctorProfileOut)
async def update_my_doctor_profile(
    data: DoctorProfileUpdate,
    current_user: dict = Depends(require_doctor)
):
    """Update doctor's schedule, fee, and available appointment time slots."""
    db = get_db()
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    
    if "full_name" in update_data:
        await db["users"].update_one(
            {"_id": current_user["user_id"]},
            {"$set": {"full_name": update_data["full_name"]}}
        )

    await db["doctor_profiles"].update_one(
        {"user_id": current_user["user_id"]},
        {"$set": update_data}
    )
    updated = await db["doctor_profiles"].find_one({"user_id": current_user["user_id"]})
    return updated


@router.get("/me/patients")
async def get_my_patients(current_user: dict = Depends(require_doctor)):
    """
    Retrieve distinct list of patients who have booked consultations with this doctor.
    Enriches with latest appointment status, chief complaint, allergies, and urgent triage flags.
    """
    db = get_db()
    doctor_user_id = current_user["user_id"]
    
    cursor = db["appointments"].find({"doctor_id": doctor_user_id}).sort("appointment_date", -1)
    appts = await cursor.to_list(length=200)
    
    patient_map = {}
    for a in appts:
        pid = a.get("patient_id")
        if not pid:
            continue
        if pid not in patient_map:
            intake = await db["symptom_intakes"].find_one({"appointment_id": a["_id"]})
            profile = await db["patient_profiles"].find_one({"user_id": pid})
            patient_map[pid] = {
                "patient_id": pid,
                "patient_name": a.get("patient_name", "Patient"),
                "latest_appointment_id": a["_id"],
                "latest_appointment_date": a.get("appointment_date"),
                "latest_appointment_time": a.get("appointment_time"),
                "latest_status": a.get("status"),
                "hospital_name": a.get("hospital_name"),
                "chief_complaint": intake.get("chief_complaint") if intake else a.get("reason"),
                "urgent_flags_detected": intake.get("urgent_flags_detected", False) if intake else False,
                "allergies": profile.get("allergies", []) if profile else [],
                "medical_history": profile.get("medical_history", []) if profile else [],
                "total_appointments": 1,
            }
        else:
            patient_map[pid]["total_appointments"] += 1
            
    return list(patient_map.values())


@router.get("/{doctor_id}", response_model=DoctorProfileOut)
async def get_doctor_by_id(doctor_id: str):
    """Retrieve public profile and appointment availability for a specific doctor."""
    db = get_db()
    doc = await db["doctor_profiles"].find_one({
        "$or": [{"_id": doctor_id}, {"user_id": doctor_id}]
    })
    if not doc:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doc


@router.get("/patient/{patient_id}/records")
async def get_authorized_patient_records(
    patient_id: str,
    current_user: dict = Depends(require_doctor)
):
    """
    Doctor views patient medical history and records ONLY IF authorized by an appointment.
    Strictly prohibits cross-patient record access.
    """
    db = get_db()
    doctor_user_id = current_user["user_id"]
    
    # Check if there is an appointment between this doctor and this patient
    has_appointment = await db["appointments"].find_one({
        "doctor_id": doctor_user_id,
        "patient_id": patient_id
    })

    if not has_appointment:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: You do not have an active or scheduled appointment with this patient."
        )

    # Authorized: Retrieve patient profile and documents
    profile = await db["patient_profiles"].find_one({"user_id": patient_id})
    rec_cursor = db["medical_records"].find({"patient_id": patient_id})
    records = await rec_cursor.to_list(length=50)

    # Audit log entry for HIPAA / Data Access compliance
    await db["audit_logs"].insert_one({
        "user_id": doctor_user_id,
        "user_role": "doctor",
        "action": "VIEW_PATIENT_RECORDS",
        "resource_type": "patient_profile",
        "resource_id": patient_id,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    return {
        "patient_profile": profile,
        "medical_records": records
    }
