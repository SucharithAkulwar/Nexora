# NEXORA — AI-Powered Healthcare Platform

> **Find care. Share context. Prepare better.**  
> *Initial Deployment Focus: Kolhapur, Maharashtra, India.*

---

## 1. Product Vision & Clinical Boundaries

**Nexora** bridges the gap between patients, hospitals, and doctors by modernizing both **hospital discovery** and **pre-consultation clinical preparation**:

- **Real-world Scenario:** A student relocates to Kolhapur for graduation, develops an acute 102.5°F fever and throbbing migraine, and needs immediate care. Nexora enables the student to discover nearby hospitals (e.g. CPR Hospital, Aster Aadhar, Apple Saraswati), compare authentic Google Maps ratings, select an available doctor, and complete a detailed pre-appointment symptom questionnaire (including a 24-hour food history).
- **Physician Preparation:** Before the consultation begins, the attending doctor receives a structured, AI-synthesized pre-consultation clinical briefing cross-referenced against the patient's verified medical records using patient-isolated RAG.
- **Ethical & Safety Guardrails:** Nexora **never** autonomously diagnoses conditions or prescribes medications. All AI-generated briefings require doctor review and validation before being treated as clinically verified.

---

## 2. Technology Stack

- **Frontend:** React 19 / 18, TypeScript, Bootstrap 5.3, Bootstrap Icons, Lucide Icons, Leaflet (interactive maps), Canvas-Confetti.
- **Backend:** Python 3.11+, FastAPI, Pydantic v2 Settings.
- **Machine Learning & RAG:** Scikit-learn (TF-IDF vector space and cosine similarity indexing), isolated patient RAG retrieval, Ollama client with deterministic clinical synthesis fallback.
- **Database & Persistence:** MongoDB (Motor async driver) with transparent embedded resilient JSON fallback engine for seamless zero-dependency local execution.
- **DevOps & Containers:** Docker, Docker Compose, Kubernetes manifests (`k8s/deployment.yaml`).

---

## 3. Key Architecture & Features

### A. Role-Based Authorization & 1-Click Dev Presets
- Enforces strict role-based access: Patients cannot access other patients' records; Doctors can only access patients with whom they have an active or scheduled appointment.
- **1-Click Development Testing Presets:**
  - `Aarav Patil`: 21-year-old student patient in Kolhapur (acute pyrexia, migraine, Penicillin allergy).
  - `Dr. Rajesh Kulkarni`: Senior Physician, Chhatrapati Pramila Raje (CPR) Hospital Kolhapur.
  - `Dr. Priya Deshmukh`: Cardiologist, Aster Aadhar Hospital Kolhapur.
  - `Dr. Snehal Shinde`: Family Medicine, Apple Saraswati Multispeciality Hospital Kolhapur.

### B. Kolhapur Hospital Discovery
- Integrates the **Google Maps Platform Places API (New)** with field masks (`places.id,displayName,formattedAddress,rating,userRatingCount,reviews,location`).
- Locality filtering for Kolhapur areas: **Mangalwar Peth, Shastri Nagar, Kadamwadi, Shahupuri, Tarabai Park, Rajarampuri, Line Bazaar**.
- Interactive map view powered by Leaflet and list view with distance and rating sorting.
- Transparent offline catalog fallback when `GOOGLE_MAPS_API_KEY` is not provided.

### C. Atomic Appointment Reservation & Anti-Double-Booking
- Prevents concurrent reservations on the exact same date and doctor slot.
- Full consultation lifecycle: `Scheduled` &rarr; `Confirmed` &rarr; `Checked in` &rarr; `In consultation` &rarr; `Completed` &rarr; `Cancelled`.

### D. Symptom Intake & Real-Time Urgent Care Triage
- Collects: Chief complaint, duration, patient-reported severity (1–10), associated symptoms, 24-hour food and beverage diary, and recent medications.
- Real-time urgent triage detector scans for emergency red flags (crushing chest pain, respiratory distress, facial drooping, stiff neck with high fever, uncontrolled hemorrhage) and displays immediate urgent-care warnings.

