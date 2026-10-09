from datetime import datetime
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# ==========================================
# User & Authentication Schemas
# ==========================================

class UserRole(str):
    PATIENT = "patient"
    DOCTOR = "doctor"
    ADMIN = "admin"


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., min_length=2)
    role: Literal["patient", "doctor"] = "patient"
    hospital_name: Optional[str] = None
    hospital_id: Optional[str] = None
    specialty: Optional[str] = None
    qualifications: Optional[str] = None
    experience_years: Optional[int] = 5
    consultation_fee_inr: Optional[int] = 300


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class DevLoginRequest(BaseModel):
    role: Literal["patient", "doctor"]
    preset: Optional[str] = None  # e.g. "student_patient", "cpr_doctor", "aster_doctor"


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user_id: str
    full_name: str
    email: str


class UserOut(BaseModel):
    id: str = Field(..., alias="_id")
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: str

    model_config = ConfigDict(populate_by_name=True)


# ==========================================
# Patient Profile Schemas
# ==========================================

class EmergencyContact(BaseModel):
    name: Optional[str] = None
    relationship: Optional[str] = None
    phone: Optional[str] = None


class PatientProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    contact_phone: Optional[str] = None
    city: Optional[str] = "Kolhapur"
    locality: Optional[str] = None
    allergies: Optional[List[str]] = []
    medical_history: Optional[List[str]] = []
    current_medications: Optional[List[str]] = []
    emergency_contact: Optional[EmergencyContact] = None


