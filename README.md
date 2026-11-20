# CARNI — Digital Health Journal

\<p align="center">   \<strong>Your Health. Your Memory. Your Control.\</strong> \</p>

\<p align="center">   A patient-centered digital health journal designed to help people organize, manage, and control access to their health information. \</p>

---

## About CARNI

**CARNI** is a HealthTech project that aims to give patients a centralized and structured space to manage their personal health information.

The project explores a patient-controlled approach to digital health records, allowing users to organize medical information and manage how selected information is shared.

Our vision is simple: make health information more accessible, organized, and controlled by the patient.

## Core Features

The current prototype includes the following interface and workflows:

- **Health Dashboard** — A centralized overview of health information.
- **Medical Journal** — Organize health events and personal medical history.
- **Medical Vault** — Interface for managing medical documents.
- **Secure Sharing Workflow** — Generate and manage access-sharing sessions.
- **Doctor Portal** — A dedicated interface for viewing shared information.
- **Audit Log** — Review recorded activities.
- **Emergency Information** — A dedicated space for important health information.

*Feature implementation and security guarantees are subject to ongoing development and testing.*

## Tech Stack

| Layer      | Technologies            |
| ---------- | ----------------------- |
| Frontend   | React, TypeScript, Vite |
| Styling    | Tailwind CSS            |
| Backend    | Rust, Axum              |
| Database   | SQLite                  |
| QR Sharing | QR Code integration     |

## Project Structure

```text
CARNI/
├── backend/
│   ├── src/
│   │   ├── handlers/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   ├── Cargo.toml
│   └── Cargo.lock
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── data/
│   │   ├── services/
│   │   └── types/
│   ├── package.json
│   └── index.html
│
├── docs/
│   ├── ARCHITECTURE.md
│   └── RUN_GUIDE.md
│
└── README.md
```

## Getting Started

### Prerequisites

- Node.js and npm
- Rust and Cargo

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
cargo run
```

For additional configuration and execution details, see [`docs/RUN_GUIDE.md`](docs/RUN_GUIDE.md).

## Privacy & Security

CARNI is being developed with a privacy-first mindset.

Development priorities include:

- Patient-controlled information sharing.
- Permission-based access.
- Sharing session expiration and revocation.
- Activity traceability.
- Avoiding unnecessary exposure of sensitive information.

**Important:** CARNI is a development prototype, not a certified medical record system. Do not use real patient information in the demo.

## Project Status

**Status:** Prototype — Active Development

CARNI is an evolving project. Features, architecture, and security mechanisms are subject to implementation, testing, and improvement.

## Contributing

Contributions, suggestions, and feedback are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Submit a Pull Request.

## License

A license has not yet been specified. All rights are reserved unless a license is added to this repository.

---

\<p align="center">   \<strong>CARNI\</strong>\<br>   Your Health. Your Memory. Your Control. \</p>
