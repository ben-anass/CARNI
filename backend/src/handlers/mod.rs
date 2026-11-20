use axum::{
    extract::{Multipart, Path, State},
    http::{header, StatusCode},
    response::{IntoResponse, Json, Response},
    Extension,
};
use chrono::Utc;
use object_store::{aws::AmazonS3, path::Path as ObjectPath, ObjectStore};
use rusqlite::{Connection, OptionalExtension};
use serde_json::json;
use std::sync::{Arc, Mutex};

use crate::models::*;
use crate::services::{db, storage::MAX_FILE_BYTES};

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
        Err(rusqlite::Error::QueryReturnedNoRows) => {
            Err((StatusCode::NOT_FOUND, "Événement introuvable".to_string()))
        }
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
        Err(rusqlite::Error::QueryReturnedNoRows) => {
            Err((StatusCode::NOT_FOUND, "Événement introuvable".to_string()))
        }
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

type DocumentError = (StatusCode, String);
type DocumentStorage = Option<Arc<AmazonS3>>;

fn bad_upload(message: &str) -> DocumentError {
    (StatusCode::BAD_REQUEST, message.into())
}

fn database_error(error: impl std::fmt::Display) -> DocumentError {
    eprintln!("Document database operation failed: {error}");
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        "Erreur de base de données".into(),
    )
}

fn require_storage(storage: &DocumentStorage) -> Result<&AmazonS3, DocumentError> {
    storage.as_deref().ok_or((
        StatusCode::SERVICE_UNAVAILABLE,
        "Le stockage R2 n'est pas configuré".into(),
    ))
}

fn storage_error(error: object_store::Error) -> DocumentError {
    eprintln!("Document storage operation failed: {error}");
    (
        StatusCode::BAD_GATEWAY,
        "Le stockage R2 est indisponible".into(),
    )
}

fn object_path(id: &str) -> ObjectPath {
    ObjectPath::from(format!("documents/{id}"))
}

