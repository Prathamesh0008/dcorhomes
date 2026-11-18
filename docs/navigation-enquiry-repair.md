# Navigation and enquiry repair — 2026-11-17

## Exact configuration findings

The checked configuration is this workspace's `.env.local`, loaded with Next's environment loader. No linked `.vercel/project.json` or deployed environment was selected. These findings must not be treated as evidence about a different deployment's secrets.

- `MONGODB_URI` still contains a placeholder password. The existing MongoDB configuration validator rejects it before connection.
- `BETTER_AUTH_SECRET` is shorter than 32 characters. Administrator authentication correctly fails closed. Existing users, credentials and administrator identity cannot be inspected with this database configuration.
- `RESEND_API_KEY` is a placeholder and does not have the provider's key format. An actual request to Resend's **sending endpoint** returned HTTP **401**, `validation_error`, classified as `invalid_api_key` (provider meaning: API key is invalid).
- The domain-list endpoint returned HTTP **400**, `validation_error`, also `invalid_api_key`. The configured sender uses the Dcorhome domain, but its verification status **could not be verified** with this key. No claim is made that DNS verification is complete or incomplete.
- `RESEND_FROM_EMAIL` and its compatibility alias `ENQUIRY_FROM_EMAIL` are present. The recipient is fixed on the server to **sales@dcorhome.com**.

Provider probes sent an intentionally empty JSON payload to `/emails`, which cannot create an email, and read `/domains`. No diagnostic email was sent. Only status, allowlisted error names and fixed categories were printed; keys, arbitrary provider messages, database URIs and customer information were not logged.

The browser's generic delivery failure concealed the underlying provider error. The route now records its safe category, status and allowlisted error name. Recognizable invalid local configuration fails before a send attempt. The earlier HTML/plain-text template was already correct and is reused for general, fabric and design enquiries; raw configuration JSON is not rendered in the email.

