# School Assessment Management Platform

A multi-school workspace for staff accounts, teaching assignments, class rosters, assessment moderation, marks capture, and evidence storage. Students are roster records and do not receive login accounts.

## Current major update

- **Admin-Only User Engagement & Actions Tab**: A dedicated intelligence console visible exclusively to School Administrators (`SCHOOL_ADMIN`) and Platform Super Administrators (`SUPER_ADMIN`).
  - **Tracks Most Used Features**: Real-time frequency analysis and ranking of features with highest staff engagement (e.g. Assessment Workspaces, Class Rosters & Marks Capture, Quick Actions).
  - **Identifies Avoided & Underutilized Features**: Pinpoints neglected tools and friction points (e.g., manual student entry, CAPS policy document downloads, curriculum matrix toggling).
  - **Detects Low-Engagement / Bounce Sessions**: Real-time identification of staff members who log in and exit after less than 90 seconds with minimal (0–1) interactions, complete with diagnostic exit reasons, duration logs, and an in-app follow-up re-engagement modal.
  - **Executive Product Roadmap**: Categorizes modules into *Features to Leave Be* (high adoption, stable workflows that should not be disrupted), *Features to Refine* (high-intent workflows with friction or verification hesitation), and *Features to Simplify / Promote*.
  - **Interactive Scenario Simulator**: Built-in admin tool to simulate live user workflows (immediate bounce &lt;30s, assessment drafting & upload, HOD moderation approval, and spreadsheet marks capture) with real-time telemetry updates.
- One email-and-password login resolves the account's school and permissions.
- Production Firebase support covers Authentication, revoked-session checks, Firestore persistence, and Storage uploads; local development can still use generated JSON data and local files.
  - *Project Naming*: The Firebase project display name and application branding is **School Assessment Management Platform** (hosted on Google Cloud project resource ID `hidden-indexer-pthv3`).
- Login attempts are rate limited, disabled accounts lose active sessions, and tenant checks apply to every school route.
- School administrators can correct staff names, emails, passwords, status, and reporting lines.
- Every teacher must have an active Departmental Head. Replacing an HOD transfers linked teachers, departments, moderation workspaces, and grade/phase responsibilities.
- Platform administrators have a school-administrator-only account screen with the school name visible.
- Teachers and leaders manage rosters under each teacher → subject → class assignment.
- Marks imports accept Excel/CSV, PDF, and images. OCR/spreadsheet matches are reviewed before saving; unmatched people require details and roster creation first.
- Original marks files are retained in Knowledge Hub as assessment evidence.
- Knowledge Hub and assessment workspaces now upload and serve the actual selected files, with a 15 MB limit.
- School administrators and principals can create, edit, archive, and restore variable grades and class sections.
- Returned assessments show the teacher the reviewer fixes and write clear rejected/returned audit records.
- Roles & Permissions and Engagement & Actions are visible only to school and platform administrators.
- Notifications are filtered to the active school, while platform administrators retain platform visibility.
- The dashboard is compact, onboarding is skippable, and school colors apply to primary interface accents.

## Role hierarchy

| Role | Scope |
| --- | --- |
| `SUPER_ADMIN` | Platform and all schools; manages school administrator accounts |
| `SCHOOL_ADMIN` | All accounts, structure, settings, and data in one school |
| `PRINCIPAL` | School-wide academic and staff oversight |
| `DEPUTY_PRINCIPAL` | Cross-department academic oversight |
| `HOD` | Assigned departments, teachers, grades, and moderation work |
| `TEACHER` | Assigned subjects, classes, students, marks, and assessment drafts |

Permissions are enforced on the server. Hiding a navigation item is only a usability aid.

## Run locally

```bash
npm install
npm run dev
```

The application runs at `http://localhost:3000`.

```bash
npm run lint
npm test
npm run build
```

When `FIRESTORE_EMULATOR_HOST`, `FIREBASE_STORAGE_EMULATOR_HOST`, and a Firebase project ID are set, the test suite also verifies shared Firestore state and school-scoped Storage round trips. Otherwise that emulator test is reported as skipped.

All repository data is generated test data. Local persistence is stored below `data/`, which should not be committed with real school records.

## Firebase production configuration

The browser Firebase app reads `firebase-applet-config.json`. Set `VITE_USE_FIREBASE_AUTH=true` to use Firebase email/password sign-in.

The server accepts:

| Variable | Purpose |
| --- | --- |
| `FIREBASE_PROJECT_ID` | Firebase / Google Cloud project |
| `FIREBASE_STORAGE_BUCKET` | Storage bucket; defaults to `<project>.appspot.com` |
| `FIRESTORE_DATABASE_ID` | Optional named Firestore database |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | Optional service-account JSON; otherwise Application Default Credentials |
| `USE_FIREBASE=true` | Enables Firebase outside production when emulators are not configured |
| `FIRESTORE_EMULATOR_HOST` | Firestore emulator endpoint |
| `FIREBASE_AUTH_EMULATOR_HOST` | Authentication emulator endpoint |

Firebase Admin verifies ID tokens with revocation checking. Firestore stores the platform state and Storage stores school-scoped files under `schools/<schoolId>/...`. The Admin SDK bypasses client rules, so deployments must protect service credentials and keep the server private.

## Main structure

```text
server.ts                         Express API, authorization, OCR/imports, files
src/server/dbStore.ts             Tenant-scoped domain store and persistence
src/server/firebaseAdmin.ts       Firebase Admin persistence/auth/storage adapter
src/services/api.ts               Browser API and Firebase sign-in client
src/utils/rbac.ts                 Role/module policy
src/components/students/          Rosters and reviewed marks imports
src/components/knowledge/         Real resource uploads and downloads
src/components/assessments/       Assessment files and moderation workflow
src/components/users/             Staff editing, HOD assignment and replacement
src/components/engagement/        Admin engagement intelligence, feature tracking & bounce detection
src/components/superadmin/        School and school-admin management
```

## Security and data notes

- File uploads are capped at 15 MB and stored below a school-specific path.
- Excel and CSV are parsed locally. PDF text is extracted first, then OCR is attempted; images use local Tesseract OCR.
- OCR is advisory. A staff member must review the full class list and marks before saving.
- Passwords in the local development store use salted scrypt hashes.
- Account changes, roster deletion, marks imports, uploads, and HOD transfers write audit events.
- Before real-world deployment, use separate Firebase projects for development and production, enable backups, add retention rules, and run the emulator test suite against the deployed rules.
