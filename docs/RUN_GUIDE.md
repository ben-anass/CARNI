# CARNI — Guide d'Exécution & Guide de Démonstration

## Présentation
CARNI est un carnet de santé numérique intelligent et souverain conçu dans le cadre du Hackathon HealthTech Maroc. Il permet au patient d'enregistrer ses événements médicaux, d'archiver ses documents cliniques dans un coffre-fort chiffré, et de partager temporairement une sélection granulaire de données via QR code éphémère avec des professionnels de santé.

---

## Prérequis
- **Rust & Cargo** : version stable récente
- **Node.js** : version 18+ (testé avec Node v20/v26)
- **Navigateur moderne** (Chrome, Firefox, Safari, Edge)

---

## Démarrage Rapide

### 1. Démarrer le Backend Rust Axum (API + SQLite)
```bash
cd backend
cargo run
```
*Le serveur démarre sur `http://127.0.0.1:3000` et initialise automatiquement la base de données locale `carni.db` avec les données synthétiques de démonstration.*

### 2. Démarrer le Frontend React Vite
Dans un second terminal :
```bash
cd frontend
npm install
npm run dev
```
*L'application s'ouvre sur `http://127.0.0.1:5173`.*

---

## Parcours de Démonstration (Scénario Hackathon)

1. **Tableau de Bord & Données Vitales** :
   - Consulter la fiche du patient marocain de démonstration (*Yassine Mansouri, 34 ans, Casablanca*).
   - Constater l'alerte allergie majeure (*Pénicilline - Sévère*) et les constantes vitales (*Tension 120/80 mmHg, Pouls 72 bpm, Glycémie 94 mg/dL*).
   - Cliquer sur le bouton rouge clignotant **"Fiche Urgence"** pour afficher la vue paramédicale ICE prête à l'impression.

2. **Carnet de Santé (Health Journal)** :
   - Filtrer par catégorie : Consultations, Biologie, Traitements, Vaccinations.
   - Rechercher par mot-clé (ex: "Bennani", "Asthme", "Ventoline").
   - Cliquer sur **"Ajouter un événement"** pour créer une nouvelle consultation avec praticien, diagnostic et constantes.
   - Modifier ou supprimer un événement avec mise à jour immédiate.

3. **Coffre-fort Médical (Medical Vault)** :
   - Parcourir les ordonnances, bilans et radios archivés.
   - Cliquer sur **"Consulter aperçu"** pour afficher le document simulé avec en-tête officiel, ordonnance ou résultats biologiques complets.
   - Cliquer sur **"Déposer un document"** : tester la validation sur les formats acceptés (PDF, JPG, PNG) et la limite de taille (10 Mo).

4. **Partage Sécurisé & Consentement Explicite (QR Code)** :
   - Ouvrir l'onglet **"Partage Sécurisé & QR"**.
   - Spécifier le médecin destinataire (*Dr. Omar Bennani*).
   - Choisir la durée de validité (*15 min, 1h, 24h, 7 jours*) ou activer l'**Usage unique**.
   - Sélectionner de manière granulaire les événements et documents autorisés.
   - Cliquer sur **"Générer le QR Code Éphémère"** : un QR code haute définition est généré contenant un jeton cryptographique aléatoire unique.
   - Observer le compte à rebours de validité et le bouton de **révocation instantanée**.

5. **Portail Médecin (Doctor View)** :
   - Cliquer sur **"Tester vue médecin"** ou ouvrir l'URL `/share/:token`.
   - Constater que le praticien ne voit **que** les données cochées par le patient.
   - Tester la révocation : dès que le patient clique sur "Révoquer", le portail médecin affiche un écran de sécurité immédiat bloquant l'accès.

6. **Journal d'Audit & Non-Répudiation** :
   - Ouvrir l'onglet **"Journal d'Audit"**.
   - Observer l'enregistrement chronologique immuable de chaque création, accès médecin avec adresse IP, et révocation.
   - Exporter ou imprimer le rapport d'audit.

---

## Tests Automatisés
Pour exécuter la suite de tests unitaires et d'intégration Rust :
```bash
cd backend
cargo test
```
*5 tests validés avec succès : initialisation SQLite, CRUD événements, cycle de vie des documents, génération/révocation des sessions de partage, et journal d'audit.*

Pour compiler le frontend :
```bash
cd frontend
npm run build
```

## Stockage des fichiers dans Cloudflare R2

Créez des identifiants S3 R2 avec la permission **Object Read & Write** pour le
bucket privé `carni`. Définissez `R2_ACCESS_KEY_ID` et `R2_SECRET_ACCESS_KEY`
dans l’environnement du processus backend avant de lancer `cargo run`.

Le coffre-fort envoie les originaux PDF, JPEG et PNG (10 Mio maximum) au backend
qui les stocke dans R2. SQLite conserve les métadonnées. Depuis le coffre-fort,
ouvrez la fiche du document pour télécharger l’original. Les anciennes fiches
restent accessibles et conservent leur aperçu existant.

L’API patient du prototype fonctionne sans authentification. Gardez le
serveur sur l’interface locale et utilisez des documents synthétiques.
