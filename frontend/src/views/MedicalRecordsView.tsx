import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import {
  FileText,
  Trash2,
  Brain,
  Calendar,
  Building2,
  Plus,
  X,
} from 'lucide-react';

export const MedicalRecordsView: React.FC = () => {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload Form
  const [title, setTitle] = useState('');
  const [recordType, setRecordType] = useState('Laboratory');
  const [facilityName, setFacilityName] = useState('Kolhapur Diagnostic Center');
  const [recordDate, setRecordDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [extractedText, setExtractedText] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadRecords();
  }, []);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await api.getMyMedicalRecords();
      setRecords(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('record_type', recordType);
      formData.append('facility_name', facilityName);
      formData.append('date', recordDate);
      formData.append('extracted_text', extractedText);

      await api.uploadMedicalRecord(formData);
      setShowUploadModal(false);
      setTitle('');
      setExtractedText('');
      loadRecords();
    } catch (err: any) {
      alert(err.message || 'Failed to upload medical record.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (recordId: string) => {
    if (!window.confirm('Are you sure you want to delete this medical record and its RAG vector chunks?')) return;
    try {
      await api.deleteMedicalRecord(recordId);
      loadRecords();
    } catch (err) {
      alert('Could not delete record.');
    }
  };

  return (
    <div className="container py-4 text-start">
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge badge-medical-blue">Patient-Isolated Vault</span>
            <span className="text-secondary small">&bull; RAG Ingestion Pipeline</span>
          </div>
          <h2 className="fw-bold brand-editorial text-dark m-0">Medical Records & Diagnostic Reports</h2>
          <p className="text-secondary small m-0">
            Records are chunked and vector-indexed strictly for your authorized consultations.
          </p>
        </div>

        <button className="btn btn-primary-medical btn-sm d-flex align-items-center gap-2" onClick={() => setShowUploadModal(true)}>
          <Plus size={16} />
          <span>Upload Medical Record</span>
        </button>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" style={{ color: 'var(--nexora-primary)' }} role="status"></div>
        </div>
      ) : records.length === 0 ? (
        <div className="medical-card p-5 text-center text-secondary bg-white">
          <FileText size={36} className="mb-2" style={{ color: 'var(--nexora-primary)' }} />
          <h5 className="text-dark">No medical records uploaded yet</h5>
          <p className="small mb-3">Upload CBC reports, imaging summaries, or prescriptions to enrich AI pre-consultation briefings.</p>
          <button className="btn btn-primary-medical btn-sm" onClick={() => setShowUploadModal(true)}>
            Upload First Record
          </button>
        </div>
      ) : (
        <div className="row g-3">
          {records.map((rec) => (
            <div key={rec._id} className="col-lg-6">
              <div className="medical-card p-3 h-100 position-relative bg-white shadow-sm">
                <div className="d-flex justify-content-between align-items-start mb-2">
                  <div>
                    <h5 className="fw-bold text-dark m-0" style={{ fontSize: 16 }}>{rec.title}</h5>
                    <div className="small d-flex align-items-center gap-1 mt-1" style={{ color: 'var(--nexora-primary)' }}>
                      <Building2 size={13} />
                      <span>{rec.facility_name || 'Kolhapur Medical Center'}</span>
                    </div>
                  </div>
                  <span className="badge badge-medical-blue">{rec.record_type}</span>
                </div>

                <div className="d-flex align-items-center gap-3 text-secondary small mb-2" style={{ fontSize: 12 }}>
                  <span><Calendar size={12} className="me-1" />{rec.date}</span>
                  <span className="badge badge-medical-green d-flex align-items-center gap-1" style={{ fontSize: 11 }}>
                    <Brain size={11} /> Vector Indexed for RAG
                  </span>
                </div>

                <div className="p-2 rounded mb-3 small bg-light border" style={{ borderColor: 'var(--nexora-border)', color: '#334155', fontSize: 12, maxHeight: 110, overflowY: 'auto' }}>
                  {rec.extracted_text}
                </div>

                <div className="d-flex justify-content-between align-items-center pt-2 border-top">
                  <span className="text-muted" style={{ fontSize: 11 }}>
                    Source: {rec.source}
                  </span>
                  <button
                    className="btn btn-sm btn-outline-danger p-1 px-2 d-flex align-items-center gap-1"
                    style={{ fontSize: 12 }}
                    onClick={() => handleDelete(rec._id)}
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div
          className="modal fade show d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', backdropFilter: 'blur(4px)', zIndex: 1060 }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content medical-card p-4 text-dark border-0 bg-white shadow-lg">
              <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                <h4 className="fw-bold brand-editorial text-dark m-0">Upload Medical Document</h4>
                <button className="btn btn-sm btn-outline-secondary p-1 rounded-circle" onClick={() => setShowUploadModal(false)} style={{ width: 32, height: 32 }}>
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleUploadSubmit}>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-semibold">Report Title *</label>
                    <input
                      type="text"
                      className="form-control form-control-medical"
                      placeholder="e.g. Complete Blood Count & Dengue Serology"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-semibold">Record Category</label>
                    <select
                      className="form-select form-select-medical"
                      value={recordType}
                      onChange={(e) => setRecordType(e.target.value)}
                    >
                      <option value="Laboratory">Laboratory / Pathology</option>
                      <option value="Imaging">Imaging / Radiology (X-Ray, MRI)</option>
                      <option value="Prescription">Prescription</option>
                      <option value="Discharge Summary">Discharge Summary</option>
                    </select>
                  </div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-semibold">Diagnostic Center / Hospital Name</label>
                    <input
                      type="text"
                      className="form-control form-control-medical"
                      placeholder="e.g. CPR Hospital Diagnostic Lab"
                      value={facilityName}
                      onChange={(e) => setFacilityName(e.target.value)}
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label text-secondary small fw-semibold">Report Date</label>
                    <input
                      type="date"
                      className="form-control form-control-medical"
                      value={recordDate}
                      onChange={(e) => setRecordDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label text-secondary small fw-semibold">
                    Clinical Report Text / Extracted Lab Values *
                  </label>
                  <textarea
                    rows={5}
                    className="form-control form-control-medical"
                    placeholder="Paste or type lab readings: e.g. Hemoglobin 14.2 g/dL, TLC 11,400 /mcL, Dengue NS1 Negative, Widal 1:40..."
                    value={extractedText}
                    onChange={(e) => setExtractedText(e.target.value)}
                    required
                  />
                  <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                    Sanitized automatically against prompt injections. Text is chunked and stored in patient-isolated RAG storage.
                  </div>
                </div>

                <div className="d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowUploadModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary-medical px-4" disabled={uploading}>
                    {uploading ? 'Processing & Vector Indexing...' : 'Upload & Index for RAG'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
