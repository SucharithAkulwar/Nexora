import React, { useState } from 'react';
import {
  MapPin,
  Calendar,
  ShieldCheck,
  Brain,
  ArrowRight,
  Search,
  CheckCircle2,
  Building2,
  Clock,
  Sparkles,
  ChevronRight,
  User,
  Stethoscope,
  Activity,
  HeartPulse,
  Plus,
  Minus,
  Award,
  Zap,
  CreditCard,
  Wallet,
  Check,
  Star,
} from 'lucide-react';

interface LandingPageProps {
  onExploreHospitals: () => void;
  onOpenAuth: () => void;
}

interface HospitalPreview {
  name: string;
  locality: string;
  rating: number;
  reviewsCount: number;
  type: string;
  badge: string;
  availableSlots: number;
  featuredDoc: string;
  description: string;
  perkBonus: string;
}

const LOCALITY_PREVIEWS: Record<string, HospitalPreview> = {
  'Mangalwar Peth': {
    name: 'Chhatrapati Pramila Raje (CPR) Hospital',
    locality: 'Mangalwar Peth, Kolhapur',
    rating: 4.5,
    reviewsCount: 842,
    type: 'Government Medical College & Trauma Center',
    badge: '24/7 Priority Casualty',
    availableSlots: 14,
    featuredDoc: 'Dr. Rajesh Kulkarni (Senior Consultant)',
    description: 'Premier tertiary teaching hospital in South Maharashtra equipped with regional trauma center and fast-track OPD.',
    perkBonus: '₹500 Lab Rebate',
  },
  'Shastri Nagar': {
    name: 'Aster Aadhar Hospital',
    locality: 'Shastri Nagar, Kolhapur',
    rating: 4.8,
    reviewsCount: 1120,
    type: 'NABH Tertiary Multi-Specialty',
    badge: 'Advanced Cardiology & Cath Lab',
    availableSlots: 9,
    featuredDoc: 'Dr. Priya Deshmukh (Cardiologist)',
    description: 'Ultra-modern 300-bed facility offering robotic diagnostics, cardiac cath lab, and express outpatient triage suites.',
    perkBonus: '₹1,000 Consultation Voucher',
  },
  'Kadamwadi': {
    name: 'Apple Saraswati Multispeciality Hospital',
    locality: 'Kadamwadi, Kolhapur',
    rating: 4.6,
    reviewsCount: 630,
    type: 'Multi-Specialty Center',
    badge: 'Family & Internal Medicine',
    availableSlots: 11,
    featuredDoc: 'Dr. Snehal Shinde (Family Medicine)',
    description: 'Community-centered acute hospital known for rapid outpatient triage and comprehensive maternal health programs.',
    perkBonus: 'Free Preventive Vitals Check',
  },
  'Shahupuri': {
    name: 'Kolhapur Institute of Orthopaedics & Trauma',
    locality: 'Shahupuri, Kolhapur',
    rating: 4.7,
    reviewsCount: 512,
    type: 'Super-Specialty Orthopaedics',
    badge: 'Joint Replacement & Spine',
    availableSlots: 7,
    featuredDoc: 'Dr. Vikram Patil (Orthopaedic Surgeon)',
    description: 'High-volume musculoskeletal center featuring laminar airflow operation suites and priority post-op rehab.',
    perkBonus: '₹750 Physiotherapy Credit',
  },
};

const FAQ_ITEMS = [
  {
    question: 'What is Nexora and how does it work?',
    answer:
      'Nexora is a modern healthcare platform connecting patients with Kolhapur’s premier hospitals. Patients receive priority queue access at participating facilities, automated AI-synthesized clinical dossiers delivered to physicians before arrival, and earn direct cash health credits for preventive checkups and completed appointments.',
  },
  {
    question: 'How does the Priority OPD Queue work?',
    answer:
      'When you book an appointment on Nexora, your consultation is automatically placed in the hospital’s fast-track schedule with atomic locking to prevent double-booking. Participating doctors receive advance alerts and review your clinical brief before your arrival.',
  },
  {
    question: 'How do I earn and redeem the ₹2,500 Care Rewards?',
    answer:
      'You receive an initial ₹500 welcome credit immediately upon completing your Universal Health Profile. Every time you complete a verified specialist consultation or annual preventive checkup in Kolhapur, additional credits are credited to your Nexora Wallet, redeemable for pharmacy bills, lab tests, or follow-up fees.',
  },
  {
    question: 'What information is contained in the AI Pre-Consultation Dossier?',
    answer:
      'The Section 7 Dossier synthesizes your acute symptom trajectories, 24-hour food and hydration intake, drug allergies, and past lab history. It provides attending doctors with a clean 60-second briefing so consultations focus immediately on treatment rather than repetitive clipboard paperwork.',
  },
  {
    question: 'Is my personal health information protected?',
    answer:
      'Yes. Nexora enforces strict patient-isolated vector indexing. Each health record is encrypted and strictly scoped to your patient ID. Physicians only receive time-bounded access to your dossier during your confirmed appointment slot, maintaining full ABDM & HIPAA compliance.',
  },
];

