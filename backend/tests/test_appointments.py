import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import init_db


@pytest.mark.asyncio
async def test_appointment_booking_and_anti_double_booking():
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Register a real patient
        p_email = f"patient_{uuid.uuid4().hex[:8]}@kolhapur.com"
        p_res = await ac.post("/api/v1/auth/register", json={
            "email": p_email,
            "password": "Password123!",
            "full_name": "Appointment Test Patient",
            "role": "patient"
        })
        token = p_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 2. Register a real doctor
        d_email = f"doctor_{uuid.uuid4().hex[:8]}@kolhapur.com"
        d_res = await ac.post("/api/v1/auth/register", json={
            "email": d_email,
            "password": "Password123!",
            "full_name": "Dr. Appointment Test Doctor",
            "role": "doctor"
        })
        doctor_user_id = d_res.json()["user_id"]

        # 3. Book an appointment slot
        test_date = "2026-10-25"
        test_time = "11:00 AM"
        booking_payload = {
            "hospital_id": "hosp-cpr-kolhapur",
            "hospital_name": "CPR Hospital Kolhapur",
            "doctor_id": doctor_user_id,
            "doctor_name": "Dr. Appointment Test Doctor",
            "appointment_date": test_date,
            "appointment_time": test_time,
            "intake": {
                "chief_complaint": "Acute frontal migraine and recurrent nausea",
                "symptom_duration": "2 days",
                "severity_score": 7,
                "reported_symptoms": ["Migraine", "Nausea", "Photophobia"],
                "associated_symptoms": ["Fatigue"],
                "recent_food_history": ["Spicy misal at college canteen", "Black coffee"],
                "recent_medications": ["Paracetamol 500mg"],
                "additional_notes": "Exams starting next week in Kolhapur university."
            }
        }

        first_res = await ac.post("/api/v1/appointments/book", json=booking_payload, headers=headers)
        assert first_res.status_code == 201

        # 4. Attempt to book the EXACT SAME doctor slot and date -> MUST return 409 Conflict
        second_res = await ac.post("/api/v1/appointments/book", json=booking_payload, headers=headers)
        assert second_res.status_code == 409
        assert "already booked" in second_res.json()["detail"]


@pytest.mark.asyncio
async def test_patient_appointment_listing():
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        p_email = f"patient_{uuid.uuid4().hex[:8]}@kolhapur.com"
        p_res = await ac.post("/api/v1/auth/register", json={
            "email": p_email,
            "password": "Password123!",
            "full_name": "Listing Test Patient",
            "role": "patient"
        })
        token = p_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        res = await ac.get("/api/v1/appointments/patient/my", headers=headers)
        assert res.status_code == 200
        appts = res.json()
        assert isinstance(appts, list)