### E. AI Patient Summary & Patient-Isolated RAG Pipeline
- Conforms strictly to the required clinical schema:
```json
{
  "chief_complaint": "",
  "symptom_duration": "",
  "reported_symptoms": [],
  "relevant_medical_history": [],
  "allergies": [],
  "current_medications": [],
  "recent_food_history": [],
  "relevant_records": [],
  "missing_information": [],
  "source_references": [],
  "summary": "",
  "requires_doctor_verification": true
}
```
- Hard boundary: Vector searches strictly filter by `patient_id`. Cross-patient record leakage is prevented.
- Clear separation between patient-reported facts, historical medical records, and AI interpretations.

### F. Doctor Consultation Dossier (Section 7 Order)
1. Patient identification and appointment details.
2. Main complaint and symptom duration.
3. Relevant allergies and medical history (prominent allergy alerts, e.g. Penicillin).
4. Current medications.
5. 24-hour food and beverage history.
6. Other patient-reported context.
7. AI-generated summary.
8. Source references & missing data alerts.
9. Doctor's clinical notes (impression, observations, regimen, follow-up advice).

---

## 4. Local Development Setup

### Backend Setup (FastAPI)

1. Open PowerShell and navigate to the backend directory:
```powershell
cd C:\Users\91932\.gemini\antigravity-ide\scratch\nexora\backend
```

2. Activate virtual environment:
```powershell
.\venv\Scripts\Activate.ps1
```

3. Configure `.env` (optional, default fallback works out-of-the-box):
```env
GOOGLE_MAPS_API_KEY=""  # Leave empty for offline verified Kolhapur dataset
OLLAMA_BASE_URL="http://localhost:11434"
```

4. Run automated test suite:
```powershell
.\venv\Scripts\pytest.exe tests -v
```

5. Start the backend development server:
```powershell
.\venv\Scripts\uvicorn.exe app.main:app --host 127.0.0.1 --port 8000 --reload
```
Interactive OpenAPI documentation will be accessible at `http://127.0.0.1:8000/docs`.

---

### Frontend Setup (React & Vite)

1. Navigate to the frontend directory:
```powershell
cd C:\Users\91932\.gemini\antigravity-ide\scratch\nexora\frontend
```

2. Start the Vite development server:
```powershell
npm run dev
```

3. Open your browser at `http://localhost:5173`.

---

## 5. Docker & Kubernetes Deployment

### Docker Compose
Run the entire stack (MongoDB, FastAPI backend, React frontend, and Ollama) with a single command:
```bash
docker-compose up --build
```
- Web Application: `http://localhost:3000`
- API & Docs: `http://localhost:8000/docs`
- MongoDB: `localhost:27017`

### Kubernetes Manifests
Deploy the production workloads into your Kubernetes cluster:
```bash
kubectl apply -f k8s/deployment.yaml
```

---

## 6. Test Suite Coverage

The automated test suite verifies 100% of the core critical workflows:
- `test_urgent_symptom_detection`: Validates red flag emergency detection.
- `test_ai_summary_schema_and_doctor_review`: Enforces Section 8 schema compliance and physician sign-off.
- `test_appointment_booking_and_anti_double_booking`: Validates atomic slot locking.
- `test_patient_appointment_listing`: Checks patient reservation retrieval.
- `test_auth_dev_login`: Tests 1-click preset authentication.
- `test_auth_register_and_login`: Tests registration, password hashing, and token issuance.
- `test_kolhapur_hospital_discovery`: Verifies hospital retrieval for Kolhapur facilities.
- `test_kolhapur_locality_filter`: Verifies locality queries (Shahupuri, Mangalwar Peth, etc.).
- `test_hospital_detail_with_reviews`: Tests Google review extraction.
- `test_patient_cannot_access_doctor_routes`: Role boundary verification.
- `test_unauthorized_doctor_cannot_view_unrelated_patient_records`: Prevents cross-patient leakage.
- `test_authorized_doctor_can_view_assigned_patient_records`: Allows assigned doctor dossier access.

---

## 7. Compliance & Privacy

- **Password Hashing:** Salted Bcrypt with standard rounds.
- **Token Security:** JWT HS256 tokens with role claims.
- **Sanitization:** Medical document uploads are sanitized against prompt injections.
- **Audit Logging:** Every sensitive record inspection is recorded in the immutable audit log table.
