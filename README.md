# School Assessment Management Platform

An enterprise-grade, multi-tenant academic assessment, curriculum management, and institutional governance platform designed for schools, educational networks, and platform administrators.

---

## 📖 Project Overview

The **School Assessment Management Platform** provides an isolated, multi-tenant workspace for educational institutions. Each school manages its own academic structure, user directory, moderation workflows, assessment cycles, and institutional branding, while platform super administrators maintain high-level tenant governance, auditing, and platform configuration.

---

## 🏗️ Core Architecture & Multi-Tenancy

- **Multi-Tenant Isolation**: Each school is encapsulated within an isolated tenant environment (`schoolId`). Data, users, subjects, classes, assessments, and audit logs are scoped strictly to the respective school.
- **Hierarchical Role-Based Access Control (RBAC)**: Fine-grained authorization controls module visibility, creation permissions, approval chains, and moderation actions.
- **Authenticated API Boundary**: Protected API routes require a short-lived bearer session. The server derives the acting user from that verified session instead of trusting actor details supplied by the client.
- **Persistent Data Store**: The current development architecture uses `src/server/dbStore.ts` with local persistence in `data/db.json`. Runtime data is ignored by Git and must contain fictional test data only.

---

## 👥 Role Hierarchy & Authority Structure

The system enforces a strict priority and capability hierarchy:

| Rank | Role | Title | Primary Responsibilities |
| :--- | :--- | :--- | :--- |
| **1** | `SUPER_ADMIN` | Platform Super Admin | Cross-school management, tenant provisioning, enabling/disabling schools, platform audit logs. |
| **2** | `SCHOOL_ADMIN` | School Administrator | Institution setup, user account creation, branding, academic year setup, role management. |
| **3** | `PRINCIPAL` | Principal | Full academic oversight, final approval of assessment schedules, institutional reporting. |
| **4** | `DEPUTY_PRINCIPAL`| Deputy Principal | Academic management, moderation review across departments and phases. |
| **5** | `HOD` | Departmental Head (DH) | Moderation of departmental assessments, grade allocations, paper reviews. |
| **6** | `GRADE_HEAD` | Grade Head | Initial assessment review, moderation feedback, grade-level consistency checks. |
| **7** | `TEACHER` | Educator / Teacher | Creation of assessment drafts, rubrics, task items, class assignments. |

---

## 🚀 Key Modules & Capabilities

### 1. Super Admin Platform Portal
- **Tenant Management**: View all registered schools, active student counts, staff counts, and setup statuses.
- **Enable / Disable School Tenants**: Toggle school active/disabled states with modal confirmation. When disabled, staff login access for that tenant is locked until reactivated.
- **Platform Audit Trail**: Real-time cross-tenant logging of security events, administrative updates, and status modifications.

### 2. User & Access Management
- **Role Assignment & Inheritance**: Users can be assigned multiple roles; the system automatically resolves and inherits the role with the **highest authority** as their primary operational role.
- **Mandatory Class Allocation for Teachers**: Educator accounts strictly require assignment to at least one class section (e.g., Grade 1A, Grade 4B) before creation.
- **HOD Moderation Allocation**: Department heads can be assigned specific grade levels for moderation.
- **Account Controls**: Disable, reactivate, or edit staff profiles with audit logging.

### 3. School Setup & Onboarding Wizard
- Step-by-step institutional setup covering:
  - Institutional Identity & Profile
  - Academic Year & Term Configuration
  - Department & Phase Definition (Foundation, Intermediate, Senior, FET)
  - Grade & Class Section Setup
  - Subject Creation & Code Allocations
  - Teacher-Subject-Class Teaching Allocations

### 4. Academic Structure Management
- **Phases & Grades**: Configure educational tiers and grade levels.
- **Class Sections**: Manage class groupings with room allocations and capacity.
- **Departments & Subjects**: Define faculties, subject codes, and credit weightings.
- **Teaching Assignments**: Assign educators to specific grades, subjects, and class sections.

### 5. Assessment & Moderation Workspace
- **Assessment Creation**: Build structured assessments, term exams, diagnostic tests, and class tasks with weightings, duration, and mark totals.
- **Review & Moderation Workflow**: Server-enforced lifecycle from Draft through review, Approved, and Archived. Ownership and role checks prevent unauthorized reversals or edits to archived work.
- **Feedback & Revisions**: Reviewers can submit comments and request revisions directly on assessment drafts.

### 6. Institutional Knowledge Hub & Templates
- **Knowledge Base**: Centralized curriculum guidelines, policy documents, and assessment blueprints.
- **Standardized Templates**: Pre-built exam layouts, rubric formats, and moderation cover sheets.

### 7. Reports & Analytics
- Track assessment completion rates, moderation timelines, department workloads, and academic readiness.

### 8. School Branding & Customization
- Configure school crest/logo, institutional color palettes, motto, and contact information used on formal headers and printable assessment papers.

---

## 🛠️ Technology Stack

