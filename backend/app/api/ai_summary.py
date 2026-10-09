import logging
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, status
from app.core.security import require_doctor, get_current_user
from app.core.database import get_db
from app.models.schemas import AISummaryOut, AISummaryDoctorReview
from app.services.ai_summary_engine import ai_summary_engine

logger = logging.getLogger("nexora.ai_api")
router = APIRouter()


@router.get("/{appointment_id}", response_model=AISummaryOut)
async def get_appointment_ai_summary(
    appointment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Retrieve structured AI pre-consultation summary for an appointment.
    Restricted to assigned patient or assigned doctor.
    """
    db = get_db()
    appt = await db["appointments"].find_one({"_id": appointment_id})
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    user_id = current_user["user_id"]
    if user_id != appt["patient_id"] and user_id != appt["doctor_id"] and current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access Denied: You are not authorized to view this clinical summary."
        )

    summary = await db["ai_summaries"].find_one({"appointment_id": appointment_id})
    if not summary:
        raise HTTPException(status_code=404, detail="AI summary not yet generated for this appointment.")

    return summary


@router.post("/{appointment_id}/review", response_model=AISummaryOut)
async def review_ai_summary(
    appointment_id: str,
    review: AISummaryDoctorReview,
    current_user: dict = Depends(require_doctor)
):
    """
    Doctor reviews, modifies, and signs off on the AI pre-consultation summary.
    Enforces physician oversight: AI summaries must be verified by a clinician.
    """
    db = get_db()
    appt = await db["appointments"].find_one({"_id": appointment_id})
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if appt["doctor_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden: You are not the assigned doctor.")

    update_fields = {
        "doctor_reviewed": True,
        "doctor_clinical_notes": review.doctor_clinical_notes,
        "reviewed_at": datetime.now(timezone.utc).isoformat(),
        "reviewed_by_doctor_id": current_user["user_id"]
    }
    if review.edited_summary:
        update_fields["summary"] = review.edited_summary

    await db["ai_summaries"].update_one(
        {"appointment_id": appointment_id},
        {"$set": update_fields}
    )

    # Audit log
    await db["audit_logs"].insert_one({
        "user_id": current_user["user_id"],
        "user_role": "doctor",
        "action": "DOCTOR_REVIEW_AI_SUMMARY",
        "resource_type": "ai_summary",
        "resource_id": appointment_id,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    updated = await db["ai_summaries"].find_one({"appointment_id": appointment_id})
    return updated


@router.post("/{appointment_id}/regenerate", response_model=AISummaryOut)
async def regenerate_ai_summary(
    appointment_id: str,
    current_user: dict = Depends(require_doctor)
):
    """
    Regenerates the AI pre-consultation summary incorporating newly uploaded medical records.
    """
    db = get_db()
    appt = await db["appointments"].find_one({"_id": appointment_id})
    if not appt:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if appt["doctor_id"] != current_user["user_id"]:
        raise HTTPException(status_code=403, detail="Forbidden: You are not the assigned doctor.")

    intake = await db["symptom_intakes"].find_one({"appointment_id": appointment_id})
    if not intake:
        raise HTTPException(status_code=400, detail="No symptom intake found for this appointment.")

    patient_profile = await db["patient_profiles"].find_one({"user_id": appt["patient_id"]}) or {}

    new_summary_data = await ai_summary_engine.generate_patient_summary(
        patient_id=appt["patient_id"],
        patient_profile=patient_profile,
        intake_data=intake,
        doctor_id=current_user["user_id"]
    )

    await db["ai_summaries"].update_one(
        {"appointment_id": appointment_id},
        {"$set": new_summary_data}
    )

    updated = await db["ai_summaries"].find_one({"appointment_id": appointment_id})
    return updated
