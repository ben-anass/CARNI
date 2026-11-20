# --- Stage 1: Build ---
FROM rust:1.85-slim AS builder

WORKDIR /app

# Install build dependencies (adjust if using SQLite/OpenSSL native libs)
RUN apt-get update && apt-get install -y --no-install-recommends \
    pkg-config \
    libsqlite3-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Cache dependencies first
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo "fn main() {}" > src/main.rs
RUN cargo build --release
RUN rm -rf src

# Copy actual source and build release binary
COPY src ./src
# If you have migrations or static assets, copy them before building if embedded/referenced
RUN touch src/main.rs && cargo build --release

# --- Stage 2: Runtime ---
FROM debian:bookworm-slim AS runtime

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libsqlite3-0 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create a non-root user for security
RUN useradd -m -u 10001 appuser && mkdir -p /data/vault && chown -R appuser:appuser /app /data

COPY --from=builder /app/target/release/carni-backend /usr/local/bin/carni-backend

USER appuser
ENV RUST_LOG=info
EXPOSE 8080

CMD ["carni-backend"]
