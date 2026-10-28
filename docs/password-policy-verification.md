# Password validation and live strength feedback

Implemented on `main`, 28 October 2026. No deployment or push. Existing accounts and credentials were not changed by this task.

## Actual validation bug

The modal and API shared a rule that rejected any occurrence of `password`, `qwerty`, `letmein`, `welcome`, `123456`, `dcorhome` or `changeme` anywhere in a password, and returned the same generic message for all of them and repeated-character passwords. The 12–128 length bounds were correct. There was no strength estimator. A strong unrelated-word passphrase containing a listed word could be rejected, while many predictable passwords absent from that small list could pass.

The particular rejected password was not supplied and was not requested; its matching term cannot be identified without it. The exact rejection branch and its false-positive behavior were reproduced using synthetic fixtures.

The Windows dialog duplicated the blacklist. Browser generation used Web Crypto, while server generation used Node crypto, but server-generated reset passwords did not pass through the policy. Add User validated generated passwords, so a rare incidental blacklist match could fail instead of producing a replacement.

## Shared policy and generator

- `lib/password-policy.ts` uses [zxcvbn-ts](https://zxcvbn-ts.github.io/zxcvbn/guide/getting-started/) with the recommended common and English dictionaries and keyboard graphs. It recognizes dictionary words, substitutions, repetitions, sequences and dates; account User ID/name/email terms are supplied as context. Raw input bounds remain 12–128 characters, and scoring uses the same NFKC normalization as Better Auth hashing.
- Scores 0/1 map to WEAK, 2 to FAIR, 3 to GOOD and 4 to STRONG. GOOD or STRONG is required for a new password. No uppercase, digit or special-character quota is imposed. Unrelated-word passphrases are accepted. Known common/account-based whole-password constructions with predictable numbers, years or simple substitutions are also rejected, including estimator edge cases. This check is anchored to the complete password, not arbitrary substrings.
- The shared generator uses Web Crypto to obtain 24 random bytes, encoded without bias as 48 hex characters (192 random bits). It returns a password only after the same contextual policy rates it STRONG, with a bounded retry on failure. No `Math.random()` is used. Generate updates the field without saving it.
- Server-side creation, admin reset, self-service/first-login change and local recovery all use this policy. Existing passwords are not retroactively rejected at sign-in. Administrator permissions, Better Auth scrypt hashing, session-version increment/deletion, required password change after admin resets and signup denial are preserved.

## Live feedback and files

- `components/account/PasswordStrength.tsx`: compact bar, accessible meter/text, specific safe feedback and reduced-motion support. Colors: WEAK `#DC4545`, FAIR `#ED963B`, GOOD `#E8BC47`, STRONG `#27845B`.
- `lib/password-strength.worker.ts`: runs the same estimator off the UI thread, coalesces queued keystrokes and ignores outdated results. A checking state prevents a stale label from being presented as the latest assessment. Passwords remain in browser memory; nothing is sent to a scoring service or stored. If workers are unavailable, the interface explains that validation will still occur on save.
- `components/account/UserManagement.tsx`: contextual live feedback, checked generation and existing Show/Hide/Copy controls; generated Add User credentials also display strength. Feedback never echoes the password.
- `components/account/ChangePassword.tsx` and `app/account/change-password/page.tsx`: the same contextual policy and meter for self-service and first-login changes.
- `lib/server/member-policy.ts`: compatibility export of the shared policy. `lib/server/members.ts`: authoritative contextual validation and shared generation in all relevant operations.
- `scripts/bootstrap-admin.cjs`, `scripts/admin-account.cjs`, `scripts/member-password-dialog.ps1`: CLI context is supplied to the shared Node policy; the dialog no longer has a conflicting rule.
- `package.json` / `package-lock.json`: estimator and language packages. Attribution retained in `docs/password-dictionary-notices.md`.
- `scripts/password-policy-check.cjs` and `scripts/user-management-check.cjs`: focused policy/API/browser regression checks using synthetic credentials and disposable MongoDB.

## Verification

TypeScript and production build passed, including the existing repository/asset/content/SEO checks. Policy fixtures passed for short/overlong rejection, common and repeated passwords, account-based passwords, random passwords, 12-character random input, unrelated passphrases and the old substring false positive. A 64-password generation check produced unique policy-compliant STRONG results. Existing hashing, status, session and signup checks and the isolated local-recovery check passed.

`node scripts/user-management-check.cjs` passed against the final production build with a disposable MongoDB replica set:

| Requested check | Result |
| --- | --- |
| Short password | PASS: specific minimum-length feedback and API rejection |
| Common long password / predictable substitutions | PASS: policy rejection; common/repeated API fixtures rejected |
| Strong random password | PASS: accepted and hash verified |
| Long unrelated passphrase | PASS: accepted by policy/API and used successfully to sign in |
| Generate | PASS: checked STRONG output in browser, server reset and Add User; 64 unique generation samples |
| Live strength feedback | PASS: all four labels and exact requested colors; feedback does not echo input |
| Password change and login | PASS: new password authenticates |
| Previous password | PASS: rejected after reset |
| Old sessions | PASS: revoked after reset/change |
| Add User | PASS: generated credential passes the same contextual policy and rates STRONG |
| First-login change | PASS: account-based password rejected, strong change completes and restores private access |
| Mobile modal | PASS: no horizontal overflow; masked input, meter, Show/Hide/Copy and confirm controls work |

Non-admin denial, last-active-admin protection, self-reset refusal and signup blocking also passed. Clipboard handling uses an in-page test stub to avoid changing the operator's clipboard. Screenshots are in ignored `.test-data/user-management/`, including `password-mobile.png`, which was visually reviewed. No broad Playwright/E2E suite or live-account password reset was used.

Homepage, Design Studio, SEO, logo and authentication provider configuration were not changed by this task. Earlier uncommitted work remains preserved in the working tree.
