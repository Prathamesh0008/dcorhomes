# Dcorhome authentication: Better Auth and MongoDB only

This supersedes the earlier Clerk cutover and redirect investigation documents. Clerk, its middleware, route providers, account checks, components, dependency and provider switch have been removed from the active application. Historical documents and Git history remain for recovery. `backup/pre-mongodb-auth-final` preserves the starting commit.

## Operation

Members use `/login` with their assigned User ID and password. Public signup, email login, account linking and public password-reset API endpoints are denied by an explicit allowlist; Better Auth also sets `emailAndPassword.disableSignUp: true`. Only username/password login, sanitized session retrieval and logout are exposed. Better Auth's username plugin normalizes User IDs; passwords use its scrypt implementation. Sessions are database-backed, HttpOnly, secure in production, with cookie caching disabled. Every private request rechecks account status, role and session version.

`/login` redirects only for a verified session; `/account` redirects only for a confirmed signed-out state. An account-validation outage renders a stable unavailable message. The navbar asynchronously requests the same validated session; until resolved it shows Account rather than falsely flashing Login. Public HTML, catalogue, Studio, local designs and SEO do not wait for that request. Anonymous requests with no recognized session cookie do not connect to MongoDB.

Administrators use `/admin/users` to create members, list their information, disable/enable accounts, reset passwords and revoke sessions. Each action checks current server-side administrator authorization and serializes changes in a MongoDB transaction. The last active administrator cannot be disabled. Resets and account changes invalidate earlier sessions. Temporary passwords appear only in the immediate response/UI, never in storage or logs. Provisioning requires a genuine internal contact email because Better Auth requires email; this does not change User ID login. Existing historical accounts, including legacy internal email placeholders, are not rewritten.

## First administrator

An administrator already exists in the configured database. Do not bootstrap or reset it.

Only for a database with no existing administrator:

```powershell
npm run auth:bootstrap -- dcorhome-admin "Owner Full Name" <real-owner-email>
```

Replace the email placeholder before executing. The script prompts for the password with hidden input, confirms it, and refuses to run when an administrator already exists. Never put the password in command arguments or chat. After signing in, create additional accounts through `/admin/users` and share temporary passwords privately. Members must change temporary passwords before private access.

## Environment and deployment

Use Node.js 22.x (already required by package.json), the existing MongoDB driver and Atlas database. Required server-only settings: `MONGODB_URI`, `MONGODB_DB` (or URI database), existing `BETTER_AUTH_SECRET` of at least 32 characters, and exact `SITE_URL` origin. Preserve the existing secret to avoid invalidating sessions. Production SITE_URL must be the HTTPS production origin; Preview needs its own exact HTTPS origin and authorized test database settings. Keep `ALLOW_LOCAL_HTTP=false` in hosted environments. Enable TRUST_PROXY only where the hosting proxy controls forwarding headers.

The ignored local `.env.local` now uses `SITE_URL=http://localhost:3000`; obsolete Clerk/provider variables were removed locally. Restart the existing development server to load the new environment and removed middleware. No remote Vercel variables have been changed. `.env.example` documents placeholders. SESSION_SECRET remains only for retired guest-session tooling, not member authentication; unrelated email/export settings are retained.

In Vercel, Project Settings → Environment Variables: configure the required settings for the intended Preview/Production scope. Remove obsolete Clerk and AUTH_PROVIDER settings after reviewing other consumers. Settings changes apply to a new deployment, not an already-serving deployment. Confirm Node.js 22.x in Project Settings → Build and Deployment and inspect the new deployment's runtime logs. Do not deploy Production until Preview connection and authorized user login, refresh and logout are verified.

In Atlas, select the project and cluster matching the reviewed source. Confirm the cluster is running and the Connect → Drivers hostname matches the URI. In Security → Network Access, allow the actual Vercel outbound addresses for the deployment's executing region. Use Vercel's configured Static IPs/Secure Compute egress addresses where available; do not assume workstation IPs or inbound deployment IPs are serverless egress addresses. Confirm database-user permissions and correct authentication database. Never disable TLS, certificate verification or hostname verification. A TLS internal alert alone does not prove an IP-list or runtime cause.

The cached MongoClient/promise, bounded pool, timeout/cooldown and secret-free diagnostics remain in place. Explicit nested SSL/TLS error codes are classified as TLS, rather than merely a generic selection timeout. A failed TLS handshake occurs before MongoDB password authentication; it is not evidence of a bad member password.

Run `npm run db:ping` from the intended trusted environment to test the actual server client configuration. `-- --env-only` ignores local dotenv files and uses only injected settings. A workstation ping using production credentials still tests workstation networking, not Vercel networking. There is no public diagnostic endpoint.

Implementation references: [Better Auth options](https://better-auth.com/docs/reference/options), [username plugin](https://better-auth.com/docs/plugins/username), [MongoDB adapter](https://better-auth.com/docs/adapters/mongo).

## Verification on 27 October 2026

- TypeScript (`npm run lint` and the final Node 22 `tsc --noEmit`): PASS.
- Production build, including the existing preservation and SEO prebuild checks: PASS. The first sandboxed attempt could not fetch the unchanged Google font; the network-enabled retry passed.
- Explicit `VERCEL_ENV=production` content-preservation gate: PASS, with no migration evidence changes.
- Database diagnostic classification checks: PASS, including nested TLS codes, ambiguous TLS wording, DNS/network errors and redaction.
- Build boundaries: PASS, 59 server traces without SQLite/data-directory dependencies and 82 public artifacts without configured server credentials.
- Configured Atlas read-only ping: PASS on workstation Node 22.23.4 / OpenSSL 3.5.9 and Node 24.11.0 / OpenSSL 3.5.4, MongoDB driver 6.21.0. Neither is the failing live Node 24.21.0 / OpenSSL 3.5.7 runtime.
- Read-only inventory: one user, one administrator, one active administrator and one credential account. No production records, passwords or roles were modified.
- Isolated replica-set HTTP tests: PASS for administrator creation, member provisioning with required email, uppercase User ID login, password hashing, wrong/unknown credentials, blocked signup and non-allowlisted endpoints, temporary-password change, session refresh, login/account redirects, normal-user admin denial, reset, disable/enable, explicit session revocation and logout. Test accounts exist only in the disposable local database.
- Public-outage checks: PASS with the actual MongoDB driver connection forbidden, including cookie-bearing public page requests and anonymous sanitized session requests. Private authentication fails closed during outages.
- Focused Studio browser check: PASS for canvas/shade changes, before/after, actual PNG download, device save/reopen/delete. No cloud storage or AI calls; anonymous session reads do not connect to MongoDB.
- Public HTTP/SEO crawl: PASS for 28 pages and 28 public link targets, metadata, canonical/noindex/404 rules, JSON-LD, 17 sitemap URLs and robots, with database connections blocked.
- Preservation regression: PASS using an explicitly local fixture; it verifies that unique unpreserved records are rejected. This fixture is not production preservation evidence.

**Vercel runtime and live administrator login remain unverified.** The browser connector is disconnected, there is no linked Vercel project in this checkout, and no authorized live member password was supplied. No Preview or Production deployment was made. A successful workstation ping does not resolve the earlier live TLS alert. The next release step is an operator-authorized Preview with correct scoped settings and Atlas egress access, followed by real authorized login, refresh and logout before any Production deployment.