References: [Resend error meanings](https://resend.com/docs/api-reference/errors), [domain listing](https://resend.com/docs/api-reference/domains/list-domains), [24-hour idempotency behavior](https://resend.com/docs/dashboard/emails/idempotency-keys).

## Changes

- Desktop Login is an understated user icon and text before Design Your Space. The same link appears in the mobile drawer before its design button and in the tablet header. It targets `/admin/login`.
- A client session read changes the link to My Account (`/admin`) only when the server returns an administrator. Failed/expired session reads retain Login. This display state grants no permissions: existing server-side role/status/session-version checks still protect login, administrator pages and APIs. No public signup or customer login was reopened.
- Both enquiry forms retain data after failures and disable their fields while sending. A synchronous lock prevents double clicks from starting parallel submissions.
- An unchanged retry reuses its previous idempotency key and exact JSON body. Editing details creates a new key, fixing the previous changed-payload/same-key conflict. Keys reset after confirmed success; no contact data is stored in browser storage.
- The server passes the key to Resend. Provider idempotency protects retry-after-timeout cases across server instances within Resend's retention window. It is not a permanent deduplication service or a guarantee for independent submissions with different keys.
- Both forms require `accepted: true` and `notified: true` before showing success. Backend acceptance requires an OK provider response with a nonempty email ID. Missing confirmation, invalid credentials/domain, rejected responses and transport failures remain failures.
- Sender resolution normalizes invisible whitespace and chooses the first nonblank value from `RESEND_FROM_EMAIL`, `ENQUIRY_FROM_EMAIL`, `EMAIL_FROM`. Blank canonical values no longer conceal a usable compatibility alias. Newline injection and malformed addresses are rejected.
- Existing HTML escaping, selected fabric/design validation, consent, honeypot, payload/origin checks and bounded throttling remain in place. Public pages and enquiry submission remain independent of MongoDB.

## Configuration required to enable live operation

| Setting | Requirement |
| --- | --- |
| `MONGODB_URI` | Valid URI and credentials for the existing MongoDB database; retain its records and database selection. |
| `MONGODB_DB` | Existing database name, or supply its name in the URI. Replica-set/Atlas support is needed for existing administrator transactions. |
| `BETTER_AUTH_SECRET` | Stable cryptographically random secret of at least 32 characters, supplied privately. Replacing it requires existing sessions to sign in again; passwords/users are retained. |
| `SITE_URL` | Exact root origin; HTTPS in production. Existing loopback HTTP exception is limited to local checks. |
| `RESEND_API_KEY` | Active real key with sending permission for the configured sender domain. |
| `RESEND_FROM_EMAIL` | Sender address on a domain verified in the same Resend account. A branded `Name <address>` value is supported. Compatibility aliases above remain supported. |

Verify the sender domain's required DNS records and status in Resend. A sending-only key may send successfully but cannot list domains; use the dashboard to verify the domain in that case. Restart the local process or redeploy the selected hosting environment after private configuration changes. Never paste these credentials in chat or put them in tracked files. No credentials were invented, rotated or changed by this work.

Safe diagnostics:

```text
npm.cmd run auth:config
npm.cmd run db:ping
npm.cmd run email:config
npm.cmd run email:config -- --verify
```

`--verify` checks provider responses without sending mail. With current settings these diagnostics correctly report configuration failures. A later run with a real key may return a required-field error for the intentionally empty send probe; it does not prove an actual delivery. A successful real enquiry still requires provider acceptance through the application.

## Files modified for this follow-up

- `components/SiteHeader.tsx`, `components/account/AccountNavigation.tsx`, `components/navigation/MobileNavigation.tsx`.
- `app/contact/page.tsx`, `components/curtains/FabricQuote.tsx`, `lib/enquiry-submission.ts`.
- `app/api/enquiries/route.ts`, `lib/server/enquiry-email-configuration.ts`.
- `.env.example`, `package.json` (diagnostic command).
- `scripts/enquiry-config-check.cjs`, `enquiry-submission-check.cjs`, `enquiry-idempotency-check.cjs`, `navigation-enquiry-browser-check.cjs`; existing `enquiry-and-storage-check.cjs` uses a synthetic key in the accepted format and `admin-only-auth-check.cjs` gains the optional browser check.
- This report; the earlier administrator-only report links to this follow-up.

No homepage/hero, branding, typography, palette, globals.css, catalogue records, Studio functionality or existing database records were changed. Work stays on `main`; no commit, push or deployment was performed. Earlier uncommitted work and unrelated assets remain intact. Next may regenerate `next-env.d.ts` during builds; its development reference is restored after checks.

## Verification

- TypeScript: `npx.cmd tsc --noEmit` passed.
- Production build: `npm.cmd run build` passed, including assets/catalogue/SEO checks. One sandbox worker launch hit EPERM; the final run passed with the required process-launch permission.
- `node scripts/enquiry-submission-check.cjs` passed configuration parsing, safe classifications and retry key changes.
- `node scripts/enquiry-idempotency-check.cjs` passed general/design retries, provider acceptance followed by a lost response, edited-payload keys, empty confirmation rejection and privacy of logs.
- `node scripts/enquiry-and-storage-check.cjs` passed readable HTML/plain text, selected designs, fixed recipient, validation/abuse protection, provider failures and no MongoDB calls.
- `node scripts/admin-only-auth-check.cjs --browser` passed using a disposable MongoDB replica set and real synthetic administrator login. It verified administrator authorization, customer login denial, responsive Login/My Account at widths 360–1920, contact/design/fabric-quotation UI failures and retries, retained form details, duplicate-click locking and confirmed-success behavior.

Browser enquiry responses and provider acceptance in automated tests are controlled fixtures, never live email. Live email delivery and actual sender-domain verification remain blocked until the private configuration is corrected. The host is Node 24.11.0; the repository declares Node 22 for deployment.
