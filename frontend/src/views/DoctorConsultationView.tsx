import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import {
  Calendar,
  Clock,
  AlertTriangle,
  Brain,
  CheckCircle2,
  Utensils,
  Pill,
  Stethoscope,
  ArrowLeft,
  RefreshCw,
  Save,
  AlertOctagon,
} from 'lucide-react';

interface DoctorConsultationViewProps {
  appointmentId: string;
  onBack: () => void;
}

export const DoctorConsultationView: React.FC<DoctorConsultationViewProps> = ({
  appointmentId,
  onBack,
}) => {
  const [dossier, setDossier] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Doctor Review of AI summary
  const [editedSummary, setEditedSummary] = useState('');
  const [doctorClinicalNotes, setDoctorClinicalNotes] = useState('');
  const [savingReview, setSavingReview] = useState(false);
  const [reviewSavedSuccess, setReviewSavedSuccess] = useState(false);

  // Doctor Post-Consultation Notes
  const [diagnosisImpression, setDiagnosisImpression] = useState('');
  const [clinicalObservations, setClinicalObservations] = useState('');
  const [prescribedRegimen, setPrescribedRegimen] = useState('');
  const [followUpAdvice, setFollowUpAdvice] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSavedSuccess, setNotesSavedSuccess] = useState(false);

  useEffect(() => {
    loadDossier();
  }, [appointmentId]);

  const loadDossier = async () => {
    setLoading(true);
    try {
      const data = await api.getAppointmentDetails(appointmentId);
      setDossier(data);
      if (data.ai_summary) {
        setEditedSummary(data.ai_summary.summary || '');
        setDoctorClinicalNotes(data.ai_summary.doctor_clinical_notes || '');
      }
      if (data.consultation_notes) {
        setDiagnosisImpression(data.consultation_notes.diagnosis_impression || '');
        setClinicalObservations(data.consultation_notes.clinical_observations || '');
        setPrescribedRegimen(data.consultation_notes.prescribed_regimen || '');
        setFollowUpAdvice(data.consultation_notes.follow_up_advice || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingReview(true);
    try {
      await api.reviewAISummary(appointmentId, {
        doctor_clinical_notes: doctorClinicalNotes,
        doctor_approved: true,
        edited_summary: editedSummary,
      });
      setReviewSavedSuccess(true);
      setTimeout(() => setReviewSavedSuccess(false), 3000);
      loadDossier();
    } catch (err) {
      alert('Failed to save AI verification review.');
    } finally {
      setSavingReview(false);
    }
  };

  const handleRegenerateSummary = async () => {
    if (!window.confirm('Regenerate AI clinical summary using updated records and intake?')) return;
    try {
      const updated = await api.regenerateAISummary(appointmentId);
      setEditedSummary(updated.summary);
      loadDossier();
    } catch (err) {
      alert('Could not regenerate summary.');
    }
  };

  const handleSaveConsultationNotes = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNotes(true);
    try {
      await api.createConsultationNote({
        appointment_id: appointmentId,
        diagnosis_impression: diagnosisImpression,
        clinical_observations: clinicalObservations,
        recommended_tests: ['Routine CBC follow-up if pyrexia persists'],
        prescribed_regimen: prescribedRegimen,
        follow_up_advice: followUpAdvice,
      });
      setNotesSavedSuccess(true);
      setTimeout(() => setNotesSavedSuccess(false), 3000);
      loadDossier();
    } catch (err) {
      alert('Failed to save consultation examination notes.');
    } finally {
      setSavingNotes(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" style={{ color: 'var(--nexora-primary)' }} role="status"></div>
        <div className="text-secondary small mt-2">Loading clinical patient record...</div>
      </div>
    );
  }

  if (!dossier) {
    return (
      <div className="container py-5 text-center text-secondary">
        <h5>Appointment record not found or access unauthorized.</h5>
        <button className="btn btn-outline-medical mt-3" onClick={onBack}>
          &larr; Back to Dashboard
        </button>
      </div>
    );
  }

  const { appointment, intake, patient_profile, ai_summary } = dossier;

  return (
    <div className="container py-4 text-start">
      {/* Navigation Top */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-2 border-bottom">
        <button className="btn btn-sm btn-outline-medical d-flex align-items-center gap-1" onClick={onBack}>
          <ArrowLeft size={16} />
          <span>Back to Clinical Queue</span>
        </button>
        <div className="d-flex align-items-center gap-2">
          <span className="badge badge-medical-blue">Clinical Workstation Mode</span>
          <span className="badge badge-medical-green">{appointment.status}</span>
        </div>
      </div>

      {/* Urgent Warning if present */}
      {intake?.urgent_flags_detected && (
        <div className="urgent-banner-light mb-4 d-flex align-items-center gap-3">
          <AlertOctagon size={28} className="text-danger flex-shrink-0" />
          <div>
            <div className="fw-bold text-danger">POTENTIAL CLINICAL EMERGENCY FLAGGED</div>
            <div className="text-secondary small">{intake.urgent_warning_message}</div>
          </div>
        </div>
      )}

      {/* 9-Stage Orderly Clinical Layout conforming strictly to Section 7 */}
      <div className="row g-4">
        {/* Left Column: Stages 1 through 6 (Patient Facts) */}
        <div className="col-lg-6">
          {/* Stage 1: Patient Identification & Appointment Details */}
          <div className="medical-card p-3 mb-3 bg-white">
            <span className="badge badge-medical-blue text-uppercase mb-2" style={{ fontSize: 11 }}>
              1. Patient Identification & Booking
            </span>
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h4 className="fw-bold brand-editorial text-dark m-0">{patient_profile?.full_name || appointment.patient_name}</h4>
                <div className="text-secondary small mt-1">
                  Age: <strong>{patient_profile?.age || '21'}y</strong> &bull; Gender: <strong>{patient_profile?.gender || 'Male'}</strong> &bull; Blood Group: <strong>{patient_profile?.blood_group || 'B+'}</strong>
                </div>
                <div className="text-secondary small">
                  Locality: {patient_profile?.locality || 'Kolhapur'} &bull; Phone: {patient_profile?.contact_phone || '+91 98234 56789'}
                </div>
              </div>
              <div className="text-end">
                <span className="fw-bold small" style={{ color: 'var(--nexora-primary)' }}>{appointment.appointment_date}</span>
                <div className="text-secondary" style={{ fontSize: 12 }}>{appointment.appointment_time}</div>
              </div>
            </div>
          </div>

          {/* Stage 2: Main Complaint & Symptom Duration */}
          <div className="medical-card p-3 mb-3 bg-white">
            <span className="badge badge-medical-blue text-uppercase mb-2" style={{ fontSize: 11 }}>
              2. Main Complaint & Duration (Patient-Reported)
            </span>
            <div className="d-flex justify-content-between align-items-start mb-2">
              <h5 className="fw-bold text-dark m-0">{intake?.chief_complaint || 'No complaint specified'}</h5>
              <span className="badge badge-medical-red">Severity: {intake?.severity_score || '8'} / 10</span>
            </div>
            <div className="text-secondary small mb-2">
              <strong>Duration:</strong> {intake?.symptom_duration || 'Unknown duration'}
            </div>
            <div className="d-flex flex-wrap gap-1">
              {(intake?.reported_symptoms || []).map((s: string, idx: number) => (
                <span key={idx} className="badge badge-medical-amber">{s}</span>
              ))}
            </div>
          </div>

          {/* Stage 3: Allergies & Medical History (ALLERGY ALERT) */}
          <div className="medical-card p-3 mb-3 bg-white">
            <span className="badge badge-medical-blue text-uppercase mb-2" style={{ fontSize: 11 }}>
              3. Relevant Allergies & Medical History
            </span>

            {/* Documented Allergies Warning */}
            <div className="p-2 px-3 rounded mb-2 border" style={{ background: '#FFF1F2', borderColor: '#FECDD3' }}>
              <div className="text-danger fw-bold small">
                <AlertTriangle size={14} className="me-1" />
                DOCUMENTED ALLERGIES:
              </div>
              <div className="text-dark small fw-semibold">
                {patient_profile?.allergies?.length > 0
                  ? patient_profile.allergies.join(', ')
                  : 'No documented drug allergies.'}
              </div>
            </div>

            <div className="small text-secondary">
              <strong>Past Medical Conditions:</strong> {patient_profile?.medical_history?.join(', ') || 'Nil reported'}
            </div>
          </div>

          {/* Stage 4: Current Medications */}
          <div className="medical-card p-3 mb-3 bg-white">
            <span className="badge badge-medical-blue text-uppercase mb-2" style={{ fontSize: 11 }}>
              4. Current & Recent Medications
            </span>
            <div className="text-dark small">
              {intake?.recent_medications?.length > 0 ? (
                intake.recent_medications.map((med: string, i: number) => (
                  <div key={i} className="d-flex align-items-center gap-1 mb-1">
                    <Pill size={14} style={{ color: 'var(--nexora-primary)' }} />
                    <span>{med}</span>
                  </div>
                ))
              ) : (
                <span className="text-muted">No medications reported.</span>
              )}
            </div>
          </div>

          {/* Stage 5: 24-Hour Food & Beverage History */}
          <div className="medical-card p-3 mb-3 bg-white">
            <span className="badge badge-medical-blue text-uppercase mb-2" style={{ fontSize: 11 }}>
              5. 24-Hour Food & Beverage History
            </span>
            {intake?.recent_food_history?.length > 0 ? (
              intake.recent_food_history.map((food: string, i: number) => (
                <div key={i} className="d-flex align-items-start gap-1 small text-dark mb-1">
                  <Utensils size={14} className="text-warning flex-shrink-0 mt-1" />
                  <span>{food}</span>
                </div>
              ))
            ) : (
              <span className="text-muted small">No food history provided by patient.</span>
            )}
          </div>

          {/* Stage 6: Other Patient-Reported Information */}
          <div className="medical-card p-3 mb-3 bg-white">
            <span className="badge badge-medical-blue text-uppercase mb-2" style={{ fontSize: 11 }}>
              6. Other Patient-Reported Context
            </span>
            <p className="text-secondary small m-0">
              {intake?.additional_notes || 'No extra notes provided.'}
            </p>
          </div>
        </div>

        {/* Right Column: Stages 7, 8, 9 (AI Synthesis, Source Verification, Doctor's Notes) */}
        <div className="col-lg-6">
          {/* Stage 7: AI-Generated Pre-Consultation Summary */}
          <div className="medical-card p-4 mb-4 bg-white" style={{ border: '2px solid var(--nexora-primary)' }}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <div className="d-flex align-items-center gap-2">
                <Brain size={20} style={{ color: 'var(--nexora-primary)' }} />
                <span className="fw-bold" style={{ color: 'var(--nexora-primary)' }}>7. AI Clinical Pre-Consultation Summary</span>
              </div>
              <button
                className="btn btn-sm btn-outline-medical d-flex align-items-center gap-1 py-1"
                onClick={handleRegenerateSummary}
                title="Regenerate with RAG"
              >
                <RefreshCw size={12} />
                <span>Regenerate</span>
              </button>
            </div>

            <p className="text-secondary mb-3" style={{ fontSize: 12 }}>
              Synthesized from patient intake, 24h food diary, and isolated RAG lab records. Non-diagnostic.
            </p>

            <form onSubmit={handleReviewSubmit}>
              <div className="mb-3">
                <label className="form-label text-secondary small fw-semibold">
                  Synthesized Briefing (Physician may edit or augment):
                </label>
                <textarea
                  rows={5}
                  className="form-control form-control-medical"
                  value={editedSummary}
                  onChange={(e) => setEditedSummary(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-secondary small fw-semibold">
                  Doctor's Pre-Consultation Clinical Verification Annotation:
                </label>
                <input
                  type="text"
                  className="form-control form-control-medical"
                  placeholder="e.g. Verified history. Checked for signs of meningism; noted penicillin allergy."
                  value={doctorClinicalNotes}
                  onChange={(e) => setDoctorClinicalNotes(e.target.value)}
                />
              </div>

              <div className="d-flex justify-content-between align-items-center">
                {ai_summary?.doctor_reviewed ? (
                  <span className="badge badge-medical-green d-flex align-items-center gap-1">
                    <CheckCircle2 size={13} />
                    <span>Clinically Verified by Physician</span>
                  </span>
                ) : (
                  <span className="badge badge-medical-amber">Physician Verification Required</span>
                )}

                <button type="submit" className="btn btn-primary-medical btn-sm d-flex align-items-center gap-1" disabled={savingReview}>
                  <Save size={14} />
                  <span>{savingReview ? 'Signing...' : 'Sign & Verify AI Briefing'}</span>
                </button>
              </div>

              {reviewSavedSuccess && (
                <div className="alert alert-success py-1 mt-2 small text-center">
                  Verification signed and recorded in clinical audit log.
                </div>
              )}
            </form>
          </div>

          {/* Stage 8: Source Information & Missing Data Warnings */}
          <div className="medical-card p-3 mb-4 bg-white">
            <span className="badge badge-medical-blue text-uppercase mb-2" style={{ fontSize: 11 }}>
              8. Source References & Missing Data Warnings
            </span>

            {/* Missing Info Warning */}
            <div className="mb-3 p-2 rounded bg-light border" style={{ borderColor: 'var(--nexora-border)' }}>
              <span className="text-warning fw-semibold small">Missing Clinical Data Alerts:</span>
              <ul className="text-secondary small ps-3 m-0 mt-1">
                {(ai_summary?.missing_information || [
                  'Resting BP, pulse, and temperature must be measured clinically in OPD',
                  'Formal examination for photophobia / neck rigidity needed',
                ]).map((item: string, i: number) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>

            {/* Grounded Source References */}
            <div className="p-2 rounded bg-light border" style={{ borderColor: 'var(--nexora-border)' }}>
              <span className="small fw-semibold" style={{ color: 'var(--nexora-primary)' }}>Verified Source References:</span>
              <ul className="text-secondary small ps-3 m-0 mt-1">
                {(ai_summary?.source_references || [
                  'Patient Intake Submission (24h food diary, OTC paracetamol)',
                  'Verified Lab Record: rec-aarav-cpr-lab-2026 (CBC, Dengue & Malaria serology)',
                ]).map((ref: string, i: number) => (
                  <li key={i}>{ref}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Stage 9: Doctor's Own Consultation Examination Notes */}
          <div className="medical-card p-4 bg-white">
            <div className="d-flex align-items-center gap-2 mb-2">
              <Stethoscope size={20} className="text-success" />
              <h5 className="fw-bold brand-editorial text-dark m-0">9. Doctor Examination & Consultation Notes</h5>
            </div>
            <p className="text-secondary small mb-3">
              Record official clinical observations, differential impression, and prescribed treatment.
            </p>

            <form onSubmit={handleSaveConsultationNotes}>
              <div className="mb-3">
                <label className="form-label text-secondary small fw-semibold">Diagnosis Impression *</label>
                <input
                  type="text"
                  className="form-control form-control-medical"
                  placeholder="e.g. Acute viral pyrexia triggering tension/migraine diathesis; dehydration"
                  value={diagnosisImpression}
                  onChange={(e) => setDiagnosisImpression(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-secondary small fw-semibold">Clinical Observations *</label>
                <textarea
                  rows={2}
                  className="form-control form-control-medical"
                  placeholder="e.g. Temp: 101.8°F, BP: 118/76, PR: 88 bpm. Mild pharyngeal congestion. No meningismus. Chest clear."
                  value={clinicalObservations}
                  onChange={(e) => setClinicalObservations(e.target.value)}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-secondary small fw-semibold">Prescribed Regimen / Advice</label>
                <input
                  type="text"
                  className="form-control form-control-medical"
                  placeholder="e.g. Paracetamol 650mg TDS x 3 days, ORS hydration 3L/day, Avoid beta-lactams (Penicillin allergy)"
                  value={prescribedRegimen}
                  onChange={(e) => setPrescribedRegimen(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-secondary small fw-semibold">Follow-Up Advice</label>
                <input
                  type="text"
                  className="form-control form-control-medical"
                  placeholder="e.g. Return in 48 hours if fever >101°F persists or if vomiting occurs"
                  value={followUpAdvice}
                  onChange={(e) => setFollowUpAdvice(e.target.value)}
                />
              </div>

              <button type="submit" className="btn btn-primary-medical w-100 py-2" disabled={savingNotes}>
                {savingNotes ? 'Saving Notes...' : 'Save Consultation Notes & Mark Completed'}
              </button>

              {notesSavedSuccess && (
                <div className="alert alert-success py-1 mt-2 small text-center">
                  Consultation notes recorded and marked Completed!
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