fn stored_file(db: &DbState, id: &str) -> Result<Option<(String, String)>, DocumentError> {
    db.lock()
        .map_err(database_error)?
        .query_row(
            "SELECT file_name, file_type FROM documents
             JOIN document_files ON document_id = id WHERE id = ?1",
            [id],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .optional()
        .map_err(database_error)
}

pub async fn create_document(
    State(db): State<DbState>,
    Extension(storage): Extension<DocumentStorage>,
    mut multipart: Multipart,
) -> Result<(StatusCode, Json<MedicalDocument>), DocumentError> {
    let storage = require_storage(&storage)?;
    let multipart_error = |error: axum::extract::multipart::MultipartError| {
        (
            error.status(),
            "Dépôt multipart invalide ou trop volumineux".into(),
        )
    };
    let mut metadata = None;
    let mut file = None;
    while let Some(field) = multipart.next_field().await.map_err(multipart_error)? {
        match field.name() {
            Some("metadata") if metadata.is_none() => {
                let bytes = field.bytes().await.map_err(multipart_error)?;
                if bytes.len() > 64 * 1024 {
                    return Err((
                        StatusCode::PAYLOAD_TOO_LARGE,
                        "Métadonnées trop volumineuses".into(),
                    ));
                }
                metadata = Some(
                    serde_json::from_slice::<CreateDocumentRequest>(&bytes)
                        .map_err(|_| bad_upload("Métadonnées du document invalides"))?,
                );
            }
            Some("file") if file.is_none() => {
                let name = field
                    .file_name()
                    .ok_or(bad_upload("Nom de fichier obligatoire"))?
                    .rsplit(['/', '\\'])
                    .next()
                    .unwrap_or_default()
                    .chars()
                    .filter(|c| !c.is_control())
                    .collect::<String>();
                let bytes = field.bytes().await.map_err(multipart_error)?;
                if bytes.len() > MAX_FILE_BYTES {
                    return Err((
                        StatusCode::PAYLOAD_TOO_LARGE,
                        "Taille maximale de 10 Mo".into(),
                    ));
                }
                let mime = if bytes.starts_with(b"%PDF-") {
                    "application/pdf"
                } else if bytes.starts_with(b"\xff\xd8\xff") {
                    "image/jpeg"
                } else if bytes.starts_with(b"\x89PNG\r\n\x1a\n") {
                    "image/png"
                } else {
                    return Err((
                        StatusCode::UNSUPPORTED_MEDIA_TYPE,
                        "Formats acceptés : PDF, JPG, PNG".into(),
                    ));
                };
                if name.is_empty() {
                    return Err(bad_upload("Nom de fichier obligatoire"));
                }
                file = Some((name, mime, bytes));
            }
            _ => return Err(bad_upload("Champs attendus : metadata et file")),
        }
    }

    let mut payload = metadata.ok_or(bad_upload("Métadonnées du document obligatoires"))?;
    let (name, mime, bytes) = file.ok_or(bad_upload("Fichier obligatoire"))?;
    if payload.title.trim().is_empty() || payload.doctor_or_lab.trim().is_empty() {
        return Err(bad_upload("Titre et émetteur du document obligatoires"));
    }
    payload.file_name = name;
    payload.file_type = mime.into();
    payload.file_size_bytes = bytes.len() as u64;
    payload.content_preview = None;

    let id = format!("doc_{}", uuid::Uuid::new_v4().simple());
    let path = object_path(&id);
    storage
        .put(&path, bytes.into())
        .await
        .map_err(storage_error)?;
    let saved = db
        .lock()
        .map_err(database_error)
        .and_then(|conn| db::create_document(&conn, payload, id).map_err(database_error));
    match saved {
        Ok(doc) => Ok((StatusCode::CREATED, Json(doc))),
        Err(error) => {
            if let Err(cleanup_error) = storage.delete(&path).await {
                eprintln!("Failed to remove unindexed R2 object {path}: {cleanup_error}");
            }
            Err(error)
        }
    }
}

pub async fn download_document(
    State(db): State<DbState>,
    Extension(storage): Extension<DocumentStorage>,
    Path(id): Path<String>,
) -> Result<Response, DocumentError> {
    let (name, mime) = stored_file(&db, &id)?.ok_or((
        StatusCode::NOT_FOUND,
        "Fichier original indisponible".into(),
    ))?;
    let result = require_storage(&storage)?
        .get(&object_path(&id))
        .await
        .map_err(|error| match error {
            object_store::Error::NotFound { .. } => (
                StatusCode::NOT_FOUND,
                "Fichier original indisponible".into(),
            ),
            other => storage_error(other),
        })?;
    let bytes = result.bytes().await.map_err(storage_error)?;
    let encoded_name: String = name.bytes().map(|byte| format!("%{byte:02X}")).collect();
    Ok((
        [
            (header::CONTENT_TYPE, mime),
            (
                header::CONTENT_DISPOSITION,
                format!("attachment; filename*=UTF-8''{encoded_name}"),
            ),
            (header::CACHE_CONTROL, "no-store".into()),
            (header::X_CONTENT_TYPE_OPTIONS, "nosniff".into()),
        ],
        bytes,
    )
        .into_response())
}

pub async fn delete_document(
    State(db): State<DbState>,
    Extension(storage): Extension<DocumentStorage>,
    Path(id): Path<String>,
) -> Result<StatusCode, DocumentError> {
    if stored_file(&db, &id)?.is_some() {
        match require_storage(&storage)?.delete(&object_path(&id)).await {
            Ok(()) | Err(object_store::Error::NotFound { .. }) => {}
            Err(error) => return Err(storage_error(error)),
        }
    }
    let conn = db.lock().map_err(database_error)?;
    db::delete_document(&conn, &id).map_err(database_error)?;
    Ok(StatusCode::NO_CONTENT)
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
