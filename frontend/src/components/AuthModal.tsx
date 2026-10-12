import React, { useState } from 'react';
import { api, UserSession } from '../api/client';
import { X, User, Stethoscope, Lock, Mail, ShieldAlert, Building2, Award, Info, IndianRupee, CheckCircle2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (session: UserSession) => void;
}

const VERIFIED_HOSPITALS = [
  { id: 'hosp-cpr-kolhapur', name: 'Chhatrapati Pramila Raje (CPR) Hospital', locality: 'Mangalwar Peth' },
  { id: 'hosp-aster-aadhar', name: 'Aster Aadhar Hospital', locality: 'Shastri Nagar' },
  { id: 'hosp-apple-saraswati', name: 'Apple Saraswati Multispeciality Hospital', locality: 'Kadamwadi' },
  { id: 'hosp-dy-patil', name: 'D.Y. Patil Medical College Hospital & Research Centre', locality: 'Line Bazaar' },
  { id: 'hosp-swastik-shahupuri', name: 'Swastik Multispeciality Hospital', locality: 'Shahupuri' },
  { id: 'hosp-lotus-tarabai', name: 'Lotus Multi-Speciality Hospital', locality: 'Tarabai Park' },
  { id: 'other', name: '+ Other / Enter Custom Hospital Name', locality: 'Kolhapur' },
];

