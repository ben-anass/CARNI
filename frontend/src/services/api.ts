import {
  PatientProfile,
  HealthEvent,
  MedicalDocument,
  SharingSession,
  AuditLogEntry,
  SharingScope,
  DoctorAccessResponse,
} from '../types';

// In development, target the Axum Rust server directly at 127.0.0.1:3000 with CORS
const API_BASE =
  window.location.port === '5173'
    ? 'http://127.0.0.1:3000/api'
    : '/api';

async function throwEventMutationError(res: Response, fallback: string): Promise<never> {
  const message = (await res.text()).trim();
  throw new Error(message || `${fallback} (HTTP ${res.status})`);
}

export const api = {
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/health`, { method: 'GET' });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getPatient(): Promise<PatientProfile> {
    const res = await fetch(`${API_BASE}/patient`);
    if (!res.ok) throw new Error('Impossible de charger le profil patient');
    return res.json();
  },

  async updatePatient(patient: PatientProfile): Promise<PatientProfile> {
    const res = await fetch(`${API_BASE}/patient`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patient),
    });
    if (!res.ok) throw new Error('Erreur lors de la mise à jour des constantes');
    return res.json();
  },

  async getEvents(): Promise<HealthEvent[]> {
    const res = await fetch(`${API_BASE}/events`);
    if (!res.ok) throw new Error('Impossible de charger les événements');
    return res.json();
  },

  async createEvent(event: Omit<HealthEvent, 'id' | 'created_at'>): Promise<HealthEvent> {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    if (!res.ok) return throwEventMutationError(res, 'Erreur lors de la création de l\'événement');
    return res.json();
  },

  async updateEvent(id: string, event: Partial<HealthEvent>): Promise<HealthEvent> {
    const res = await fetch(`${API_BASE}/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event),
    });
    if (!res.ok) return throwEventMutationError(res, 'Erreur lors de la mise à jour de l\'événement');
    return res.json();
  },

  async deleteEvent(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/events/${id}`, { method: 'DELETE' });
    if (!res.ok) await throwEventMutationError(res, 'Erreur lors de la suppression de l\'événement');
  },

  async getDocuments(): Promise<MedicalDocument[]> {
    const res = await fetch(`${API_BASE}/documents`);
    if (!res.ok) throw new Error('Impossible de charger les documents');
    return res.json();
  },

  async createDocument(doc: Omit<MedicalDocument, 'id' | 'created_at'>, file: File): Promise<MedicalDocument> {
    const body = new FormData();
    body.append('metadata', JSON.stringify(doc));
    body.append('file', file);
    const res = await fetch(`${API_BASE}/documents`, { method: 'POST', body });
    if (!res.ok) throw new Error(await res.text() || 'Erreur lors du dépôt du document');
    return res.json();
  },

  documentDownloadUrl(id: string): string {
    return `${API_BASE}/documents/${encodeURIComponent(id)}/file`;
  },

  async deleteDocument(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(await res.text() || 'Erreur lors de la suppression du document');
  },

  async getSharingSessions(): Promise<SharingSession[]> {
    const res = await fetch(`${API_BASE}/shares`);
    if (!res.ok) throw new Error('Impossible de charger les sessions');
    return res.json();
  },

  async createSharingSession(data: {
    recipient_label: string;
    purpose: string;
    duration_minutes: number;
    one_time_use: boolean;
    scope: SharingScope;
  }): Promise<SharingSession> {
    const res = await fetch(`${API_BASE}/shares`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Erreur lors de la création du partage');
    return res.json();
  },

  async revokeSharingSession(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/shares/${id}/revoke`, { method: 'POST' });
    if (!res.ok) throw new Error('Erreur lors de la révocation du partage');
  },

  async accessSharedSession(token: string): Promise<DoctorAccessResponse> {
    const res = await fetch(`${API_BASE}/shares/access/${token}`);
    if (res.status === 403) throw new Error('REVOKED');
    if (res.status === 410) throw new Error('EXPIRED');
    if (res.status === 404) throw new Error('NOT_FOUND');
    if (!res.ok) throw new Error('ACCESS_DENIED');
    return res.json();
  },

  async getAuditLogs(): Promise<AuditLogEntry[]> {
    const res = await fetch(`${API_BASE}/audit`);
    if (!res.ok) throw new Error('Impossible de charger le journal d\'audit');
    return res.json();
  },
};
