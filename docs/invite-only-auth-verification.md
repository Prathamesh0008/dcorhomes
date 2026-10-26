# Invite-only authentication verification

Verification date: 2026-10-26. Implemented directly in the existing repository; not deployed.

## Results

| Feature | Status | Evidence / limit |
| --- | --- | --- |
| Existing MongoDB connection | VERIFIED WORKING | Live ping to operator-configured database; replica-set support confirmed. No alternate database created. |
| First-admin provisioning | VERIFIED WORKING | Transactional fixture provisioning succeeded; repeat bootstrap refused. Temporary admin removed afterward. |
| Interactive bootstrap password prompt | IMPLEMENTED, NOT VERIFIED | Hidden double prompt implemented; unconfigured refusal exercised. Owner must run the interactive command to create the permanent account. |
| Admin creates users | VERIFIED WORKING | Live HTTP admin creation returned 201; user persisted in MongoDB. |
| Secure credential storage | VERIFIED WORKING | Real Better Auth scrypt hash stored separately in accounts; hash differed from temporary password and verified correctly. |
| Case-insensitive User ID login | VERIFIED WORKING | Uppercase User ID logged into the normalized MongoDB user. |
| Wrong / unknown / disabled login | VERIFIED WORKING | Live HTTP requests rejected with generic 401 responses. |
| No public registration | VERIFIED WORKING | Signup endpoint returns 403; email-login/reset endpoints closed; /signup redirects to /login; rendered login contains no signup link. |
| First-login password setup | VERIFIED WORKING | /account redirected to change-password; private API unavailable; password verified/changed; old session rejected; new credentials succeeded. |
| Browser continuation after password setup | IMPLEMENTED, NOT VERIFIED | Client establishes a fresh library session using new credentials and opens /account. Browser JavaScript interaction was not exercised. The same backend reauthentication sequence passed through HTTP. |
| Sessions persist and logout revokes | VERIFIED WORKING | HttpOnly session cookie captured; reused successfully on repeated requests; logout made get-session return null. No localStorage tokens. |
| Disabling revokes access | VERIFIED WORKING | Old session returned null; account-private mutation returned 401; future login rejected. |
| Enabling / password reset | VERIFIED WORKING | Account reenabled; reset generated a new temporary password; previous password rejected; new temporary credential worked. |
| Final active admin protection | VERIFIED WORKING | Live attempt to disable sole active admin returned 409. Concurrent operations use transactional serialization; a concurrent-disable race was not separately stress-tested. |
| Admin page and API authorization | VERIFIED WORKING | Ordinary active member received 404 for /admin/users and 403 for admin APIs; temporary-password session received 401. |
| Administrative CSRF protection | VERIFIED WORKING | Foreign-origin create-user request rejected with 403. |
| Saved-design ownership | VERIFIED WORKING | Ordinary member could not delete another fixture account's saved design (404); changing owner query did not expose it; original owner remained intact. |
| Durable login throttling | VERIFIED WORKING | Concurrent MongoDB counter tests allowed exactly 8 attempts per User ID and 30 per source. Only independently keyed throttle fixtures were removed. |
| Administrative audit | VERIFIED WORKING | Provision/reset/disable/enable/password-change operations persist credential-free audit entries; fixture audit trail retained. |
| Public website | VERIFIED WORKING | Homepage, collections, Studio, About, Contact and Login returned 200; anonymous private routes redirected or rejected. |
| Existing visualizer | VERIFIED WORKING | /studio returned 200 and existing prebuild configuration/asset checks passed. Full browser rendering/export was not retested. No visualizer source edits in this task. |
| TypeScript / lint | VERIFIED WORKING | npm run lint and direct tsc --noEmit checks passed. |
| Production build | VERIFIED WORKING | Next.js production build completed successfully, including new account/admin routes and existing prebuild checks. |
| Permanent owner administrator | NOT IMPLEMENTED | Intentionally not created with a guessed name/password. Owner provisions it using the local hidden-password CLI below. |
| External configuration blocker | No remaining database blocker | Real MongoDB connection is configured locally. Production configuration/HTTPS and permanent owner bootstrap remain operator setup; no deployment performed. |

Tests used generated credentials held in memory, never printed. Cleanup was restricted to exact fixture identities and an explicitly owned saved-design fixture; existing customer profiles, assets, secrets and user data were preserved. No application account was created during build or startup.

## Owner setup

In an interactive local terminal, choose your own User ID and name:

```powershell
npm.cmd run auth:bootstrap -- your.chosen.id "Your Full Name"
```

Optional email may be supplied as the final argument. Enter a unique strong password twice at the hidden prompts. Then open `/login`. Do not paste the password into chat, command arguments or source files. Do not run `--fixture` after creating your real administrator.

Create members under `/admin/users`; securely hand over the temporary password once. Use Reset password for a new one-time temporary password, or Disable to revoke private access immediately. The account management UI is implemented; backend behavior was verified by focused HTTP tests rather than a large browser suite.

## Files in this task

Created:

- `lib/server/mongodb.ts`
- `lib/server/member-policy.ts`
- `lib/server/members.ts`
- `app/api/admin/users/route.ts`
- `app/api/admin/users/[id]/route.ts`
- `app/api/account/password/route.ts`
- `app/admin/users/page.tsx`
- `app/account/change-password/page.tsx`
- `components/account/UserManagement.tsx`
- `components/account/ChangePassword.tsx`
- `components/account/AccountSavedDesigns.tsx`
- `scripts/bootstrap-admin.cjs`
- `scripts/member-prompt.cjs`
- `docs/invite-only-auth.md`
- `docs/invite-only-auth-verification.md`

Modified:

- `lib/server/customer-auth.ts`
- `lib/server/security.ts`
- `app/api/auth/[...all]/route.ts`
- `app/api/admin/session/route.ts`
- `app/admin/page.tsx` (authentication controls only)
- `app/account/page.tsx`
- `app/login/page.tsx`
- `app/signup/page.tsx`
- `app/layout.tsx` (account state props only)
- `components/SiteHeader.tsx` (account state props only)
- `components/SiteFooter.tsx` (removed signup link only)
- `components/navigation/MobileNavigation.tsx` (account links only)
- `components/account/AccountNavigation.tsx`
- `components/account/AuthForm.tsx`
- `scripts/auth-loader.cjs`
- `scripts/auth-migrate.cjs`
- `scripts/customer-auth-check.cjs`
- `package.json`, `package-lock.json`
- `.env.example`
- `.env.local` (ignored; added missing local origin and independent auth secret; did not print secrets)
- `README.md`

Previously existing uncommitted logo/visualizer changes were left intact. This task did not change their implementation, global CSS, homepage, hero, catalogue or editorial designs.

For the exact collection/index inventory, session behavior and configuration requirements, see [setup and architecture](invite-only-auth.md).
