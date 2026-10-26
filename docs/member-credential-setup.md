# Creating real member credentials locally

This uses the existing MongoDB database and Better Auth implementation. It does not create another authentication system or change public website features.

The first administrator command is:

```powershell
npm.cmd run auth:bootstrap -- dcorhome-admin "Dcorhome Administrator"
```

It refuses to create a second initial administrator. Passwords must be unique passphrases of 12–128 characters, without common predictable terms. The CLI prompts without echo and allows retry after validation failure or confirmation mismatch. Never pass a password as a command argument.

For the requested real-account verification flow on Windows:

```powershell
node scripts/setup-member-credentials.cjs
```

The setup helper opens masked local password dialogs for first-admin creation and login verification. Password-dialog responses travel through a captured memory-only child-process pipe, never a log or file. The helper confirms the admin database operation and uses the actual authenticated admin HTTP workflow to create `dcorhome-test01`.

It tests unique User IDs, temporary-password login, first-login password change, ordinary-user admin denial, disable/session revocation, public signup denial, and anonymous user-creation denial. After testing, it leaves the requested test account **disabled**, resets its password, and shows that fresh temporary password once in the authenticated owner's local terminal. Enter dismisses the display. Passwords and cookies are never included in the status file.

The helper refuses to overwrite an existing test user or initialize over a different existing administrator. A partially completed flow should be reviewed before retrying; use the normal admin panel to reset an existing test user if needed.

The credential-free local progress report is `.data/member-onboarding/status.json`, inside the ignored private data directory. It contains only User IDs, roles, statuses and verification results. Do not enable terminal transcripts during credential setup.

After setup, open the site's `/login` page and sign in as `dcorhome-admin` with the password you chose. Open **My Account → Manage Users** to create additional approved User IDs, reset passwords, enable accounts or disable them. A generated temporary password is shown once; if lost, reset it rather than attempting to recover it. Enable `dcorhome-test01` before using its final temporary password; its next successful login requires a password change.
