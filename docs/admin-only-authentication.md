# Administrator-only access

Follow-up: public Login/My Account navigation has since been restored for administrators. See [the navigation and enquiry repair report](navigation-enquiry-repair.md) for the current navigation behavior and provider diagnostics. The administrator-only security policy below remains in force.

The administrator entry point is `/admin/login`. Successful established administrators go to `/admin`; temporary-password accounts must complete `/admin/change-password` first. Public navigation no longer requests sessions or displays account links. Legacy login, registration and account URLs redirect to the administrator entry point. Public registration, email sign-in, recovery and account-linking APIs remain forbidden by an explicit Better Auth endpoint allowlist.

## Configuration incident

Inspection of the current local configuration on 2026-11-17 found **two independent blockers**:

- `MONGODB_URI` contains a placeholder password, rejected by `lib/server/mongodb.ts` before connecting.
- `BETTER_AUTH_SECRET` is shorter than 32 characters, rejected before Better Auth initialization.

The resulting HTTP 503 is a configuration failure, not a reason to weaken authentication. Private environment values were neither printed nor changed. No real database connection or account mutation was attempted after the invalid URI was detected. Existing administrator records could not be inspected with these settings.

Set a valid URI for the **existing database**, retaining `MONGODB_DB` (or a database path in the URI). Encode credential punctuation in the URI. Use a cryptographically random, stable Better Auth secret of at least 32 characters, supplied through the private environment or deployment secret manager. Changing this signing secret requires existing administrators to sign in again; it does not delete users or password hashes. Never put credentials into tracked files or terminal output.

Set both `BETTER_AUTH_URL` and `SITE_URL` to `https://www.dcorhome.com` in Vercel Production. Authentication uses `BETTER_AUTH_URL` when set and falls back to `SITE_URL` when it is absent. The configured authentication origin must be a root URL with HTTPS in production. Local production HTTP checks require `ALLOW_LOCAL_HTTP=true` and a loopback origin. Only enable `TRUST_PROXY` behind a proxy that controls forwarding headers. Better Auth and administrative transactions require database read/write/index permissions and a MongoDB replica set (Atlas supports transactions). Use Node 22 as declared in package.json.

Run `npm.cmd run auth:config` for setting-name-only diagnostics and `npm.cmd run db:ping` for a read-only connectivity probe. The auth route now logs invalid **setting names**, without values, instead of concealing configuration failures in an undifferentiated 503. It continues to fail closed.

Better Auth's documented secret requirements: https://better-auth.com/docs/installation

## Provisioning and access control

The existing operator bootstrap is `npm.cmd run auth:bootstrap -- owner.id "Owner Full Name" contact-email`. It prompts for a hidden password, applies the existing password policy, hashes credentials, creates the first administrator in a transaction and refuses if any administrator already exists. Do not bootstrap or reset existing accounts to solve a connection failure. Existing recovery remains `scripts/admin-account.cjs`, a trusted local operator tool, never an HTTP recovery route.

New accounts created at `/admin/users` are always administrators. Supplying a customer role is rejected. Existing customer records and credentials are retained, but customer login and existing customer sessions are rejected. The server rechecks role, active status and session version against MongoDB at login and on every protected session read. Password changes, account disable and session revocation invalidate earlier sessions; the final active administrator cannot be disabled. Newly generated/reset passwords require a password change. The existing red/orange/yellow/green strength meter is reused for password changes and administrator resets; server-side policy remains authoritative.

The protected route group covers the overview, fabric/design drafts, enquiries and administrator management. Login and forced-password-change pages are outside that group to prevent redirect loops and implement their own session handling. APIs independently authenticate requests; layouts are not their security boundary. The legacy `/api/account/password` endpoint is retained for compatibility and now accepts only validated administrator sessions, including temporary-password sessions.

## Content and enquiry management

`/admin/fabrics` and `/admin/designs` save private drafts in `admin_content_drafts`, validate existing catalogue/design schemas and use revision checks to reject stale edits. Fabric assets must already exist under approved repository paths. Deleting a draft never deletes a published record. Export fabrics for review into `data/catalogue/fabrics.json`, run content/build checks and redeploy using the established release process. Curtain designs export as named design configurations for review. These drafts do **not** publish automatically or modify Studio. Public catalogue/design rendering remains repository-based and does not query MongoDB. No existing catalogue, Studio, homepage, hero, branding, globals.css or SEO content was changed.

`/admin/enquiries` reads the website's sent emails from Resend and stores only administrator follow-up notes/status in `admin_enquiry_state`. The existing public submission route still validates consent, contact details, design/shade selection, origin, payload size and honeypot; it throttles requests and reports success only after Resend accepts the notification. It never queries MongoDB. Notifications continue to include escaped HTML, plain text and selected design details, addressed to `sales@dcorhome.com`.

Configure `RESEND_API_KEY` and a verified `RESEND_FROM_EMAIL` (or the existing sender aliases) for submissions. For the inbox, optionally supply `RESEND_ADMIN_API_KEY` with email read permission; otherwise the existing key must have read permission. Sending-only keys cannot power the inbox. Emails are visible only while retained by Resend; older historical database enquiries remain untouched and available through the established private export procedure. No customer email was sent during testing. Resend list/retrieve behavior: https://resend.com/changelog/list-sent-emails-endpoint

## Modified areas and checks

- Authentication: `lib/server/customer-auth.ts`, new `auth-configuration.ts`, `members.ts`, auth catch-all route and admin users API.
- Routing/UI: `app/admin/(protected)`, `/admin/login`, `/admin/change-password`, legacy account/auth redirects, `SiteHeader`, mobile navigation and reused account forms/actions/management.
- Management: `lib/server/admin-drafts.ts`, `admin-enquiries.ts`, corresponding `/api/admin/drafts` and `/api/admin/enquiries` routes and `components/admin`.
- Operations: `.env.example`, package scripts, bootstrap/recovery links, `admin-config-check.cjs`, `admin-only-auth-check.cjs`, `admin-enquiry-check.cjs` and this report.

Verification passed: TypeScript (`npx.cmd tsc --noEmit`), production build (`npm.cmd run build`, including catalogue/assets/SEO prebuild checks), isolated HTTP administrator authentication (`npm.cmd run auth:check`), local administrator recovery, mocked enquiry inbox reads, password policy and anonymous enquiry/storage checks. Authentication integration creates and destroys a disposable replica set and synthetic accounts, never loading production database settings. The sandbox initially blocked launching MongoDB with EPERM; the isolated tests passed after running with process-launch permission. The host used Node 24.11.0; the repository declares Node 22 for deployment.

`npm.cmd run auth:config` correctly reports the two local invalid settings and exits nonzero. `npm.cmd run db:ping` correctly refuses the placeholder URI before connection. Real database connectivity, existing administrator identity and live inbox permissions remain unverified until valid private configuration is supplied. No credentials were rotated and no external email was sent.

The broader `node scripts/architecture-runtime-check.cjs` passed: public routes/catalogue APIs work with MongoDB connections explicitly forbidden, authentication fails closed during an outage, administrator-only account lifecycle works, and read-only exports preserve legacy records. The headless Studio check passed shade changes, before/after, PNG download and local design save/restore/delete. Chrome was unavailable, so the browser helper now supports installed Edge or `DCORHOME_TEST_BROWSER`; the rerun passed with Edge. These script changes also update older authentication expectations to the administrator-only routes.

Pre-existing changes to `next-env.d.ts`, `package-lock.json` and untracked `public/images/image.png` are unrelated to this work and are preserved. No commit or push was requested or performed.
