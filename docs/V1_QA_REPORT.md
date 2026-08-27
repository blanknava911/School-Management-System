# Version 1.0 QA and Security Report

Date: 2026-08-27  
Source tested: `blanknava911/New-Project` main at `9c209bb`  
Environment: local, using fictional seeded data only

## Summary

The baseline build and existing tests passed, but testing found seven security and workflow issues. Six were fixed in this change set. The remaining architectural item is the full migration from the local Express/JSON data layer to Firebase Authentication, Firestore, and Cloud Storage.

## Findings and status

| ID | Severity | Finding | Status |
| --- | --- | --- | --- |
| QA-SEC-001 | Critical | API endpoints accepted unauthenticated and cross-school requests | Fixed and verified |
| QA-SEC-002 | Critical | Passwords were stored as plaintext in committed runtime data | Fixed for local storage; committed runtime file removed |
| QA-SEC-003 | Critical | Firestore had an authenticated-user catch-all rule | Fixed; rules now deny by default |
| QA-ARCH-001 | High | Firebase initialization was not connected to application data flows | Open; migration is still required |
| QA-WF-001 | High | Approved assessments could move backwards without authorization | Fixed and verified |
| QA-AUTH-001 | High | Disabled users could still sign in | Fixed and verified |
| QA-AUTH-002 | Medium | Login errors revealed whether an email existed | Fixed and verified |

## Changes made

- Added eight-hour, cryptographically random bearer sessions and required authentication for protected API routes.
- Enforced school isolation and server-side role permissions. Actor identity now comes from the verified session rather than request data.
- Added assignment-scoped access for teachers and filtered teacher assessment lists to their own work.
- Added an assessment transition state machine, ownership checks, and approved/archive protections.
- Added persistent enable/disable controls for users and blocked disabled users and disabled schools at login.
- Replaced different login errors with one generic invalid-credentials response.
- Replaced plaintext password storage with scrypt hashes and automatic migration after a valid legacy login.
- Removed runtime database data from source control and added `data/` to `.gitignore`.
- Replaced broad Firestore access with tenant/role rules, a deny-all fallback, and locked-down Storage rules until file storage is integrated.
- Fixed the teacher Students & Marks view so it loads assigned classes without requesting the protected user-management endpoint.

## Verification performed

- TypeScript type checking: passed.
- Database tests: 2/2 passed, including hash verification.
- Frontend production build: passed.
- Server production bundle: passed.
- Unauthenticated protected requests: rejected with `401`.
- Teacher access to user management: rejected with `403`.
- Teacher cross-school request: concealed with `404`.
- Assigned teacher roster request: allowed; forged actor query data ignored.
- Super administrator school list: allowed.
- Approved-to-submitted workflow reversal: rejected with `409`.
- Disabled user login: rejected; login restored after re-enabling.
- Teacher webview: assigned Grade 2A, Grade 3A, and Grade 4A subjects loaded without the previous fetch error.

## Remaining work before real-data use

The application still uses the local Express/JSON persistence layer. Firebase is configured, but Firebase Authentication, Firestore persistence, Cloud Storage uploads, emulator rule tests, session revocation, login rate limiting, and durable multi-instance sessions are not complete. Keep this project on fictional data until that migration and a follow-up security test are finished.

