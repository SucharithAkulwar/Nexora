import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import {
  X,
  MapPin,
  Star,
  Phone,
  Clock,
  Calendar,
  Building2,
} from 'lucide-react';

interface HospitalDetailModalProps {
  hospitalId: string | null;
  onClose: () => void;
  onBookDoctor: (hospital: any, doctor: any) => void;
}

export const HospitalDetailModal: React.FC<HospitalDetailModalProps> = ({
  hospitalId,
  onClose,
  onBookDoctor,
}) => {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hospitalId) return;
    setLoading(true);
    api
      .getHospitalDetails(hospitalId)
      .then((data) => setDetails(data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [hospitalId]);

  if (!hospitalId) return null;

  return (
    <div
      className="modal fade show d-block"
      tabIndex={-1}
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', zIndex: 1050 }}
    >
      <div className="modal-dialog modal-dialog-centered modal-lg modal-dialog-scrollable">
        <div className="modal-content medical-card p-4 text-dark border-0 bg-white shadow-lg">
          <div className="d-flex justify-content-between align-items-start mb-3 pb-2 border-bottom">
            <div>
              <span className="badge badge-medical-blue mb-1">Facility Dossier</span>
              <h3 className="fw-bold brand-editorial text-dark m-0">
                {details?.name || 'Hospital Details'}
              </h3>
              <div className="d-flex align-items-center gap-1 text-secondary small mt-1">
                <MapPin size={14} style={{ color: 'var(--nexora-primary)' }} />
                <span>{details?.formatted_address}</span>
              </div>
            </div>
            <button className="btn btn-sm btn-outline-secondary p-1 rounded-circle" onClick={onClose} style={{ width: 32, height: 32 }}>
              <X size={16} />
            </button>
          </div>

          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" style={{ color: 'var(--nexora-primary)' }} role="status"></div>
            </div>
          ) : details ? (
            <div className="text-start">
              {/* Rating and Info Grid */}
              <div className="row g-3 mb-4">
                <div className="col-sm-4">
                  <div className="p-3 rounded bg-light border" style={{ borderColor: 'var(--nexora-border)' }}>
                    <span className="text-secondary small fw-semibold">Google Rating</span>
                    <div className="d-flex align-items-center gap-2 mt-1">
                      <Star size={20} fill="#B45309" color="#B45309" />
                      <span className="fs-4 fw-bold text-dark">{details.rating}</span>
                      <span className="text-secondary small">({details.user_rating_count} reviews)</span>
                    </div>
                  </div>
                </div>

                <div className="col-sm-4">
                  <div className="p-3 rounded bg-light border" style={{ borderColor: 'var(--nexora-border)' }}>
                    <span className="text-secondary small fw-semibold">Contact Reception</span>
                    <div className="mt-1">
                      <a href={`tel:${details.phone_number}`} className="fw-bold text-decoration-none" style={{ color: 'var(--nexora-primary)' }}>
                        <Phone size={14} className="me-1" />
                        {details.phone_number || '+91 231 264 1125'}
                      </a>
                    </div>
                  </div>
                </div>

                <div className="col-sm-4">
                  <div className="p-3 rounded bg-light border" style={{ borderColor: 'var(--nexora-border)' }}>
                    <span className="text-secondary small fw-semibold">Operation Hours</span>
                    <div className="text-success fw-bold mt-1 d-flex align-items-center gap-1">
                      <Clock size={14} />
                      <span>{details.open_now ? 'Open Now &bull; 24/7 Casualty' : 'Standard OPD Hours'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Participating Doctors Section */}
              <div className="mb-4">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <h5 className="fw-bold text-dark m-0 brand-editorial" style={{ fontSize: 18 }}>
                    Participating Physicians
                  </h5>
                  <span className="badge badge-medical-green">Direct Slot Booking</span>
                </div>

                {details.participating_doctors && details.participating_doctors.length > 0 ? (
                  <div className="d-flex flex-column gap-2">
                    {details.participating_doctors.map((doc: any) => (
                      <div
                        key={doc.id || doc._id}
                        className="p-3 rounded d-flex justify-content-between align-items-center flex-wrap gap-2 border bg-white"
                        style={{ borderColor: 'var(--nexora-border)' }}
                      >
                        <div>
                          <div className="fw-bold text-dark fs-6">{doc.full_name}</div>
                          <div className="text-secondary small">{doc.specialty} &bull; {doc.experience_years} Years Experience</div>
                          <div className="text-muted" style={{ fontSize: 12 }}>
                            Reg: {doc.registration_number || 'MMC Verified'} &bull; Fee: &#8377;{doc.consultation_fee_inr}
                          </div>
                        </div>

                        <button
                          className="btn btn-sm btn-primary-medical d-flex align-items-center gap-1 px-3"
                          onClick={() => {
                            onClose();
                            onBookDoctor(details, doc);
                          }}
                        >
                          <Calendar size={14} />
                          <span>Book Slot (&#8377;{doc.consultation_fee_inr})</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 rounded bg-light text-secondary small border" style={{ borderColor: 'var(--nexora-border)' }}>
                    This hospital has not yet enrolled online doctor slots in Nexora. You may contact them directly via telephone or visit the casualty OPD.
                  </div>
                )}
              </div>

              {/* Verified Google Maps Reviews */}
              {details.reviews && details.reviews.length > 0 && (
                <div>
                  <h5 className="fw-bold text-dark mb-2 brand-editorial" style={{ fontSize: 18 }}>
                    Public Reviews from Google Maps
                  </h5>
                  <div className="d-flex flex-column gap-2">
                    {details.reviews.map((rev: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded border bg-light"
                        style={{ borderColor: 'var(--nexora-border)' }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="fw-bold text-dark small">{rev.author_name}</span>
                          <div className="d-flex align-items-center gap-1 text-warning small">
                            <Star size={12} fill="#B45309" color="#B45309" />
                            <span className="fw-bold text-dark">{rev.rating}</span>
                          </div>
                        </div>
                        <p className="text-secondary small m-0 fst-italic">"{rev.text}"</p>
                        {rev.relative_time_description && (
                          <div className="text-end text-muted" style={{ fontSize: 11 }}>
                            {rev.relative_time_description}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
