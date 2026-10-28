# Administrator access investigation — 28 October 2026

Branch: `main`. Earlier uncommitted dashboard, enquiry and recovery work was preserved. No push or deployment.

## Confirmed cause

Read-only inspection of the configured MongoDB database `sales_db` found `dcorhome-admin` with the correct normalized User ID, active status, admin role and one correctly linked Better Auth credential account. The stored password has the installed Better Auth scrypt format; no password, hash or token was printed.

The audit recorded a **self-initiated `reset-password` at 07:59:21 UTC / 1:29:21 PM IST on 28 October**. The credential update and user update have matching timestamps. The preceding successful login was at 07:58:07 UTC / 1:28:07 PM IST. At diagnosis, `sessionVersion=2`, `mustChangePassword=true`, and zero sessions remained. This is the existing reset operation's intended result: replace the previous password, increment the session version, revoke sessions and require a password change after the next sign-in. The old password cannot authenticate after this reset.

The operator confirmed that the error occurs on `http://localhost:3000` and that the reset password was lost. The lost replacement password explains the inability to sign in; the forced-password-change flag explains why even a successful temporary-password sign-in must complete the change flow before admin access. A forced change does not itself reject valid sign-in credentials.

## Connectivity and regression review

- MongoDB connection and account inspection succeeded. The configured database and the URI database both resolve to `sales_db`.
- The local app responds on port 3000, matching local `SITE_URL`. Authentication configuration is ready.
- No current diff changes the login page, account page, session validation, Better Auth configuration, navbar authentication logic or auth endpoint. Contact/enquiry and SEO changes do not change the authentication gate. No authentication middleware/provider replacement was found.
- Roles are taken from the current database record, not inferred from a User ID. Status and session version are rechecked on private requests.

## Preventive fix

- `lib/server/members.ts`: reject administrative self-password-reset with HTTP 409, directing the owner to the existing current-password change flow. Resets for other users retain all existing checks, session revocation and forced-change behavior.
- `components/account/UserManagement.tsx`: the current administrator's Change Password action opens `/account/change-password`, without changing dashboard styling.
- `scripts/admin-account.cjs`: safe audit/session diagnostics and credential-format boolean; verification now correctly recognizes the forced-password-change redirect instead of reporting it as a generic failure.
- `scripts/user-management-check.cjs`: regression checks cover self-reset refusal without credential changes, own-password navigation, navbar admin recognition and the administrator forced-change flow.

## Verification

TypeScript, production build and targeted password/policy/signup checks passed. Disposable MongoDB/browser tests passed for login, `/account`, `/admin/users`, listing/creating users, custom/generated password resets, disable/enable, session revocation/logout, last-active-admin protection, non-admin and cross-origin denial, public signup denial, navbar admin recognition and forced-password-change completion without redirect loops. The local recovery test also passed. These tests did not modify existing users.

Real administrator recovery and subsequent login verification are performed interactively with the existing masked local CLI. The recovery command is explicitly operator-requested and never accepts a password in arguments or prints one:

```powershell
node scripts/admin-account.cjs reset dcorhome-admin
node scripts/admin-account.cjs verify dcorhome-admin
```

On Windows, `DCORHOME_PASSWORD_UI=dialog` selects the existing masked dialog instead of terminal entry. Verification signs out only the session it creates. Real-account results are recorded after those commands complete; isolated tests alone are not evidence of real-account login success.

The operator reported that the masked dialog was not visible. That recovery process and its child dialog were cancelled. No replacement password was automatically chosen. Real-account login and administrator-page verification remain pending recovery. Run the commands above from an interactive terminal in the repository root, first running `Remove-Item Env:DCORHOME_PASSWORD_UI -ErrorAction SilentlyContinue` to select hidden terminal entry. Keep the local app running in another terminal.
