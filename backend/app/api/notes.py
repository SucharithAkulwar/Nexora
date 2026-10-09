import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, status
from app.core.security import require_doctor, get_current_user
from app.core.database import get_db
from app.models.schemas import ConsultationNoteCreate, ConsultationNoteOut

router = APIRouter()


@router.post("/", response_model=ConsultationNoteOut, status_code=status.HTTP_201_CREATED)
async def create_consultation_notes(
    note_in: ConsultationNoteCreate,
    current_user: dict = Depends(require_doctor)
):
    """Doctor files official post-consultation examination notes and clinical recommendations."""
    db = get_db()
    doctor_id = current_user["user_id"]
    appt = await db["appointments"].find_one({"_id": note_in.appointment_id})
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if appt["doctor_id"] != doctor_id:
        raise HTTPException(status_code=403, detail="Forbidden: You are not the assigned doctor.")

    doctor_user = await db["users"].find_one({"_id": doctor_id})
    doctor_name = doctor_user.get("full_name", "Doctor") if doctor_user else "Doctor"

    now_iso = datetime.now(timezone.utc).isoformat()
    note_id = f"note-{uuid.uuid4().hex[:10]}"
    
    note_doc = {
        "_id": note_id,
        "appointment_id": note_in.appointment_id,
        "patient_id": appt["patient_id"],
        "doctor_id": doctor_id,
        "doctor_name": doctor_name,
        "diagnosis_impression": note_in.diagnosis_impression,
        "clinical_observations": note_in.clinical_observations,
        "recommended_tests": note_in.recommended_tests or [],
        "prescribed_regimen": note_in.prescribed_regimen,
        "follow_up_advice": note_in.follow_up_advice,
        "created_at": now_iso
    }

    # Upsert consultation note
    await db["consultation_notes"].update_one(
        {"appointment_id": note_in.appointment_id},
        {"$set": note_doc},
        upsert=True
    )

    # Automatically update appointment status to Completed
    await db["appointments"].update_one(
        {"_id": note_in.appointment_id},
        {"$set": {"status": "Completed", "updated_at": now_iso}}
    )

    # Audit log
    await db["audit_logs"].insert_one({
        "user_id": doctor_id,
        "user_role": "doctor",
        "action": "CREATE_CONSULTATION_NOTE",
        "resource_type": "consultation_note",
        "resource_id": note_id,
        "timestamp": now_iso
    })

    return note_doc


@router.get("/appointment/{appointment_id}")
async def get_consultation_notes(
    appointment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Retrieve consultation notes for an appointment (accessible by assigned doctor or patient)."""
    db = get_db()
    appt = await db["appointments"].find_one({"_id": appointment_id})
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    user_id = current_user["user_id"]
    if user_id != appt["patient_id"] and user_id != appt["doctor_id"] and current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Forbidden")

    note = await db["consultation_notes"].find_one({"appointment_id": appointment_id})
    return note or {}
