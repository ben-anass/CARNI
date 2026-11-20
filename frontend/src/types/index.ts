export type EventCategory =
  | 'CONSULTATION'
  | 'ANALYSE'
  | 'TRAITEMENT'
  | 'VACCIN'
  | 'CHIRURGIE'
  | 'SYMPTOME';

export type DocumentCategory =
  | 'ORDONNANCE'
  | 'BILAN'
  | 'IMAGERIE'
  | 'COMPTE_RENDU'
  | 'CERTIFICAT'
  | 'AUTRE';

export type AuditActionType =
  | 'SESSION_CREATED'
  | 'SESSION_ACCESSED'
  | 'SESSION_REVOKED'
  | 'SESSION_ACCESS_DENIED'
  | 'RECORD_CREATED'
  | 'RECORD_UPDATED'
  | 'RECORD_DELETED'
  | 'DOCUMENT_UPLOADED'
  | 'DOCUMENT_DELETED'
  | 'PROFILE_UPDATED'
  | 'EMERGENCY_ACCESSED';

export interface Allergy {
  name: string;
  severity: 'LEVE' | 'MODEREE' | 'SEVERE';
  reaction: string;
}

export interface EmergencyContact {
  name: string;
  relation: string;
  phone: string;
  city: string;
}

export interface Vitals {
  blood_pressure: string;
  heart_rate: number;
  blood_sugar_mg_dl: number;
  weight_kg: number;
  height_cm: number;
  bmi: number;
  last_updated: string;
}

export interface PatientProfile {
  id: string;
  full_name: string;
  cin_cnss: string;
  birth_date: string;
  age: number;
  gender: 'M' | 'F';
  blood_type: string;
  city: string;
  address: string;
  allergies: Allergy[];
  chronic_conditions: string[];
  emergency_contact: EmergencyContact;
  attending_physician: string;
  vitals: Vitals;
}

export interface ConsentedPatientProfile {
  id: string;
  full_name: string;
  cin_cnss: string;
  birth_date: string;
  age: number;
  gender: string;
  blood_type: string;
  city: string;
  allergies?: Allergy[];
  chronic_conditions: string[];
  emergency_contact?: EmergencyContact;
  attending_physician: string;
  vitals?: Vitals;
}

export interface HealthEvent {
  id: string;
  title: string;
  event_date: string;
  category: EventCategory;
  doctor_or_facility: string;
  description: string;
  treatment_notes?: string;
  vital_signs?: {
    bp?: string;
    hr?: number;
    temp_c?: number;
  };
  attachments: string[]; // document ids
  created_at: string;
  updated_at?: string;
}

export interface MedicalDocument {
  id: string;
  title: string;
  category: DocumentCategory;
  file_name: string;
  file_type: string;
  file_size_bytes: number;
  issue_date: string;
  doctor_or_lab: string;
  notes?: string;
  content_preview?: string; // synthetic medical summary or base64 data url for preview
  tags: string[];
  created_at: string;
}

export interface SharingScope {
  all_events: boolean;
  event_ids: string[];
  all_docs: boolean;
  doc_ids: string[];
  include_allergies: boolean;
  include_vitals: boolean;
  include_emergency: boolean;
}

export interface SharingSession {
  id: string;
  token: string;
  recipient_label: string;
  purpose: string;
  scope: SharingScope;
  expires_at: string;
  created_at: string;
  is_revoked: boolean;
  access_count: number;
  last_accessed_at?: string;
  one_time_use: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: AuditActionType;
  actor: string;
  actor_role: 'PATIENT' | 'MEDECIN' | 'SYSTEM' | 'URGENCES';
  ip_address: string;
  details: string;
  status: 'SUCCESS' | 'WARNING' | 'REVOKED';
}

export interface DoctorAccessResponse {
  session: SharingSession;
  patient: ConsentedPatientProfile;
  events: HealthEvent[];
  documents: MedicalDocument[];
}