class PatientProfileOut(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    full_name: str
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    contact_phone: Optional[str] = None
    city: str = "Kolhapur"
    locality: Optional[str] = None
    allergies: List[str] = []
    medical_history: List[str] = []
    current_medications: List[str] = []
    emergency_contact: Optional[EmergencyContact] = None
    onboarded: bool = False
    updated_at: Optional[str] = None

    model_config = ConfigDict(populate_by_name=True)


# ==========================================
# Doctor Profile Schemas
# ==========================================

class DoctorProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    specialty: Optional[str] = None
    experience_years: Optional[int] = None
    qualifications: Optional[str] = None
    hospital_id: Optional[str] = None
    hospital_name: Optional[str] = None
    locality: Optional[str] = None
    consultation_fee_inr: Optional[int] = None
    available_days: Optional[List[str]] = None
    available_time_slots: Optional[List[str]] = None


class DoctorProfileOut(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    full_name: str
    specialty: str
    experience_years: int
    qualifications: str
    registration_number: Optional[str] = None
    hospital_id: str
    hospital_name: str
    locality: str
    consultation_fee_inr: int
    available_days: List[str]
    available_time_slots: List[str]
    rating: float = 4.5
    review_count: int = 0

    model_config = ConfigDict(populate_by_name=True)


# ==========================================
# Hospital & Places Schemas
# ==========================================

class HospitalReview(BaseModel):
    author_name: str
    rating: float
    text: str
    relative_time_description: Optional[str] = None
    author_url: Optional[str] = None


class HospitalOut(BaseModel):
    id: str
    name: str
    formatted_address: str
    locality: str
    latitude: float
    longitude: float
    rating: float
    user_rating_count: int
    phone_number: Optional[str] = None
    website: Optional[str] = None
    open_now: Optional[bool] = None
    types: List[str] = []
    source: str = "google_places"  # "google_places_live" or "demo_verified_offline"
    has_nexora_doctors: bool = False
    bookable_doctors_count: int = 0
    distance_km: Optional[float] = None


class HospitalDetailOut(HospitalOut):
    reviews: List[HospitalReview] = []
    opening_hours: List[str] = []
    google_maps_url: Optional[str] = None
    attribution: Optional[str] = None


# ==========================================
# Symptom Intake & Urgent Triaging Schemas
# ==========================================

class SymptomIntakeCreate(BaseModel):
    chief_complaint: str = Field(..., min_length=3)
    symptom_duration: str = Field(..., min_length=2)
    severity_score: int = Field(..., ge=1, le=10)
    reported_symptoms: List[str] = []
    associated_symptoms: List[str] = []
    recent_food_history: List[str] = []
    recent_medications: List[str] = []
    additional_notes: Optional[str] = None


class SymptomIntakeOut(BaseModel):
    id: str = Field(..., alias="_id")
    appointment_id: str
    patient_id: str
    chief_complaint: str
    symptom_duration: str
    severity_score: int
    reported_symptoms: List[str]
    associated_symptoms: List[str]
    recent_food_history: List[str]
    recent_medications: List[str]
    additional_notes: Optional[str] = None
    urgent_flags_detected: bool = False
    urgent_warning_message: Optional[str] = None
    submitted_at: str

    model_config = ConfigDict(populate_by_name=True)


# ==========================================
# Appointment Schemas
# ==========================================

class AppointmentCreate(BaseModel):
    hospital_id: str
    hospital_name: str
    doctor_id: str
    doctor_name: str
    appointment_date: str  # YYYY-MM-DD
    appointment_time: str  # e.g. "10:30 AM"
    intake: SymptomIntakeCreate


class AppointmentStatusUpdate(BaseModel):
    status: Literal["Scheduled", "Confirmed", "Checked in", "In consultation", "Completed", "Cancelled"]


class AppointmentOut(BaseModel):
    id: str = Field(..., alias="_id")
    patient_id: str
    patient_name: str
    doctor_id: str
    doctor_name: str
    hospital_id: str
    hospital_name: str
    appointment_date: str
    appointment_time: str
    status: str
    created_at: str
    intake_submitted: bool = True
    ai_summary_available: bool = False

    model_config = ConfigDict(populate_by_name=True)


# ==========================================
# Medical Records & Document RAG Schemas
# ==========================================

class MedicalRecordCreate(BaseModel):
    title: str
    record_type: str = "Laboratory"  # Lab, Imaging, Prescription, Discharge Summary
    facility_name: Optional[str] = None
    date: Optional[str] = None
    extracted_text: str
    summary: Optional[str] = None


class MedicalRecordOut(BaseModel):
    id: str = Field(..., alias="_id")
    patient_id: str
    title: str
    record_type: str
    facility_name: Optional[str] = None
    date: Optional[str] = None
    extracted_text: str
    summary: Optional[str] = None
    file_name: Optional[str] = None
    uploaded_at: str
    source: str = "Uploaded by patient"

    model_config = ConfigDict(populate_by_name=True)


# ==========================================
# AI Patient Summary Schemas (Section 8)
# ==========================================

class AISummaryOut(BaseModel):
    id: str = Field(..., alias="_id")
    appointment_id: str
    patient_id: str
    doctor_id: str
    chief_complaint: str
    symptom_duration: str
    reported_symptoms: List[str]
    relevant_medical_history: List[str]
    allergies: List[str]
    current_medications: List[str]
    recent_food_history: List[str]
    relevant_records: List[str]
    missing_information: List[str]
    source_references: List[str]
    summary: str
    requires_doctor_verification: bool = True
    doctor_reviewed: bool = False
    doctor_clinical_notes: Optional[str] = None
    created_at: str

    model_config = ConfigDict(populate_by_name=True)


class AISummaryDoctorReview(BaseModel):
    doctor_clinical_notes: str
    doctor_approved: bool = True
    edited_summary: Optional[str] = None


# ==========================================
# Consultation Notes Schemas
# ==========================================

class ConsultationNoteCreate(BaseModel):
    appointment_id: str
    diagnosis_impression: str
    clinical_observations: str
    recommended_tests: Optional[List[str]] = []
    prescribed_regimen: Optional[str] = None
    follow_up_advice: Optional[str] = None


class ConsultationNoteOut(BaseModel):
    id: str = Field(..., alias="_id")
    appointment_id: str
    patient_id: str
    doctor_id: str
    doctor_name: str
    diagnosis_impression: str
    clinical_observations: str
    recommended_tests: List[str]
    prescribed_regimen: Optional[str] = None
    follow_up_advice: Optional[str] = None
    created_at: str

    model_config = ConfigDict(populate_by_name=True)


# ==========================================
# Audit Log Schemas
# ==========================================

class AuditLogOut(BaseModel):
    id: str = Field(..., alias="_id")
    user_id: str
    user_role: str
    action: str
    resource_type: str
    resource_id: str
    ip_address: Optional[str] = None
    timestamp: str

    model_config = ConfigDict(populate_by_name=True)
