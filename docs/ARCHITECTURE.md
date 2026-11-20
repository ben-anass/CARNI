# Architecture Technique — CARNI

## 1. Vue d'Ensemble
CARNI est une application Full-Stack intégrant un client web moderne React + TypeScript et une API backend souveraine en Rust (Axum) avec persistance SQLite locale.

```
┌────────────────────────────────────────────────────────┐
│                   Frontend (React + Vite)              │
│  - Tailwind CSS v4, Lucide React                       │
│  - Navigation modulaire (Dashboard, Journal, Vault,    │
│    Sharing QR, Audit Log, Portail Médecin)             │
│  - Moteur de QR Code vectoriel autonome                │
│  - Mode offline / synchronisation automatique          │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP JSON API (CORS)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Backend Rust (Axum 0.8)              │
│  - Écoute stricte sur 127.0.0.1:3000                   │
│  - Sérialisation Serde / Serde JSON                    │
│  - Gestionnaire de sessions de partage éphémères       │
│  - Filtrage des données selon le consentement patient  │
│  - Journal d'audit immuable                            │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│                Base de Données SQLite (carni.db)       │
│  - Tables : patient, events, documents,               │
│    sharing_sessions, audit_logs                        │
│  - Données synthétiques marocaines pré-amorcées        │
└────────────────────────────────────────────────────────┘
```

## 2. Principes de Sécurité & Confidentialité
1. **Zéro Donnée Médicale dans le QR Code** :
   Le QR code ne contient jamais de données médicales brutes, mais un jeton aléatoire cryptographique imprévisible (`carni-sec-{uuid}`).
2. **Durée de Vie Limitée & Révocabilité** :
   Chaque session possède une date d'expiration stricte et peut être révoquée en 1 clic par le patient.
3. **Usage Unique Optionnel** :
   Possibilité de configurer une auto-destruction du lien dès la première consultation par le médecin.
4. **Validation des Entrées** :
   Vérification stricte des types MIME (`application/pdf`, `image/jpeg`, `image/png`) et limitation de taille de fichier à 10 Mo.
5. **Non-Répudiation & Audit Log** :
   Toutes les opérations d'accès et de modification sont consignées avec horodatage UTC et adresse IP.
6. **Données Synthétiques Uniquement** :
   Aucune donnée patient réelle n'est utilisée. Contexte marocain de démonstration.

## 3. Modèle de Données (SQLite)
- `patient` : Fiche d'identité, groupe sanguin, allergies majeures, constantes.
- `events` : Consultations, bilans, ordonnances, vaccins, symptômes.
- `documents` : Métadonnées et fichiers scellés du coffre-fort.
- `sharing_sessions` : Jetons, périmètre de consentement granulaire (scope JSON), expiration, état de révocation.
- `audit_logs` : Traçabilité des accès médecins et modifications patient.
