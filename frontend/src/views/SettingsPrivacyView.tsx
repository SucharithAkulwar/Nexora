import React, { useState, useEffect } from 'react';
import { api, UserSession } from '../api/client';
import {
  Shield,
  Lock,
  Eye,
  CheckCircle2,
  Server,
  LogOut,
  RefreshCw,
} from 'lucide-react';

interface SettingsPrivacyViewProps {
  session: UserSession | null;
  onLogout: () => void;
}

export const SettingsPrivacyView: React.FC<SettingsPrivacyViewProps> = ({
  session,
  onLogout,
}) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [consentGranted, setConsentGranted] = useState(true);
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    loadAuditLogs();
    api.getHealth().then(setHealth).catch(() => {});
  }, []);

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4 text-start" style={{ maxWidth: 880 }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <span className="badge badge-medical-blue mb-1">Governance & Security</span>
          <h2 className="fw-bold brand-editorial text-dark m-0">Settings, Privacy & Audit Trail</h2>
          <p className="text-secondary small m-0">
            Compliance with clinical data privacy standards, role boundaries, and record access logs.
          </p>
        </div>
        {session && (
          <button className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1" onClick={onLogout}>
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        )}
      </div>

      {/* Security Status Card */}
      <div className="medical-card p-4 mb-4 bg-white shadow-sm">
        <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2 brand-editorial" style={{ fontSize: 18 }}>
          <Shield size={20} style={{ color: 'var(--nexora-primary)' }} />
          <span>System Security & Data Boundary Status</span>
        </h5>

        <div className="row g-3">
          <div className="col-md-4">
            <div className="p-3 rounded bg-light border" style={{ borderColor: 'var(--nexora-border)' }}>
              <span className="text-secondary small">Authentication</span>
              <div className="text-success fw-bold d-flex align-items-center gap-1 mt-1">
                <CheckCircle2 size={16} />
                <span>JWT HS256 & Bcrypt</span>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="p-3 rounded bg-light border" style={{ borderColor: 'var(--nexora-border)' }}>
              <span className="text-secondary small">RAG Vector Boundary</span>
              <div className="fw-bold d-flex align-items-center gap-1 mt-1" style={{ color: 'var(--nexora-primary)' }}>
                <Lock size={16} />
                <span>Strict Patient Isolation</span>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="p-3 rounded bg-light border" style={{ borderColor: 'var(--nexora-border)' }}>
              <span className="text-secondary small">Google Places API</span>
              <div className="text-dark fw-bold d-flex align-items-center gap-1 mt-1">
                <Server size={16} style={{ color: 'var(--nexora-primary)' }} />
                <span>{health?.google_places_configured ? 'Live Places (New)' : 'Verified Kolhapur Catalog'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Patient Privacy Consent Controls */}
      <div className="medical-card p-4 mb-4 bg-white shadow-sm">
        <h5 className="fw-bold text-dark mb-2 brand-editorial" style={{ fontSize: 18 }}>
          Clinical Data Processing & Consent
        </h5>
        <p className="text-secondary small mb-3">
          Nexora strictly processes symptom questionnaires and uploaded documents for pre-consultation briefings. Identifiable health data is never shared with third-party advertising networks.
        </p>

        <div className="form-check form-switch mb-2">
          <input
            className="form-check-input"
            type="checkbox"
            id="consentSwitch"
            checked={consentGranted}
            onChange={(e) => setConsentGranted(e.target.checked)}
          />
          <label className="form-check-label text-dark small fw-semibold" htmlFor="consentSwitch">
            Consent to AI-Assisted Clinical Intake Synthesis for Consultations
          </label>
        </div>
        <div className="text-muted" style={{ fontSize: 12 }}>
          Authorizes the attending physician to review synthesized clinical briefings before appointment starts.
        </div>
      </div>

      {/* Security Audit Trail Log Table */}
      <div className="medical-card p-4 bg-white shadow-sm">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold text-dark m-0 d-flex align-items-center gap-2 brand-editorial" style={{ fontSize: 18 }}>
              <Eye size={18} style={{ color: 'var(--nexora-primary)' }} />
              <span>Immutable Record Access Audit Trail</span>
            </h5>
            <span className="text-secondary small">Records every clinical dossier access, booking, and physician verification.</span>
          </div>
          <button className="btn btn-sm btn-outline-medical d-flex align-items-center gap-1" onClick={loadAuditLogs}>
            <RefreshCw size={13} />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border" style={{ color: 'var(--nexora-primary)' }} role="status"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center text-muted py-3 small">
            No audit events recorded yet in this session.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" style={{ fontSize: 13 }}>
              <thead className="table-light">
                <tr className="text-secondary">
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Role</th>
                  <th>Resource</th>
                  <th>Identifier</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id || log.id}>
                    <td className="text-muted">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td>
                      <span className="badge badge-medical-blue">{log.action}</span>
                    </td>
                    <td className="text-capitalize fw-semibold text-dark">{log.user_role}</td>
                    <td className="text-secondary">{log.resource_type}</td>
                    <td className="text-dark font-monospace" style={{ fontSize: 11 }}>{log.resource_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
