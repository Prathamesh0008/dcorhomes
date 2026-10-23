# Customer accounts, About and Contact — Phase 3

Implemented directly in the existing application. No deployment, paid AI requests or live customer emails were made. Existing uncommitted repository work was preserved. The homepage/hero, comparison interaction and Brand implementation were not edited by this task.

## Routes and customer experience

- `/about`: editorial curtain photography, approach, supported fabric categories, style exploration, library and consultation links. No invented company history, addresses, testimonials or guarantees.
- `/contact`: improved existing consultation page, clickable official email and copy action; required name, email **or** phone, enquiry type and privacy consent. Optional fabric, colour, city, measurements, room and message. Existing fabric/configurator query-string summaries retain selected shade/SKU/main/sheer details in the message. Client validation, submit lock, honeypot, backend validation, durable throttling and idempotency remain active.
- `/signup`, `/login`, `/forgot-password`, `/reset-password`: shared photographic layout and accessible inputs, password visibility, feedback and loading states. Private/auth pages have noindex metadata.
- `/account`: server session guard; name, email/verification state, profile name editing, logout and securely account-associated enquiries. Links to existing device/guest saved designs with an explicit ownership explanation.
- `/api/auth/[...all]`: Better Auth handler, no-store responses, safe unavailable responses and reset blocking when email is absent.
- Header: two spacious desktop rows, all seven page links visible; account actions and Studio CTA above. Existing responsive mobile panel, Escape/focus handling and account dropdown. Footer adds About, Contact, state-appropriate auth links and official email.

## Authentication and storage

Better Auth supplies credential hashing (scrypt), database sessions, HttpOnly cookies, expiry, CSRF/origin checks, one-time reset/verification tokens and server validation. It avoids custom credential/session cryptography and supports both existing deployment storage options. Full-page navigation after login/logout refreshes server-rendered navigation without storing tokens in localStorage.

Customer auth uses the existing PostgreSQL URL in production. Local-only installations use `customer-auth.sqlite` alongside existing private SQLite metadata; existing guest/admin schema is untouched. Run `npm run auth:migrate` after setting the environment: this creates Better Auth's user, account, session, verification and rateLimit tables. Back up production data before operating schema migrations. No production migration was run here.

Seven-day sessions, 12–128 character passwords, database rate limits (login 5/minute, signup 5/hour, reset 3/hour), session revocation on password reset. Proxy headers are used only when the operator sets `TRUST_PROXY=true`; otherwise limits use a shared bucket. Only enable that setting behind a proxy that replaces client-supplied forwarding headers.

Enquiries continue to persist in the existing `records` table. Signed-in submissions additionally create `account-enquiry` records owned by the **server-validated** customer ID, in the same transaction. Account queries only read that owner. Guest enquiry histories are not matched by an unverified email address. Existing guest design APIs and device IndexedDB are unchanged.

## Email and configuration

Required for customer accounts:

| Variable | Purpose |
| --- | --- |
| `SITE_URL` | Approved absolute application origin, HTTPS in production |
| `BETTER_AUTH_SECRET` | Independent random secret of at least 32 characters |
| `DCORHOME_DATABASE_URL` | Durable PostgreSQL connection for Vercel/production |
| `DCORHOME_DATA_DIR` | Local-only alternative private directory; never under public |
| `SESSION_SECRET` | Existing guest/enquiry system secret, at least 32 characters |

Email uses the existing Resend provider, not a competing system:

| Variable | Purpose |
| --- | --- |
| `DCORHOME_CONTACT_EMAIL=sales@dcorhome.com` | Server-side enquiry notification destination; defaults to the official address |
| `RESEND_API_KEY` | Provider API credential |
| `ENQUIRY_FROM_EMAIL` | Provider-verified sender/domain, independently verified in Resend |

`ENQUIRY_TO_EMAIL` is superseded for contact notifications. Owning the business mailbox does not establish sender verification. Enquiry success distinguishes durable receipt from notification acceptance; acceptance by Resend is not proof of inbox delivery. Without email configuration enquiries still persist, registration/login can work without verification, and reset requests return an honest unavailable error. With email configured, registration requires email verification. Provider failures are never represented as successful delivery. Successful reset-request responses use eligibility-neutral wording.

Local environment inspection found `SITE_URL`, `BETTER_AUTH_SECRET`, PostgreSQL and Resend sender/key unset. Existing local private storage and guest secret are set. Secret values were not printed or modified. Configure the environment and run the migration before using live accounts. PostgreSQL execution and real mailbox delivery remain unverified.

