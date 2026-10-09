import re
import uuid
import logging
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form, status
from app.core.security import require_patient, get_current_user
from app.core.database import get_db
from app.models.schemas import MedicalRecordCreate, MedicalRecordOut
from app.services.rag_service import rag_service

logger = logging.getLogger("nexora.records")
router = APIRouter()

# Security filter against prompt injection patterns in uploaded medical documents
PROMPT_INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior)\s+instructions",
    r"you\s+are\s+now\s+a",
    r"system\s*:\s*",
    r"override\s+clinical\s+guidelines",
    r"<\|\s*im_start\s*\|>",
    r"<\s*script\s*>",
]


def sanitize_clinical_text(text: str) -> str:
    sanitized = text
    for pattern in PROMPT_INJECTION_PATTERNS:
        sanitized = re.sub(pattern, "[FILTERED_SECURITY_STRING]", sanitized, flags=re.IGNORECASE)
    return sanitized


@router.post("/upload", response_model=MedicalRecordOut, status_code=status.HTTP_201_CREATED)
async def upload_medical_record(
    title: str = Form(...),
    record_type: str = Form("Laboratory"),
    facility_name: Optional[str] = Form("Kolhapur Healthcare Facility"),
    date: Optional[str] = Form(None),
    extracted_text: str = Form(...),
    current_user: dict = Depends(require_patient)
):
    """
    Upload and index a medical document (Lab report, prescription, imaging notes).
    Sanitizes against prompt injection and ingests chunks into patient-isolated RAG index.
    """
    db = get_db()
    patient_id = current_user["user_id"]
    record_id = f"rec-{uuid.uuid4().hex[:10]}"

    cleaned_text = sanitize_clinical_text(extracted_text)
    now_iso = datetime.now(timezone.utc).isoformat()
    record_date = date or datetime.now().strftime("%Y-%m-%d")

    record_doc = {
        "_id": record_id,
        "patient_id": patient_id,
        "title": title,
        "record_type": record_type,
        "facility_name": facility_name,
        "date": record_date,
        "extracted_text": cleaned_text,
        "summary": cleaned_text[:200] + ("..." if len(cleaned_text) > 200 else ""),
        "file_name": f"{title.lower().replace(' ', '_')}_{record_id[-4:]}.pdf",
        "uploaded_at": now_iso,
        "source": "Uploaded by patient with consent"
    }
    await db["medical_records"].insert_one(record_doc)

    # Ingest chunks into isolated RAG storage
    chunk_count = await rag_service.ingest_record(
        patient_id=patient_id,
        record_id=record_id,
        title=title,
        text=cleaned_text,
        record_type=record_type
    )

    # Log audit
    await db["audit_logs"].insert_one({
        "user_id": patient_id,
        "user_role": "patient",
        "action": "UPLOAD_MEDICAL_RECORD",
        "resource_type": "medical_record",
        "resource_id": record_id,
        "timestamp": now_iso
    })

    return record_doc


@router.get("/my", response_model=List[MedicalRecordOut])
async def get_my_medical_records(current_user: dict = Depends(require_patient)):
    """Retrieve all medical records for the logged-in patient."""
    db = get_db()
    cursor = db["medical_records"].find({"patient_id": current_user["user_id"]}).sort("uploaded_at", -1)
    records = await cursor.to_list(length=100)
    return records


@router.delete("/{record_id}")
async def delete_medical_record(record_id: str, current_user: dict = Depends(require_patient)):
    """Delete a medical record and remove its RAG chunks."""
    db = get_db()
    patient_id = current_user["user_id"]

    rec = await db["medical_records"].find_one({"_id": record_id, "patient_id": patient_id})
    if not rec:
        raise HTTPException(status_code=404, detail="Record not found or access denied.")

    await db["medical_records"].delete_one({"_id": record_id})
    await db["rag_chunks"].delete_one({"record_id": record_id})

    # Log audit
    await db["audit_logs"].insert_one({
        "user_id": patient_id,
        "user_role": "patient",
        "action": "DELETE_MEDICAL_RECORD",
        "resource_type": "medical_record",
        "resource_id": record_id,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })

    return {"success": True, "message": "Record deleted successfully."}
