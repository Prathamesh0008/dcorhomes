# Visualizer enquiry and email verification

Implemented on `main`, 28 October 2026. No commit, push or deployment.

## Result

- Active Studio enquiry links (including the secondary enquiry link) and saved visualizer designs use a short `designRef`. The validated configuration remains in an immutable browser-local snapshot, separate from customer information. Changed designs get separate snapshots, preserving history and separate tabs. Browser storage failure produces a general-enquiry link with an honest warning.
- Contact displays a read-only “Your Selected Design” section with supported room, fabric and color names, plus a brief illustrative-selection disclaimer. Personal fields and Additional Message start empty. A recovered design selects Design Enquiry; direct visits retain General Enquiry. Measurement and fabric entry points remain available.
- Legacy `visualizer` configuration URLs are validated and supported. URL message text is never copied into the editable message. Invalid, outdated, missing or cross-browser references show a warning and permit a normal enquiry.
- The server validates the structured configuration against supported room/material/fabric/shade data. One shared function derives the readable design fields used by Contact and both email formats.
- The HTML email uses the existing forest-green/ivory branding and approved logo asset. It contains Customer Details, Selected Design, Project Details, Customer Message and reply/call actions. The plain-text fallback contains the same information. Supplier SKUs are shown only for verified supplier selections. No configuration JSON, technical IDs, filenames or JSON attachments are included. Design details are not appended to the customer message.
- Existing Resend delivery integration, consent, honeypot, same-origin checks, rate limit, payload bounds and idempotency forwarding are retained. Both supplied contact channels are validated. Success still requires provider acceptance with a returned email ID.
- No composed image is included: an existing safe email-ready handoff is unavailable. No unrelated room photo or private upload is substituted.

## Verification

| Flow | Result |
| --- | --- |
| A: Open `/contact` directly | PASS: General Enquiry, empty personal/message fields, no selected design |
| B: Studio to Contact | PASS: readable selected-design section and empty Additional Message |
| C: Change shade | PASS: Burgundy selected in Studio appears in Contact; independent snapshot/history tests preserve earlier shades |
| D: Design submission | PASS with mocks: browser sends separate configuration and actual customer message; API creates readable HTML/text without duplicate notes, JSON or attachments |
| E: General / fabric / measurement enquiries | PASS: mocked API/email paths retain their relevant fields without irrelevant visualizer content; phone-only measurement enquiries include a valid call action |
| F: Malformed / legacy URLs | PASS: safe warning for malformed references, valid legacy configuration recovery, URL message ignored |
| G: Desktop / mobile | PASS: focused Chrome check, no horizontal overflow; screenshots under ignored `.test-data/enquiry-contact/` |

- `npm.cmd run lint`: PASS.
- `npm.cmd run build`: PASS, including repository content, asset, catalogue and SEO prebuild checks.
- `node scripts/enquiry-and-storage-check.cjs`: PASS. Mocked Resend acceptance, rejection, missing configuration/ID and transport failure; readable/escaped HTML and text; contact/consent/honeypot/origin/body validation; rate limiting and idempotency forwarding; local snapshot/legacy/shade/history tests. MongoDB connection attempts: zero.
- `node scripts/enquiry-contact-smoke.cjs`: PASS. One focused browser workflow, with intercepted form submission; no real email delivery. No broad Playwright/E2E suite.

Live Resend/inbox delivery was not exercised. A successful mock is not evidence of inbox delivery. Browser-local references require the same browser and retained site storage; the fallback explains this if recovery fails.

Homepage, logo assets, catalogue data, rendering engine, authentication, MongoDB, SEO and business contact details were not changed by this task. Earlier uncommitted administrator-dashboard and local-recovery work remains in the working tree.
