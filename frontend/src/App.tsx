import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { AuthModal } from './components/AuthModal';
import { LandingPage } from './views/LandingPage';
import { HospitalDiscoveryView } from './views/HospitalDiscoveryView';
import { HospitalDetailModal } from './views/HospitalDetailModal';
import { AppointmentBookingModal } from './views/AppointmentBookingModal';
import { PatientDashboardView } from './views/PatientDashboardView';
import { DoctorDashboardView } from './views/DoctorDashboardView';
import { DoctorConsultationView } from './views/DoctorConsultationView';
import { PatientOnboardingView } from './views/PatientOnboardingView';
import { MedicalRecordsView } from './views/MedicalRecordsView';
import { DoctorAvailabilityView } from './views/DoctorAvailabilityView';
import { SettingsPrivacyView } from './views/SettingsPrivacyView';
import { api, getStoredSession, setStoredSession, UserSession } from './api/client';

export const App: React.FC = () => {
  const [session, setSession] = useState<UserSession | null>(getStoredSession);
  const [currentTab, setCurrentTab] = useState<string>(() => {
    const stored = getStoredSession();
    return stored?.role === 'doctor' ? 'doctor-dashboard' : 'landing';
  });

  useEffect(() => {
    if (session?.role === 'doctor') {
      if (currentTab === 'landing' || currentTab === 'hospitals' || currentTab === 'patient-dashboard' || currentTab === 'records' || currentTab === 'onboarding') {
        setCurrentTab('doctor-dashboard');
      }
    }
  }, [session, currentTab]);

  // Modals & Active Selections
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [detailHospitalId, setDetailHospitalId] = useState<string | null>(null);
  
  // Booking Modal State
  const [bookingHospital, setBookingHospital] = useState<any | null>(null);
  const [bookingDoctor, setBookingDoctor] = useState<any | null>(null);

  // Active Doctor Consultation ID
  const [activeConsultationId, setActiveConsultationId] = useState<string | null>(null);

  const handleLogout = () => {
    setSession(null);
    setStoredSession(null);
    setCurrentTab('landing');
  };


  const handleOpenBooking = (hospital: any, doctor?: any) => {
    // If doctor not explicitly passed, find first participating doctor
    const docToBook = doctor || (hospital.participating_doctors && hospital.participating_doctors[0]) || {
      user_id: 'attending-consultant',
      full_name: 'Attending OPD Consultant',
      consultation_fee_inr: 250,
      available_time_slots: ['09:30 AM', '10:30 AM', '04:00 PM', '05:30 PM'],
    };

    setBookingHospital(hospital);
    setBookingDoctor(docToBook);
  };

  return (
    <div className="min-vh-100 d-flex flex-column" style={{ backgroundColor: 'var(--nexora-bg-body)' }}>
      {/* Navigation */}
      <Navbar
        currentTab={currentTab}
        onNavigate={(tab) => {
          let target = tab;
          if (session?.role === 'doctor' && (target === 'landing' || target === 'hospitals')) {
            target = 'doctor-dashboard';
          }
          setCurrentTab(target);
          if (target !== 'doctor-consultation') setActiveConsultationId(null);
        }}
        session={session}
        onLogout={handleLogout}
        onOpenAuthModal={() => setShowAuthModal(true)}
      />

      {/* Main Screen Views */}
      <main className="flex-grow-1">
        {currentTab === 'landing' && session?.role !== 'doctor' && (
          <LandingPage
            onExploreHospitals={() => setCurrentTab('hospitals')}
            onOpenAuth={() => setShowAuthModal(true)}
          />
        )}

        {currentTab === 'hospitals' && session?.role !== 'doctor' && (
          <HospitalDiscoveryView
            onSelectHospitalForBooking={(hospital, doctor) => handleOpenBooking(hospital, doctor)}
            onViewHospitalDetail={(hospId) => setDetailHospitalId(hospId)}
          />
        )}

        {currentTab === 'patient-dashboard' && (
          <PatientDashboardView
            onBookNew={() => setCurrentTab('hospitals')}
            onNavigateRecords={() => setCurrentTab('records')}
            onNavigateProfile={() => setCurrentTab('onboarding')}
          />
        )}

        {currentTab === 'onboarding' && <PatientOnboardingView />}

        {currentTab === 'records' && <MedicalRecordsView />}

        {currentTab === 'doctor-dashboard' && (
          <DoctorDashboardView
            onOpenConsultation={(apptId) => {
              setActiveConsultationId(apptId);
              setCurrentTab('doctor-consultation');
            }}
          />
        )}

        {currentTab === 'doctor-consultation' && activeConsultationId && (
          <DoctorConsultationView
            appointmentId={activeConsultationId}
            onBack={() => {
              setActiveConsultationId(null);
              setCurrentTab('doctor-dashboard');
            }}
          />
        )}

        {currentTab === 'doctor-availability' && <DoctorAvailabilityView />}

        {currentTab === 'settings' && (
          <SettingsPrivacyView session={session} onLogout={handleLogout} />
        )}
      </main>

      {/* Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={(sess) => {
          setSession(sess);
          setStoredSession(sess);
          if (sess.role === 'doctor') setCurrentTab('doctor-dashboard');
          else setCurrentTab('patient-dashboard');
        }}
      />


      <HospitalDetailModal
        hospitalId={detailHospitalId}
        onClose={() => setDetailHospitalId(null)}
        onBookDoctor={(hosp, doc) => {
          setDetailHospitalId(null);
          handleOpenBooking(hosp, doc);
        }}
      />

      {bookingHospital && bookingDoctor && (
        <AppointmentBookingModal
          hospital={bookingHospital}
          doctor={bookingDoctor}
          onClose={() => {
            setBookingHospital(null);
            setBookingDoctor(null);
          }}
          onBookingSuccess={() => {
            setCurrentTab('patient-dashboard');
          }}
          onSessionUpdate={(sess) => {
            setSession(sess);
          }}
        />
      )}

      {/* Footer */}
      <footer className="py-4 mt-auto border-top bg-white" style={{ borderColor: 'var(--nexora-border)' }}>
        <div className="container text-center text-muted small">
          <div className="brand-editorial fw-bold text-dark mb-1" style={{ fontSize: 16 }}>
            NEXORA HEALTHCARE PLATFORM
          </div>
          <div className="text-secondary">Find care. Share context. Prepare better. Initial Region: Kolhapur, Maharashtra, India.</div>
          <div className="mt-2 text-muted" style={{ fontSize: 12 }}>
            &copy; {new Date().getFullYear()} Nexora Healthcare Technologies. Clinical briefings require physician verification.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
