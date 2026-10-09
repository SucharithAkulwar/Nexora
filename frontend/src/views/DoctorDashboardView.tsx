import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import {
  Calendar,
  User,
  AlertTriangle,
  Brain,
  CheckCircle2,
  ChevronRight,
  Stethoscope,
  Building2,
  Users,
  Info,
  FileText,
  Clock,
  ShieldAlert,
} from 'lucide-react';

interface DoctorDashboardViewProps {
  onOpenConsultation: (appointmentId: string) => void;
}

export const DoctorDashboardView: React.FC<DoctorDashboardViewProps> = ({
  onOpenConsultation,
}) => {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'today' | 'pending_review' | 'patients'>('all');
  const [showWorkflowGuide, setShowWorkflowGuide] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [apptsData, profData, patientsData] = await Promise.all([
        api.getMyDoctorAppointments().catch(() => []),
        api.getMyDoctorProfile().catch(() => null),
        api.getMyPatients().catch(() => []),
      ]);
      setAppointments(apptsData);
      setProfile(profData);
      setPatients(patientsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = async () => {
    try {
      const [apptsData, patientsData] = await Promise.all([
        api.getMyDoctorAppointments().catch(() => []),
        api.getMyPatients().catch(() => []),
      ]);
      setAppointments(apptsData);
      setPatients(patientsData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStatusChange = async (apptId: string, newStatus: string) => {
    try {
      await api.updateAppointmentStatus(apptId, newStatus);
      loadAppointments();
    } catch (err) {
      alert('Could not update appointment status.');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const filteredAppointments = appointments.filter((a) => {
    if (filter === 'today') return a.appointment_date === todayStr;
    if (filter === 'pending_review') return !a.doctor_reviewed;
    return true;
  });

  return (
    <div className="container py-4 text-start">
      {/* Top Bar */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge badge-medical-blue">Physician Station</span>
            <span className="text-secondary small">&bull; Kolhapur Clinical Queue</span>
          </div>
          <h2 className="fw-bold brand-editorial text-dark m-0">Physician Clinical Workstation</h2>
          <p className="text-secondary small m-0">
            Review patient symptom intakes, verify AI clinical briefings, and file consultation examination notes.
          </p>
        </div>

        {/* Quick Filter Tabs */}
        <div className="btn-group btn-group-sm p-1 rounded bg-white border" style={{ borderColor: 'var(--nexora-border)' }}>
          <button
            className={`btn btn-sm ${filter === 'all' ? 'btn-primary-medical' : 'btn-light text-secondary'}`}
            onClick={() => setFilter('all')}
          >
            All Scheduled ({appointments.length})
          </button>
          <button
            className={`btn btn-sm ${filter === 'today' ? 'btn-primary-medical' : 'btn-light text-secondary'}`}
            onClick={() => setFilter('today')}
          >
            Today's Queue
          </button>
          <button
            className={`btn btn-sm ${filter === 'pending_review' ? 'btn-primary-medical' : 'btn-light text-secondary'}`}
            onClick={() => setFilter('pending_review')}
          >
            Pending Verification
          </button>
          <button
            className={`btn btn-sm ${filter === 'patients' ? 'btn-primary-medical' : 'btn-light text-secondary'}`}
            onClick={() => setFilter('patients')}
          >
            <Users size={13} className="me-1 inline" />
            My Patients ({patients.length})
          </button>
        </div>
      </div>

      {/* Doctor Affiliation Banner */}
      {profile && (
        <div className="medical-card p-3 mb-4 bg-white shadow-sm border-start border-4 border-primary">
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
            <div className="d-flex align-items-center gap-3">
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  background: 'var(--nexora-primary-light)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--nexora-primary)',
                }}
              >
                <Stethoscope size={24} />
              </div>
              <div>
                <h5 className="fw-bold text-dark m-0">{profile.full_name}</h5>
                <div className="text-secondary small d-flex align-items-center gap-2 flex-wrap">
                  <span className="fw-semibold text-dark">{profile.specialty}</span>
                  <span>&bull;</span>
                  <span className="d-flex align-items-center gap-1">
                    <Building2 size={13} style={{ color: 'var(--nexora-primary)' }} />
                    <strong>{profile.hospital_name}</strong> {profile.locality ? `(${profile.locality})` : ''}
                  </span>
                  <span>&bull;</span>
                  <span>Fee: &#8377;{profile.consultation_fee_inr}</span>
                  <span>&bull;</span>
                  <span>{profile.qualifications}</span>
                </div>
              </div>
            </div>
            <button
              className="btn btn-sm btn-outline-medical d-flex align-items-center gap-1"
              onClick={() => setShowWorkflowGuide(!showWorkflowGuide)}
            >
              <Info size={14} />
              <span>{showWorkflowGuide ? 'Hide Intake Guide' : 'How Doctor Gets Patients'}</span>
            </button>
          </div>

          {showWorkflowGuide && (
            <div className="mt-3 pt-3 border-top">
              <h6 className="fw-bold text-dark mb-2 brand-editorial">How You Receive & Understand Your Patients in Nexora:</h6>
              <div className="row g-3">
                <div className="col-md-4">
                  <div className="p-3 rounded bg-light border h-100" style={{ borderColor: 'var(--nexora-border)' }}>
                    <div className="fw-bold small text-dark d-flex align-items-center gap-1 mb-1">
                      <Building2 size={14} className="text-primary" />
                      <span>1. Hospital Discovery Booking</span>
                    </div>
                    <p className="text-secondary mb-0" style={{ fontSize: 12 }}>
                      Patients discovering <strong>{profile.hospital_name}</strong> on the Kolhapur hospital directory select your OPD schedule to reserve an appointment.
                    </p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="p-3 rounded bg-light border h-100" style={{ borderColor: 'var(--nexora-border)' }}>
                    <div className="fw-bold small text-dark d-flex align-items-center gap-1 mb-1">
                      <FileText size={14} className="text-primary" />
                      <span>2. Structured Symptom Intake</span>
                    </div>
                    <p className="text-secondary mb-0" style={{ fontSize: 12 }}>
                      During booking, patients submit their chief complaint, symptom duration, 1-10 severity score, recent medications, and a 24-hour food/drink diary.
                    </p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="p-3 rounded bg-light border h-100" style={{ borderColor: 'var(--nexora-border)' }}>
                    <div className="fw-bold small text-dark d-flex align-items-center gap-1 mb-1">
                      <Brain size={14} className="text-primary" />
                      <span>3. Patient-Isolated AI Dossier</span>
                    </div>
                    <p className="text-secondary mb-0" style={{ fontSize: 12 }}>
                      Nexora generates an AI briefing, flags emergency red flags, and displays known allergies. You verify the findings and file post-consultation notes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: 'var(--nexora-primary)' }} role="status"></div>
          <div className="text-secondary small mt-2">Loading clinical records...</div>
        </div>
      ) : filter === 'patients' ? (
        /* My Patients Roster View */
        patients.length === 0 ? (
          <div className="medical-card p-5 text-center text-secondary bg-white">
            <Users size={36} className="mb-2" style={{ color: 'var(--nexora-primary)' }} />
            <h5 className="text-dark">No Patients Registered Under Your Care Yet</h5>
            <p className="small mb-0">
              Patients who book appointments with you at <strong>{profile?.hospital_name || 'your affiliated hospital'}</strong> will appear in this roster with full consultation histories.
            </p>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {patients.map((p) => (
              <div
                key={p.patient_id}
                className="medical-card p-3 text-start bg-white shadow-sm"
              >
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 8,
                        background: 'var(--nexora-primary-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--nexora-primary)',
                        fontWeight: 'bold',
                      }}
                    >
                      <User size={22} />
                    </div>
                    <div>
                      <h5 className="fw-bold text-dark m-0" style={{ fontSize: 16 }}>{p.patient_name}</h5>
                      <span className="text-secondary small">
                        Patient ID: <code style={{ fontSize: 11 }}>{p.patient_id}</code> &bull; Total Consultations: <strong>{p.total_appointments}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <span className="badge badge-medical-blue">{p.latest_status || 'Scheduled'}</span>
                    <button
                      className="btn btn-sm btn-primary-medical d-flex align-items-center gap-1"
                      onClick={() => onOpenConsultation(p.latest_appointment_id)}
                    >
                      <span>Open Patient Dossier</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Patient Summary Details */}
                <div
                  className="p-2 px-3 rounded mb-2 d-flex justify-content-between align-items-center flex-wrap gap-2 bg-light border"
                  style={{ borderColor: 'var(--nexora-border)' }}
                >
                  <div className="small text-dark">
                    <strong>Recent Complaint:</strong> {p.chief_complaint || 'General Checkup'}
                    <span className="text-secondary ms-2">
                      (Last visited: {p.latest_appointment_date} at {p.latest_appointment_time})
                    </span>
                  </div>

                  {p.urgent_flags_detected && (
                    <span className="badge badge-medical-red d-flex align-items-center gap-1">
                      <AlertTriangle size={12} />
                      <span>Urgent Care Red Flag</span>
                    </span>
                  )}
                </div>

                {/* Allergies / Medical History Tags */}
                <div className="d-flex align-items-center gap-2 flex-wrap pt-1">
                  <span className="text-secondary small">Known Allergies:</span>
                  {p.allergies && p.allergies.length > 0 ? (
                    p.allergies.map((allg: string, idx: number) => (
                      <span key={idx} className="badge badge-medical-red" style={{ fontSize: 11 }}>
                        Allergy: {allg}
                      </span>
                    ))
                  ) : (
                    <span className="badge bg-light text-secondary border" style={{ fontSize: 11 }}>
                      No adverse drug reactions reported
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )
      ) : filteredAppointments.length === 0 ? (
        <div className="medical-card p-5 text-center text-secondary bg-white">
          <Calendar size={36} className="mb-2" style={{ color: 'var(--nexora-primary)' }} />
          <h5 className="text-dark">No appointments found under this filter</h5>
          <p className="small mb-0">Patient bookings will appear here in real time.</p>
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {filteredAppointments.map((appt) => {
            let statusBadge = 'badge-medical-blue';
            if (appt.status === 'Completed') statusBadge = 'badge-medical-green';
            if (appt.status === 'In consultation') statusBadge = 'badge-medical-amber';
            if (appt.status === 'Cancelled') statusBadge = 'badge-medical-red';

            return (
              <div
                key={appt._id}
                className="medical-card p-3 text-start bg-white shadow-sm"
                style={{ cursor: 'pointer', transition: 'all 0.15s ease' }}
                onClick={() => onOpenConsultation(appt._id)}
              >
                <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 8,
                        background: 'var(--nexora-primary-light)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--nexora-primary)',
                        fontWeight: 'bold',
                      }}
                    >
                      <User size={22} />
                    </div>
                    <div>
                      <h5 className="fw-bold text-dark m-0" style={{ fontSize: 16 }}>{appt.patient_name}</h5>
                      <span className="text-secondary small">
                        Slot: <strong>{appt.appointment_date}</strong> at <strong>{appt.appointment_time}</strong> &bull; {appt.hospital_name}
                      </span>
                    </div>
                  </div>

                  <div className="d-flex align-items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <select
                      className="form-select form-select-sm form-select-medical py-1"
                      style={{ width: 'auto', fontSize: 13 }}
                      value={appt.status}
                      onChange={(e) => handleStatusChange(appt._id, e.target.value)}
                    >
                      <option value="Confirmed">Confirmed</option>
                      <option value="Checked in">Checked in</option>
                      <option value="In consultation">In consultation</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>

                    <span className={`badge ${statusBadge}`}>{appt.status}</span>
                  </div>
                </div>

                {/* Patient Complaint & Urgent Flag */}
                <div
                  className="p-2 px-3 rounded mb-2 d-flex justify-content-between align-items-center flex-wrap gap-2 bg-light border"
                  style={{ borderColor: 'var(--nexora-border)' }}
                >
                  <div className="small text-dark">
                    <strong>Complaint:</strong> {appt.chief_complaint || appt.reason || 'Routine consultation'}
                    {appt.symptom_duration && <span className="text-secondary"> ({appt.symptom_duration})</span>}
                  </div>

                  {appt.urgent_flags_detected && (
                    <span className="badge badge-medical-red d-flex align-items-center gap-1">
                      <AlertTriangle size={12} />
                      <span>Urgent Care Red Flag</span>
                    </span>
                  )}
                </div>

                {/* Pre-Consultation Summary Status */}
                <div className="d-flex justify-content-between align-items-center pt-2 border-top mt-2">
                  <div className="d-flex align-items-center gap-2">
                    {appt.ai_summary_available ? (
                      <span className="badge badge-medical-blue d-flex align-items-center gap-1">
                        <Brain size={12} />
                        <span>AI Briefing Ready</span>
                      </span>
                    ) : (
                      <span className="text-secondary small">Intake submitted</span>
                    )}

                    {appt.doctor_reviewed ? (
                      <span className="badge badge-medical-green d-flex align-items-center gap-1">
                        <CheckCircle2 size={12} />
                        <span>Physician Verified</span>
                      </span>
                    ) : (
                      <span className="badge badge-medical-amber">Pending Verification</span>
                    )}
                  </div>

                  <button
                    className="btn btn-sm btn-primary-medical d-flex align-items-center gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenConsultation(appt._id);
                    }}
                  >
                    <span>Open Patient Dossier</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
