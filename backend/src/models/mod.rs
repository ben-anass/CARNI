use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Allergy {
    pub name: String,
    pub severity: String,
    pub reaction: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct EmergencyContact {
    pub name: String,
    pub relation: String,
    pub phone: String,
    pub city: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Vitals {
    pub blood_pressure: String,
    pub heart_rate: u32,
    pub blood_sugar_mg_dl: u32,
    pub weight_kg: f64,
    pub height_cm: u32,
    pub bmi: f64,
    pub last_updated: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PatientProfile {
    pub id: String,
    pub full_name: String,
    pub cin_cnss: String,
    pub birth_date: String,
    pub age: u32,
    pub gender: String,
    pub blood_type: String,
    pub city: String,
    pub address: String,
    pub allergies: Vec<Allergy>,
    pub chronic_conditions: Vec<String>,
    pub emergency_contact: EmergencyContact,
    pub attending_physician: String,
    pub vitals: Vitals,
}

/// Sanitized patient profile transmitted to healthcare professionals.
/// Sensitive fields (allergies, emergency contact, vitals) are only populated
/// if explicitly authorized in the patient's sharing consent scope.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ConsentedPatientProfile {
    pub id: String,
    pub full_name: String,
    pub cin_cnss: String,
    pub birth_date: String,
    pub age: u32,
    pub gender: String,
    pub blood_type: String,
    pub city: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub allergies: Option<Vec<Allergy>>,
    pub chronic_conditions: Vec<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub emergency_contact: Option<EmergencyContact>,
    pub attending_physician: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vitals: Option<Vitals>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct EventVitalSigns {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bp: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub hr: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temp_c: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct HealthEvent {
    pub id: String,
    pub title: String,
    pub event_date: String,
    pub category: String,
    pub doctor_or_facility: String,
    pub description: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub treatment_notes: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vital_signs: Option<EventVitalSigns>,
    pub attachments: Vec<String>,
    pub created_at: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub updated_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateEventRequest {
    pub title: String,
    pub event_date: String,
    pub category: String,
    pub doctor_or_facility: String,
    pub description: String,
    pub treatment_notes: Option<String>,
    pub vital_signs: Option<EventVitalSigns>,
    #[serde(default)]
    pub attachments: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct MedicalDocument {
    pub id: String,
    pub title: String,
    pub category: String,
    pub file_name: String,
    pub file_type: String,
    pub file_size_bytes: u64,
    pub issue_date: String,
    pub doctor_or_lab: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub notes: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content_preview: Option<String>,
    pub tags: Vec<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateDocumentRequest {
    pub title: String,
    pub category: String,
    pub file_name: String,
    pub file_type: String,
    pub file_size_bytes: u64,
    pub issue_date: String,
    pub doctor_or_lab: String,
    pub notes: Option<String>,
    pub content_preview: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SharingScope {
    pub all_events: bool,
    pub event_ids: Vec<String>,
    pub all_docs: bool,
    pub doc_ids: Vec<String>,
    pub include_allergies: bool,
    pub include_vitals: bool,
    pub include_emergency: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct SharingSession {
    pub id: String,
    pub token: String,
    pub recipient_label: String,
    pub purpose: String,
    pub scope: SharingScope,
    pub expires_at: String,
    pub created_at: String,
    pub is_revoked: bool,
    pub access_count: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_accessed_at: Option<String>,
    pub one_time_use: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateShareRequest {
    pub recipient_label: String,
    pub purpose: String,
    pub duration_minutes: u32,
    pub one_time_use: bool,
    pub scope: SharingScope,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct AuditLogEntry {
    pub id: String,
    pub timestamp: String,
    pub action: String,
    pub actor: String,
    pub actor_role: String,
    pub ip_address: String,
    pub details: String,
    pub status: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DoctorAccessResponse {
    pub session: SharingSession,
    pub patient: ConsentedPatientProfile,
    pub events: Vec<HealthEvent>,
    pub documents: Vec<MedicalDocument>,
}
