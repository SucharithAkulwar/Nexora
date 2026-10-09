import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import init_db


@pytest.mark.asyncio
async def test_auth_register_and_login_patient():
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        unique_email = f"patient_{uuid.uuid4().hex[:8]}@kolhapur.com"
        reg_payload = {
            "email": unique_email,
            "password": "SecurePassword123!",
            "full_name": "Test Real Patient",
            "role": "patient"
        }
        res = await ac.post("/api/v1/auth/register", json=reg_payload)
        assert res.status_code == 200
        token_data = res.json()
        assert "access_token" in token_data
        assert token_data["role"] == "patient"
        
        # Test login
        login_res = await ac.post("/api/v1/auth/login", json={
            "email": unique_email,
            "password": "SecurePassword123!"
        })
        assert login_res.status_code == 200
        assert "access_token" in login_res.json()


@pytest.mark.asyncio
async def test_auth_register_and_login_doctor():
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        unique_email = f"doctor_{uuid.uuid4().hex[:8]}@kolhapur.com"
        reg_payload = {
            "email": unique_email,
            "password": "DoctorPassword123!",
            "full_name": "Dr. Test Real Doctor",
            "role": "doctor",
            "hospital_id": "hosp-aster-aadhar",
            "hospital_name": "Aster Aadhar Hospital",
            "specialty": "Cardiology",
            "qualifications": "MBBS, MD (Cardiology)",
            "experience_years": 10,
            "consultation_fee_inr": 600
        }
        res = await ac.post("/api/v1/auth/register", json=reg_payload)
        assert res.status_code == 200
        token_data = res.json()
        assert "access_token" in token_data
        assert token_data["role"] == "doctor"

        headers = {"Authorization": f"Bearer {token_data['access_token']}"}

        # Verify profile has the assigned hospital
        prof_res = await ac.get("/api/v1/doctors/me/profile", headers=headers)
        assert prof_res.status_code == 200
        prof = prof_res.json()
        assert prof["hospital_id"] == "hosp-aster-aadhar"
        assert prof["hospital_name"] == "Aster Aadhar Hospital"
        assert prof["specialty"] == "Cardiology"
        assert prof["consultation_fee_inr"] == 600

        # Verify doctor can call me/patients endpoint
        patients_res = await ac.get("/api/v1/doctors/me/patients", headers=headers)
        assert patients_res.status_code == 200
        assert isinstance(patients_res.json(), list)
