import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import init_db


@pytest.mark.asyncio
async def test_patient_cannot_access_doctor_routes():
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        p_email = f"patient_{uuid.uuid4().hex[:8]}@kolhapur.com"
        p_res = await ac.post("/api/v1/auth/register", json={
            "email": p_email,
            "password": "Password123!",
            "full_name": "Test Patient",
            "role": "patient"
        })
        token = p_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Attempt to access doctor-only endpoint
        res = await ac.get("/api/v1/doctors/me/profile", headers=headers)
        assert res.status_code == 403
        assert "Access denied" in res.json()["detail"]


@pytest.mark.asyncio
async def test_unauthorized_doctor_cannot_view_unrelated_patient_records():
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Register patient
        p_email = f"patient_{uuid.uuid4().hex[:8]}@kolhapur.com"
        p_res = await ac.post("/api/v1/auth/register", json={
            "email": p_email,
            "password": "Password123!",
            "full_name": "Unrelated Patient",
            "role": "patient"
        })
        patient_id = p_res.json()["user_id"]

        # Register doctor who has NO appointment with this patient
        d_email = f"doctor_{uuid.uuid4().hex[:8]}@kolhapur.com"
        d_res = await ac.post("/api/v1/auth/register", json={
            "email": d_email,
            "password": "Password123!",
            "full_name": "Dr. Unrelated",
            "role": "doctor"
        })
        doc_token = d_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {doc_token}"}

        # Attempt to fetch patient's records
        res = await ac.get(f"/api/v1/doctors/patient/{patient_id}/records", headers=headers)
        assert res.status_code == 403
        assert "Access Denied" in res.json()["detail"]


@pytest.mark.asyncio
async def test_authorized_doctor_can_view_assigned_patient_records():
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # Register doctor
        d_email = f"doctor_{uuid.uuid4().hex[:8]}@kolhapur.com"
        d_res = await ac.post("/api/v1/auth/register", json={
            "email": d_email,
            "password": "Password123!",
            "full_name": "Dr. Assigned Doctor",
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
            "full_name": "Assigned Patient",
            "role": "patient"
        })
        pat_token = p_res.json()["access_token"]
        patient_id = p_res.json()["user_id"]
        pat_headers = {"Authorization": f"Bearer {pat_token}"}

        # Patient books appointment with this doctor
        await ac.post("/api/v1/appointments/book", json={
            "hospital_id": "hosp-cpr-kolhapur",
            "hospital_name": "CPR Hospital",
            "doctor_id": doc_id,
            "doctor_name": "Dr. Assigned Doctor",
            "appointment_date": "2026-11-05",
            "appointment_time": "11:30 AM",
            "intake": {
                "chief_complaint": "Follow up consultation",
                "symptom_duration": "1 week",
                "severity_score": 4,
                "reported_symptoms": ["Fatigue"]
            }
        }, headers=pat_headers)

        # Now doctor accesses patient records
        res = await ac.get(f"/api/v1/doctors/patient/{patient_id}/records", headers=doc_headers)
        assert res.status_code == 200
        data = res.json()
        assert "patient_profile" in data
        assert "medical_records" in data
