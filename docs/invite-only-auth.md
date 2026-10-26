# Invite-only Dcorhome members

The application extends the installed Better Auth 1.7.12 with its MongoDB adapter and Username plugin. Public registration, email login, email password resets, account linking and other unneeded auth HTTP endpoints are denied by an explicit allowlist. `/signup` redirects to `/login`. There is no first-admin HTTP endpoint.

## Local configuration and first administrator

Use the existing MongoDB database. Configure these privately in `.env.local`:

```dotenv
MONGODB_URI=<your existing connection URI, selecting your existing database>
MONGODB_DB=sales_db
SITE_URL=http://localhost:3000
BETTER_AUTH_SECRET=<independent random secret of at least 32 characters>
```

`MONGODB_DB` is optional if the URI already selects the correct database. Do not use the sample `YOUR_PASSWORD` as a real credential. The implementation does not fall back to a newly named database or SQLite for authentication. MongoDB Atlas/a replica set with transactions is required for atomic provisioning, password changes and last-administrator protection. MongoDB must permit connection from the deployment and creation of indexes on the selected database. Use HTTPS for production; authenticated production cookies are always Secure. `TRUST_PROXY=true` is appropriate only behind a trusted proxy that replaces client forwarding headers. Otherwise source throttling deliberately shares a bucket rather than trusting spoofable headers.

Catalogue/design records now use the same configured MongoDB database through the shared application repository. `SESSION_SECRET` still protects guest cookies. Legacy SQLite files are preserved for explicit reviewed migration; the runtime no longer reads `DCORHOME_DATABASE_URL` or `DCORHOME_DATA_DIR`. See [database migration and production readiness](mongodb-production-readiness.md). MongoDB member setup does not migrate or delete existing SQL customer profiles. Existing SQL customer credentials are no longer accepted; an administrator must provision/approve MongoDB users. Do not assign an old account's saved records to a new account without separately verifying ownership.

In an interactive terminal at the repository root:

```powershell
npm.cmd run auth:migrate
npm.cmd run auth:bootstrap -- owner.id "Owner Full Name" sales@dcorhome.com
```

The final email argument is optional. Bootstrap checks for any existing admin before prompting, prompts twice without echo, hashes the password, and rechecks within a serialized transaction. It refuses repeat initialization, including when the existing admin is disabled. It does not print a password or run during installation/build/startup. Choose a unique 12–128 character password/passphrase; common predictable terms are rejected locally (this is not a comprehensive breached-password service).

## User management

1. Sign in at `/login` with the chosen User ID and password.
2. Open **My Account → Manage Users** (`/admin/users`). Only an active admin with a current session and completed password setup can access it.
3. Enter full name, a unique 3–30 character User ID, optional email and role (default User). User IDs accept letters, digits, dots, underscores and hyphens and begin with a letter or digit. They are normalized by trimming and lowercasing for login/uniqueness.
4. Create the user and privately hand over the generated temporary password. It is returned once to the administrator's protected response and held only in component memory until dismissed/navigation. It is not persisted in plaintext, logged or emailed. If lost, reset it.
5. First login redirects to `/account/change-password`. Private account APIs stay unavailable until password setup completes. Password changes verify the current/temporary password and revoke all sessions, including the current one; the browser verifies the new credentials to establish a fresh session and continues to the account. If that new sign-in fails, it returns to Login; other sessions remain revoked.

**Reset password** generates another one-time temporary password, increments the version, revokes sessions and requires a new password. **Disable** rejects future logins and immediately makes existing sessions fail server authorization. **Enable** permits login again but does not revive earlier sessions. Concurrent admin operations serialize through a transactional control document. The final active admin cannot be disabled. Roles cannot be edited through user/client profile requests. The old shared `ADMIN_PASSWORD` endpoint no longer grants administrative access; catalogue administration uses the same approved member/admin authorization.

The account page displays member identity, existing account-owned manual designs and enquiries. Device/guest designs remain separate; no implicit account migration occurs. Existing saved-fabric/manual-design APIs derive ownership from the server session and do not accept an owner supplied by the client.

## Collections and indexes

All collections are in the selected existing MongoDB database:

| Collection | Purpose / indexes |
| --- | --- |
| `users` | Internal ObjectId; visible `userId`; unique `normalizedUserId` and email indexes (partial for existing documents); name, role, status, mustChangePassword, sessionVersion, timestamps, createdBy |
| `accounts` | Better Auth credential hash in `password`; unique `(userId, providerId)`; internal user reference. Password hashes are deliberately stored in the library's credential record, not duplicated in users. |
| `sessions` | Better Auth database sessions; unique token; TTL on expiresAt; per-session version. Cookies HttpOnly/SameSite, Secure in production; no browser token storage or cookie-cache authorization. |
| `verification`, `rateLimit` | Better Auth adapter-managed infrastructure; built-in database limiter |
| `member_login_limits` | Atomic login counters keyed by hashed normalized User ID and trusted source IP (or shared source); unique key, TTL expiry |
| `member_control` | Unique administration key, serialization revision |
| `member_audit` | Provision/reset/disable/enable/password-change records; descending timestamp index; no credentials |

The existing Better Auth scrypt hashing is reused (random salt, N=16384/r=16/p=1). No plaintext or reversible passwords are stored. Every private request checks MongoDB active status and version, beyond signed-cookie validity. A credential-attempt snapshot also prevents an in-flight login from bypassing a concurrent reset/disable. Requests fail closed on missing/unavailable MongoDB. User management returns explicit safe projections, never credential documents. Mutation routes require same-origin JSON; Better Auth additionally validates origins on sign-in/out. Redirects are fixed internal destinations, not client-selected URLs.

## Focused verification

```powershell
npm.cmd run auth:check
npm.cmd run lint
npm.cmd run build
```

The default check verifies normalization, local password policy, actual library hashing/verification, status/version rejection and HTTP signup denial. It does **not** claim MongoDB login works.

Once the database is configured, the first administrator has been created, and the server runs at `SITE_URL`:

```powershell
npm.cmd run auth:check -- --database owner.id
```

This prompts without echo for the existing admin password and exercises live HTTP/MongoDB create/login, wrong/unknown credentials, first-login password change, session reuse/logout, normal-user admin denial, disable/revocation, enable/reset, private API rejection and public-page access. It creates one randomly named test member and leaves it **disabled**, retaining its audit trail; it never deletes existing user data. Before a real administrator exists, maintainers can add `--fixture` to test temporary first-admin provisioning and duplicate-bootstrap refusal without a password prompt. That mode refuses to run when an administrator exists, removes only its own precisely identified test accounts and design record afterward, and preserves audit records. Do not execute against a busy production system. This focused test does not exhaustively test all design ownership permutations or browser rendering. Bootstrap must separately be verified against the intended database; it is never invoked automatically by a test.

During implementation, the initial URI supplied in chat was a placeholder. The operator subsequently configured the real MongoDB connection locally. Connectivity and replica-set support were verified. Missing local SITE_URL and an independent random BETTER_AUTH_SECRET were added without printing their values. Live fixture-backed authentication checks passed; temporary test identities were removed, leaving the real first administrator to be created with the interactive CLI. See [verification results](invite-only-auth-verification.md).
