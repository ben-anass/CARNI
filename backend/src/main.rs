use axum::http::Method;
use rusqlite::Connection;
use std::net::SocketAddr;
use std::sync::{Arc, Mutex};
use tower_http::cors::{Any, CorsLayer};

mod handlers;
mod models;
mod routes;
mod services;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    println!("🇲🇦 Initialisation du serveur CARNI (Sovereign Health Journal MVP)...");

    // Initialize SQLite database
    let db_path = "carni.db";
    let conn = Connection::open(db_path)?;
    services::db::init_db(&conn)?;
    println!(
        "✓ Base de données SQLite initialisée et prête : {}",
        db_path
    );

    let state = Arc::new(Mutex::new(conn));

    // Configure CORS for Vite dev server & production
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers(Any);

    let storage = services::storage::configure()?.map(Arc::new);
    let app = routes::create_router(state, storage).layer(cors);

    // Bind strictly to 127.0.0.1 for local security requirements
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("✓ Serveur CARNI API démarré sur http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
