use crate::handlers::*;
use axum::{
    extract::DefaultBodyLimit,
    handler::Handler,
    routing::{delete, get, post, put},
    Extension, Router,
};

pub fn create_router(
    state: DbState,
    storage: Option<std::sync::Arc<object_store::aws::AmazonS3>>,
) -> Router {
    Router::new()
        .route("/api/health", get(health_check))
        .route("/api/patient", get(get_patient).put(update_patient))
        .route("/api/events", get(get_events).post(create_event))
        .route("/api/events/{id}", put(update_event).delete(delete_event))
        .route(
            "/api/documents",
            get(get_documents).post(create_document.layer(DefaultBodyLimit::max(
                crate::services::storage::MAX_FILE_BYTES + 64 * 1024,
            ))),
        )
        .route("/api/documents/{id}/file", get(download_document))
        .route("/api/documents/{id}", delete(delete_document))
        .route(
            "/api/shares",
            get(get_sharing_sessions).post(create_sharing_session),
        )
        .route("/api/shares/{id}/revoke", post(revoke_sharing_session))
        .route("/api/shares/access/{token}", get(access_shared_session))
        .route("/api/audit", get(get_audit_logs))
        .layer(Extension(storage))
        .with_state(state)
}
