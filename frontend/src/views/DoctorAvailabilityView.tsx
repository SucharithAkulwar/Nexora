import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  Clock,
  Save,
} from 'lucide-react';

export const DoctorAvailabilityView: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSlot, setNewSlot] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    loadDoctorProfile();
  }, []);

  const loadDoctorProfile = async () => {
    setLoading(true);
    try {
      const data = await api.getMyDoctorProfile();
      setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleDay = (day: string) => {
    const current = profile.available_days || [];
    if (current.includes(day)) {
      setProfile({ ...profile, available_days: current.filter((d: string) => d !== day) });
    } else {
      setProfile({ ...profile, available_days: [...current, day] });
    }
  };

  const addSlot = () => {
    if (newSlot.trim()) {
      const current = profile.available_time_slots || [];
      if (!current.includes(newSlot.trim())) {
        setProfile({ ...profile, available_time_slots: [...current, newSlot.trim()] });
      }
      setNewSlot('');
    }
  };

  const removeSlot = (slot: string) => {
    setProfile({
      ...profile,
      available_time_slots: (profile.available_time_slots || []).filter((s: string) => s !== slot),
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateMyDoctorProfile({
        consultation_fee_inr: profile.consultation_fee_inr,
        available_days: profile.available_days,
        available_time_slots: profile.available_time_slots,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      loadDoctorProfile();
    } catch (err) {
      alert('Could not update doctor availability.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" style={{ color: 'var(--nexora-primary)' }} role="status"></div>
      </div>
    );
  }

  return (
    <div className="container py-4 text-start" style={{ maxWidth: 780 }}>
      <div className="mb-4">
        <span className="badge badge-medical-blue mb-1">Physician Schedule</span>
        <h2 className="fw-bold brand-editorial text-dark m-0">Appointment Availability & Pricing</h2>
        <p className="text-secondary small m-0">
          Configure active clinic days, bookable consultation time slots, and consultation fee in INR.
        </p>
      </div>

      <form onSubmit={handleSave} className="medical-card p-4 bg-white shadow-sm">
        {/* Fee */}
        <div className="mb-4">
          <label className="form-label text-secondary small fw-semibold">Consultation Fee (INR &#8377;)</label>
          <input
            type="number"
            className="form-control form-control-medical"
            style={{ maxWidth: 200 }}
            value={profile?.consultation_fee_inr || 300}
            onChange={(e) => setProfile({ ...profile, consultation_fee_inr: Number(e.target.value) })}
            required
          />
        </div>

        {/* Working Days */}
        <div className="mb-4">
          <label className="form-label text-secondary small fw-semibold mb-2">Available Consultation Days</label>
          <div className="d-flex flex-wrap gap-2">
            {daysOfWeek.map((day) => {
              const active = (profile?.available_days || []).includes(day);
              return (
                <button
                  type="button"
                  key={day}
                  className={`btn btn-sm ${active ? 'btn-primary-medical' : 'btn-outline-medical'}`}
                  onClick={() => toggleDay(day)}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Available Time Slots */}
        <div className="mb-4">
          <label className="form-label text-secondary small fw-semibold mb-2">Available Daily Time Slots</label>
          <div className="d-flex flex-wrap gap-2 mb-3">
            {(profile?.available_time_slots || []).map((slot: string) => (
              <span key={slot} className="badge badge-medical-blue d-flex align-items-center gap-2 py-2 px-3 fs-6">
                <Clock size={13} />
                <span>{slot}</span>
                <button
                  type="button"
                  className="btn-close ms-1"
                  style={{ fontSize: 9 }}
                  onClick={() => removeSlot(slot)}
                />
              </span>
            ))}
          </div>

          <div className="input-group" style={{ maxWidth: 360 }}>
            <input
              type="text"
              className="form-control form-control-medical"
              placeholder="e.g. 02:30 PM"
              value={newSlot}
              onChange={(e) => setNewSlot(e.target.value)}
            />
            <button type="button" className="btn btn-outline-medical" onClick={addSlot}>
              + Add Slot
            </button>
          </div>
        </div>

        <button type="submit" className="btn btn-primary-medical px-4 py-2 d-flex align-items-center gap-2" disabled={saving}>
          <Save size={16} />
          <span>{saving ? 'Updating Schedule...' : 'Save Availability & Pricing'}</span>
        </button>

        {saveSuccess && (
          <div className="alert alert-success mt-3 py-2 small text-center">
            Schedule updated successfully! Patient booking calendar refreshed.
          </div>
        )}
      </form>
    </div>
  );
};
