# Clerk authentication rebuild - staged, not cut over

> The later [local redirect correction](login-redirect-fix.md) records the now-configured Development keys and latest validation. Missing-key statements below describe the original staging run; real authorized sign-in remains unverified.

Branch: `feature/clerk-auth-rebuild`. Recoverable baseline: commit `a602606`, also named by local branch `backup/pre-clerk-auth-rebuild`. No push, merge, deployment, database deletion, password reset or legacy-user migration is authorized by this implementation alone.

## Current status

Clerk integration is implemented, but keys and dashboard access are missing. Actual provider-backed login, username-only provisioning, Invite-only settings, recovery and ban/revocation are NOT VERIFIED. Do not interpret policy/negative tests as a successful real login. The old provider is retained until the requested development/Preview acceptance succeeds.

`AUTH_PROVIDER=legacy` (the default) preserves the existing application during preparation. `AUTH_PROVIDER=clerk` selects ONLY Clerk for that deployment: legacy cookies cannot authorize resources, old `/api/auth/*` endpoints return 410, legacy password/member mutation helpers are disabled, and there is no automatic MongoDB fallback. Missing/mismatched Clerk keys deny private access while public pages continue working. An invalid provider value fails private access closed. Do not select Clerk in Production before acceptance and explicit cutover approval.

## Inventory and preservation

The legacy implementation is `lib/server/customer-auth.ts`, `members.ts`, `member-policy.ts`, `mongodb.ts`, `lib/auth-client.ts`, `/api/auth/[...all]`, `/api/account/password`, `/api/admin/users[/id]`, and the AuthForm, ChangePassword, UserManagement and AccountActions components. It had no existing authentication middleware. Better Auth, its MongoDB adapter and password functions are retained for the pre-cutover environment and recovery; this is not a completed removal of those packages.

The protected resource inventory is `/account`, `/account/change-password`, `/admin`, `/admin/users`, `/api/admin`, `/api/admin/session`, `/api/admin/users`, `/api/admin/users/[id]`, and the legacy password/auth routes. Authorization helpers now choose a single provider. Page resources and actual API handlers check identity/roles on the server independently of middleware. Retired cloud endpoints remain retired; there are no new Server Actions, content write APIs, account provisioning APIs, uploads, AI services or authentication database.

New integration files: `middleware.ts` (Next.js 15), `lib/auth-provider.ts`, `lib/server/account-session.ts`, `lib/server/clerk-policy.ts`, `components/account/ClerkScope.tsx`, `ClerkAccount.tsx`, and provider layouts for `/login` and `/account`. Existing private pages, APIs and security helpers are wired through the provider selection. `/admin/users` directs authorized administrators to Clerk Dashboard; its read-only API uses Clerk's official backend user list, with server authorization. Website user creation and modification are disabled in Clerk mode.

ClerkProvider and middleware are limited to account/login/administration. The root layout, public navigation styling, homepage, logo assets, catalogue, Studio, browser-local designs, room assets and SEO are unchanged. Public pages do not perform Clerk backend user lookups. The login page reuses the real geometric brand and documented Clerk appearance/localization options; supported SignIn provides passwords, visibility controls and errors. No SignUp component or social-login implementation was added. Dashboard settings must also disable public registration and unwanted authentication methods.

MongoDB historical users, credentials, audit records, sessions and archived application data remain untouched. Existing private exports and content-preservation evidence are unchanged. Clerk user IDs differ from MongoDB user IDs: no records are automatically linked by username/email, and no private exports are released on that basis. Verify ownership separately before any later private-data migration. Local designs do not depend on account identifiers and remain on the existing device.

## Simple owner setup: development first

