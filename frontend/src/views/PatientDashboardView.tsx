import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import {
  Calendar,
  Clock,
  FileText,
  Brain,
  Stethoscope,
  Plus,
} from 'lucide-react';

interface PatientDashboardViewProps {
  onBookNew: () => void;
  onNavigateRecords: () => void;
  onNavigateProfile: () => void;
}

export const PatientDashboardView: React.FC<PatientDashboardViewProps> = ({
  onBookNew,
  onNavigateRecords,
  onNavigateProfile,
}) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApptDetails, setSelectedApptDetails] = useState<any | null>(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await api.getMyPatientAppointments();
      setAppointments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openDetails = async (apptId: string) => {
    try {
      const details = await api.getAppointmentDetails(apptId);
      setSelectedApptDetails(details);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelAppointment = async (apptId: string) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled consultation?')) return;
    try {
      await api.updateAppointmentStatus(apptId, 'Cancelled');
      loadAppointments();
      if (selectedApptDetails?.appointment?._id === apptId) {
        setSelectedApptDetails(null);
      }
    } catch (err) {
      alert('Could not cancel appointment.');
    }
  };

  return (
    <div className="container py-4 text-start">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <h2 className="fw-bold brand-editorial text-dark m-0">Patient Portal</h2>
          <p className="text-secondary small m-0">Manage scheduled consultations, pre-intake briefings, and medical notes.</p>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-outline-medical btn-sm" onClick={onNavigateRecords}>
            <FileText size={14} className="me-1" style={{ color: 'var(--nexora-primary)' }} />
            Medical Records
          </button>
          <button className="btn btn-primary-medical btn-sm" onClick={onBookNew}>
            <Plus size={14} className="me-1" />
            Book New Consultation
          </button>
        </div>
      </div>

      <div className="row g-4">
        {/* Appointments List */}
        <div className="col-lg-6">
          <h5 className="fw-bold text-dark mb-3 brand-editorial" style={{ fontSize: 18 }}>
            Your Consultations
          </h5>

          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" style={{ color: 'var(--nexora-primary)' }} role="status"></div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="medical-card p-4 text-center text-secondary bg-white">
              <Calendar size={36} className="mb-2" style={{ color: 'var(--nexora-primary)' }} />
              <h6 className="text-dark">No consultations scheduled yet</h6>
              <p className="small mb-3">Discover nearby Kolhapur hospitals to schedule an appointment.</p>
              <button className="btn btn-primary-medical btn-sm" onClick={onBookNew}>
                Explore Hospitals
              </button>
            </div>
          ) : (
            <div className="d-flex flex-column gap-3">
              {appointments.map((appt) => {
                const isSelected = selectedApptDetails?.appointment?._id === appt._id;
                let badgeClass = 'badge-medical-blue';
                if (appt.status === 'Completed') badgeClass = 'badge-medical-green';
                if (appt.status === 'Cancelled') badgeClass = 'badge-medical-red';
                if (appt.status === 'In consultation') badgeClass = 'badge-medical-amber';

                return (
                  <div
                    key={appt._id}
                    className="medical-card p-3 bg-white"
                    style={{
                      borderColor: isSelected ? 'var(--nexora-primary)' : 'var(--nexora-border)',
                      boxShadow: isSelected ? '0 4px 16px rgba(0, 50, 154, 0.12)' : undefined,
                      cursor: 'pointer',
                    }}
                    onClick={() => openDetails(appt._id)}
                  >
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <div>
                        <h6 className="fw-bold text-dark m-0">{appt.doctor_name}</h6>
                        <div className="small fw-semibold" style={{ color: 'var(--nexora-primary)' }}>{appt.hospital_name}</div>
                      </div>
                      <span className={`badge ${badgeClass}`}>{appt.status}</span>
                    </div>

                    <div className="d-flex align-items-center gap-3 text-secondary small my-2">
                      <div className="d-flex align-items-center gap-1">
                        <Calendar size={13} style={{ color: 'var(--nexora-primary)' }} />
                        <span>{appt.appointment_date}</span>
                      </div>
                      <div className="d-flex align-items-center gap-1">
                        <Clock size={13} style={{ color: 'var(--nexora-primary)' }} />
                        <span>{appt.appointment_time}</span>
                      </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-2">
                      <span className="text-muted" style={{ fontSize: 12 }}>
                        Click to view AI summary & physician notes
                      </span>
                      {appt.status !== 'Cancelled' && appt.status !== 'Completed' && (
                        <button
                          className="btn btn-sm btn-outline-danger py-0 px-2"
                          style={{ fontSize: 12 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelAppointment(appt._id);
                          }}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Consultation Dossier Panel */}
        <div className="col-lg-6">
          <div className="sticky-top" style={{ top: '85px' }}>
            <h5 className="fw-bold text-dark mb-3 brand-editorial" style={{ fontSize: 18 }}>
              Consultation Dossier
            </h5>

            {selectedApptDetails ? (
              <div className="medical-card p-4 bg-white shadow-sm">
                <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                  <div>
                    <h6 className="fw-bold text-dark m-0">{selectedApptDetails.appointment.hospital_name}</h6>
                    <div className="text-secondary small">Doctor: {selectedApptDetails.appointment.doctor_name}</div>
                  </div>
                  <span className="badge badge-medical-blue">{selectedApptDetails.appointment.status}</span>
                </div>

                {/* Submitted Intake */}
                {selectedApptDetails.intake && (
                  <div className="mb-3 p-3 rounded bg-light border" style={{ borderColor: 'var(--nexora-border)' }}>
                    <div className="fw-bold small mb-1" style={{ color: 'var(--nexora-primary)' }}>Patient-Reported Intake:</div>
                    <div className="text-dark small">
                      <strong>Complaint:</strong> {selectedApptDetails.intake.chief_complaint} ({selectedApptDetails.intake.symptom_duration})
                    </div>
                    {selectedApptDetails.intake.recent_food_history && selectedApptDetails.intake.recent_food_history.length > 0 && (
                      <div className="text-secondary small mt-1">
                        <strong>24h Food Diary:</strong> {selectedApptDetails.intake.recent_food_history.join('; ')}
                      </div>
                    )}
                  </div>
                )}

                {/* Pre-Consultation AI Briefing */}
                {selectedApptDetails.ai_summary && (
                  <div className="mb-3 p-3 rounded" style={{ background: 'var(--nexora-primary-light)', border: '1px solid var(--nexora-primary-subtle)' }}>
                    <div className="d-flex align-items-center gap-1 fw-bold small mb-1" style={{ color: 'var(--nexora-primary)' }}>
                      <Brain size={14} />
                      <span>AI Pre-Consultation Clinical Briefing (Section 8 Schema)</span>
                    </div>
                    <p className="text-dark small mb-2 fst-italic">
                      "{selectedApptDetails.ai_summary.summary}"
                    </p>
                    <div className="text-secondary" style={{ fontSize: 12 }}>
                      <strong>Allergies Documented:</strong> {selectedApptDetails.ai_summary.allergies?.join(', ') || 'None'}<br />
                      <strong>Verified Sources:</strong> {selectedApptDetails.ai_summary.source_references?.join(', ')}
                    </div>
                  </div>
                )}

                {/* Post-Consultation Doctor's Notes (if completed) */}
                {selectedApptDetails.consultation_notes && (
                  <div className="p-3 rounded border" style={{ background: '#F0FDF4', borderColor: '#BBF7D0', borderLeft: '4px solid #15803D' }}>
                    <div className="d-flex align-items-center gap-1 text-success fw-bold small mb-2">
                      <Stethoscope size={14} />
                      <span>Physician Examination & Advice</span>
                    </div>
                    <div className="text-dark small mb-1">
                      <strong>Impression:</strong> {selectedApptDetails.consultation_notes.diagnosis_impression}
                    </div>
                    <div className="text-secondary small mb-1">
                      <strong>Observations:</strong> {selectedApptDetails.consultation_notes.clinical_observations}
                    </div>
                    {selectedApptDetails.consultation_notes.prescribed_regimen && (
                      <div className="text-dark small">
                        <strong>Prescribed Regimen:</strong> {selectedApptDetails.consultation_notes.prescribed_regimen}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="medical-card p-5 text-center text-secondary bg-white">
                <Brain size={32} className="mb-2" style={{ color: 'var(--nexora-primary)' }} />
                <p className="small mb-0">Select an appointment on the left to inspect its pre-consultation summary and doctor notes.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
