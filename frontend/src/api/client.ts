/**
 * Nexora Healthcare Platform API Client
 */

const API_BASE = '/api/v1';

export interface UserSession {
  user_id: string;
  role: 'patient' | 'doctor' | 'admin';
  full_name: string;
  email: string;
  access_token: string;
}

export function getStoredSession(): UserSession | null {
  try {
    const raw = localStorage.getItem('nexora_session');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredSession(session: UserSession | null) {
  if (session) {
    localStorage.setItem('nexora_session', JSON.stringify(session));
  } else {
    localStorage.removeItem('nexora_session');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const session = getStoredSession();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = `Request failed (${response.status})`;
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch {
      // ignore
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Auth
  devLogin: (role: 'patient' | 'doctor', preset?: string) =>
    request<UserSession>('/auth/dev-login', {
      method: 'POST',
      body: JSON.stringify({ role, preset }),
    }),

  login: (email: string, password: string) =>
    request<UserSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  register: (payload: {
    email: string;
    password: string;
    full_name: string;
    role: string;
    hospital_name?: string;
    hospital_id?: string;
    specialty?: string;
    qualifications?: string;
    experience_years?: number;
    consultation_fee_inr?: number;
  }) =>
    request<UserSession>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () => request<any>('/auth/me'),

  // Patient Profile
  getPatientProfile: () => request<any>('/patients/me/profile'),
  updatePatientProfile: (data: any) =>
    request<any>('/patients/me/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Hospitals & Google Places
  discoverHospitals: (params: {
    lat?: number;
    lng?: number;
    locality?: string;
    query?: string;
    sort_by?: string;
  }) => {
    const search = new URLSearchParams();
    if (params.lat) search.append('lat', params.lat.toString());
    if (params.lng) search.append('lng', params.lng.toString());
    if (params.locality) search.append('locality', params.locality);
    if (params.query) search.append('query', params.query);
    if (params.sort_by) search.append('sort_by', params.sort_by);
    return request<any>(`/hospitals/?${search.toString()}`);
  },

  getLocalities: () => request<Array<{ name: string; value: string }>>('/hospitals/localities'),
  getHospitalDetails: (id: string) => request<any>(`/hospitals/${id}`),

  // Doctors
  listDoctors: (params?: { hospital_id?: string; specialty?: string }) => {
    const search = new URLSearchParams();
    if (params?.hospital_id) search.append('hospital_id', params.hospital_id);
    if (params?.specialty) search.append('specialty', params.specialty);
    return request<any[]>(`/doctors/?${search.toString()}`);
  },
  getDoctor: (id: string) => request<any>(`/doctors/${id}`),
  getMyDoctorProfile: () => request<any>('/doctors/me/profile'),
  updateMyDoctorProfile: (data: any) =>
    request<any>('/doctors/me/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  getMyPatients: () => request<any[]>('/doctors/me/patients'),
  getAuthorizedPatientRecords: (patientId: string) =>
    request<any>(`/doctors/patient/${patientId}/records`),

  // Appointments
  bookAppointment: (payload: any) =>
    request<any>('/appointments/book', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getMyPatientAppointments: () => request<any[]>('/appointments/patient/my'),
  getMyDoctorAppointments: () => request<any[]>('/appointments/doctor/my'),
  getAppointmentDetails: (id: string) => request<any>(`/appointments/${id}`),
  updateAppointmentStatus: (id: string, status: string) =>
    request<any>(`/appointments/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // AI Summary & RAG
  getAISummary: (appointmentId: string) => request<any>(`/ai-summary/${appointmentId}`),
  reviewAISummary: (appointmentId: string, review: { doctor_clinical_notes: string; doctor_approved: boolean; edited_summary?: string }) =>
    request<any>(`/ai-summary/${appointmentId}/review`, {
      method: 'POST',
      body: JSON.stringify(review),
    }),
  regenerateAISummary: (appointmentId: string) =>
    request<any>(`/ai-summary/${appointmentId}/regenerate`, {
      method: 'POST',
    }),

  // Medical Records & RAG
  uploadMedicalRecord: (formData: FormData) => {
    const session = getStoredSession();
    return fetch('/api/v1/records/upload', {
      method: 'POST',
      headers: {
        Authorization: session?.access_token ? `Bearer ${session.access_token}` : '',
      },
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Upload failed');
      }
      return res.json();
    });
  },
  getMyMedicalRecords: () => request<any[]>('/records/my'),
  deleteMedicalRecord: (id: string) =>
    request<any>(`/records/${id}`, {
      method: 'DELETE',
    }),

  // Doctor Consultation Notes
  createConsultationNote: (payload: any) =>
    request<any>('/notes/', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getConsultationNote: (appointmentId: string) =>
    request<any>(`/notes/appointment/${appointmentId}`),

  // Audit Logs
  getAuditLogs: () => request<any[]>('/audit/logs'),

  // System Health
  getHealth: () => request<any>('/health'),
};
