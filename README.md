# Dcorhome

Existing Next.js 15.5.28 / React 19 curtain-design application. Node 24 or newer is required for the built-in SQLite adapter. Fonts and colors are preserved; styling remains in Tailwind TSX classes.

See [the manual curtain configurator and catalogue report](MANUAL_CURTAIN_CONFIGURATOR.md) for independent layer rendering, catalogue imports, Studio integration, asset provenance and verification limits. The earlier [prepared-look report](CURTAIN_CONFIGURATOR.md) documents the previous implementation.

## Run locally

Use `npm.cmd run dev` on Windows, or `npm run dev` elsewhere. `npm run lint` checks TypeScript; `npm run build` validates comparison assets and builds production output. `npm start` serves the last build.

Development uses `.next-dev` and `tsconfig.dev.json`; production uses `.next` and `tsconfig.build.json`. Stop the relevant server before rebuilding or clearing its generated output. Do not manually create generated manifests.

## Pages

- `/`: automatic/manual comparison, distinct photographic sample composer, fabrics, process, inspiration, measurements, FAQ and consultation.
- `/studio`: upload/drop a room, select style/material/pattern/color/heading/length/fullness/layers, generate when configured, compare, save, download, share and enquire.
- `/designs`: browser-local and private guest-session history with reopen/delete.
- `/collections` and `/collections/[id]`: illustrative reference catalogue with search/category/palette/surface filters, persistent favorites and detail pages.
- `/measure`: cm/in planning estimator with panel count, roll width, fullness, repeat and allowances; passes measurements to consultation.
- `/contact`: consent, validation, duplicate protection, persistent enquiry and optional email notification.
- `/inspiration` and `/inspiration/[slug]`: original editorial guides.
- `/how-it-works`, `/faq`, `/privacy`, `/terms`: supporting content; legal notices are explicitly drafts for owner approval.
- `/admin`: server-authorized administration for enquiries, catalogue, public image uploads, design options, homepage pair, FAQ/articles and retention cleanup.
- `/share/[token]`: explicit, expiring, revocable result-only sharing.

## Configuration

Copy `.env.example` to `.env.local` and configure only the services you intend to use. Never paste keys in chat or commit credentials.

Browser-local saving works without a backend. For private session storage and enquiries, set `DCORHOME_DATA_DIR` to a protected durable directory **outside public**, plus a random `SESSION_SECRET` of at least 32 characters. SQLite metadata lives there; large images do not live in database records. Restrict directory permissions/Windows ACLs and use encrypted volumes/backups as appropriate.

For local private images, set `ASSET_STORAGE=local`. For managed private image storage, set `ASSET_STORAGE=s3` and `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`. The adapter uses path-style S3 Signature V4. Keep bucket public access blocked. Use durable single-host SQLite storage; this is not a multi-instance/serverless database deployment. The S3 adapter must be verified against your selected provider before launch.

Set a random `ADMIN_PASSWORD` of at least 20 characters for the owner login. There is no default credential. Admin sessions expire after eight hours and logout revokes their server record. Rotate `SESSION_SECRET` to invalidate all sessions after a compromise. Customer accounts and account recovery are not implemented: server history belongs to a 30-day guest cookie.

Enable image generation only after the above is configured: set `AI_ENABLED=true`, `OPENAI_API_KEY` and optionally `OPENAI_IMAGE_MODEL` (existing default `gpt-image-1.5`). The endpoint decodes uploads, uses enumerated preferences, applies per-session and request-origin limits, reserves a global rolling daily call allowance and saves private outputs. Default limits: one attempt/session/day, two/IP/day, five total/day; global configuration is capped at 20. Failed provider calls count against attempts. These are request caps, not a monetary billing guarantee: configure the provider's own spending controls too.

`TRUST_PROXY=true` is appropriate only when a trusted ingress replaces untrusted forwarding headers. Otherwise all requests share a conservative IP bucket. Keep `ALLOW_LOCAL_HTTP=false` for public HTTPS; enable it only for local HTTP tests to permit session cookies.

Enquiries are saved even without email. To notify the business through Resend, configure `RESEND_API_KEY`, `ENQUIRY_FROM_EMAIL` and `ENQUIRY_TO_EMAIL`. The UI confirms persistence, never unverified email delivery.

Retention cleanup is an authenticated admin action using `RETENTION_DAYS` (default 30). Run it regularly and arrange an operational schedule before launch. Backups require their own retention policy. The adapter does not provide a hosted cron service.

Set `SITE_URL` to the approved HTTPS domain for canonical/sitemap URLs and indexing. Until then, robots and root metadata discourage indexing. Owner identity, contact details, service area, legal terms, privacy contact and real SKU data still need approval.

## Verification commands

- `node scripts/validate-assets.cjs`: rejects identical paths/content and mismatched comparison dimensions.
- `node scripts/logic-check.cjs`: measurement formulas, units, repeats, panels and invalid inputs.
- `node scripts/api-check.cjs`: starts an isolated test server on 3200, uses temporary test storage and an explicit provider fixture, then tests the browser flow with Chrome on Windows; no real AI/email requests.
- `node scripts/browser-check.cjs`: Chrome on Windows, against a production preview on 3100; responsive screenshots, interactions and browser-local saving.

See `DCORHOME_IMPLEMENTATION.md` for the completion report and actual verified/blocked status. `lib/assets.ts` centralizes photography provenance; `PHOTOGRAPHY.md` documents original licenses. Historical phase documents describe earlier states and are superseded by the implementation report.

Nothing is deployed by these commands.
