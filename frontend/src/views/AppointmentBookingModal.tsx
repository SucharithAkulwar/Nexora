import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { api, getStoredSession, setStoredSession, UserSession } from '../api/client';
import {
  X,
  Calendar,
  Clock,
  Utensils,
  Pill,
  ShieldAlert,
  CheckCircle2,
  User,
  Lock,
  Mail,
  FileText,
  Stethoscope,
  IndianRupee,
  Award,
} from 'lucide-react';

interface AppointmentBookingModalProps {
  hospital: any;
  doctor: any;
  onClose: () => void;
  onBookingSuccess: () => void;
  onSessionUpdate?: (session: UserSession) => void;
}

export const AppointmentBookingModal: React.FC<AppointmentBookingModalProps> = ({
  hospital,
  doctor,
  onClose,
  onBookingSuccess,
  onSessionUpdate,
}) => {
  const [step, setStep] = useState<1 | 2>(1); // Step 1: Slot, Step 2: Intake Form

  // Check stored session
  const [currentSession, setCurrentSession] = useState<UserSession | null>(() => getStoredSession());

  // Doctor Selection State (pulled live from registered doctors table)
  const [availableDoctors, setAvailableDoctors] = useState<any[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState<boolean>(true);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(doctor || null);

  // Fetch live registered doctors for this hospital
  useEffect(() => {
    let isMounted = true;
    const fetchLiveDoctors = async () => {
      setLoadingDoctors(true);
      try {
        const hospId = hospital.id || hospital._id;
        const docs = await api.listDoctors({ hospital_id: hospId });
        if (!isMounted) return;
        if (docs && docs.length > 0) {
          setAvailableDoctors(docs);
          const initialId = doctor?.user_id || doctor?._id || doctor?.id;
          const matched = initialId
            ? docs.find((d: any) => d.user_id === initialId || d._id === initialId)
            : null;
          setSelectedDoctor(matched || docs[0]);
        } else {
          // Attending OPD consultant fallback
          const dutyDoc = {
            user_id: 'attending-consultant',
            full_name: 'Attending OPD Consultant',
            specialty: 'General OPD & Internal Medicine',
            qualifications: 'MBBS, MD (Medicine)',
            experience_years: 8,
            consultation_fee_inr: 250,
            available_time_slots: ['09:30 AM', '10:30 AM', '04:00 PM', '05:30 PM'],
          };
          setAvailableDoctors([dutyDoc]);
          setSelectedDoctor(dutyDoc);
        }
      } catch (err) {
        console.error('Failed to load registered doctors:', err);
        const dutyDoc = {
          user_id: 'attending-consultant',
          full_name: 'Attending OPD Consultant',
          specialty: 'General OPD & Internal Medicine',
          qualifications: 'MBBS, MD (Medicine)',
          experience_years: 8,
          consultation_fee_inr: 250,
          available_time_slots: ['09:30 AM', '10:30 AM', '04:00 PM', '05:30 PM'],
        };
        setAvailableDoctors([dutyDoc]);
        setSelectedDoctor(dutyDoc);
      } finally {
        if (isMounted) setLoadingDoctors(false);
      }
    };
    fetchLiveDoctors();
    return () => {
      isMounted = false;
    };
  }, [hospital, doctor]);

  // Slot State
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });
  const [selectedTime, setSelectedTime] = useState(
    doctor?.available_time_slots?.[0] || '10:00 AM'
  );

  // Sync selected time with doctor's slots
  useEffect(() => {
    if (selectedDoctor?.available_time_slots?.length > 0) {
      if (!selectedDoctor.available_time_slots.includes(selectedTime)) {
        setSelectedTime(selectedDoctor.available_time_slots[0]);
      }
    }
  }, [selectedDoctor]);

  // Intake Form State
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [duration, setDuration] = useState('');
  const [severityScore, setSeverityScore] = useState(5);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [foodHistory, setFoodHistory] = useState('');
  const [medications, setMedications] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Guest Registration / Sign-in state (if not logged in)
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [guestFullName, setGuestFullName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPassword, setGuestPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [urgentWarning, setUrgentWarning] = useState<string | null>(null);

  // Real-time urgent triage warning detector
  const checkUrgentFlags = (text: string) => {
    const lower = text.toLowerCase();
    if (
      lower.includes('chest pain') ||
      lower.includes('shortness of breath') ||
      lower.includes('slurred speech') ||
      lower.includes('stiff neck') ||
      lower.includes('bleeding')
    ) {
      setUrgentWarning(
        'POTENTIAL CLINICAL EMERGENCY: Severe symptoms reported. If life-threatening distress is present, call 108 or proceed directly to CPR Casualty Ward rather than waiting for a scheduled appointment.'
      );
    } else {
      setUrgentWarning(null);
    }
  };

  const handleComplaintChange = (val: string) => {
    setChiefComplaint(val);
    checkUrgentFlags(val);
  };

  const toggleSymptom = (sym: string) => {
    if (selectedSymptoms.includes(sym)) {
      setSelectedSymptoms(selectedSymptoms.filter((s) => s !== sym));
    } else {
      setSelectedSymptoms([...selectedSymptoms, sym]);
    }
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let activeSession = currentSession;

      // 1. If not logged in, perform instant patient registration or login
      if (!activeSession || activeSession.role !== 'patient') {
        if (!guestEmail.trim() || !guestPassword.trim()) {
          throw new Error('Please enter your email and password to book your consultation.');
        }

        if (authMode === 'register') {
          if (!guestFullName.trim()) {
            throw new Error('Please enter your full name for the medical consultation record.');
          }
          const resSession = await api.register({
            full_name: guestFullName.trim(),
            email: guestEmail.trim().toLowerCase(),
            password: guestPassword,
            role: 'patient',
          });
          activeSession = resSession;
        } else {
          const resSession = await api.login(
            guestEmail.trim().toLowerCase(),
            guestPassword
          );
          activeSession = resSession;
        }

        setStoredSession(activeSession);
        setCurrentSession(activeSession);
        if (onSessionUpdate) {
          onSessionUpdate(activeSession);
        }
      }

      // 2. Prepare payload with verified doctor unique ID
      const docUserId = selectedDoctor?.user_id || selectedDoctor?._id || 'attending-consultant';
      const docFullName = selectedDoctor?.full_name || 'Attending OPD Consultant';
      const payload = {
        hospital_id: hospital.id || hospital._id,
        hospital_name: hospital.name,
        doctor_id: docUserId,
        doctor_name: docFullName,
        appointment_date: selectedDate,
        appointment_time: selectedTime,
        intake: {
          chief_complaint: chiefComplaint.trim(),
          symptom_duration: duration.trim(),
          severity_score: severityScore,
          reported_symptoms: selectedSymptoms,
          associated_symptoms: ['Fatigue'],
          recent_food_history: foodHistory ? foodHistory.split('\n').filter(Boolean) : [],
          recent_medications: medications ? medications.split('\n').filter(Boolean) : [],
          additional_notes: additionalNotes.trim(),
        },
      };

      await api.bookAppointment(payload);

      // Trigger celebration Confetti
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#00329A', '#2563EB', '#15803D'],
        });
      } catch {}

      onBookingSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Booking could not be finalized. Please check your information and try again.');
    } finally {
      setLoading(false);
    }
  };

  const symptomOptions = [
    'High grade fever with chills',
    'Throbbing migraine',
    'Photophobia',
    'Nausea or vomiting',
    'Asthenia / Severe fatigue',
    'Sore throat',
    'Body ache / Myalgia',
    'Stomach cramps',
  ];

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1060,
      }}
    >
      <div
        className="modal-dialog modal-dialog-centered modal-lg"
        style={{
          maxWidth: 740,
          margin: '1.5rem auto',
          height: 'calc(100vh - 3rem)',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <div
          className="modal-content text-dark border-0 bg-white shadow-2xl d-flex flex-column"
          style={{
            borderRadius: 16,
            maxHeight: '100%',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          {/* 1. FIXED HEADER */}
          <div
            className="modal-header px-4 py-3 border-bottom d-flex justify-content-between align-items-center flex-shrink-0 bg-white"
            style={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
          >
            <div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <span className="badge badge-medical-blue">
                  Step {step} of 2 &bull; {step === 1 ? 'Physician & Slot Selection' : 'Pre-Appointment Clinical Intake'}
                </span>
              </div>
              <h4 className="fw-bold brand-editorial text-dark m-0">
                Consultation at {hospital.name}
              </h4>
              <div className="text-secondary small mt-1">
                Physician:{' '}
                <strong className="text-dark">
                  {selectedDoctor?.full_name || 'Selecting physician...'}
                </strong>{' '}
                {selectedDoctor?.specialty ? `(${selectedDoctor.specialty})` : ''} &bull; Fee:{' '}
                &#8377;{selectedDoctor?.consultation_fee_inr || 250}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary p-1 rounded-circle d-flex align-items-center justify-content-center"
              onClick={onClose}
              style={{ width: 34, height: 34 }}
              title="Close modal"
            >
              <X size={18} />
            </button>
          </div>

          {/* 2. SCROLLABLE BODY */}
          <div
            className="modal-body px-4 py-3 flex-grow-1"
            style={{
              overflowY: 'auto',
              overscrollBehavior: 'contain',
            }}
          >
            {urgentWarning && (
              <div className="urgent-banner-light mb-3 d-flex align-items-center gap-2 p-3 rounded bg-danger-subtle border border-danger">
                <ShieldAlert size={22} className="text-danger flex-shrink-0" />
                <div className="small text-danger fw-semibold">{urgentWarning}</div>
              </div>
            )}

            {error && (
              <div className="alert alert-danger py-2 small mb-3 d-flex align-items-center gap-2">
                <ShieldAlert size={16} className="flex-shrink-0" />
                <div>{error}</div>
              </div>
            )}

            {step === 1 ? (
              /* STEP 1: Doctor, Date and Time Selection */
              <div className="text-start">
                {/* Physician Selection */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label text-secondary small fw-semibold m-0">
                      <Stethoscope size={14} className="me-1 inline" style={{ color: 'var(--nexora-primary)' }} />
                      Select Registered Physician at {hospital.name}
                    </label>
                    <span className="badge badge-medical-blue">
                      {availableDoctors.length} Registered Doctor{availableDoctors.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {loadingDoctors ? (
                    <div className="p-3 text-center text-secondary small border rounded bg-light">
                      Loading registered physicians from database...
                    </div>
                  ) : (
                    <div className="d-flex flex-column gap-2 mb-3">
                      {availableDoctors.map((doc: any) => {
                        const docId = doc.user_id || doc._id;
                        const isSelected = selectedDoctor && (selectedDoctor.user_id === docId || selectedDoctor._id === docId);
                        return (
                          <div
                            key={docId}
                            className={`p-3 rounded border text-start transition-all ${
                              isSelected ? 'bg-primary-subtle border-primary shadow-sm' : 'bg-white border-light-subtle'
                            }`}
                            style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                            onClick={() => setSelectedDoctor(doc)}
                          >
                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                              <div>
                                <div className="d-flex align-items-center gap-2">
                                  <span className="fw-bold text-dark fs-6">{doc.full_name}</span>
                                  {isSelected && (
                                    <span className="badge bg-primary text-white" style={{ fontSize: 11 }}>
                                      Selected
                                    </span>
                                  )}
                                </div>
                                <div className="text-secondary small mt-0.5">
                                  <strong>{doc.specialty}</strong> &bull; {doc.qualifications || 'MBBS'} &bull; {doc.experience_years || 5} yrs exp.
                                </div>
                              </div>
                              <div className="text-end">
                                <div className="fw-bold text-dark" style={{ fontSize: 15 }}>
                                  &#8377;{doc.consultation_fee_inr || 250}
                                </div>
                                <div className="text-secondary" style={{ fontSize: 11 }}>
                                  Consultation Fee
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label text-secondary small fw-semibold">
                    <Calendar size={14} className="me-1" style={{ color: 'var(--nexora-primary)' }} />
                    Select Consultation Date
                  </label>
                  <input
                    type="date"
                    className="form-control form-control-medical"
                    value={selectedDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label text-secondary small fw-semibold d-block mb-2">
                    <Clock size={14} className="me-1" style={{ color: 'var(--nexora-primary)' }} />
                    Select Available Time Slot
                  </label>
                  <div className="d-flex flex-wrap gap-2">
                    {(selectedDoctor?.available_time_slots || ['09:30 AM', '10:30 AM', '04:00 PM', '05:30 PM']).map(
                      (slot: string) => {
                        const isSelected = selectedTime === slot;
                        return (
                          <button
                            key={slot}
                            type="button"
                            className={`btn btn-sm ${
                              isSelected ? 'btn-primary-medical' : 'btn-outline-medical'
                            }`}
                            onClick={() => setSelectedTime(slot)}
                          >
                            {slot}
                          </button>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* STEP 2: Pre-Appointment Symptom Intake Form */
              <form id="booking-intake-form" onSubmit={handleSubmitBooking} className="text-start">
                {/* Patient Session Status */}
                {currentSession && currentSession.role === 'patient' ? (
                  <div className="p-3 mb-3 rounded bg-primary-subtle border border-primary-subtle d-flex align-items-center gap-2 text-dark small">
                    <CheckCircle2 size={18} className="text-primary flex-shrink-0" />
                    <div>
                      Booking for logged-in patient:{' '}
                      <strong className="text-primary">{currentSession.full_name}</strong> ({currentSession.email})
                    </div>
                  </div>
                ) : (
                  <div className="p-3 mb-3 rounded bg-light border border-secondary-subtle">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="fw-bold small text-dark d-flex align-items-center gap-1">
                        <User size={14} style={{ color: 'var(--nexora-primary)' }} />
                        {authMode === 'register' ? 'Patient Identification (Instant Registration)' : 'Sign In as Patient'}
                      </div>
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 text-decoration-none"
                        style={{ fontSize: 12, color: 'var(--nexora-primary)' }}
                        onClick={() => setAuthMode(authMode === 'register' ? 'login' : 'register')}
                      >
                        {authMode === 'register' ? 'Already registered? Sign in' : 'New patient? Register here'}
                      </button>
                    </div>

                    <div className="row g-2">
                      {authMode === 'register' && (
                        <div className="col-12">
                          <label className="form-label text-secondary mb-1" style={{ fontSize: 12 }}>
                            Patient Full Name *
                          </label>
                          <input
                            type="text"
                            className="form-control form-control-sm form-control-medical"
                            placeholder="e.g. Ramesh Patil"
                            value={guestFullName}
                            onChange={(e) => setGuestFullName(e.target.value)}
                            required
                          />
                        </div>
                      )}
                      <div className="col-md-6">
                        <label className="form-label text-secondary mb-1" style={{ fontSize: 12 }}>
                          Email Address *
                        </label>
                        <input
                          type="email"
                          className="form-control form-control-sm form-control-medical"
                          placeholder="e.g. patient@gmail.com"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label text-secondary mb-1" style={{ fontSize: 12 }}>
                          Password *
                        </label>
                        <input
                          type="password"
                          className="form-control form-control-sm form-control-medical"
                          placeholder="Create or enter password"
                          value={guestPassword}
                          onChange={(e) => setGuestPassword(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                    <div className="text-muted mt-2" style={{ fontSize: 11 }}>
                      Your medical profile and doctor briefing will be securely associated with this account.
                    </div>
                  </div>
                )}

                {/* Chief Complaint */}
                <div className="mb-3">
                  <label className="form-label text-secondary small fw-semibold">
                    Chief Complaint / Main Reason for Consultation *
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-medical"
                    placeholder="e.g. High fever, throbbing migraine, severe stomach pain"
                    value={chiefComplaint}
                    onChange={(e) => handleComplaintChange(e.target.value)}
                    required
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-semibold">
                      Symptom Duration *
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-medical"
                      placeholder="e.g. 3 days, 1 week"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-semibold d-flex justify-content-between">
                      <span>Severity Scale (1 to 10)</span>
                      <span className="fw-bold" style={{ color: 'var(--nexora-primary)' }}>
                        {severityScore} / 10
                      </span>
                    </label>
                    <input
                      type="range"
                      className="form-range mt-2"
                      min="1"
                      max="10"
                      value={severityScore}
                      onChange={(e) => setSeverityScore(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Associated Symptoms Tags */}
                <div className="mb-3">
                  <label className="form-label text-secondary small fw-semibold mb-2">
                    Associated Symptoms
                  </label>
                  <div className="d-flex flex-wrap gap-2">
                    {symptomOptions.map((sym) => {
                      const active = selectedSymptoms.includes(sym);
                      return (
                        <button
                          type="button"
                          key={sym}
                          className={`btn btn-sm ${
                            active ? 'btn-primary-medical' : 'btn-outline-secondary'
                          }`}
                          style={{ fontSize: 12, padding: '5px 12px' }}
                          onClick={() => toggleSymptom(sym)}
                        >
                          {active ? '✓ ' : '+ '} {sym}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 24-hr Food & Beverage Diary */}
                <div className="mb-3">
                  <label className="form-label text-secondary small fw-semibold">
                    <Utensils size={14} className="me-1" style={{ color: 'var(--nexora-primary)' }} />
                    Food & Beverages Consumed in Past 24 Hours
                  </label>
                  <textarea
                    rows={2}
                    className="form-control form-control-medical"
                    placeholder="e.g. Breakfast: Misal pav, tea. Lunch: Dal rice. Water: ~2 liters."
                    value={foodHistory}
                    onChange={(e) => setFoodHistory(e.target.value)}
                  />
                  <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                    Helps doctor assess food-borne illness or dietary triggers.
                  </div>
                </div>

                {/* Recent Medications */}
                <div className="mb-3">
                  <label className="form-label text-secondary small fw-semibold">
                    <Pill size={14} className="me-1" style={{ color: 'var(--nexora-primary)' }} />
                    Recent Medications or OTC Tablets Taken
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-medical"
                    placeholder="e.g. Paracetamol 650mg, antacids"
                    value={medications}
                    onChange={(e) => setMedications(e.target.value)}
                  />
                </div>

                {/* Additional Context */}
                <div className="mb-2">
                  <label className="form-label text-secondary small fw-semibold">
                    <FileText size={14} className="me-1" style={{ color: 'var(--nexora-primary)' }} />
                    Additional Context (Living situation, travel, etc.)
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-medical"
                    placeholder="e.g. Student relocated to Kolhapur hostel 2 weeks ago"
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                  />
                </div>
              </form>
            )}
          </div>

          {/* 3. FIXED & VISIBLE FOOTER (PINNED TO BOTTOM) */}
          <div
            className="modal-footer px-4 py-3 border-top bg-light d-flex justify-content-between align-items-center flex-shrink-0"
            style={{
              borderBottomLeftRadius: 16,
              borderBottomRightRadius: 16,
              borderColor: 'var(--nexora-border)',
            }}
          >
            {step === 1 ? (
              <>
                <button type="button" className="btn btn-outline-secondary px-3" onClick={onClose}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary-medical px-4"
                  onClick={() => setStep(2)}
                >
                  Proceed to Symptom Intake &rarr;
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-outline-secondary px-3"
                  onClick={() => setStep(1)}
                  disabled={loading}
                >
                  &larr; Back to Slot Selection
                </button>
                <button
                  type="submit"
                  form="booking-intake-form"
                  className="btn btn-primary-medical px-4"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="d-flex align-items-center gap-2">
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                      Confirming Reservation...
                    </span>
                  ) : (
                    'Confirm Appointment'
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