1. Sign into [Clerk Dashboard](https://dashboard.clerk.com), create/select the Dcorhome application and select its Development instance. This is a separate service account, not a Dcorhome customer login.
2. Under **User & authentication**, enable **Username** and **Password**. Make username the intended sign-in identifier. Disable unwanted social connections and other sign-in methods. Configure email/phone as optional only if the instance supports the desired username-only model. Required fields must be supplied honestly; never invent email addresses. If the dashboard/user-creation flow requires a real contact method, supply the authorized owner's actual contact or keep setup blocked. See [authentication options](https://clerk.com/docs/guides/configure/auth-strategies/sign-up-sign-in-options) and [user creation requirements](https://clerk.com/docs/reference/backend/user/create-user).
3. Open **Access mode** and select **Invite-only** (API value `restricted`), NOT Open. Check this separately in Development and Production. Accounts must be created by the dashboard administrator, or through deliberately authorized invitation flows. The site has no public signup page/creation API. Hiding the sign-up action is only presentation, not this security setting. See [access modes](https://clerk.com/docs/guides/secure/restricting-access).
4. Under **User & authentication -> User model -> User permissions**, turn OFF **Allow users to change their username**. Also disable self-deletion if the owner must control account lifecycle. These are provider restrictions, not CSS. See [restrict identifier changes](https://clerk.com/docs/guides/configure/auth-strategies/sign-up-sign-in-options#restrict-changes).
5. Under **API Keys**, copy the Development publishable key and secret key privately into ignored `.env.local` with these names. Never paste them into chat, Git, screenshots, diagnostics or public files:

```dotenv
# Substitute the actual values privately; these are names/placeholders only.
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=<development publishable key>
CLERK_SECRET_KEY=<development secret key>
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/account
SITE_URL=http://localhost:3000
# Select this only after inserting valid matching keys and configuring the instance.
AUTH_PROVIDER=clerk
```

Restart/rebuild after adding public variables. Development keys start with `pk_test_`/`sk_test_`; Production requires matching `pk_live_`/`sk_live_`. The server rejects test keys when VERCEL_ENV is production. The publishable key is intentionally public; only CLERK_SECRET_KEY authorizes backend administration. There are no real keys in `.env.example`.

## First administrator and subsequent accounts

The authorized owner should create their fresh user through **Users -> Create user** in Clerk Dashboard, with username `dcorhome-admin` (or another assigned ID) and a unique securely delivered credential. No default password exists. Follow the provider's secure password/invitation workflow; never store credentials in project files or put them in URL parameters. Enable MFA for dashboard operators and appropriate admin accounts where supported.

In that user's **Public metadata**, set the following as the trusted dashboard administrator:

```json
{ "dcorhomeAccess": "approved", "role": "ADMIN" }
```

For an authorized ordinary user, create their unique username/credentials in Dashboard and set:

```json
{ "dcorhomeAccess": "approved", "role": "USER" }
```

These are non-secret access flags controlled by the Backend API/dashboard, not client-editable unsafeMetadata. A created account without explicit approval and a valid role receives no private application access. Roles are uppercase in provider metadata and mapped to the existing internal admin/user permissions on the server. Website ADMIN does not make someone a Clerk workspace/dashboard administrator. Never grant metadata-setting API access to the browser.

The server validates both the verified Clerk session and fresh Backend API user/session state for private resources. It rejects banned/locked users, inactive/expired sessions, mismatched session owners, missing usernames and unapproved metadata. Provider failures fail closed. Backend reads add provider availability/rate-limit costs to private requests; public pages remain independent. Metadata/JWT cookies supplied by the browser are not accepted as role authority.

To disable access, **ban** the user in Dashboard and confirm session revocation. Clerk documents that banning revokes sessions and prevents sign-in ([banUser](https://clerk.com/docs/reference/backend/user/ban-user)). Removing Dcorhome approval additionally denies application access on the next private check. Use unban/restore approval only after authorization. Do not delete the user to disable access.

Password changes use Clerk's UserProfile security flow on `/account/change-password`. Recovery with a verified contact uses Clerk's supported recovery flow. Without a verified recovery contact, the owner must verify identity out of band and use Clerk Dashboard's supported password/access recovery plus session revocation. Do not claim an email reset was sent for username-only accounts. Do not implement security questions, manual hashes, shared passwords or recovery bypasses.

## Preview and Production cutover

In the intended Vercel project -> Settings -> Environment Variables, add the documented keys, sign-in route variables, AUTH_PROVIDER and exact HTTPS SITE_URL to **Preview** scope for this branch. Use the Development instance and authorized test users there. Keep deployment protection. Public variables are embedded at build time; a changed key requires a new build. Keep existing Production variables untouched. This task creates no Preview automatically.

Acceptance must use real authorized Clerk users: correct username/password, incorrect password, attempted unauthorized signup (including Account Portal/provider), refresh/session persistence, logout and rejected reuse, ban of the approved test user with active-session denial, restored access, USER forbidden on admin APIs, ADMIN permitted, provider password/recovery path, username-change restriction and denied old Better Auth cookies/endpoints. Capture only status/results; no passwords, tokens or screenshots of credentials. Recheck public pages/catalogue/Studio/local designs/SEO with MongoDB unavailable. Synthetic checks cannot replace this matrix.

After successful Development/Preview acceptance, create/configure the Production instance: Invite-only, username/password, identifier restrictions, approved administrator metadata, production domain/Clerk DNS and production keys. Update the privacy notice/service-provider wording before cutover; current wording still describes the retained legacy provider. Obtain explicit deployment approval. Then select Clerk exclusively for the new Production deployment and verify live login/access/logout. No legacy sessions are accepted in Clerk mode.

Only AFTER actual Clerk acceptance may the remaining legacy routes/modules/client components and Better Auth packages be removed in a reviewed cleanup. Keep MongoDB/export dependencies if preservation tools still need them; never delete records or remove Vercel variables merely because a runtime import disappears. The backup branch remains recoverable, but reverting to the old provider would restore the old operational problem; do not switch providers automatically during an outage.

## Validation evidence

All checks below ran under Node 22.23.4. Provider-backed login and dashboard security settings remain BLOCKED until the instance and real keys are available.

| Check | Result |
| --- | --- |
| TypeScript / `npm run lint` | PASS. |
| `npm run check` | PASS: unchanged preservation workflow, public content, visualizer assets/local storage and email acceptance/failure behavior. |
| Production-scoped `npm run build`, AUTH_PROVIDER=clerk, no Clerk keys | PASS, including the real existing preservation prebuild requirement; unconfigured private access is denied. Initial sandbox attempt failed fetching the existing Inter font; the network-enabled retry passed without a font/UI change. |
| `npm run check:clerk` | PASS: pure role/approval/ban policy; legacy API/session/write-helper rejection; unconfigured admin denial; public HTTP routes remain available with Clerk selected and the real MongoDB driver forbidden. This is explicitly NOT a provider login test. |
| `npm run check:architecture`, AUTH_PROVIDER=legacy | PASS: public offline routes and a focused Studio/local-save browser journey; secure database outage handling; existing legacy auth tested only against disposable localhost MongoDB; preservation-fixture refusal. No business accounts modified. |
| `npm run check:build-boundaries` | PASS: 58 server traces without SQLite/data-directory dependencies, 86 public artifacts without configured server credentials. Scan now includes CLERK_SECRET_KEY. |
| Existing dependency resolution comparison | PASS: all pre-existing package versions unchanged. @clerk/nextjs 7.9.21 is pinned and its published peer range accepts installed Next.js 15.5.28 / React 19.3.1. |
| Public/record preservation diff | Root layout, homepage, header, assets, catalogue/site JSON, SEO and migration evidence/gate scripts unchanged. Only .env.example is tracked among environment/private paths; no secrets or private exports added. |

NOT TESTED: real Clerk login, incorrect credential/provider rejection, provider-level signup/identifier restrictions, real Clerk role enforcement, session refresh/logout, ban/unban and recovery. No fake/in-memory account is offered as evidence for these. No key was invented to produce a passing test. No automatic push/merge/deploy occurred.

The package audit also reports inherited Next/PostCSS advisories, not a Clerk advisory. Existing dependency versions were retained; no forced Next.js 16 upgrade or broad dependency refactor was applied. This is not a claim of a clean dependency security audit.
