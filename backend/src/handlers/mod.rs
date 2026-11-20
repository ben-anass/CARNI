use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::{IntoResponse, Json},
};
use chrono::Utc;
use rusqlite::Connection;
use serde_json::json;
use std::sync::{Arc, Mutex};

use crate::models::*;
use crate::services::db;

pub type DbState = Arc<Mutex<Connection>>;

pub async fn health_check() -> impl IntoResponse {
    Json(json!({
        "status": "ok",
        "service": "CARNI HealthTech API",
        "version": "0.1.0",
        "slogan": "Votre santé. Votre mémoire. Votre contrôle.",
        "jurisdiction": "Maroc",
        "timestamp": Utc::now().to_rfc3339()
    }))
}

pub async fn get_patient(
    State(db): State<DbState>,
) -> Result<Json<PatientProfile>, (StatusCode, String)> {
    let conn = db.lock().map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "DB Lock error".to_string(),
        )
    })?;
    match db::get_patient(&conn) {
        Ok(patient) => Ok(Json(patient)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

pub async fn update_patient(
    State(db): State<DbState>,
    Json(payload): Json<PatientProfile>,
) -> Result<Json<PatientProfile>, (StatusCode, String)> {
    if payload.full_name.trim().is_empty() || payload.cin_cnss.trim().is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            "Nom complet et identifiant médical obligatoires".to_string(),
        ));
    }
    let conn = db.lock().map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "DB Lock error".to_string(),
        )
    })?;
    match db::update_patient(&conn, &payload) {
        Ok(patient) => Ok(Json(patient)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

pub async fn get_events(
    State(db): State<DbState>,
) -> Result<Json<Vec<HealthEvent>>, (StatusCode, String)> {
    let conn = db.lock().map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "DB Lock error".to_string(),
        )
    })?;
    match db::get_events(&conn) {
        Ok(events) => Ok(Json(events)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

pub async fn create_event(
    State(db): State<DbState>,
    Json(payload): Json<CreateEventRequest>,
) -> Result<(StatusCode, Json<HealthEvent>), (StatusCode, String)> {
    if payload.title.trim().is_empty() || payload.doctor_or_facility.trim().is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            "Titre et praticien obligatoires".to_string(),
        ));
    }
    if payload.title.len() > 250 || payload.doctor_or_facility.len() > 250 {
        return Err((
            StatusCode::BAD_REQUEST,
            "Titre ou nom de praticien trop long (max 250 caractères)".to_string(),
        ));
    }
    let conn = db.lock().map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "DB Lock error".to_string(),
        )
    })?;
    match db::create_event(&conn, payload) {
        Ok(event) => Ok((StatusCode::CREATED, Json(event))),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

pub async fn update_event(
    State(db): State<DbState>,
    Path(id): Path<String>,
    Json(payload): Json<CreateEventRequest>,
) -> Result<Json<HealthEvent>, (StatusCode, String)> {
    if payload.title.trim().is_empty() || payload.doctor_or_facility.trim().is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            "Titre et praticien obligatoires".to_string(),
        ));
    }
    let conn = db.lock().map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "DB Lock error".to_string(),
        )
    })?;
    match db::update_event(&conn, &id, payload) {
        Ok(event) => Ok(Json(event)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

pub async fn delete_event(
    State(db): State<DbState>,
    Path(id): Path<String>,
) -> Result<StatusCode, (StatusCode, String)> {
    let conn = db.lock().map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "DB Lock error".to_string(),
        )
    })?;
    match db::delete_event(&conn, &id) {
        Ok(_) => Ok(StatusCode::NO_CONTENT),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

pub async fn get_documents(
    State(db): State<DbState>,
) -> Result<Json<Vec<MedicalDocument>>, (StatusCode, String)> {
    let conn = db.lock().map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "DB Lock error".to_string(),
        )
    })?;
    match db::get_documents(&conn) {
        Ok(docs) => Ok(Json(docs)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

pub async fn create_document(
    State(db): State<DbState>,
    Json(mut payload): Json<CreateDocumentRequest>,
) -> Result<(StatusCode, Json<MedicalDocument>), (StatusCode, String)> {
    if payload.title.trim().is_empty() || payload.doctor_or_lab.trim().is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            "Titre et émetteur du document obligatoires".to_string(),
        ));
    }
    // Validate file size and MIME type
    let max_size: u64 = 10 * 1024 * 1024; // 10MB
    if payload.file_size_bytes > max_size {
        return Err((
            StatusCode::BAD_REQUEST,
            "Fichier trop volumineux. Maximum 10 Mo".to_string(),
        ));
    }
    let allowed_types = ["application/pdf", "image/jpeg", "image/png"];
    if !allowed_types.contains(&payload.file_type.as_str()) {
        return Err((
            StatusCode::BAD_REQUEST,
            "Format non autorisé. Formats acceptés : PDF, JPG, PNG".to_string(),
        ));
    }

    // Sanitize filename to prevent path traversal or injection
    let clean_filename = std::path::Path::new(&payload.file_name)
        .file_name()
        .and_then(|n| n.to_str())
        .unwrap_or("document.pdf")
        .replace(['/', '\\', '\0'], "_");
    payload.file_name = clean_filename;

    let conn = db.lock().map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "DB Lock error".to_string(),
        )
    })?;
    match db::create_document(&conn, payload) {
        Ok(doc) => Ok((StatusCode::CREATED, Json(doc))),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

pub async fn delete_document(
    State(db): State<DbState>,
    Path(id): Path<String>,
) -> Result<StatusCode, (StatusCode, String)> {
    let conn = db.lock().map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "DB Lock error".to_string(),
        )
    })?;
    match db::delete_document(&conn, &id) {
        Ok(_) => Ok(StatusCode::NO_CONTENT),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

pub async fn get_sharing_sessions(
    State(db): State<DbState>,
) -> Result<Json<Vec<SharingSession>>, (StatusCode, String)> {
    let conn = db.lock().map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "DB Lock error".to_string(),
        )
    })?;
    match db::get_sharing_sessions(&conn) {
        Ok(sessions) => Ok(Json(sessions)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

pub async fn create_sharing_session(
    State(db): State<DbState>,
    Json(payload): Json<CreateShareRequest>,
) -> Result<(StatusCode, Json<SharingSession>), (StatusCode, String)> {
    if payload.recipient_label.trim().is_empty() {
        return Err((
            StatusCode::BAD_REQUEST,
            "Le nom du destinataire autorisé est obligatoire".to_string(),
        ));
    }
    if payload.duration_minutes == 0 || payload.duration_minutes > 10080 {
        // max 7 days
        return Err((
            StatusCode::BAD_REQUEST,
            "Durée de session invalide (doit être entre 1 min et 7 jours)".to_string(),
        ));
    }

    let conn = db.lock().map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "DB Lock error".to_string(),
        )
    })?;
    match db::create_sharing_session(&conn, payload) {
        Ok(session) => Ok((StatusCode::CREATED, Json(session))),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

pub async fn revoke_sharing_session(
    State(db): State<DbState>,
    Path(id): Path<String>,
) -> Result<StatusCode, (StatusCode, String)> {
    let conn = db.lock().map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "DB Lock error".to_string(),
        )
    })?;
    match db::revoke_sharing_session(&conn, &id) {
        Ok(_) => Ok(StatusCode::OK),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

pub async fn access_shared_session(
    State(db): State<DbState>,
    Path(token): Path<String>,
) -> Result<Json<DoctorAccessResponse>, (StatusCode, String)> {
    let conn = db.lock().map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "DB Lock error".to_string(),
        )
    })?;

    let session = match db::get_session_by_token(&conn, &token) {
        Ok(Some(s)) => s,
        Ok(None) => {
            return Err((
                StatusCode::NOT_FOUND,
                "Session de partage introuvable".to_string(),
            ))
        }
        Err(e) => return Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    };

    // Verify revoked
    if session.is_revoked {
        let _ = db::add_audit_log(
            &conn,
            "SESSION_ACCESS_DENIED",
            &session.recipient_label,
            "MEDECIN",
            "127.0.0.1",
            &format!("Tentative d'accès rejetée : jeton révoqué ({})", token),
            "REVOKED",
        );
        return Err((
            StatusCode::FORBIDDEN,
            "Cette session a été révoquée par le patient".to_string(),
        ));
    }

    // Verify expired
    if let Ok(exp) = chrono::DateTime::parse_from_rfc3339(&session.expires_at) {
        if exp < Utc::now() {
            let _ = db::add_audit_log(
                &conn,
                "SESSION_ACCESS_DENIED",
                &session.recipient_label,
                "MEDECIN",
                "127.0.0.1",
                &format!("Tentative d'accès rejetée : session expirée ({})", token),
                "WARNING",
            );
            return Err((
                StatusCode::GONE,
                "La durée de validité de cette session est expirée".to_string(),
            ));
        }
    }

    // Record access in database and audit log
    let _ = db::record_doctor_access(&conn, &session, "127.0.0.1");

    // Fetch full patient profile and sanitize according to patient's explicit consent scope
    let full_patient =
        db::get_patient(&conn).map_err(|e| (StatusCode::INTERNAL_SERVER_ERROR, e.to_string()))?;
    let consented_patient = db::filter_patient_by_scope(&full_patient, &session.scope);

    // Filter events according to scope
    let all_events = db::get_events(&conn).unwrap_or_default();
    let events = if session.scope.all_events {
        all_events
    } else {
        all_events
            .into_iter()
            .filter(|e| session.scope.event_ids.contains(&e.id))
            .collect()
    };

    // Filter documents according to scope
    let all_docs = db::get_documents(&conn).unwrap_or_default();
    let documents = if session.scope.all_docs {
        all_docs
    } else {
        all_docs
            .into_iter()
            .filter(|d| session.scope.doc_ids.contains(&d.id))
            .collect()
    };

    Ok(Json(DoctorAccessResponse {
        session,
        patient: consented_patient,
        events,
        documents,
    }))
}

pub async fn get_audit_logs(
    State(db): State<DbState>,
) -> Result<Json<Vec<AuditLogEntry>>, (StatusCode, String)> {
    let conn = db.lock().map_err(|_| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            "DB Lock error".to_string(),
        )
    })?;
    match db::get_audit_logs(&conn) {
        Ok(logs) => Ok(Json(logs)),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}
