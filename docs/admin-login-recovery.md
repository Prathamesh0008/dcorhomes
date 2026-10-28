# Existing administrator recovery

Read-only inspection on 28 October 2026 confirmed that the configured database and URI database are both `sales_db`. MongoDB ping succeeded with network access. `dcorhome-admin` exists with role `admin`, status `active`, `mustChangePassword=false` and session version 1. One Better Auth credential account exists with the expected ObjectId user reference, matching account ID and a password hash present. No existing database records were changed during diagnosis.

These facts do not establish whether the password used in the failing browser request was correct, or whether a hosted deployment uses these same environment settings. The generic login response also masks Better Auth server errors. Do not describe an unknown password as a proven invalid password. Sandboxed connection attempts timed out; a network-enabled workstation ping and inspection succeeded.

Run from the repository root in an interactive terminal (passwords are hidden; never supply them as arguments or environment variables):

```powershell
node scripts/admin-account.cjs inspect dcorhome-admin
node scripts/admin-account.cjs reset dcorhome-admin
```

The reset requires exactly one existing active administrator and one correctly linked credential account. It refuses missing, ambiguous or malformed records. It uses Better Auth's existing hash function and the application's password-change transaction: update the credential, clear the forced-change flag, increment the session version, delete that user's previous sessions and write an audit entry. It does not create users, change roles/status, or modify other users. Cancel before confirming the password to leave credentials unchanged.

Start the existing app with `npm.cmd run dev`, then run:

```powershell
node scripts/admin-account.cjs verify dcorhome-admin
```

Verification first checks the supplied password against the configured database in memory. It then signs in against `SITE_URL`, checks `/account` and `/admin/users` twice with the issued cookie, checks session persistence and logs out its test session. A password mismatch identifies invalid credentials in this database; a successful hash check followed by an HTTP failure points to runtime/server/configuration differences requiring investigation. It never prints passwords, hashes, cookies or tokens. Real administrator login remains unverified until this interactive step succeeds. The configured local `SITE_URL` is `http://localhost:3000`; this check does not validate a hosted deployment.

Quick isolated recovery checks (disposable local replica set; no `.env.local` credentials loaded):

```powershell
node scripts/admin-recovery-check.cjs
# After a successful production build, also check actual private pages:
node scripts/admin-recovery-check.cjs --http
```

Public signup and password-reset endpoints remain blocked. No public UI, Studio, catalogue, branding or SEO changes are needed.

Validation completed: TypeScript, production build, existing password/policy/signup checks, and the isolated recovery HTTP checks passed. The HTTP checks verified administrator access to both private pages, repeated session reads, logout and subsequent login redirects. These used a disposable administrator, not the existing administrator's unknown password.
