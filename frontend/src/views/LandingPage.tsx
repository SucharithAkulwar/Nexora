import React from 'react';
import {
  MapPin,
  Calendar,
  ShieldCheck,
  Brain,
  AlertTriangle,
  ArrowRight,
  Search,
  CheckCircle2,
  Building2,
  Clock,
} from 'lucide-react';

interface LandingPageProps {
  onExploreHospitals: () => void;
  onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onExploreHospitals,
  onOpenAuth,
}) => {
  return (
    <div className="container py-4 py-lg-5">
      {/* Urgent Medical Advisory Banner (Clean Clinical Alert) */}
      <div className="urgent-banner-light mb-4 d-flex align-items-center justify-content-between flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <div className="p-2 rounded-circle bg-danger bg-opacity-10 text-danger">
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="fw-bold text-danger" style={{ fontSize: 14 }}>
              URGENT & EMERGENCY MEDICAL CARE NOTICE
            </div>
            <div className="text-secondary" style={{ fontSize: 13 }}>
              If you or someone with you experiences crushing chest pain, sudden difficulty breathing, slurred speech, or acute trauma, dial <strong className="text-danger">108 (Ambulance)</strong> immediately or visit the CPR Hospital 24/7 Casualty Ward. Do not wait for an appointment.
            </div>
          </div>
        </div>
        <span className="badge badge-medical-red px-3 py-2">Emergency Hotline 108</span>
      </div>

      {/* Hero Section — Clean Medical Aesthetic */}
      <div className="row align-items-center gy-4 mb-5 pb-3">
        <div className="col-lg-7 text-start">
          <div className="d-inline-flex align-items-center gap-2 px-3 py-1 mb-3 rounded-pill bg-white border" style={{ borderColor: 'var(--nexora-border)' }}>
            <span className="pulse-indicator-medical"></span>
            <span className="small fw-semibold" style={{ color: 'var(--nexora-primary)' }}>
              Kolhapur Healthcare Network &bull; Verified Doctor Consultations
            </span>
          </div>

          <h1 className="display-4 fw-bold brand-editorial mb-3 text-dark lh-sm">
            Compassionate care, <br />
            <span style={{ color: 'var(--nexora-primary)' }}>informed before you arrive.</span>
          </h1>

          <p className="lead text-secondary mb-4" style={{ fontSize: '1.15rem', maxWidth: 620 }}>
            Nexora connects patients with reputable hospitals in Kolhapur, confirms real-time appointment slots, and organizes your symptoms and 24-hour food history into an objective clinical briefing for your physician.
          </p>

          <div className="d-flex flex-wrap gap-3 mb-4">
            <button
              className="btn btn-primary-medical btn-lg d-flex align-items-center gap-2 px-4"
              onClick={onExploreHospitals}
            >
              <Search size={20} />
              <span>Discover Kolhapur Hospitals</span>
            </button>
            <button
              className="btn btn-outline-medical btn-lg d-flex align-items-center gap-2 px-4"
              onClick={onOpenAuth}
            >
              <span>Sign In / Create Account</span>
              <ArrowRight size={18} />
            </button>
          </div>

          <div className="d-flex flex-wrap gap-4 text-secondary small pt-2">
            <div className="d-flex align-items-center gap-2">
              <CheckCircle2 size={16} style={{ color: 'var(--nexora-primary)' }} />
              <span>Google Places Verified Ratings</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <CheckCircle2 size={16} style={{ color: 'var(--nexora-primary)' }} />
              <span>Guaranteed Slot Reservations</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <CheckCircle2 size={16} style={{ color: 'var(--nexora-primary)' }} />
              <span>Patient-Isolated RAG Privacy</span>
            </div>
          </div>
        </div>

        {/* Hero Card: Authentic Kolhapur Network Overview */}
        <div className="col-lg-5">
          <div className="medical-card p-4 position-relative bg-white shadow-sm">
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <div className="d-flex align-items-center gap-2">
                <Building2 size={20} style={{ color: 'var(--nexora-primary)' }} />
                <span className="fw-bold small text-dark">Kolhapur Facility Directory</span>
              </div>
              <span className="badge badge-medical-green">Live Network</span>
            </div>

            <div className="p-3 rounded mb-3 bg-light border" style={{ borderColor: 'var(--nexora-border)' }}>
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div>
                  <div className="fw-bold text-dark" style={{ fontSize: 15 }}>Chhatrapati Pramila Raje (CPR) Hospital</div>
                  <div className="text-secondary" style={{ fontSize: 12 }}>Mangalwar Peth, Kolhapur</div>
                </div>
                <span className="badge badge-medical-amber">&#9733; 4.2</span>
              </div>
              <p className="text-secondary small mb-2">
                Premier government medical college & tertiary teaching hospital in South Maharashtra with 24/7 emergency casualty.
              </p>
              <div className="d-flex flex-wrap gap-1">
                <span className="badge badge-medical-blue" style={{ fontSize: 11 }}>24/7 Casualty OPD</span>
                <span className="badge badge-medical-blue" style={{ fontSize: 11 }}>Government College</span>
              </div>
            </div>

            <div className="p-3 rounded" style={{ background: 'var(--nexora-primary-light)', border: '1px solid var(--nexora-primary-subtle)' }}>
              <div className="d-flex align-items-center gap-2 fw-bold mb-1" style={{ color: 'var(--nexora-primary)', fontSize: 13 }}>
                <Brain size={16} />
                <span>Pre-Consultation Clinical Briefing</span>
              </div>
              <p className="text-secondary small mb-0" style={{ fontSize: 12, lineHeight: 1.5 }}>
                Patients submit symptoms and nutritional context in advance. Attending doctors review verified lab timelines and allergy flags prior to consultation.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Core Pillars — Clean Medical Aesthetic */}
      <div className="row g-4 mb-5 text-start">
        <div className="col-md-4">
          <div className="medical-card p-4 h-100 bg-white">
            <div
              className="p-3 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
              style={{ background: 'var(--nexora-primary-light)', color: 'var(--nexora-primary)', width: 56, height: 56 }}
            >
              <MapPin size={26} />
            </div>
            <h4 className="fw-bold text-dark mb-2 brand-editorial" style={{ fontSize: 20 }}>Kolhapur Facility Directory</h4>
            <p className="text-secondary small mb-0" style={{ lineHeight: 1.6 }}>
              Compare Chhatrapati Pramila Raje (CPR) Hospital, Aster Aadhar, Apple Saraswati, and neighborhood clinics across Tarabai Park, Shahupuri, and Rajarampuri with authentic Google reviews.
            </p>
          </div>
        </div>

        <div className="col-md-4">
          <div className="medical-card p-4 h-100 bg-white">
            <div
              className="p-3 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
              style={{ background: '#DCFCE7', color: '#15803D', width: 56, height: 56 }}
            >
              <Calendar size={26} />
            </div>
            <h4 className="fw-bold text-dark mb-2 brand-editorial" style={{ fontSize: 20 }}>Reliable Slot Booking</h4>
            <p className="text-secondary small mb-0" style={{ lineHeight: 1.6 }}>
              Atomic slot locking guarantees your appointment time without double-booking. Complete your symptoms intake and 24-hour nutritional history in under three minutes.
            </p>
          </div>
        </div>

        <div className="col-md-4">
          <div className="medical-card p-4 h-100 bg-white">
            <div
              className="p-3 rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
              style={{ background: '#EFF6FF', color: '#2563EB', width: 56, height: 56 }}
            >
              <Brain size={26} />
            </div>
            <h4 className="fw-bold text-dark mb-2 brand-editorial" style={{ fontSize: 20 }}>AI Clinical Pre-Briefing</h4>
            <p className="text-secondary small mb-0" style={{ lineHeight: 1.6 }}>
              Strictly non-diagnostic synthesis matches symptoms with patient-authorized records. Doctors receive a 9-stage structured dossier highlighting missing information and critical warnings.
            </p>
          </div>
        </div>
      </div>

      {/* Clinical Governance & Ethical Standards */}
      <div className="medical-card p-4 p-lg-5 text-start bg-white mb-5" style={{ borderLeft: '5px solid var(--nexora-primary)' }}>
        <div className="row align-items-center gy-4">
          <div className="col-lg-8">
            <div className="d-flex align-items-center gap-2 mb-2">
              <ShieldCheck size={26} style={{ color: 'var(--nexora-primary)' }} />
              <h3 className="fw-bold text-dark m-0 brand-editorial" style={{ fontSize: 24 }}>
                Clinical Safety & Ethical Standards
              </h3>
            </div>
            <p className="text-secondary mb-3">
              Nexora operates as a clinical preparation and intake system designed to assist licensed physicians, not replace them:
            </p>
            <ul className="text-secondary small mb-0 list-unstyled d-flex flex-column gap-2">
              <li className="d-flex align-items-center gap-2">
                <CheckCircle2 size={16} className="text-success flex-shrink-0" />
                <span><strong>No Autonomous Diagnosis:</strong> Nexora never diagnoses illness or prescribes medications independently.</span>
              </li>
              <li className="d-flex align-items-center gap-2">
                <CheckCircle2 size={16} className="text-success flex-shrink-0" />
                <span><strong>Physician Verification:</strong> All AI-generated briefings require doctor validation and electronic sign-off.</span>
              </li>
              <li className="d-flex align-items-center gap-2">
                <CheckCircle2 size={16} className="text-success flex-shrink-0" />
                <span><strong>Strict Patient Isolation:</strong> Health records and RAG indexes are compartmentalized strictly per patient ID.</span>
              </li>
            </ul>
          </div>
          <div className="col-lg-4 text-center text-lg-end">
            <button className="btn btn-primary-medical btn-lg px-4" onClick={onExploreHospitals}>
              Explore Facilities Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