## Guest designs and deletion

**NOT IMPLEMENTED:** importing local/guest designs into an account. The account page deliberately links to the existing device designs and states they are not imported. IndexedDB photo ownership cannot be established solely by creating an account on that browser. A future import must explicitly confirm device ownership and validate each private guest session before copying data. No private photos were migrated.

Account deletion is a documented manual workflow: customer emails `sales@dcorhome.com` from the account address; operator verifies ownership, revokes/deletes that user's auth sessions and credential/verification records, deletes the user and owner-matched account-enquiry records, then reviews corresponding operational enquiry records for required retention. Do not match or delete unrelated guests' photographs by email. Confirm retained records and reasons with the customer. The business must approve legal retention periods and the existing draft privacy/terms before public launch; these are not invented here.

`lib/business.ts` is the editable official contact/enquiry configuration. Business identity, physical address, phone, showroom, hours and social profiles remain unspecified and unpublished.

## AI hold

`lib/ai/config.ts` unconditionally reports AI disabled during this phase, even if an old environment flag remains enabled. Studio explains the hold; working manual sample selection and existing backend code are retained. No API keys were activated and no AI requests were made.

## Files created

- `app/about/page.tsx`
- `app/account/page.tsx`
- `app/login/page.tsx`, `app/signup/page.tsx`, `app/forgot-password/page.tsx`, `app/reset-password/page.tsx`
- `app/api/auth/[...all]/route.ts`
- `components/account/AccountActions.tsx`, `AccountNavigation.tsx`, `AuthForm.tsx`, `AuthPage.tsx`, `FormControls.tsx`
- `lib/auth-client.ts`, `lib/business.ts`, `lib/server/customer-auth.ts`, `lib/server/email.ts`
- `scripts/auth-loader.cjs`, `auth-migrate.cjs`, `customer-auth-check.cjs`, `phase3-server.cjs`, `phase3-api-check.cjs`, `phase3-browser.cjs`
- This report.

## Files modified by this task

`app/layout.tsx`, `app/contact/page.tsx`, `app/contact/layout.tsx`, `app/api/enquiries/route.ts`, `app/privacy/page.tsx`, `app/sitemap.ts`, `app/studio/page.tsx`, `components/SiteHeader.tsx`, `components/SiteFooter.tsx`, `lib/ai/config.ts`, `.env.example`, `package.json`, `package-lock.json`, `scripts/browser-check.cjs`.

## Verification status

- **VERIFIED WORKING:** TypeScript and production build; asset/comparison and manual configurator prebuild checks.
- **VERIFIED WORKING:** isolated real SQLite migration, signup, credential hashing/checks, HttpOnly sessions, anonymous denial, logout and revoked sessions, database login rate limiting and cross-origin rejection (`node scripts/customer-auth-check.cjs`). Verification/reset mail is mocked; expiring one-time-token consumption and rejection of reuse exercise the real provider implementation.
- **VERIFIED WORKING:** isolated local HTTP signup/login/logout, account guard, profile editing, owner-isolated account enquiries, phone-only enquiry persistence/idempotency, no-email reset rejection, public catalogue and AI-disabled readiness (`node scripts/phase3-api-check.cjs` against `node scripts/phase3-server.cjs`).
- **VERIFIED WORKING:** focused Chrome checks of About, Contact, Login and Signup at 360, 390, 768, 1024 and 1440px: no horizontal overflow or broken images, one main heading, email link, product prefill, required validation, mobile navigation/Escape/focus return, public catalogue/Studio and anonymous account redirect. Final stable-build run had no captured runtime exceptions. Desktop/mobile screenshots were reviewed in the temporary directory (`dcorhome-phase3-*.png`).
- **IMPLEMENTED, NOT VERIFIED:** production PostgreSQL authentication/migration and real email verification/reset/notification delivery.
- **BLOCKED BY CONFIGURATION:** live customer accounts until origin, auth secret and migrated database are configured; live transactional email until Resend key and verified sender are supplied.
- **NOT IMPLEMENTED:** guest-photo/design import; automatic self-service account deletion. Manual deletion workflow documented above.

The dependency audit reports existing Next.js-transitive PostCSS advisories (one high, one moderate). Better Auth/pg had no reported advisories. No forced Next.js major upgrade was performed as part of this feature task.

Auth integration references: [Better Auth SQLite](https://better-auth.com/docs/adapters/sqlite), [PostgreSQL](https://better-auth.com/docs/adapters/postgresql), [email/password](https://better-auth.com/docs/authentication/email-password).
