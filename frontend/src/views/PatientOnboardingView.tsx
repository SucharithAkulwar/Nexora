import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  AlertTriangle,
  Save,
} from 'lucide-react';

export const PatientOnboardingView: React.FC = () => {
  const [profile, setProfile] = useState<any>({
    full_name: '',
    age: '',
    gender: 'Male',
    blood_group: 'Unknown',
    contact_phone: '',
    city: 'Kolhapur',
    locality: '',
    allergies: [],
    medical_history: [],
    current_medications: [],
    emergency_contact: {
      name: '',
      relationship: '',
      phone: '',
    },
  });

  const [allergyInput, setAllergyInput] = useState('');
  const [historyInput, setHistoryInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await api.getPatientProfile();
      if (data) setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updatePatientProfile(profile);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      loadProfile();
    } catch (err) {
      alert('Could not update profile.');
    } finally {
      setSaving(false);
    }
  };

  const addAllergy = () => {
    if (allergyInput.trim()) {
      setProfile({ ...profile, allergies: [...(profile.allergies || []), allergyInput.trim()] });
      setAllergyInput('');
    }
  };

  const removeAllergy = (idx: number) => {
    setProfile({
      ...profile,
      allergies: profile.allergies.filter((_: any, i: number) => i !== idx),
    });
  };

  const addHistory = () => {
    if (historyInput.trim()) {
      setProfile({ ...profile, medical_history: [...(profile.medical_history || []), historyInput.trim()] });
      setHistoryInput('');
    }
  };

  const removeHistory = (idx: number) => {
    setProfile({
      ...profile,
      medical_history: profile.medical_history.filter((_: any, i: number) => i !== idx),
    });
  };

  return (
    <div className="container py-4 text-start" style={{ maxWidth: 780 }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <span className="badge badge-medical-blue mb-1">Clinical Intake Profile</span>
          <h2 className="fw-bold brand-editorial text-dark m-0">Patient Medical Baseline Dossier</h2>
          <p className="text-secondary small m-0">
            Collected with explicit consent to help doctors prepare accurate clinical summaries before consultations.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: 'var(--nexora-primary)' }} role="status"></div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="medical-card p-4 bg-white shadow-sm">
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label text-secondary small fw-semibold">Full Legal Name</label>
              <input
                type="text"
                className="form-control form-control-medical"
                value={profile.full_name || ''}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                required
              />
            </div>

            <div className="col-md-3">
              <label className="form-label text-secondary small fw-semibold">Age</label>
              <input
                type="number"
                className="form-control form-control-medical"
                value={profile.age || ''}
                onChange={(e) => setProfile({ ...profile, age: Number(e.target.value) })}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label text-secondary small fw-semibold">Gender</label>
              <select
                className="form-select form-select-medical"
                value={profile.gender || 'Male'}
                onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <label className="form-label text-secondary small fw-semibold">Blood Group</label>
              <select
                className="form-select form-select-medical"
                value={profile.blood_group || 'B+'}
                onChange={(e) => setProfile({ ...profile, blood_group: e.target.value })}
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="Unknown">Unknown / Optional</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label text-secondary small fw-semibold">Contact Phone</label>
              <input
                type="text"
                className="form-control form-control-medical"
                value={profile.contact_phone || ''}
                onChange={(e) => setProfile({ ...profile, contact_phone: e.target.value })}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label text-secondary small fw-semibold">Locality in Kolhapur</label>
              <input
                type="text"
                className="form-control form-control-medical"
                value={profile.locality || ''}
                placeholder="e.g. Rajarampuri, Shahupuri, Tarabai Park"
                onChange={(e) => setProfile({ ...profile, locality: e.target.value })}
              />
            </div>
          </div>

          {/* Allergies - Critical Warning */}
          <div className="mb-4">
            <label className="form-label text-danger small fw-bold">
              <AlertTriangle size={14} className="me-1" />
              Known Drug & Food Allergies (Will be highlighted to doctors)
            </label>
            <div className="d-flex flex-wrap gap-2 mb-2">
              {(profile.allergies || []).map((all: string, idx: number) => (
                <span key={idx} className="badge badge-medical-red d-flex align-items-center gap-2 py-1 px-2">
                  <span>{all}</span>
                  <button type="button" className="btn-close" style={{ fontSize: 9 }} onClick={() => removeAllergy(idx)} />
                </span>
              ))}
            </div>
            <div className="input-group">
              <input
                type="text"
                className="form-control form-control-medical"
                placeholder="Add an allergy (e.g. Penicillin, Sulfa drugs, Peanuts)"
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
              />
              <button type="button" className="btn btn-outline-medical" onClick={addAllergy}>
                + Add Allergy
              </button>
            </div>
          </div>

          {/* Chronic Medical Conditions */}
          <div className="mb-4">
            <label className="form-label text-secondary small fw-semibold">
              Relevant Medical History (Past illnesses, chronic conditions)
            </label>
            <div className="d-flex flex-wrap gap-2 mb-2">
              {(profile.medical_history || []).map((h: string, idx: number) => (
                <span key={idx} className="badge badge-medical-blue d-flex align-items-center gap-2 py-1 px-2">
                  <span>{h}</span>
                  <button type="button" className="btn-close" style={{ fontSize: 9 }} onClick={() => removeHistory(idx)} />
                </span>
              ))}
            </div>
            <div className="input-group">
              <input
                type="text"
                className="form-control form-control-medical"
                placeholder="e.g. Childhood Asthma, Hypertension, Migraines"
                value={historyInput}
                onChange={(e) => setHistoryInput(e.target.value)}
              />
              <button type="button" className="btn btn-outline-medical" onClick={addHistory}>
                + Add Condition
              </button>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="p-3 rounded bg-light border mb-4" style={{ borderColor: 'var(--nexora-border)' }}>
            <h6 className="fw-bold text-dark mb-2">Emergency Contact (Optional)</h6>
            <div className="row g-2">
              <div className="col-md-5">
                <input
                  type="text"
                  className="form-control form-control-medical"
                  placeholder="Contact Name"
                  value={profile.emergency_contact?.name || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      emergency_contact: { ...(profile.emergency_contact || {}), name: e.target.value },
                    })
                  }
                />
              </div>
              <div className="col-md-3">
                <input
                  type="text"
                  className="form-control form-control-medical"
                  placeholder="Relationship"
                  value={profile.emergency_contact?.relationship || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      emergency_contact: { ...(profile.emergency_contact || {}), relationship: e.target.value },
                    })
                  }
                />
              </div>
              <div className="col-md-4">
                <input
                  type="text"
                  className="form-control form-control-medical"
                  placeholder="Emergency Phone"
                  value={profile.emergency_contact?.phone || ''}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      emergency_contact: { ...(profile.emergency_contact || {}), phone: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary-medical w-100 py-2 d-flex align-items-center justify-content-center gap-2" disabled={saving}>
            <Save size={16} />
            <span>{saving ? 'Saving Medical Profile...' : 'Save & Update Patient Profile'}</span>
          </button>

          {savedSuccess && (
            <div className="alert alert-success mt-3 py-2 text-center small">
              Patient profile saved successfully!
            </div>
          )}
        </form>
      )}
    </div>
  );
};