- **Frontend**:
  - [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
  - [Vite 6](https://vitejs.dev/)
  - [Tailwind CSS v4](https://tailwindcss.com/)
  - [Lucide React](https://lucide.dev/) (Iconography)
  - [Motion](https://motion.dev/) (UI Transitions)
- **Backend**:
  - [Express](https://expressjs.com/) (Node.js TypeScript API server)
  - Custom REST API endpoints (`/api/*`)
  - Server-side DB store with JSON disk persistence (`data/db.json`)
  - Scrypt password hashing and random in-memory bearer sessions
  - [@google/genai](https://www.npmjs.com/package/@google/genai) integration ready for server-side assistance
- **Firebase foundation**:
  - Firebase client and Admin SDK dependencies
  - Tenant-aware Firestore rules with a deny-by-default fallback
  - Cloud Storage locked down until upload integration is complete
  - Named-database rules deployment configured in `firebase.json`

---

## 📁 Directory Structure

```text
├── data/                       # Local runtime data; ignored by Git
│   └── db.json
├── docs/
│   └── V1_QA_REPORT.md         # Security findings and verification status
├── firebase.json               # Firebase rules deployment configuration
├── firestore.rules             # Firestore tenant and role rules
├── storage.rules               # Cloud Storage rules
├── server.ts                   # Backend Express server & API endpoints
├── src/
│   ├── components/
│   │   ├── academic/           # Academic structure & teaching assignments
│   │   ├── archive/            # Archival management
│   │   ├── assessments/        # Assessment creation, moderation & workflow
│   │   ├── audit/              # Audit trail & system logs
│   │   ├── auth/               # Authentication & login components
│   │   ├── branding/           # School branding & themes
│   │   ├── common/             # Reusable UI components & modals
│   │   ├── dashboard/          # Role-tailored dashboards
│   │   ├── knowledge/          # Knowledge hub & document store
│   │   ├── landing/            # Platform landing & portal select
│   │   ├── profile/            # User & school profiles
│   │   ├── reports/            # Analytics & reports
│   │   ├── roles/              # Role hierarchy reference UI
│   │   ├── settings/           # School & platform settings
│   │   ├── superadmin/         # Super Admin platform dashboard
│   │   ├── templates/          # Assessment templates & blueprints
│   │   ├── users/              # User management & account provisioning
│   │   └── wizard/             # School setup onboarding wizard
│   ├── context/
│   │   └── AuthContext.tsx     # Global authentication & tenant context
│   ├── server/
│   │   └── dbStore.ts          # Core in-memory/disk database engine
│   ├── services/
│   │   └── api.ts              # Frontend API client service
│   ├── utils/
│   │   └── rbac.ts             # Role-based access control & permission logic
│   ├── types.ts                # TypeScript interfaces & domain models
│   ├── App.tsx                 # Main application view & router
│   ├── main.tsx                # Client entry point
│   └── index.css               # Global Tailwind CSS imports
├── metadata.json               # Applet metadata configuration
├── package.json                # Project dependencies & build scripts
├── tsconfig.json               # TypeScript compiler configuration
└── vite.config.ts              # Vite configuration
```

---

## ⚡ Development & Build Commands

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs the full-stack application with hot reloading via `tsx server.ts` |
| `npm run build` | Builds the production Vite bundle and bundles `server.ts` into `dist/server.cjs` via `esbuild` |
| `npm start` | Starts the production server from `dist/server.cjs` |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) |
| `npm test` | Runs the database and credential-storage tests |
| `npm run clean` | Cleans build artifacts and compiled files |

---

## 🔐 Authentication and Authorization

- Login uses a single email-and-password entry point. The account's role and school membership determine the available modules and API permissions.
- Sessions expire after eight hours and are stored only for the active browser tab.
- Disabled users and users belonging to disabled schools cannot obtain a session.
- Cross-school requests are rejected unless the verified account is a platform super administrator.
- Teachers can access only their assigned classes, subjects, assessment workspaces, and student rosters.
- School administrators, principals, deputies, HODs, and grade heads receive broader access according to the server-side role matrix.
- New locally stored passwords are hashed with scrypt. Valid legacy plaintext entries are migrated to hashes on login.

## 📝 Recent Major Changes — August 2026

1. **API security and tenant isolation**
   - Added server-issued sessions to protected routes.
   - Added server-side school, role, ownership, and assignment checks.
   - Removed trust in client-supplied actor identities.
2. **Account lifecycle security**
   - Persisted user enable/disable actions and enforced them at login.
   - Added stronger new-user password requirements and generic invalid-credential errors.
3. **Assessment workflow protection**
   - Added explicit transition validation and role-specific approval/archive permissions.
   - Made archived assessments read-only and protected approved work from deletion.
4. **Teacher Students & Marks workflow**
   - Teachers now load their assigned subjects and classes without requesting the leadership-only user directory.
5. **Firebase safeguards**
   - Replaced broad Firestore access with tenant/role rules and a deny-all fallback.
   - Added deny-by-default Storage rules until file uploads are fully integrated.
6. **QA and verification**
   - Added `docs/V1_QA_REPORT.md` with the original findings, fixes, test results, and remaining work.

## ⚠️ Current Development Status

The Firebase foundation is configured, but authentication and application persistence still run through the local Express/JSON development layer. Firebase Authentication, Firestore persistence, Cloud Storage uploads, emulator rule tests, durable multi-instance sessions, session revocation, and login rate limiting remain to be implemented. Do not use real school or student data until those items receive a follow-up security review.

## 📚 Documentation Maintenance

Update this README whenever a pull request introduces a major feature, architecture change, security change, new setup requirement, or significant limitation. Keep `docs/V1_QA_REPORT.md` focused on test evidence and remediation status.