const SPECIALTY_OPTIONS = [
  'General Medicine',
  'Cardiology',
  'Family Medicine & OPD',
  'Pediatrics & Child Health',
  'Orthopedics & Joint Care',
  'Pulmonology & Respiratory',
  'Neurology',
  'Dermatology',
  'General Surgery',
  'other',
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [role, setRole] = useState<'patient' | 'doctor'>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Success state for registration & welcome notification
  const [successData, setSuccessData] = useState<{ session: UserSession; email: string; name: string } | null>(null);
  
  // Doctor specific registration fields
  const [hospitalSelection, setHospitalSelection] = useState<string>('hosp-cpr-kolhapur');
  const [customHospitalName, setCustomHospitalName] = useState<string>('');
  const [specialtySelection, setSpecialtySelection] = useState<string>('General Medicine');
  const [customSpecialty, setCustomSpecialty] = useState<string>('');
  const [qualifications, setQualifications] = useState<string>('MBBS, MD');
  const [experienceYears, setExperienceYears] = useState<number>(5);
  const [consultationFee, setConsultationFee] = useState<number>(300);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleProceedAfterSuccess = () => {
    if (successData) {
      onSuccess(successData.session);
      setSuccessData(null);
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      let session: UserSession;
      if (mode === 'signin') {
        session = await api.login(email, password);
        onSuccess(session);
        onClose();
      } else {
        let payload: any = {
          email,
          password,
          full_name: fullName,
          role,
        };

        if (role === 'doctor') {
          const hospId = hospitalSelection !== 'other' ? hospitalSelection : undefined;
          const hospObj = VERIFIED_HOSPITALS.find((h) => h.id === hospitalSelection);
          const hospName =
            hospitalSelection !== 'other'
              ? (hospObj ? hospObj.name : 'Kolhapur Medical Clinic')
              : (customHospitalName.trim() || 'Kolhapur Medical Clinic');

          const finalSpecialty =
            specialtySelection !== 'other'
              ? specialtySelection
              : (customSpecialty.trim() || 'General Medicine');

          payload = {
            ...payload,
            hospital_id: hospId,
            hospital_name: hospName,
            specialty: finalSpecialty,
            qualifications: qualifications.trim() || 'MBBS',
            experience_years: Number(experienceYears) || 5,
            consultation_fee_inr: Number(consultationFee) || 300,
          };
        }

        session = await api.register(payload);
        // Display welcome email confirmation view
        setSuccessData({
          session,
          email: payload.email,
          name: payload.full_name || 'Patient',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', zIndex: 1050 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable" style={{ maxWidth: 520, maxHeight: '92vh' }}>
        <div className="modal-content medical-card p-4 text-dark border-0 bg-white shadow-lg overflow-hidden">
          
          {/* SUCCESS VIEW (Registration & Gmail Notification Sent) */}
          {successData ? (
            <div className="text-center py-3">
              <div
                className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
                style={{ width: 68, height: 68, backgroundColor: '#ECFDF5', color: '#059669' }}
              >
                <CheckCircle2 size={38} />
              </div>

              <h4 className="fw-bold mb-1 text-dark brand-editorial">Welcome to Nexora!</h4>
              <p className="text-secondary small mb-3">
                Your account is confirmed and ready to access the Kolhapur healthcare network.
              </p>

              {/* Notification card info */}
              <div className="text-start p-3 rounded-3 bg-light border mb-4" style={{ borderColor: 'var(--nexora-border)' }}>
                <div className="d-flex align-items-center gap-2 mb-2">
                  <Mail size={16} className="text-primary" />
                  <span className="fw-bold small text-dark">Gmail Notification Dispatched</span>
                </div>
                <div className="small text-secondary mb-1">
                  We've sent a welcome briefing and security pass to:
                </div>
                <div className="fw-bold text-dark font-monospace small bg-white p-2 rounded border text-break">
                  {successData.email}
                </div>
                <div className="mt-2 text-muted" style={{ fontSize: 11 }}>
                  ✓ Check your Gmail inbox for your registration confirmation & platform guidelines.
                </div>
              </div>

              <button
                type="button"
                className="btn btn-primary-medical w-100 py-2 fw-semibold"
                onClick={handleProceedAfterSuccess}
              >
                Proceed to Nexora Dashboard →
              </button>
            </div>
          ) : (
            /* STANDARD EMAIL / PASSWORD VIEW */
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                <div>
                  <h4 className="fw-bold m-0 brand-editorial text-dark">
                    {mode === 'signin' ? 'Sign In to Nexora' : 'Create Your Account'}
                  </h4>
                  <p className="text-secondary small m-0">
                    {mode === 'signin' ? 'Access your appointments, consultations, and records.' : 'Register as a Patient or Healthcare Practitioner.'}
                  </p>
                </div>
                <button className="btn btn-sm btn-outline-secondary p-1 rounded-circle" onClick={onClose} style={{ width: 32, height: 32 }}>
                  <X size={16} />
                </button>
              </div>

              {/* Mode Switcher */}
              <div className="d-flex p-1 mb-3 rounded bg-light border" style={{ borderColor: 'var(--nexora-border)' }}>
                <button
                  className={`btn btn-sm flex-fill ${mode === 'signin' ? 'btn-primary-medical' : 'btn-light text-secondary'}`}
                  onClick={() => { setMode('signin'); setError(null); }}
                >
                  Sign In
                </button>
                <button
                  className={`btn btn-sm flex-fill ${mode === 'register' ? 'btn-primary-medical' : 'btn-light text-secondary'}`}
                  onClick={() => { setMode('register'); setError(null); }}
                >
                  New Registration
                </button>
              </div>

              {error && (
                <div className="alert alert-danger py-2 small d-flex align-items-center gap-2 mb-3">
                  <ShieldAlert size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Standard Email Form starts */}

          <form onSubmit={handleSubmit} style={{ overflowY: 'auto', maxHeight: '68vh', paddingRight: '4px' }}>
            {mode === 'register' && (
              <>
                <div className="mb-3">
                  <label className="form-label small text-secondary fw-semibold">Account Type</label>
                  <div className="d-flex gap-2">
                    <button
                      type="button"
                      className={`btn btn-sm flex-fill d-flex align-items-center justify-content-center gap-1 ${role === 'patient' ? 'btn-primary-medical' : 'btn-outline-medical'}`}
                      onClick={() => setRole('patient')}
                    >
                      <User size={15} /> Patient
                    </button>
                    <button
                      type="button"
                      className={`btn btn-sm flex-fill d-flex align-items-center justify-content-center gap-1 ${role === 'doctor' ? 'btn-primary-medical' : 'btn-outline-medical'}`}
                      onClick={() => setRole('doctor')}
                    >
                      <Stethoscope size={15} /> Doctor
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small text-secondary fw-semibold">
                    {role === 'doctor' ? 'Full Name with Title (e.g. Dr. Rajesh Kulkarni)' : 'Full Name'}
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-medical"
                    placeholder={role === 'doctor' ? 'Dr. Name Surname' : 'Your full name'}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                {role === 'doctor' && (
                  <>
                    {/* Hospital Name Selection */}
                    <div className="mb-3">
                      <label className="form-label small text-secondary fw-semibold d-flex align-items-center gap-1">
                        <Building2 size={15} style={{ color: 'var(--nexora-primary)' }} />
                        <span>Hospital / Medical Facility Affiliation</span>
                      </label>
                      <select
                        className="form-select form-select-medical"
                        value={hospitalSelection}
                        onChange={(e) => setHospitalSelection(e.target.value)}
                        required
                      >
                        {VERIFIED_HOSPITALS.map((hosp) => (
                          <option key={hosp.id} value={hosp.id}>
                            {hosp.name} {hosp.locality ? `(${hosp.locality})` : ''}
                          </option>
                        ))}
                      </select>
                      {hospitalSelection === 'other' && (
                        <input
                          type="text"
                          className="form-control form-control-medical mt-2"
                          placeholder="Enter hospital or clinic name (e.g. Kolhapur Care Hospital)"
                          value={customHospitalName}
                          onChange={(e) => setCustomHospitalName(e.target.value)}
                          required
                        />
                      )}
                      <div className="form-text small" style={{ fontSize: 11 }}>
                        Patients browsing this hospital will be able to book clinical appointments directly with you.
                      </div>
                    </div>

                    {/* Medical Specialty */}
                    <div className="mb-3">
                      <label className="form-label small text-secondary fw-semibold d-flex align-items-center gap-1">
                        <Stethoscope size={15} style={{ color: 'var(--nexora-primary)' }} />
                        <span>Medical Specialty</span>
                      </label>
                      <select
                        className="form-select form-select-medical"
                        value={specialtySelection}
                        onChange={(e) => setSpecialtySelection(e.target.value)}
                        required
                      >
                        {SPECIALTY_OPTIONS.map((spec) => (
                          <option key={spec} value={spec}>
                            {spec === 'other' ? '+ Other / Custom Specialty' : spec}
                          </option>
                        ))}
                      </select>
                      {specialtySelection === 'other' && (
                        <input
                          type="text"
                          className="form-control form-control-medical mt-2"
                          placeholder="Specify specialty (e.g. Endocrinology)"
                          value={customSpecialty}
                          onChange={(e) => setCustomSpecialty(e.target.value)}
                          required
                        />
                      )}
                    </div>

                    {/* Qualifications & Degrees */}
                    <div className="mb-3">
                      <label className="form-label small text-secondary fw-semibold d-flex align-items-center gap-1">
                        <Award size={15} style={{ color: 'var(--nexora-primary)' }} />
                        <span>Qualifications / Degrees</span>
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-medical"
                        placeholder="e.g. MBBS, MD (Internal Medicine), DNB"
                        value={qualifications}
                        onChange={(e) => setQualifications(e.target.value)}
                        required
                      />
                    </div>

                    {/* Experience & Fee */}
                    <div className="row g-2 mb-3">
                      <div className="col-6">
                        <label className="form-label small text-secondary fw-semibold">Experience (Years)</label>
                        <input
                          type="number"
                          min="0"
                          max="60"
                          className="form-control form-control-medical"
                          value={experienceYears}
                          onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                          required
                        />
                      </div>
                      <div className="col-6">
                        <label className="form-label small text-secondary fw-semibold d-flex align-items-center gap-1">
                          <IndianRupee size={13} />
                          <span>OPD Fee (₹)</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="50"
                          className="form-control form-control-medical"
                          value={consultationFee}
                          onChange={(e) => setConsultationFee(parseInt(e.target.value) || 0)}
                          required
                        />
                      </div>
                    </div>

                    {/* Physician Workflow Info Box */}
                    <div className="p-2 px-3 rounded bg-light border mb-3 small d-flex gap-2" style={{ borderColor: 'var(--nexora-border)' }}>
                      <Info size={16} className="text-primary flex-shrink-0 mt-1" />
                      <div style={{ fontSize: 12 }}>
                        <strong>How patient intake works:</strong> Patients booking at your hospital complete a structured intake (chief complaint, 24-hr food history, meds). Nexora automatically generates a pre-consultation AI briefing in your queue.
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            <div className="mb-3">
              <label className="form-label small text-secondary fw-semibold">Email Address</label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-secondary" style={{ borderColor: '#CBD5E1' }}>
                  <Mail size={16} />
                </span>
                <input
                  type="email"
                  className="form-control form-control-medical border-start-0 ps-0"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {mode === 'register' && (
                <div className="form-text text-muted" style={{ fontSize: 11 }}>
                  ✉️ A registration confirmation and welcome briefing will be dispatched to this email.
                </div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label small text-secondary fw-semibold">Password</label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-secondary" style={{ borderColor: '#CBD5E1' }}>
                  <Lock size={16} />
                </span>
                <input
                  type="password"
                  className="form-control form-control-medical border-start-0 ps-0"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary-medical w-100 py-2 mt-2" disabled={loading}>
              {loading ? 'Processing...' : mode === 'signin' ? 'Sign In' : 'Complete Registration'}
            </button>
          </form>

          <div className="mt-3 text-center text-secondary" style={{ fontSize: 12 }}>
            Your clinical data is protected by patient isolation and encrypted authentication.
          </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

