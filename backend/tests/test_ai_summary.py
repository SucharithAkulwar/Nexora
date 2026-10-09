import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import init_db
from app.services.ai_summary_engine import ai_summary_engine


def test_urgent_symptom_detection():
    # Emergency symptom should be detected
    warning_chest = ai_summary_engine.detect_urgent_symptoms("Patient has crushing chest pain radiating to left arm")
    assert warning_chest is not None
    assert "POTENTIAL CLINICAL EMERGENCY DETECTED" in warning_chest

    # Non-emergency symptom should not trigger urgent warning
    warning_mild = ai_summary_engine.detect_urgent_symptoms("Mild headache and dry cough for 2 days")
    assert warning_mild is None


@pytest.mark.asyncio
async def test_ai_summary_schema_and_doctor_review():
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Register doctor
        d_email = f"doc_{uuid.uuid4().hex[:8]}@kolhapur.com"
        d_res = await ac.post("/api/v1/auth/register", json={
            "email": d_email,
            "password": "Password123!",
            "full_name": "Dr. Summary Tester",
            "role": "doctor"
        })
        doc_token = d_res.json()["access_token"]
        doc_id = d_res.json()["user_id"]
        doc_headers = {"Authorization": f"Bearer {doc_token}"}

        # Register patient
        p_email = f"patient_{uuid.uuid4().hex[:8]}@kolhapur.com"
        p_res = await ac.post("/api/v1/auth/register", json={
            "email": p_email,
            "password": "Password123!",
            "full_name": "Summary Patient",
            "role": "patient"
        })
        pat_token = p_res.json()["access_token"]
        pat_headers = {"Authorization": f"Bearer {pat_token}"}

        # Patient books appointment with intake
        book_res = await ac.post("/api/v1/appointments/book", json={
            "hospital_id": "hosp-cpr-kolhapur",
            "hospital_name": "CPR Hospital",
            "doctor_id": doc_id,
            "doctor_name": "Dr. Summary Tester",
            "appointment_date": "2026-11-01",
            "appointment_time": "10:00 AM",
            "intake": {
                "chief_complaint": "High fever and headache",
                "symptom_duration": "3 days",
                "severity_score": 8,
                "reported_symptoms": ["Fever", "Headache"],
                "recent_food_history": ["Tea and toast"],
                "recent_medications": ["Paracetamol"]
            }
        }, headers=pat_headers)
        assert book_res.status_code == 201
        appt_id = book_res.json()["appointment"]["_id"]

        # Doctor fetches AI summary
        res = await ac.get(f"/api/v1/ai-summary/{appt_id}", headers=doc_headers)
        assert res.status_code == 200
        summary = res.json()

        # Check required Section 8 schema fields
        assert "chief_complaint" in summary
        assert "symptom_duration" in summary
        assert "reported_symptoms" in summary
        assert "relevant_medical_history" in summary
        assert "allergies" in summary
        assert "current_medications" in summary
        assert "recent_food_history" in summary
        assert "relevant_records" in summary
        assert "missing_information" in summary
        assert "source_references" in summary
        assert "summary" in summary
        assert "requires_doctor_verification" in summary
        assert summary["requires_doctor_verification"] is True

        # Doctor verifies and reviews summary
        review_payload = {
            "doctor_clinical_notes": "Reviewed pre-consultation summary. Advised hydration.",
            "doctor_approved": True,
            "edited_summary": "Doctor-verified: Acute febrile illness."
        }
        review_res = await ac.post(f"/api/v1/ai-summary/{appt_id}/review", json=review_payload, headers=doc_headers)
        assert review_res.status_code == 200
        reviewed_data = review_res.json()
        assert reviewed_data["doctor_reviewed"] is True
