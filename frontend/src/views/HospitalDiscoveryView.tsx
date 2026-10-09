import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { HospitalMap } from '../components/HospitalMap';
import {
  Search,
  MapPin,
  Star,
  Info,
  Calendar,
  Layers,
  List,
  Map as MapIcon,
  ShieldCheck,
  Building2,
  ExternalLink,
} from 'lucide-react';

interface HospitalDiscoveryViewProps {
  onSelectHospitalForBooking: (hospital: any, doctor?: any) => void;
  onViewHospitalDetail: (hospitalId: string) => void;
}

export const HospitalDiscoveryView: React.FC<HospitalDiscoveryViewProps> = ({
  onSelectHospitalForBooking,
  onViewHospitalDetail,
}) => {
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [localities, setLocalities] = useState<Array<{ name: string; value: string }>>([]);
  const [selectedLocality, setSelectedLocality] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'rating' | 'distance'>('rating');
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [discoveryMeta, setDiscoveryMeta] = useState<any>(null);

  useEffect(() => {
    loadLocalities();
    loadHospitals();
  }, [selectedLocality, sortBy]);

  const loadLocalities = async () => {
    try {
      const locs = await api.getLocalities();
      setLocalities(locs);
    } catch {
      // fallback
    }
  };

  const loadHospitals = async () => {
    setLoading(true);
    try {
      const res = await api.discoverHospitals({
        locality: selectedLocality,
        query: searchQuery,
        sort_by: sortBy,
      });
      setHospitals(res.hospitals || []);
      setDiscoveryMeta(res);
      if (res.hospitals && res.hospitals.length > 0 && !selectedHospitalId) {
        setSelectedHospitalId(res.hospitals[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadHospitals();
  };

  return (
    <div className="container py-4">
      {/* Header and Live Google Places notice */}
      <div className="text-start mb-4">
        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
          <div>
            <h2 className="fw-bold brand-editorial text-dark mb-1">
              Kolhapur Hospital & Clinic Directory
            </h2>
            <p className="text-secondary small mb-0">
              Verified healthcare facilities, medical colleges, and specialist centers across Kolhapur, Maharashtra.
            </p>
          </div>

          {/* View Mode Switches */}
          <div className="btn-group btn-group-sm p-1 bg-white border rounded" style={{ borderColor: 'var(--nexora-border)' }}>
            <button
              className={`btn btn-sm ${viewMode === 'split' ? 'btn-primary-medical' : 'btn-light text-secondary'}`}
              onClick={() => setViewMode('split')}
            >
              <Layers size={14} className="me-1" /> Split View
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary-medical' : 'btn-light text-secondary'}`}
              onClick={() => setViewMode('list')}
            >
              <List size={14} className="me-1" /> List Only
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'map' ? 'btn-primary-medical' : 'btn-light text-secondary'}`}
              onClick={() => setViewMode('map')}
            >
              <MapIcon size={14} className="me-1" /> Map Only
            </button>
          </div>
        </div>

        {/* Discovery Source & Policy Attribution Notice */}
        <div
          className="p-3 rounded bg-white border d-flex align-items-center justify-content-between flex-wrap gap-2"
          style={{ borderColor: 'var(--nexora-border)' }}
        >
          <div className="d-flex align-items-center gap-2">
            <Info size={18} style={{ color: 'var(--nexora-primary)' }} />
            <span className="small text-dark">
              <strong>Source:</strong> {discoveryMeta?.is_live_google ? 'Google Maps Platform Places API (New)' : 'Verified Kolhapur Healthcare Facility Catalog (Offline Mode)'}
            </span>
          </div>
          <span className="text-muted" style={{ fontSize: 12 }}>
            {discoveryMeta?.notice}
          </span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <form onSubmit={handleSearchSubmit} className="medical-card p-3 mb-4 bg-white">
        <div className="row g-2 align-items-center">
          <div className="col-md-5">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 text-secondary" style={{ borderColor: '#CBD5E1' }}>
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-control form-control-medical border-start-0 ps-0"
                placeholder="Search hospital name, CPR, cardiology, clinic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="col-md-4">
            <select
              className="form-select form-select-medical"
              value={selectedLocality}
              onChange={(e) => setSelectedLocality(e.target.value)}
            >
              <option value="">All Kolhapur Localities</option>
              {localities.map((loc) => (
                <option key={loc.value} value={loc.value}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="col-md-3 d-flex gap-2">
            <select
              className="form-select form-select-medical"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="rating">Sort: Google Rating &#9733;</option>
              <option value="distance">Sort: Distance (km)</option>
            </select>
            <button type="submit" className="btn btn-primary-medical px-3 text-nowrap">
              Filter
            </button>
          </div>
        </div>
      </form>

      {/* Main Content Layout */}
      <div className="row g-4">
        {/* Left Side: Hospital List */}
        {(viewMode === 'split' || viewMode === 'list') && (
          <div className={viewMode === 'split' ? 'col-lg-6' : 'col-12'}>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <span className="text-secondary small fw-semibold">
                Showing {hospitals.length} healthcare facilities in Kolhapur
              </span>
            </div>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border" style={{ color: 'var(--nexora-primary)' }} role="status"></div>
                <div className="text-secondary small mt-2">Loading verified facilities...</div>
              </div>
            ) : hospitals.length === 0 ? (
              <div className="medical-card p-5 text-center text-secondary bg-white">
                <Building2 size={36} className="mb-2" style={{ color: 'var(--nexora-primary)' }} />
                <h5 className="text-dark">No facilities found</h5>
                <p className="small mb-0">Try clearing the search query or locality filter.</p>
              </div>
            ) : (
              <div className="d-flex flex-column gap-3" style={{ maxHeight: viewMode === 'split' ? '700px' : 'none', overflowY: 'auto' }}>
                {hospitals.map((hosp) => {
                  const isSelected = hosp.id === selectedHospitalId;
                  return (
                    <div
                      key={hosp.id}
                      className="medical-card p-3 text-start bg-white"
                      style={{
                        borderColor: isSelected ? 'var(--nexora-primary)' : 'var(--nexora-border)',
                        boxShadow: isSelected ? '0 4px 16px rgba(0, 50, 154, 0.12)' : undefined,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onClick={() => setSelectedHospitalId(hosp.id)}
                    >
                      <div className="d-flex justify-content-between align-items-start gap-2 mb-2">
                        <div>
                          <h5 className="fw-bold text-dark mb-1" style={{ fontSize: 16 }}>
                            {hosp.name}
                          </h5>
                          <div className="d-flex align-items-center gap-1 text-secondary small">
                            <MapPin size={13} style={{ color: 'var(--nexora-primary)' }} />
                            <span>{hosp.locality} &bull; {hosp.formatted_address}</span>
                          </div>
                        </div>

                        {/* Google Rating Pill */}
                        <div className="d-flex align-items-center gap-1 badge badge-medical-amber px-2 py-1 flex-shrink-0">
                          <Star size={13} fill="#B45309" />
                          <span className="fw-bold" style={{ fontSize: 12 }}>{hosp.rating}</span>
                          <span className="text-secondary" style={{ fontSize: 10 }}>({hosp.user_rating_count})</span>
                        </div>
                      </div>

                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 pt-2 border-top mt-2">
                        <div className="d-flex align-items-center gap-2">
                          {hosp.distance_km && (
                            <span className="text-secondary" style={{ fontSize: 12 }}>
                              <strong>{hosp.distance_km} km</strong> away
                            </span>
                          )}

                          {hosp.has_nexora_doctors ? (
                            <span className="badge badge-medical-green d-flex align-items-center gap-1">
                              <ShieldCheck size={12} />
                              <span>{hosp.bookable_doctors_count} Participating Doctor(s)</span>
                            </span>
                          ) : (
                            <span className="badge bg-light text-secondary border">
                              Facility Directory
                            </span>
                          )}
                        </div>

                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-sm btn-soft-medical"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewHospitalDetail(hosp.id);
                            }}
                          >
                            Details & Reviews
                          </button>

                          {hosp.has_nexora_doctors ? (
                            <button
                              className="btn btn-sm btn-primary-medical"
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectHospitalForBooking(hosp);
                              }}
                            >
                              <Calendar size={13} className="me-1" />
                              Book Consultation
                            </button>
                          ) : (
                            <a
                              href={hosp.website || `tel:${hosp.phone_number}`}
                              className="btn btn-sm btn-outline-medical"
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink size={12} className="me-1" /> Contact
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Right Side: Map */}
        {(viewMode === 'split' || viewMode === 'map') && (
          <div className={viewMode === 'split' ? 'col-lg-6' : 'col-12'}>
            <div className="sticky-top" style={{ top: '85px' }}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span className="small fw-bold" style={{ color: 'var(--nexora-primary)' }}>
                  Interactive Kolhapur Medical Map
                </span>
                <span className="text-secondary small">Click markers to view facility</span>
              </div>
              <div className="border rounded-3 overflow-hidden bg-white shadow-sm" style={{ height: '650px', borderColor: 'var(--nexora-border)' }}>
                <HospitalMap
                  hospitals={hospitals}
                  selectedHospitalId={selectedHospitalId}
                  onSelectHospital={(id) => {
                    setSelectedHospitalId(id);
                    const h = hospitals.find((item) => item.id === id);
                    if (h) onViewHospitalDetail(id);
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