export const LandingPage: React.FC<LandingPageProps> = ({
  onExploreHospitals,
  onOpenAuth,
}) => {
  const [selectedLocality, setSelectedLocality] = useState<string>('Shastri Nagar');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [activeDossierTab, setActiveDossierTab] = useState<'symptoms' | 'nutrition' | 'labs'>('symptoms');

  const activeHospital = LOCALITY_PREVIEWS[selectedLocality] || LOCALITY_PREVIEWS['Shastri Nagar'];

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="landing-wrapper" style={{ overflowX: 'hidden', backgroundColor: '#FFFFFF' }}>

      {/* ──────────────────────────────────────────────────────────────────────────
          HERO SECTION: Bold, Minimalistic & Impactful
          ────────────────────────────────────────────────────────────────────────── */}
      <section className="container pt-5 pb-5">
        <div className="row align-items-center gy-5">
          {/* Left Column: Bold Headline, Subtitle, Actions, Avatar Stack */}
          <div className="col-lg-6 text-start">

            {/* Massive Bold Headline */}
            <h1 className="vivian-display mb-4" style={{ fontSize: 'clamp(2.5rem, 5vw, 4.2rem)' }}>
              A Smarter Consultation <br />
              <span style={{ color: '#2563EB' }}>Starts Before You Arrive.</span>
            </h1>

            {/* Minimalist Lead Subtitle */}
            <p className="vivian-subheading mb-4">
              Nexora uses AI to organize patient information and summarize health concerns, helping doctors prepare for more informed consultations.
            </p>

            {/* Action Button */}
            <div className="d-flex flex-wrap align-items-center gap-3 mb-4 pt-1">
              <button
                className="vivian-btn-primary"
                onClick={onExploreHospitals}
              >
                <span>Explore Hospitals</span>
                <ArrowRight size={17} />
              </button>
            </div>

          </div>

          {/* Right Column: Seamless Borderless Hero Illustration */}
          <div className="col-lg-6 text-center text-lg-end d-flex justify-content-center justify-content-lg-end align-items-center">
            <div className="position-relative" style={{ maxWidth: '100%' }}>
              <img
                src="/hero-consultation.png"
                alt="Nexora Healthcare Platform — Online Doctor Consultation & Hospital Booking"
                className="img-fluid"
                style={{
                  maxHeight: 520,
                  width: '100%',
                  maxWidth: 580,
                  objectFit: 'contain',
                  border: 'none',
                  outline: 'none',
                  boxShadow: 'none',
                  background: 'transparent',
                  display: 'block',
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          STATS RIBBON: Bold & Minimalist 4-Column Bar
          ────────────────────────────────────────────────────────────────────────── */}
      <section className="vivian-stats-bar">
        <div className="container">
          <div className="row g-4 text-center">

            <div className="col-6 col-md-3 border-end" style={{ borderColor: '#E5E7EB' }}>
              <div className="vivian-stat-number">3x</div>
              <div className="vivian-stat-label">Faster Doctor Intake</div>
            </div>

            <div className="col-6 col-md-3 border-end-md" style={{ borderColor: '#E5E7EB' }}>
              <div className="vivian-stat-number" style={{ color: '#D97706' }}>₹2,500</div>
              <div className="vivian-stat-label">Annual Care Credits</div>
            </div>

            <div className="col-6 col-md-3 border-end" style={{ borderColor: '#E5E7EB' }}>
              <div className="vivian-stat-number">100%</div>
              <div className="vivian-stat-label">Atomic Slot Reliability</div>
            </div>

            <div className="col-6 col-md-3">
              <div className="vivian-stat-number" style={{ color: '#2563EB' }}>24/7</div>
              <div className="vivian-stat-label">Casualty &amp; OPD Telemetry</div>
            </div>

          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          Z-PATTERN SECTION 01: Priority Hospital Access
          ────────────────────────────────────────────────────────────────────────── */}
      <section className="vivian-z-section">
        <div className="container">
          <div className="row align-items-center gy-5">

            {/* Left: Text & Features */}
            <div className="col-lg-6 text-start pe-lg-5">
              <div className="vivian-step-index">01 / PRIORITY HOSPITAL ACCESS</div>
              <h2 className="vivian-display mb-3" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
                Skip the waiting room. Enter the verified priority queue.
              </h2>
              <p className="vivian-subheading mb-4">
                Patients are prioritized directly on attending physicians' schedules across Kolhapur. No paper forms, no uncertain queues, and no double-booking delays.
              </p>

              <div className="d-flex flex-column gap-3 mb-4">
                <div className="d-flex align-items-start gap-3">
                  <div className="rounded-circle bg-dark text-white p-1 d-flex align-items-center justify-content-center mt-1" style={{ width: 22, height: 22 }}>
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-0">Direct Physician Schedule Allocation</h6>
                    <p className="text-muted small mb-0">Your appointment is atomically reserved with a verified time window.</p>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3">
                  <div className="rounded-circle bg-dark text-white p-1 d-flex align-items-center justify-content-center mt-1" style={{ width: 22, height: 22 }}>
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-0">Priority Status on Hospital Dashboards</h6>
                    <p className="text-muted small mb-0">Triage nurses and OPD desks instantly identify your fast-track status.</p>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3">
                  <div className="rounded-circle bg-dark text-white p-1 d-flex align-items-center justify-content-center mt-1" style={{ width: 22, height: 22 }}>
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-0">Real-Time SMS &amp; Mobile Ticker</h6>
                    <p className="text-muted small mb-0">Receive live queue updates so you arrive exactly when the physician is ready.</p>
                  </div>
                </div>
              </div>

              <button className="vivian-btn-primary" onClick={onExploreHospitals}>
                <span>Explore Network Hospitals</span>
                <ChevronRight size={17} />
              </button>
            </div>

            {/* Right: Interactive Priority Queue Simulator */}
            <div className="col-lg-6">
              <div className="vivian-feature-card text-start">
                <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                  <div>
                    <span className="badge bg-dark text-white rounded-pill px-3 py-1 mb-1" style={{ fontSize: 11 }}>
                      LIVE OPD QUEUE MONITOR
                    </span>
                    <h5 className="fw-bold text-dark mb-0" style={{ fontFamily: 'Outfit, sans-serif' }}>
                      Aster Aadhar Cardiology Suite
                    </h5>
                  </div>
                  <span className="badge bg-success-subtle text-success fw-bold px-3 py-2 rounded-pill">
                    ● Real-Time Feed
                  </span>
                </div>

                {/* Queue Display Box */}
                <div className="p-4 rounded-4 mb-3" style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0' }}>
                  <div className="row g-3 text-center mb-3">
                    <div className="col-4 border-end">
                      <span className="text-muted small text-uppercase" style={{ fontSize: 10, fontWeight: 700 }}>Your Queue #</span>
                      <h3 className="fw-bold text-dark mb-0" style={{ fontFamily: 'Outfit, sans-serif' }}>#01</h3>
                    </div>
                    <div className="col-4 border-end">
                      <span className="text-muted small text-uppercase" style={{ fontSize: 10, fontWeight: 700 }}>Estimated Wait</span>
                      <h3 className="fw-bold text-success mb-0" style={{ fontFamily: 'Outfit, sans-serif' }}>3 Mins</h3>
                    </div>
                    <div className="col-4">
                      <span className="text-muted small text-uppercase" style={{ fontSize: 10, fontWeight: 700 }}>Status</span>
                      <h3 className="fw-bold text-primary mb-0" style={{ fontSize: 16, marginTop: 4 }}>Next In</h3>
                    </div>
                  </div>

                  <div className="d-flex align-items-center justify-content-between p-3 rounded-3 bg-white border">
                    <div className="d-flex align-items-center gap-3">
                      <div className="rounded-circle bg-light p-2 text-primary d-flex align-items-center justify-content-center" style={{ width: 38, height: 38 }}>
                        <Stethoscope size={20} />
                      </div>
                      <div>
                        <div className="fw-bold text-dark" style={{ fontSize: 13.5 }}>Dr. Priya Deshmukh (Cardiologist)</div>
                        <div className="text-secondary small" style={{ fontSize: 11.5 }}>Consultation Room 3B &bull; Shastri Nagar</div>
                      </div>
                    </div>
                    <span className="badge bg-primary-subtle text-primary rounded-pill px-2 py-1" style={{ fontSize: 11 }}>
                      Priority OPD Pass
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-3" style={{ background: '#ECFDF5', border: '1px solid #A7F3D0' }}>
                  <div className="d-flex align-items-center gap-2 text-success fw-bold small mb-1">
                    <CheckCircle2 size={16} />
                    <span>Clinical Pre-Dossier Delivered</span>
                  </div>
                  <div className="text-secondary small" style={{ fontSize: 12 }}>
                    Physician already inspected your 48h fever progression and lab records.
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          Z-PATTERN SECTION 02: AI Clinical Dossier Pre-Pass
          ────────────────────────────────────────────────────────────────────────── */}
      <section className="vivian-z-section" style={{ backgroundColor: '#FAFAFA' }}>
        <div className="container">
          <div className="row align-items-center gy-5 flex-lg-row-reverse">

            {/* Right: Text & Features */}
            <div className="col-lg-6 text-start ps-lg-5">
              <div className="vivian-step-index">02 / INTELLIGENT CLINICAL PRE-PASS</div>
              <h2 className="vivian-display mb-3" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
                Your complete health story, organized before you walk in.
              </h2>
              <p className="vivian-subheading mb-4">
                No more repeating symptoms or recalling exact food timings. Nexora's Section 7 Engine synthesizes acute symptoms, 24-hour food logs, and drug allergies into a clean clinical brief for the doctor.
              </p>

              <div className="d-flex flex-column gap-3 mb-4">
                <div className="d-flex align-items-start gap-3">
                  <div className="rounded-circle bg-dark text-white p-1 d-flex align-items-center justify-content-center mt-1" style={{ width: 22, height: 22 }}>
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-0">48-Hour Symptom Timeline</h6>
                    <p className="text-muted small mb-0">Captures exact temperature spikes, pain progression, and medication responses.</p>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3">
                  <div className="rounded-circle bg-dark text-white p-1 d-flex align-items-center justify-content-center mt-1" style={{ width: 22, height: 22 }}>
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-0">24-Hour Nutritional &amp; Lifestyle Context</h6>
                    <p className="text-muted small mb-0">Helps doctors instantly detect dietary triggers, dehydration, or drug interactions.</p>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3">
                  <div className="rounded-circle bg-dark text-white p-1 d-flex align-items-center justify-content-center mt-1" style={{ width: 22, height: 22 }}>
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-0">Patient-Isolated RAG Security</h6>
                    <p className="text-muted small mb-0">100% private. Only your active consulting doctor has access during your slot.</p>
                  </div>
                </div>
              </div>

              <button className="vivian-btn-outline" onClick={onOpenAuth}>
                <span>Preview Your Dossier</span>
                <ChevronRight size={17} />
              </button>
            </div>

            {/* Left: Interactive Section 7 Clinical Dossier Card */}
            <div className="col-lg-6">
              <div className="vivian-feature-card text-start bg-white">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="d-flex align-items-center gap-2">
                    <div className="p-2 rounded-3 bg-dark text-white">
                      <Brain size={20} />
                    </div>
                    <div>
                      <h6 className="fw-bold text-dark mb-0" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        Section 7 Clinical Synthesis
                      </h6>
                      <span className="text-muted small" style={{ fontSize: 11 }}>
                        Case: Aarav Patil (21y) &bull; CPR / Aster Network
                      </span>
                    </div>
                  </div>
                  <span className="badge bg-danger-subtle text-danger fw-bold rounded-pill px-3 py-1">
                    Allergy Alert: Penicillin
                  </span>
                </div>

                {/* Tab selector */}
                <div className="d-flex gap-2 p-1 rounded-pill bg-light border mb-3">
                  <button
                    className={`btn btn-sm rounded-pill flex-grow-1 border-0 ${activeDossierTab === 'symptoms' ? 'bg-white fw-bold shadow-sm' : 'text-muted'}`}
                    style={{ fontSize: 12 }}
                    onClick={() => setActiveDossierTab('symptoms')}
                  >
                    Symptom Chronology
                  </button>
                  <button
                    className={`btn btn-sm rounded-pill flex-grow-1 border-0 ${activeDossierTab === 'nutrition' ? 'bg-white fw-bold shadow-sm' : 'text-muted'}`}
                    style={{ fontSize: 12 }}
                    onClick={() => setActiveDossierTab('nutrition')}
                  >
                    24h Food Diary
                  </button>
                  <button
                    className={`btn btn-sm rounded-pill flex-grow-1 border-0 ${activeDossierTab === 'labs' ? 'bg-white fw-bold shadow-sm' : 'text-muted'}`}
                    style={{ fontSize: 12 }}
                    onClick={() => setActiveDossierTab('labs')}
                  >
                    Lab History
                  </button>
                </div>

                {/* Dossier Content Based on Tab */}
                {activeDossierTab === 'symptoms' && (
                  <div className="p-3 rounded-4 bg-light border mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold text-dark small">Chief Complaint</span>
                      <span className="badge bg-secondary-subtle text-dark">Onset: 48h ago</span>
                    </div>
                    <div className="text-dark small mb-3">
                      High pyrexia (102.5°F peak) accompanied by retro-orbital cephalalgia and mild dehydration.
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                      <span className="badge bg-white text-dark border p-2">Severity: 8/10</span>
                      <span className="badge bg-white text-dark border p-2">OTC: Paracetamol 650mg taken</span>
                      <span className="badge bg-white text-success border border-success-subtle p-2">BP: 120/80 mmHg</span>
                    </div>
                  </div>
                )}

                {activeDossierTab === 'nutrition' && (
                  <div className="p-3 rounded-4 bg-light border mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold text-dark small">Last 24 Hours Intake</span>
                      <span className="badge bg-success-subtle text-success">Logged at 09:15 AM</span>
                    </div>
                    <div className="text-dark small mb-3">
                      Breakfast: Poha &amp; Chai at 08:30 AM &bull; Hydration: 1.8 Liters filtered water &bull; No street food reported.
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                      <span className="badge bg-white text-dark border p-2">Diet: Vegetarian</span>
                      <span className="badge bg-white text-dark border p-2">GI Distress: Nil</span>
                      <span className="badge bg-white text-dark border p-2">Nausea: Mild</span>
                    </div>
                  </div>
                )}

                {activeDossierTab === 'labs' && (
                  <div className="p-3 rounded-4 bg-light border mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <span className="fw-bold text-dark small">Verified Historical Lab Records</span>
                      <span className="badge bg-primary-subtle text-primary">Synced via ABDM</span>
                    </div>
                    <div className="text-dark small mb-3">
                      Complete Blood Count (CBC) from Dr. D.Y. Patil Labs: Hemoglobin 14.2 g/dL &bull; Platelets 220,000/μL (Normal).
                    </div>
                    <div className="d-flex gap-2 flex-wrap">
                      <span className="badge bg-white text-dark border p-2">Blood Group: B+</span>
                      <span className="badge bg-white text-dark border p-2">HbA1c: 5.4%</span>
                      <span className="badge bg-white text-dark border p-2">Thyroid: Normal</span>
                    </div>
                  </div>
                )}

                <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                  <div className="d-flex align-items-center gap-2">
                    <ShieldCheck size={16} className="text-success" />
                    <span className="small text-muted" style={{ fontSize: 12 }}>
                      Physician Signature Ready
                    </span>
                  </div>
                  <span className="badge bg-dark text-white rounded-pill px-3 py-1" style={{ fontSize: 11 }}>
                    Section 7 Verified
                  </span>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          Z-PATTERN SECTION 03: Cash Rewards & Milestone Credits
          ────────────────────────────────────────────────────────────────────────── */}
      <section className="vivian-z-section">
        <div className="container">
          <div className="row align-items-center gy-5">

            {/* Left: Text & Features */}
            <div className="col-lg-6 text-start pe-lg-5">
              <div className="vivian-step-index">03 / VERIFIED HEALTH REWARDS</div>
              <h2 className="vivian-display mb-3" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}>
                Earn up to ₹2,500 in care credits for proactive visits.
              </h2>
              <p className="vivian-subheading mb-4">
                Nexora rewards you for maintaining routine checkups, completing verified specialist follow-ups, and keeping your health profile up to date.
              </p>

              <div className="d-flex flex-column gap-3 mb-4">
                <div className="d-flex align-items-start gap-3">
                  <div className="rounded-circle bg-warning text-dark p-1 d-flex align-items-center justify-content-center mt-1" style={{ width: 22, height: 22 }}>
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-0">₹500 Welcome Bonus Credit</h6>
                    <p className="text-muted small mb-0">Instantly unlocked upon creating your universal clinical profile.</p>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3">
                  <div className="rounded-circle bg-warning text-dark p-1 d-flex align-items-center justify-content-center mt-1" style={{ width: 22, height: 22 }}>
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-0">₹1,000 Annual Health Review Voucher</h6>
                    <p className="text-muted small mb-0">Applied towards comprehensive wellness panels and cardiologist screenings.</p>
                  </div>
                </div>

                <div className="d-flex align-items-start gap-3">
                  <div className="rounded-circle bg-warning text-dark p-1 d-flex align-items-center justify-content-center mt-1" style={{ width: 22, height: 22 }}>
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <div>
                    <h6 className="fw-bold text-dark mb-0">Direct Pharmacy &amp; Lab Disbursal</h6>
                    <p className="text-muted small mb-0">Redeem seamlessly at partner pharmacies and diagnostics across Kolhapur.</p>
                  </div>
                </div>
              </div>

              <button className="vivian-btn-gold" onClick={onOpenAuth}>
                <Award size={18} />
                <span>Get Started &amp; Claim ₹2,500</span>
              </button>
            </div>

            {/* Right: Interactive Rewards Wallet Card */}
            <div className="col-lg-6">
              <div className="vivian-feature-card text-start">
                <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
                  <div className="d-flex align-items-center gap-2">
                    <div className="p-2 rounded-3 bg-warning text-dark">
                      <Wallet size={20} />
                    </div>
                    <div>
                      <h6 className="fw-bold text-dark mb-0" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        Nexora Care Rewards Wallet
                      </h6>
                      <span className="text-muted small" style={{ fontSize: 11 }}>
                        Member: Aarav Patil &bull; Instant Disbursal
                      </span>
                    </div>
                  </div>
                  <span className="badge bg-warning text-dark fw-bold px-3 py-2 rounded-pill">
                    Active Rewards Tier
                  </span>
                </div>

                {/* Balance display */}
                <div className="p-4 rounded-4 mb-3" style={{ background: '#0A0F1D', color: '#FFFFFF' }}>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <span className="text-secondary small text-uppercase" style={{ fontSize: 11, letterSpacing: '0.06em' }}>
                      TOTAL ACCUMULATED REWARDS
                    </span>
                    <span className="badge bg-success-subtle text-success">Verified Balance</span>
                  </div>
                  <h2 className="fw-bold mb-3" style={{ fontFamily: 'Outfit, sans-serif', color: '#FBBF24', fontSize: '2.5rem' }}>
                    ₹2,500<span style={{ fontSize: 16, color: '#9CA3AF' }}>.00</span>
                  </h2>

                  <div className="p-2 rounded-3 bg-dark border border-secondary border-opacity-25 d-flex align-items-center justify-content-between">
                    <span className="small text-secondary" style={{ fontSize: 12 }}>
                      Next Tier: Platinum Care Ambassador (+₹1,500)
                    </span>
                    <span className="text-warning small fw-bold">85% Complete</span>
                  </div>
                </div>

                {/* Milestone list */}
                <div className="d-flex flex-column gap-2 mb-3">
                  <div className="d-flex align-items-center justify-content-between p-2 rounded-3 bg-light border" style={{ fontSize: 12.5 }}>
                    <div className="d-flex align-items-center gap-2">
                      <CheckCircle2 size={16} className="text-success" />
                      <span className="fw-semibold text-dark">Universal Profile Completed</span>
                    </div>
                    <span className="fw-bold text-success">+₹500 Deposited</span>
                  </div>

                  <div className="d-flex align-items-center justify-content-between p-2 rounded-3 bg-light border" style={{ fontSize: 12.5 }}>
                    <div className="d-flex align-items-center gap-2">
                      <CheckCircle2 size={16} className="text-success" />
                      <span className="fw-semibold text-dark">Aster Aadhar Verified Visit</span>
                    </div>
                    <span className="fw-bold text-success">+₹1,000 Credited</span>
                  </div>

                  <div className="d-flex align-items-center justify-content-between p-2 rounded-3 bg-light border" style={{ fontSize: 12.5 }}>
                    <div className="d-flex align-items-center gap-2">
                      <CheckCircle2 size={16} className="text-success" />
                      <span className="fw-semibold text-dark">Annual Lab Panel Synced</span>
                    </div>
                    <span className="fw-bold text-success">+₹1,000 Unlocked</span>
                  </div>
                </div>

                <div className="d-flex align-items-center justify-content-between pt-2 border-top">
                  <span className="small text-muted" style={{ fontSize: 12 }}>
                    Auto-redeemable at checkout
                  </span>
                  <button className="btn btn-sm btn-dark rounded-pill px-3 py-1" style={{ fontSize: 11.5 }} onClick={onOpenAuth}>
                    View Voucher Details
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          HOW IT WORKS (1 - 2 - 3 Minimalist Cards)
          ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-5" style={{ backgroundColor: '#F9FAFB' }}>
        <div className="container py-4 text-start">

          <div className="text-center mb-5">
            <span className="vivian-badge-mono mb-2">
              ✦ SIMPLE 3-STEP JOURNEY
            </span>
            <h2 className="vivian-display mb-3" style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.2rem)' }}>
              How Nexora Works
            </h2>
            <p className="vivian-subheading mx-auto">
              Getting started takes less than two minutes. Elevate your healthcare experience across Kolhapur.
            </p>
          </div>

          <div className="row g-4">

            {/* Step 1 */}
            <div className="col-lg-4">
              <div className="vivian-step-box">
                <div>
                  <div className="vivian-step-number">01</div>
                  <h4 className="fw-bold text-dark mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    Build Your Universal Profile
                  </h4>
                  <p className="text-muted mb-4" style={{ lineHeight: 1.6, fontSize: 14.5 }}>
                    Enter your chronic conditions, routine medication, allergies, and dietary lifestyle once. Unlock your instant ₹500 welcome care credit.
                  </p>
                </div>
                <div className="p-3 rounded-3 bg-light border">
                  <span className="small fw-semibold text-dark">Takes ~90 seconds</span>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="col-lg-4">
              <div className="vivian-step-box">
                <div>
                  <div className="vivian-step-number" style={{ background: '#0A0F1D', color: '#FBBF24' }}>02</div>
                  <h4 className="fw-bold text-dark mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    Activate Instant Priority Access
                  </h4>
                  <p className="text-muted mb-4" style={{ lineHeight: 1.6, fontSize: 14.5 }}>
                    Your health account is automatically activated. You receive priority fast-track status for bookings at CPR, Aster Aadhar, and Apple Saraswati.
                  </p>
                </div>
                <div className="p-3 rounded-3 bg-light border">
                  <span className="small fw-semibold text-dark">Immediate digital activation</span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="col-lg-4">
              <div className="vivian-step-box">
                <div>
                  <div className="vivian-step-number" style={{ background: '#ECFDF5', color: '#047857' }}>03</div>
                  <h4 className="fw-bold text-dark mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                    Consult &amp; Collect Care Rewards
                  </h4>
                  <p className="text-muted mb-4" style={{ lineHeight: 1.6, fontSize: 14.5 }}>
                    Arrive with your Section 7 dossier ready. Walk directly into consultation without waiting, and earn milestone reward deposits to your wallet.
                  </p>
                </div>
                <div className="p-3 rounded-3 bg-light border">
                  <span className="small fw-semibold text-dark">Up to ₹2,500 total rewards</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          INTERACTIVE FACILITY DISCOVERY RADAR: Kolhapur Hospitals (Minimalist)
          ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-5">
        <div className="container py-4 text-start">

          <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-end mb-4 pb-2 border-bottom">
            <div>
              <span className="vivian-badge-mono mb-2">
                ✦ LIVE NETWORK TELEMETRY
              </span>
              <h2 className="vivian-display mb-1" style={{ fontSize: 'clamp(2rem, 3.5vw, 2.8rem)' }}>
                Kolhapur Facility Radar
              </h2>
              <p className="text-muted mb-0" style={{ fontSize: 15 }}>
                Real-time bed telemetry, attending doctors, and certified Google ratings across medical zones.
              </p>
            </div>

            {/* Locality Selector Pills */}
            <div className="d-flex flex-wrap gap-2 mt-3 mt-md-0">
              {Object.keys(LOCALITY_PREVIEWS).map((locality) => (
                <button
                  key={locality}
                  className={`btn btn-sm px-3 py-2 rounded-pill transition-all ${selectedLocality === locality
                      ? 'btn-dark fw-bold shadow-sm'
                      : 'btn-outline-secondary'
                    }`}
                  style={{ fontSize: 13, fontFamily: 'Inter, sans-serif' }}
                  onClick={() => setSelectedLocality(locality)}
                >
                  {locality}
                </button>
              ))}
            </div>
          </div>

          {/* Active Facility Card */}
          <div className="p-4 p-lg-5 rounded-4 border bg-white shadow-sm mb-4">
            <div className="row align-items-center gy-4">

              <div className="col-lg-7">
                <div className="d-flex align-items-center gap-2 mb-2">
                  <span className="badge bg-primary-subtle text-primary fw-bold px-3 py-1 rounded-pill" style={{ fontSize: 11 }}>
                    {activeHospital.type}
                  </span>
                  <span className="badge bg-warning-subtle text-warning-emphasis fw-bold px-3 py-1 rounded-pill" style={{ fontSize: 11 }}>
                    ★ {activeHospital.rating} ({activeHospital.reviewsCount} Reviews)
                  </span>
                </div>

                <h3 className="fw-bold text-dark mb-2" style={{ fontFamily: 'Outfit, sans-serif', fontSize: 26 }}>
                  {activeHospital.name}
                </h3>

                <div className="d-flex align-items-center gap-2 text-muted mb-3" style={{ fontSize: 13.5 }}>
                  <MapPin size={16} className="text-primary" />
                  <span>{activeHospital.locality}</span>
                </div>

                <p className="text-secondary mb-4" style={{ lineHeight: 1.6, fontSize: 14.5 }}>
                  {activeHospital.description}
                </p>

                <div className="d-flex flex-wrap gap-2 mb-4">
                  <span className="badge bg-light text-dark border px-3 py-2 rounded-pill" style={{ fontSize: 12 }}>
                    {activeHospital.badge}
                  </span>
                  <span className="badge bg-success-subtle text-success px-3 py-2 rounded-pill" style={{ fontSize: 12 }}>
                    🟢 {activeHospital.availableSlots} Priority Slots Today
                  </span>
                  <span className="badge bg-warning-subtle text-dark border border-warning px-3 py-2 rounded-pill fw-bold" style={{ fontSize: 12 }}>
                    🎁 Hospital Perk: {activeHospital.perkBonus}
                  </span>
                </div>

                <div className="d-flex align-items-center gap-3">
                  <button className="vivian-btn-primary" onClick={onExploreHospitals}>
                    <span>Book Priority Slot</span>
                    <ArrowRight size={16} />
                  </button>
                  <button className="vivian-btn-outline" onClick={onExploreHospitals}>
                    <span>View All Specialists</span>
                  </button>
                </div>
              </div>

              <div className="col-lg-5">
                <div className="p-4 rounded-4" style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0' }}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <span className="small text-muted fw-bold text-uppercase" style={{ fontSize: 11 }}>Featured On-Duty Specialist</span>
                    <span className="badge bg-success text-white">Active Now</span>
                  </div>

                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div className="rounded-circle bg-white border p-2 text-primary shadow-sm" style={{ width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Stethoscope size={24} />
                    </div>
                    <div>
                      <h6 className="fw-bold text-dark mb-0">{activeHospital.featuredDoc}</h6>
                      <span className="text-muted small">OPD Department &bull; Verified Specialist</span>
                    </div>
                  </div>

                  <div className="p-3 rounded-3 bg-white border mb-3">
                    <div className="d-flex justify-content-between align-items-center small mb-1">
                      <span className="text-muted">Consultation Fee:</span>
                      <span className="fw-bold text-dark">₹250 - ₹500</span>
                    </div>
                    <div className="d-flex justify-content-between align-items-center small">
                      <span className="text-muted">Care Rebate:</span>
                      <span className="fw-bold text-success">-₹250 (Wallet Covered)</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <span className="small text-secondary" style={{ fontSize: 11.5 }}>
                      Instant confirmation via SMS &bull; Zero waiting room queue
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          FAQ ACCORDION: Minimalist Expandable Cards
          ────────────────────────────────────────────────────────────────────────── */}
      <section className="py-5" style={{ backgroundColor: '#FBFBFB' }}>
        <div className="container py-4 text-start">

          <div className="text-center mb-5">
            <span className="vivian-badge-mono mb-2">
              ✦ FREQUENTLY ASKED QUESTIONS
            </span>
            <h2 className="vivian-display mb-3" style={{ fontSize: 'clamp(2.2rem, 4.5vw, 3.2rem)' }}>
              Everything You Need to Know
            </h2>
            <p className="vivian-subheading mx-auto">
              Clear answers about Nexora priority access, clinical briefings, rewards disbursal, and privacy.
            </p>
          </div>

          <div className="mx-auto" style={{ maxWidth: 840 }}>
            {FAQ_ITEMS.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div key={index} className={`vivian-faq-item ${isOpen ? 'active' : ''}`}>
                  <button
                    className="vivian-faq-question"
                    onClick={() => toggleFaq(index)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    <div className="vivian-faq-toggle-icon">
                      {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="vivian-faq-answer">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          FINAL BOLD CALL TO ACTION BANNER: Deep Obsidian & Minimalist
          ────────────────────────────────────────────────────────────────────────── */}
      <section className="container py-5">
        <div className="vivian-cta-banner text-center position-relative">
          <div className="position-relative" style={{ zIndex: 2 }}>

            <span className="vivian-badge-mono mb-3 px-3 py-2 bg-dark text-white border-secondary">
              ✦ ELEVATE YOUR HEALTHCARE JOURNEY
            </span>

            <h2 className="vivian-display text-white mb-3" style={{ fontSize: 'clamp(2.4rem, 5vw, 3.8rem)' }}>
              Ready for priority healthcare without the wait?
            </h2>

            <p className="mx-auto mb-4" style={{ maxWidth: 620, color: '#9CA3AF', fontSize: '1.15rem', lineHeight: 1.65 }}>
              Join 12,000+ members in Kolhapur. Unlock instant fast-track doctor queuing, your AI clinical dossier pre-pass, and ₹2,500 in care rewards.
            </p>

            <div className="d-flex justify-content-center flex-wrap gap-3">
              <button
                className="vivian-btn-gold"
                onClick={onOpenAuth}
                style={{ fontSize: 16, padding: '15px 34px' }}
              >
                <span>Get Started Now</span>
                <ArrowRight size={18} />
              </button>

              <button
                className="vivian-btn-outline"
                onClick={onExploreHospitals}
                style={{ background: 'transparent', color: '#FFFFFF', borderColor: '#374151', fontSize: 16, padding: '15px 32px' }}
              >
                <span>Explore Kolhapur Hospitals</span>
              </button>
            </div>

            <div className="d-flex justify-content-center align-items-center gap-4 mt-4 pt-3 text-secondary small" style={{ fontSize: 12 }}>
              <span className="d-flex align-items-center gap-1">
                <CheckCircle2 size={14} className="text-success" /> No Credit Card Required
              </span>
              <span className="d-flex align-items-center gap-1">
                <CheckCircle2 size={14} className="text-success" /> Instant Activation
              </span>
              <span className="d-flex align-items-center gap-1">
                <CheckCircle2 size={14} className="text-success" /> ABDM &amp; HIPAA Compliant
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* ──────────────────────────────────────────────────────────────────────────
          MINIMALIST FOOTER
          ────────────────────────────────────────────────────────────────────────── */}
      <footer className="border-top py-5 bg-white text-start">
        <div className="container">
          <div className="row gy-4 align-items-center justify-content-between">

            <div className="col-md-5">
              <div className="d-flex align-items-center gap-2 mb-2">
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: '#0A0F1D',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FBBF24',
                  }}
                >
                  <Activity size={18} strokeWidth={2.8} />
                </div>
                <span className="fw-bold text-dark fs-5" style={{ fontFamily: 'Outfit, sans-serif' }}>
                  NEXORA
                </span>
              </div>
              <p className="text-muted small mb-0" style={{ maxWidth: 360, lineHeight: 1.6 }}>
                The bold, minimalist healthcare excellence platform. Connecting patients to Kolhapur hospitals with priority queuing, AI pre-consultation briefings, and care rewards.
              </p>
            </div>

            <div className="col-md-7 text-md-end">
              <div className="d-flex flex-wrap justify-content-md-end gap-4 mb-3">
                <button className="btn btn-link p-0 text-muted text-decoration-none small" onClick={onExploreHospitals}>
                  Kolhapur Hospitals
                </button>
                <button className="btn btn-link p-0 text-muted text-decoration-none small" onClick={onOpenAuth}>
                  Care Benefits
                </button>
                <button className="btn btn-link p-0 text-muted text-decoration-none small" onClick={onOpenAuth}>
                  Clinical Briefing Engine
                </button>
                <button className="btn btn-link p-0 text-muted text-decoration-none small" onClick={onOpenAuth}>
                  Privacy &amp; Audit
                </button>
              </div>

              <div className="text-muted small" style={{ fontSize: 12 }}>
                &copy; {new Date().getFullYear()} Nexora Healthcare Technologies. All rights reserved. Built with precision for Kolhapur, Maharashtra.
              </div>
            </div>

          </div>
        </div>
      </footer>

    </div>
  );
};
