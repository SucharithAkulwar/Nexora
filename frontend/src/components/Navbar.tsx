import React from 'react';
import { UserSession } from '../api/client';
import { Activity, Shield, User, Stethoscope, MapPin, Calendar, FileText, LogOut } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  onNavigate: (tab: string) => void;
  session: UserSession | null;
  onLogout: () => void;
  onOpenAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onNavigate,
  session,
  onLogout,
  onOpenAuthModal,
}) => {
  return (
    <header className="sticky-top medical-navbar py-2 bg-white">
      <div className="container px-3 px-lg-4">
        <div className="d-flex align-items-center justify-content-between">
          {/* Brand Logo */}
          <button
            className="btn btn-link p-0 text-decoration-none d-flex align-items-center gap-2 border-0"
            onClick={() => onNavigate(session?.role === 'doctor' ? 'doctor-dashboard' : 'landing')}
          >
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: '#0A0F1D',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FBBF24',
                boxShadow: '0 4px 12px rgba(10, 15, 29, 0.15)',
              }}
            >
              <Activity size={22} strokeWidth={2.8} />
            </div>
            <div className="text-start">
              <span className="fw-bold fs-4 text-dark" style={{ fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.035em' }}>
                NEXORA
              </span>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="d-none d-lg-flex align-items-center gap-1">
            {/* Consumer / Patient Links (Hidden for Doctors) */}
            {session?.role !== 'doctor' && (
              <>
                <button
                  className={`nav-link-medical btn btn-sm border-0 ${currentTab === 'landing' ? 'active' : ''}`}
                  onClick={() => onNavigate('landing')}
                >
                  Home
                </button>

                <button
                  className={`nav-link-medical btn btn-sm border-0 ${currentTab === 'hospitals' ? 'active' : ''}`}
                  onClick={() => onNavigate('hospitals')}
                >
                  <MapPin size={15} className="me-1" style={{ color: 'var(--nexora-primary)' }} />
                  Kolhapur Hospitals
                </button>
              </>
            )}

            {/* Role specific links */}
            {session?.role === 'patient' && (
              <>
                <button
                  className={`nav-link-medical btn btn-sm border-0 ${currentTab === 'patient-dashboard' ? 'active' : ''}`}
                  onClick={() => onNavigate('patient-dashboard')}
                >
                  <Calendar size={15} className="me-1" />
                  My Consultations
                </button>
                <button
                  className={`nav-link-medical btn btn-sm border-0 ${currentTab === 'records' ? 'active' : ''}`}
                  onClick={() => onNavigate('records')}
                >
                  <FileText size={15} className="me-1" />
                  Medical Records
                </button>
                <button
                  className={`nav-link-medical btn btn-sm border-0 ${currentTab === 'onboarding' ? 'active' : ''}`}
                  onClick={() => onNavigate('onboarding')}
                >
                  <User size={15} className="me-1" />
                  My Profile
                </button>
              </>
            )}

            {session?.role === 'doctor' && (
              <>
                <button
                  className={`nav-link-medical btn btn-sm border-0 ${currentTab === 'doctor-dashboard' ? 'active' : ''}`}
                  onClick={() => onNavigate('doctor-dashboard')}
                >
                  <Stethoscope size={15} className="me-1 text-success" />
                  Doctor Workstation
                </button>
                <button
                  className={`nav-link-medical btn btn-sm border-0 ${currentTab === 'doctor-availability' ? 'active' : ''}`}
                  onClick={() => onNavigate('doctor-availability')}
                >
                  Schedule & Fees
                </button>
              </>
            )}

            <button
              className={`nav-link-medical btn btn-sm border-0 ${currentTab === 'settings' ? 'active' : ''}`}
              onClick={() => onNavigate('settings')}
            >
              <Shield size={15} className="me-1" style={{ color: 'var(--nexora-primary)' }} />
              Privacy & Audit
            </button>
          </nav>

          {/* Right Action */}
          <div className="d-flex align-items-center gap-2">
            {session ? (
              <div className="d-flex align-items-center gap-2">
                <span
                  className={`badge px-2 py-1 ${session.role === 'doctor' ? 'badge-medical-green' : 'badge-medical-blue'}`}
                  style={{ fontSize: 12, textTransform: 'capitalize' }}
                >
                  {session.role}
                </span>
                <span className="d-none d-md-inline text-dark fw-semibold" style={{ fontSize: 13 }}>
                  {session.full_name}
                </span>
                <button
                  className="btn btn-sm btn-outline-danger p-1 d-flex align-items-center rounded-circle"
                  onClick={onLogout}
                  title="Sign Out"
                  style={{ width: 32, height: 32, justifyContent: 'center' }}
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <button
                className="vivian-btn-primary px-3 py-2"
                style={{ fontSize: 13 }}
                onClick={onOpenAuthModal}
              >
                <span>Sign In / Register</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
