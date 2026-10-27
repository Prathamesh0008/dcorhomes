# Local login/account redirect correction - 27 October 2026

## Confirmed configuration and defect

The actual `.env.local` selects Clerk and contains working Development-instance key configuration. SITE_URL remains `https://dcorhomes.vercel.app`; the reported problem is on the local development server, verified running on port 3000. Neither a legacy session nor admin-only protection is the account access mechanism in Clerk mode. Root layout has no competing authentication provider/redirect, and the public navigation has no authentication navigation effect.

The defect was competing decisions: the server reduced absent, pending, unauthorized and invalid/revoked sessions to the same null value; `/account` redirected that result to `/login`. When the server considered a visitor signed out, `/login` mounted Clerk SignIn unconditionally. That widget automatically navigates an already-signed-in browser to `/account`, even when this server has not accepted its session. That yields the possible `/login` -> widget `/account` -> server `/login` cycle. Streaming/client navigation can show HTTP 200 in dev logs during that cycle; HTTP status alone did not identify which guard made the decision.

The local configuration also authorized only the Production canonical origin. A localhost session can therefore fail the middleware's authorized-party check. The fix admits the actual loopback request origin ONLY in NODE_ENV=development; Production's configured origin allowlist is unchanged. The public SEO canonical and `.env.local` were not modified.

A read-only query of the configured Clerk backend found one user, zero explicitly approved Dcorhome users and zero ADMIN-metadata users. No sessions were returned by that inventory. This confirms a remaining approval requirement in the configured instance; it does not prove which session/cookie state existed in the owner's already-open browser, or that the browser uses the same instance. The browser connector is disconnected; no existing browser cookies/tokens were accessed. Pending session tasks are a supported regression case, not an observed cause asserted from those logs.

## Corrected policy

Both pages now use one server-side resolution with five outcomes: authenticated, signed out, pending tasks, denied, unavailable. Clerk is inspected with `treatPendingAsSignedOut: false` solely to classify pending state. Private access still requires the fresh Backend API session to be active, unexpired and owned by the approved, enabled user. This option never grants pending sessions private access.

- Login redirects to account only after full server validation.
- Signed-out account redirects once to login. Denied/unavailable accounts stay on a stable message instead of bouncing back.
- The client waits for Clerk loading to finish. An active browser session rejected/missed by the server gets a stable verification message and explicit check/sign-out actions; the auto-redirecting SignIn widget never mounts in that state.
- Pending reset-password, MFA and organization tasks render the supported Clerk task component. Unknown/unresolved tasks get a stable completion/help state. Completion returns through login for server validation.
- Ordinary approved USER accounts remain eligible for account access; admin checks are separate and unchanged.
- Legacy session validation is only invoked in legacy mode; no cookies/localStorage/username-only flag authorizes private data.

Optional diagnostics: temporarily set `AUTH_NAVIGATION_DIAGNOSTICS=true` while using `next dev`. Logs contain only fixed route/provider/status booleans and redirect destination; no identifiers, cookies, keys or tokens. They are off by default and suppressed in Production. No automatic redirect counters, refresh effects or session bypasses were added.

## Files for this correction

- `lib/auth-navigation.ts`: shared redirect/client-render policy and opt-in safe diagnostics.
- `lib/auth-provider.ts`, `middleware.ts`: local loopback authorized-party handling, awaited middleware error handling.
- `lib/server/account-session.ts`: explicit resolved states while preserving resource authorization.
- `app/login/page.tsx`, `app/account/page.tsx`: shared decisions and stable outcome handling.
- `components/account/ClerkAccount.tsx`, `AccountAccessNotice.tsx`: guarded sign-in/task rendering and stable recovery actions.
- `scripts/auth-navigation-check.cjs`: redirect matrix and actual component rendering with synthetic Clerk states (not proof of real login).
- `scripts/auth-navigation-browser-check.cjs`: one fresh-profile signed-out browser check against a running local server.
- `scripts/clerk-auth-check.cjs`: adjusted expected unavailable-message text.

## Verification and remaining setup

PASS: TypeScript (`npm run lint`), no-cycle redirect matrix, loading/client-server disagreement, actual login-component task selection, USER account destination, Production origin restrictions and development-only diagnostics. These regression states are synthetic and are not represented as real provider authentication.

PASS against the actual running Clerk-configured localhost:3000 server: GET login 200 with no redirect, GET account 307 to login, subsequent GET login 200. A fresh isolated Chrome profile loaded the real Clerk widget, stayed on login, and after opening account returned once to login without repeated navigation. No passwords were entered and no account records were changed. No full-site E2E suite was run. Public features/assets/SEO/root layout and the production content gate are unchanged.

NOT VERIFIED: real authorized username/password sign-in, the owner's existing browser state, signed-in refresh/homepage/account persistence, real logout/reuse rejection, or real admin/session-task provider flows. These require an authorized test account and its supported browser login. No login success or logout success is claimed.

The owner must explicitly authorize the intended Clerk account before access can pass existing policy. In Clerk Dashboard -> Users -> intended user -> Public metadata, an authorized operator sets `dcorhomeAccess` to `approved` and role to `USER` (ordinary account) or `ADMIN` only for an explicitly authorized administrator. A username is also required. Do not grant administrator rights just to silence an error, and do not put these values in unsafeMetadata. This task changed no user metadata, roles, usernames, passwords or stored records.

After correct account provisioning, use the normal login form, refresh account, navigate home/back, verify USER denial on admin and authorized ADMIN access, then logout and reopen account. If the existing browser still has an unaccepted session, use the displayed sign-out/check action; do not automatically delete cookies or reset credentials. No push or deployment occurred.
