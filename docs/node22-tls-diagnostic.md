# Node 22 MongoDB TLS comparison

Diagnostic branch: `diagnostic/node22-mongodb-tls`. This branch is for Preview testing; do not promote it to Production on the basis of workstation results.

## Evidence and scope

The operator supplied a live Vercel connection failure: Node v24.21.0, OpenSSL 3.5.7, MongoDB server-selection wrapper, underlying `ERR_SSL_TLSV1_ALERT_INTERNAL_ERROR`, sign-in HTTP 503. That explicit alert indicates TLS negotiation failure on the affected connection, before MongoDB SCRAM authentication and before Better Auth can verify the member's password. It is not evidence of an incorrect member password, a certificate-validation error specifically, or use of TLS 1.0. The peer or an intermediary can terminate negotiation; the alert alone cannot identify why.

The request handler awaits the database-backed member limiter before calling Better Auth. Better Auth's initialization and member lookup also await the shared application MongoDB client. No application TLS overrides or alternate auth connection were found. The client pool/retry behavior, authentication rules and login UI are unchanged.

Installed dependencies remain MongoDB driver 6.21.0, Better Auth 1.7.12 and its MongoDB adapter 1.7.12. Only root engines metadata changes in the lockfile; no dependency resolutions change. Both package manifests now require 22.x on this branch. No .nvmrc, .node-version, .npmrc, vercel.json, Vercel project link or GitHub runtime configuration was found; README now reflects the diagnostic branch. Vercel dashboard settings have not been inspected or changed.

| Environment | Result |
| --- | --- |
| Reported live Vercel Node 24.21.0 / OpenSSL 3.5.7 | TLS alert and login 503, operator-supplied evidence; not independently replayed. |
| Workstation Node 24.11.0 / OpenSSL 3.5.4 | Existing `npm run db:ping` PASS with application settings. |
| Workstation Node 22.23.4 / OpenSSL 3.5.9 | Same read-only ping PASS with unchanged driver, client and settings. |
| Vercel Node 22 Preview | BLOCKED: browser connector disconnected; no authenticated CLI/project link or approved Preview test database/user configuration available. No Preview created. |

Both local versions can connect; the live Node 24 failure is not reproduced locally. These are different patch versions, operating systems and network paths. Also, this Node 22 release still uses OpenSSL 3.5, so changing Node majors does not isolate an OpenSSL-major hypothesis. No runtime incompatibility is confirmed.

Explicit allowlisted nested TLS/certificate codes now produce `category: tls` rather than being hidden by a generic server-selection `network_timeout`. A TCP reset merely mentioning TLS still retains its network category. Safe underlying codes and runtime versions remain logged; messages, credentials, hosts, database names and URIs are excluded.

## Authorized Preview experiment

1. Restore the browser connector while signed into the intended Vercel project, or provide authorized CLI access/project linkage privately. Supply an existing authorized test-user credential source and the test database settings through private Preview environment settings, never chat or Git. Do not reuse Production credentials implicitly or reset existing users.
2. Configure branch-specific Preview settings for this diagnostic branch: MONGODB_URI and MONGODB_DB for the authorized test source, a dedicated BETTER_AUTH_SECRET, and SITE_URL equal to the exact HTTPS Preview origin. The app requires that origin for mutations. Retain Preview deployment protection. Do not edit Production variables or the project-wide Production runtime.
3. Create a Preview from this branch. Verify the build and function runtime actually use Node 22.x; package engines takes precedence over dashboard selection when applicable. Inspect overrides rather than assuming a dashboard label describes the function. See [Vercel Node version selection](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions) and [Preview environment scope](https://vercel.com/docs/environment-variables).
4. Compare identical dependency/code/database/region/egress settings under Node 22 and Node 24 wherever possible. A Node 22 test database success compared with a different Production database failure is not a controlled compatibility conclusion. Record deployment IDs, runtime versions and safe error codes privately; don't log credentials. An authorized matched Node 24 Preview control is preferable to changing Production.
5. Use the real Preview login form with the approved test user; confirm successful sign-in, HttpOnly secure cookie, authorized account access, get-session and browser reload/session restoration, then sign-out and denied reuse of the old session. Do not alter credentials, users or authentication policy. This does not require forcing the one-hour Better Auth session-renewal interval or changing expiry settings.
6. If the same alert persists under Node 22, inspect Atlas cluster status and privately compare the driver-generated host to the Preview URI; check Vercel function region and actual outbound addresses against Atlas's active IP Access List. An inbound website IP or workstation allowlist entry cannot establish function access. For configured Static IPs, include both egress addresses per region; do not open global database access. See [Vercel allowlisting](https://vercel.com/kb/guide/how-to-allowlist-deployment-ip-address).
7. From the affected authorized network, investigate DNS SRV/TXT and each replica-set host's TCP port (usually 27017), then validated TLS with SNI equal to that host. Record only safe status/protocol/cipher/error codes. A workstation ping already validates a usable end-to-end path here, not the function's path. Inspect custom CA, proxy and Node options privately; never disable TLS, hostname/certificate verification or lower cipher security to make a test pass. No public diagnostics endpoint is allowed. If egress and identity are correct but alerts persist, give Atlas/Vercel support the deployment/time/region and redacted codes through private support.

No Production promotion is safe to recommend until the actual Preview runtime comparison and authorized authentication flow pass. No deployment or production data write has occurred in this investigation.

## Completed local validation under Node 22.23.4

- Diagnostic regressions and targeted password/hash/session-policy/signup checks: PASS.
- `npm run lint` (TypeScript): PASS.
- `VERCEL_ENV=production npm run build` (process-local scope): PASS, including the existing production content-preservation prebuild gate. This is a local production-mode build, not Vercel execution.
- `npm run check:architecture`: PASS. Public pages/catalogue/SEO/Studio work with the MongoDB driver forbidden; offline authentication fails securely. One focused browser journey verified preview/download/local designs. Ephemeral localhost MongoDB verified invite-only login, secure sessions, password policy, status/role enforcement, session revocation/logout and signup denial. Fixtures and password changes were confined to that disposable local test database, never existing business accounts.
- The architecture test's preservation fixture also confirmed that unique unpreserved content blocks migration. Original production evidence and gate scripts are unchanged.
- Lockfile comparison: only root Node engines metadata changed; every dependency resolution is identical.

These checks do not verify the Preview test-user sign-in, browser reload or session renewal in Vercel. No new runtime version was installed system-wide; the diagnostic Node executable came from an isolated npm cache.
