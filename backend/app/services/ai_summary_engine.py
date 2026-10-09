import json
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import httpx
from app.core.config import settings
from app.services.rag_service import rag_service

logger = logging.getLogger("nexora.ai_engine")

# Red-flag urgent emergency symptoms that trigger immediate urgent-care warnings
RED_FLAG_PATTERNS = [
    ("chest pain", "Crushing, pressure-like, or radiating chest pain"),
    ("shortness of breath", "Acute respiratory distress or severe shortness of breath at rest"),
    ("difficulty breathing", "Severe breathing difficulty or stridor"),
    ("slurred speech", "Sudden speech impairment or facial drooping (potential stroke signs)"),
    ("facial drooping", "Facial asymmetry or weakness"),
    ("numbness", "Sudden unilateral weakness or paralysis"),
    ("stiff neck", "High fever accompanied by severe neck stiffness or altered consciousness"),
    ("uncontrolled bleeding", "Severe or uncontrollable hemorrhage"),
    ("coughing blood", "Hemoptysis or acute blood in sputum"),
    ("anaphylaxis", "Severe acute allergic reaction with throat tightness or swelling")
]


class AISummaryEngine:
    def __init__(self):
        self.ollama_url = f"{settings.OLLAMA_BASE_URL}/api/generate"
        self.model_name = settings.OLLAMA_MODEL

    def detect_urgent_symptoms(self, text_to_check: str) -> Optional[str]:
        """
        Scan complaint and symptoms for clinical emergency red flags.
        Does not replace physician triage, but warns the patient and flags the record.
        """
        lower = text_to_check.lower()
        matched_flags = []
        for keyword, warning in RED_FLAG_PATTERNS:
            if keyword in lower:
                matched_flags.append(warning)
        
        if matched_flags:
            return (
                "POTENTIAL CLINICAL EMERGENCY DETECTED: "
                + "; ".join(matched_flags)
                + ". If experiencing life-threatening distress, seek immediate emergency hospital care (CPR Casualty / 108 Emergency Ambulance) rather than waiting for a routine scheduled consultation."
            )
        return None

    async def generate_patient_summary(
        self,
        patient_id: str,
        patient_profile: Dict[str, Any],
        intake_data: Dict[str, Any],
        doctor_id: str
    ) -> Dict[str, Any]:
        """
        Generates a concise, structured pre-consultation summary adhering to Section 8 schema.
        Cross-references submitted intake with authorized historical records via RAG.
        Gracefully leverages local Ollama if available, otherwise executes high-fidelity clinical synthesis.
        """
        chief_complaint = intake_data.get("chief_complaint", "Unspecified complaint")
        symptom_duration = intake_data.get("symptom_duration", "Unknown duration")
        reported_symptoms = intake_data.get("reported_symptoms", [])
        if not reported_symptoms and intake_data.get("chief_complaint"):
            reported_symptoms = [intake_data.get("chief_complaint")]

        # Query patient's authorized records via RAG
        rag_query = f"{chief_complaint} {' '.join(reported_symptoms)}"
        retrieved_chunks = await rag_service.query_patient_records(
            patient_id=patient_id,
            query=rag_query,
            top_k=3
        )

        relevant_records_summary = []
        source_references = ["Patient Pre-Appointment Intake Form (patient-reported)"]
        
        for c in retrieved_chunks:
            ref_str = f"Record: {c.get('title')} ({c.get('record_type')}) - Score: {c.get('similarity_score')}"
            relevant_records_summary.append(f"{c.get('title')}: {c.get('text')[:180]}...")
            source_references.append(ref_str)

        allergies = patient_profile.get("allergies", [])
        med_history = patient_profile.get("medical_history", [])
        current_meds = intake_data.get("recent_medications", [])
        if not current_meds:
            current_meds = patient_profile.get("current_medications", [])

        recent_food = intake_data.get("recent_food_history", [])

        # Missing information analysis
        missing_info = []
        if not intake_data.get("recent_food_history"):
            missing_info.append("24-hour food and beverage intake not provided by patient")
        if not patient_profile.get("blood_group"):
            missing_info.append("Blood group unknown / unrecorded")
        if not intake_data.get("severity_score"):
            missing_info.append("Patient-rated pain/severity scale unrecorded")
        missing_info.append("Vital signs (resting BP, pulse, SPO2, recorded temperature) require clinical measurement in clinic")

        # Check for urgent flags
        combined_text = f"{chief_complaint} {' '.join(reported_symptoms)} {intake_data.get('additional_notes', '')}"
        urgent_warning = self.detect_urgent_symptoms(combined_text)

        # Build prompt for local Ollama inference if running
        ollama_summary_text = None
        try:
            prompt = (
                "You are an assistant preparing a pre-consultation medical briefing for a licensed doctor. "
                "Synthesize this patient's intake. DO NOT provide a diagnosis or prescription. "
                "Distinguish patient-reported facts from verified medical records. "
                f"Patient Age: {patient_profile.get('age', 'Unknown')}, Gender: {patient_profile.get('gender', 'Unknown')}. "
                f"Chief Complaint: {chief_complaint}. Duration: {symptom_duration}. "
                f"Symptoms: {', '.join(reported_symptoms)}. "
                f"Allergies: {', '.join(allergies) if allergies else 'None documented'}. "
                f"Medical History: {', '.join(med_history) if med_history else 'None'}. "
                f"Medications: {', '.join(current_meds) if current_meds else 'None'}. "
                f"Food History: {', '.join(recent_food) if recent_food else 'None'}. "
                f"Relevant Lab Records: {' | '.join(relevant_records_summary) if relevant_records_summary else 'None'}. "
                "Output a concise 3-4 sentence clinical overview highlighting complaints, allergy warnings, and points for physician examination."
            )
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.post(
                    self.ollama_url,
                    json={"model": self.model_name, "prompt": prompt, "stream": False}
                )
                if res.status_code == 200:
                    resp_json = res.json()
                    ollama_summary_text = resp_json.get("response", "").strip()
        except Exception:
            # Ollama not running or timeout; seamlessly use deterministic clinical synthesis
            ollama_summary_text = None

        if not ollama_summary_text:
            # High-fidelity clinical synthesis adhering strictly to guidelines
            age_gender = f"{patient_profile.get('age', 'Adult')}yo {patient_profile.get('gender', 'patient')}"
            allergy_alert = (
                f"ALERT: Documented allergies to {', '.join(allergies)}."
                if allergies else "No drug allergies recorded in patient profile."
            )
            records_note = (
                f"Retrieved {len(relevant_records_summary)} prior medical document(s): {'; '.join(relevant_records_summary[:2])}."
                if relevant_records_summary else "No historical records attached for this specific complaint."
            )
            food_note = (
                f"Recent 24h intake includes: {'; '.join(recent_food[:2])}."
                if recent_food else "24h dietary history absent."
            )
            
            ollama_summary_text = (
                f"{age_gender} presents with {chief_complaint} lasting {symptom_duration} "
                f"(severity: {intake_data.get('severity_score', 'N/A')}/10). "
                f"Associated patient-reported symptoms include {', '.join(reported_symptoms[:3])}. "
                f"{allergy_alert} {records_note} {food_note} "
                f"Structured for physician physical examination and objective diagnostic evaluation. Autonomous diagnosis or medication withheld."
            )

        structured_output = {
            "chief_complaint": chief_complaint,
            "symptom_duration": symptom_duration,
            "reported_symptoms": reported_symptoms,
            "relevant_medical_history": med_history,
            "allergies": allergies,
            "current_medications": current_meds,
            "recent_food_history": recent_food,
            "relevant_records": relevant_records_summary,
            "missing_information": missing_info,
            "source_references": source_references,
            "summary": ollama_summary_text,
            "urgent_warning": urgent_warning,
            "requires_doctor_verification": True,
            "doctor_reviewed": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }

        return structured_output


ai_summary_engine = AISummaryEngine()
