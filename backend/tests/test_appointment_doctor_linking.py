import pytest
import uuid
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.database import init_db


@pytest.mark.asyncio
async def test_appointment_doctor_linking_isolation():
    """
    Integration Test:
    1. Register Doctor A and Doctor B at the same hospital (CPR Hospital).
    2. Register Patient P.
    3. Patient P queries live doctors at CPR Hospital and verifies Doctor A and B are returned with live fees.
    4. Patient P books an appointment specifically with Doctor A using Doctor A's real user_id.
    5. Verifies the appointment record stores Doctor A's user_id as a foreign key.
    6. Doctor A queries their queue: sees Patient P's appointment immediately.
    7. Doctor B queries their queue: confirms Doctor B does NOT see Doctor A's appointment (isolated queue).
    8. Confirms Doctor A's patient roster includes Patient P, while Doctor B's patient roster is empty.
    """
    await init_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        hospital_id = "hosp-cpr-kolhapur"
        hospital_name = "Chhatrapati Pramila Raje (CPR) Hospital"

        # 1. Register Doctor A at CPR Hospital
        doc_a_email = f"doc_a_{uuid.uuid4().hex[:8]}@kolhapur.com"
        doc_a_res = await ac.post("/api/v1/auth/register", json={
            "email": doc_a_email,
            "password": "Password123!",
            "full_name": "Dr. Anita Rao",
            "role": "doctor",
            "hospital_id": hospital_id,
            "hospital_name": hospital_name,
            "specialty": "Internal Medicine",
            "consultation_fee_inr": 450
        })
        assert doc_a_res.status_code == 200, doc_a_res.text
        doc_a_token = doc_a_res.json()["access_token"]
        doc_a_id = doc_a_res.json()["user_id"]
        headers_doc_a = {"Authorization": f"Bearer {doc_a_token}"}

        # 2. Register Doctor B at CPR Hospital (Same Hospital)
        doc_b_email = f"doc_b_{uuid.uuid4().hex[:8]}@kolhapur.com"
        doc_b_res = await ac.post("/api/v1/auth/register", json={
            "email": doc_b_email,
            "password": "Password123!",
            "full_name": "Dr. Bhavesh Shah",
            "role": "doctor",
            "hospital_id": hospital_id,
            "hospital_name": hospital_name,
            "specialty": "Cardiology",
            "consultation_fee_inr": 600
        })
        assert doc_b_res.status_code == 200, doc_b_res.text
        doc_b_token = doc_b_res.json()["access_token"]
        doc_b_id = doc_b_res.json()["user_id"]
        headers_doc_b = {"Authorization": f"Bearer {doc_b_token}"}

        # Confirm they have distinct user IDs
        assert doc_a_id != doc_b_id

        # 3. Register Patient P
        patient_email = f"patient_{uuid.uuid4().hex[:8]}@kolhapur.com"
        patient_res = await ac.post("/api/v1/auth/register", json={
            "email": patient_email,
            "password": "Password123!",
            "full_name": "Rohan Patil",
            "role": "patient"
        })
        assert patient_res.status_code == 200, patient_res.text
        patient_token = patient_res.json()["access_token"]
        patient_id = patient_res.json()["user_id"]
        headers_patient = {"Authorization": f"Bearer {patient_token}"}

        # 4. Patient queries live doctors at CPR Hospital
        docs_res = await ac.get(f"/api/v1/doctors/?hospital_id={hospital_id}")
        assert docs_res.status_code == 200
        hospital_doctors = docs_res.json()
        doc_ids_returned = [d.get("user_id") for d in hospital_doctors]
        assert doc_a_id in doc_ids_returned, "Doctor A must be listed in hospital doctors"
        assert doc_b_id in doc_ids_returned, "Doctor B must be listed in hospital doctors"

        # Verify doctor fee and specialty are pulled live
        doc_a_data = next(d for d in hospital_doctors if d.get("user_id") == doc_a_id)
        assert doc_a_data["consultation_fee_inr"] == 450
        assert doc_a_data["specialty"] == "Internal Medicine"

        # 5. Patient P books an appointment specifically with Doctor A
        booking_payload = {
            "hospital_id": hospital_id,
            "hospital_name": hospital_name,
            "doctor_id": doc_a_id,  # Storing Doctor A's actual unique account ID
            "doctor_name": "Dr. Anita Rao",
            "appointment_date": "2026-10-28",
            "appointment_time": "10:30 AM",
            "intake": {
                "chief_complaint": "Persistent fever and headache for 3 days",
                "symptom_duration": "3 days",
                "severity_score": 6,
                "reported_symptoms": ["Pyrexia", "Headache"],
                "associated_symptoms": ["Fatigue"],
                "recent_food_history": ["Normal home-cooked meals"],
                "recent_medications": ["Paracetamol 650mg"],
                "additional_notes": "No previous allergies."
            }
        }
        book_res = await ac.post("/api/v1/appointments/book", json=booking_payload, headers=headers_patient)
        assert book_res.status_code == 201, book_res.text
        booked_appt = book_res.json()["appointment"]

        # Validate appointment record linkage
        assert booked_appt["doctor_id"] == doc_a_id, "Appointment must link Doctor A's unique ID"
        assert booked_appt["patient_id"] == patient_id, "Appointment must link Patient P's unique ID"
        assert booked_appt["hospital_id"] == hospital_id, "Appointment must link CPR Hospital ID"
        assert booked_appt["consultation_fee_inr"] == 450

        # 6. Doctor A queries workstation queue -> Appears immediately!
        doc_a_queue_res = await ac.get("/api/v1/appointments/doctor/my", headers=headers_doc_a)
        assert doc_a_queue_res.status_code == 200
        doc_a_appts = doc_a_queue_res.json()
        assert len(doc_a_appts) >= 1
        found_in_a = [a for a in doc_a_appts if a["_id"] == booked_appt["_id"]]
        assert len(found_in_a) == 1, "Doctor A must see Patient P's appointment"
        assert found_in_a[0]["patient_name"] == "Rohan Patil"
        assert found_in_a[0]["chief_complaint"] == "Persistent fever and headache for 3 days"

        # 7. Doctor B (at the same hospital) queries workstation queue -> Must NOT see Doctor A's appointment
        doc_b_queue_res = await ac.get("/api/v1/appointments/doctor/my", headers=headers_doc_b)
        assert doc_b_queue_res.status_code == 200
        doc_b_appts = doc_b_queue_res.json()
        found_in_b = [a for a in doc_b_appts if a["_id"] == booked_appt["_id"]]
        assert len(found_in_b) == 0, "Doctor B must NOT see Doctor A's booked appointment"

        # 8. Patient Roster Verification
        doc_a_patients_res = await ac.get("/api/v1/doctors/me/patients", headers=headers_doc_a)
        assert doc_a_patients_res.status_code == 200
        doc_a_patients = doc_a_patients_res.json()
        assert any(p["patient_id"] == patient_id for p in doc_a_patients), "Patient P must appear in Doctor A's patient roster"

        doc_b_patients_res = await ac.get("/api/v1/doctors/me/patients", headers=headers_doc_b)
        assert doc_b_patients_res.status_code == 200
        doc_b_patients = doc_b_patients_res.json()
        assert not any(p["patient_id"] == patient_id for p in doc_b_patients), "Patient P must NOT appear in Doctor B's patient roster"

        # 9. Doctor A updates appointment status to "In consultation"
        update_res = await ac.patch(
            f"/api/v1/appointments/{booked_appt['_id']}/status",
            json={"status": "In consultation"},
            headers=headers_doc_a
        )
        assert update_res.status_code == 200
        assert update_res.json()["status"] == "In consultation"

        # 10. Doctor B attempts to update Doctor A's appointment status -> Must return 403 Forbidden
        unauth_doc_res = await ac.patch(
            f"/api/v1/appointments/{booked_appt['_id']}/status",
            json={"status": "Completed"},
            headers=headers_doc_b
        )
        assert unauth_doc_res.status_code == 403

        # 11. Patient P cancels their own appointment -> Must return 200 and set status to Cancelled
        cancel_res = await ac.patch(
            f"/api/v1/appointments/{booked_appt['_id']}/status",
            json={"status": "Cancelled"},
            headers=headers_patient
        )
        assert cancel_res.status_code == 200
        assert cancel_res.json()["status"] == "Cancelled"

        # 12. Another patient attempts to cancel Patient P's appointment -> Must return 403 Forbidden
        other_patient_res = await ac.post("/api/v1/auth/register", json={
            "email": f"other_{uuid.uuid4().hex[:8]}@kolhapur.com",
            "password": "Password123!",
            "full_name": "Unauthorized Patient",
            "role": "patient"
        })
        other_patient_token = other_patient_res.json()["access_token"]
        unauth_cancel_res = await ac.patch(
            f"/api/v1/appointments/{booked_appt['_id']}/status",
            json={"status": "Cancelled"},
            headers={"Authorization": f"Bearer {other_patient_token}"}
        )
        assert unauth_cancel_res.status_code == 403
