# Dcorhome implementation checklist

## Initial audit

| Feature | Initial status | Evidence |
|---|---|---|
| Five existing pages, header/footer, typography | WORKING | Existing route/browser tests |
| Comparison / autoplay | WORKING | Pointer, keyboard, timed autoplay tests |
| Homepage composer | NOT IMPLEMENTED | Green section repeats hero imagery |
| Fabric discovery | PARTIALLY WORKING | Search/category work; no detail, persistent favorites or extra filters |
| Studio | PARTIALLY WORKING | Upload, selections, sketch, provider call; no room/style/length/history/share |
| Billable image API | PARTIALLY WORKING | No persistent rate limits/quota or decoded-image validation |
| Enquiries | BLOCKED BY EXTERNAL CONFIGURATION | Resend-only delivery, no persistence |
| Measurement | PARTIALLY WORKING | Fixed roll/allowance, cm only |
| Accounts/storage/admin | NOT IMPLEMENTED | No database/auth/storage modules |
| FAQ/editorial/legal/SEO | NOT IMPLEMENTED | Placeholder metadata base; no supporting routes |
| Product heart | UI ONLY | State disappears on navigation |

## Progress

- [x] Audit code, routes, assets, settings references and reference journey.
- [x] Shared data/options, distinct homepage composer and complete homepage.
- [x] Studio upload validation, complete options, actual-result saving/download/share.
- [x] Persistence, private assets, protected administrative APIs and usage controls.
- [x] Catalogue discovery/details, measurement and enquiry handoff.
- [x] Supporting pages, metadata, sitemap and legal drafts.
- [x] Build, browser/API tests and accurate final status/configuration report.

No production data is modified. Credentials are never printed or embedded in client code. Provider calls remain unverified until configured and explicitly tested within controlled usage limits.


## Completion report

This is an implemented application with verified local and isolated-test flows, **not a declaration that live production services are operational**. On the normal project instance, `/api/session` returned `persistence:false, assets:false` and `/api/visualize` returned `configured:false`. No real credentials were read, added, printed or used for paid generation. No real enquiry notification was sent. No deployment occurred.

### Routes and pages

| Route | Actual status |
|---|---|
| `/` | VERIFIED WORKING: distinct sample composer, hero comparison/autoplay, value strip, fabrics, visualizer process, editorial references, measurement introduction, FAQ and consultation |
| `/studio` | VERIFIED WORKING: local upload/validation, design preferences, optional clearly labelled placement diagram, local saving; provider-backed result UI verified with explicit fixture only |
| `/collections`, `/collections/[id]` | VERIFIED WORKING: search, category, palette/surface directions, saved-fabric controls, details and studio/consultation links |
| `/measure` | VERIFIED WORKING: cm/in conversion, track/drop, windows, panel count, roll width, fullness, allowance and repeat calculations; preliminary assumptions and consultation handoff |
| `/contact` | VERIFIED WORKING: client validation/error flow; persistence/consent/idempotency verified in isolated configured server. Normal instance BLOCKED BY CONFIGURATION |
| `/designs` | VERIFIED WORKING: browser-local history/reopen/delete; private guest history verified in configured fixture. Normal server history BLOCKED BY CONFIGURATION |
| `/inspiration`, `/inspiration/[slug]` | VERIFIED WORKING: five original curtain guides plus protected admin-managed additions; proper missing-slug handling |
| `/how-it-works`, `/faq` | VERIFIED WORKING: genuine explanatory content and native accessible disclosure controls |
| `/privacy`, `/terms` | VERIFIED WORKING as owner-review drafts; publication approval BLOCKED BY CONFIGURATION / business information |
| `/admin` | VERIFIED WORKING in isolated configured browser/API tests: sign-in, data overview/editor and sign-out. Normal instance BLOCKED BY CONFIGURATION |
| `/share/[token]` | VERIFIED WORKING with explicit test share; result-only image endpoint, expiry and revocation. Production storage BLOCKED BY CONFIGURATION |
| `/sitemap.xml`, `/robots.txt` | VERIFIED WORKING HTTP responses. Approved domain/indexing requires SITE_URL |

Five editorial slugs: `choosing-living-room-curtains`, `sheer-vs-blackout`, `curtain-colors-modern-homes`, `measure-windows-for-curtains`, `curtain-pleats-and-lengths`.

### Reusable components and data

Created `DesignComposer`, `DesignActions`, and server-rendered `FAQ`; reused `CurtainComparison`, `PageIntro`, `ProductCard`, `FabricSelector`, header/footer and shared action/typography utilities. Added design options, a central asset manifest, editorial data, measurement logic, IndexedDB design persistence and catalogue/options hooks. Server modules cover SQLite metadata, signed sessions/authorization, private image storage, catalogue/content/options and homepage settings.

The navbar adds Inspiration while retaining a discoverable consultation link through the mobile menu and footer. Desktop navigation switches to the compact menu below 1280px to avoid crowding.

### User flows and honest boundaries

- VERIFIED WORKING: composer selection and URL handoff; styles/patterns/rooms/fabric/color summary; sample photographs change via working scene selectors.
- VERIFIED WORKING: browser-local save/list/reopen/delete, including original-photo restoration. Local storage is limited to ten designs; browser clearing can erase them.
- VERIFIED WORKING in fixture: upload -> provider response -> decoded private result -> comparison -> save -> private history -> reopen -> result link -> revoke. The fixture is confined to test scripts and is never imported by application routes.
- BLOCKED BY CONFIGURATION: live OpenAI generation on the normal instance. Real model output quality, billing and provider account access were not tested.
- VERIFIED WORKING in fixture: consultation persistence, privacy consent, duplicate-submission key, admin enquiry viewing/status updates. BLOCKED BY CONFIGURATION on the normal instance until private storage/session configuration.
- IMPLEMENTED, NOT VERIFIED: real Resend delivery and S3-compatible managed storage against an owner's actual account.
- VERIFIED WORKING: result download HTTP bytes and share-link privacy controls; native file sharing depends on the device/browser. IMPLEMENTED, NOT VERIFIED on a physical device.
- NOT IMPLEMENTED: customer accounts, account recovery, checkout/payment, inventory/ordering and multi-instance database deployment. Guest-session and local history are provided instead, as permitted by the brief.
- NOT IMPLEMENTED: manufactured product/SKU claims, guaranteed blackout specifications, verified customer reviews or fabricated testimonials. None are displayed.

### API inventory and test evidence

| Endpoint | Verification |
|---|---|
| `GET /api/session` | VERIFIED WORKING: configuration response and private guest cookie in isolated setup |
| `GET /api/catalogue` | VERIFIED WORKING: default catalogue and persisted admin updates |
| `GET /api/options` | VERIFIED WORKING: supported design options and protected setting updates |
| `GET/POST /api/visualize` | VERIFIED WORKING configuration/error gates, corrupt-image rejection, valid decoded fixture output, quota/provider-error handling. Live generation BLOCKED BY CONFIGURATION |
| `GET/POST /api/designs` | VERIFIED WORKING private list/save in isolated setup |
| `GET/DELETE /api/designs/[id]` | VERIFIED WORKING owner-only retrieval/deletion and cross-session denial |
| `GET /api/designs/[id]/image` | VERIFIED WORKING private original/result bytes and denied cross-session access |
| `POST/DELETE /api/designs/[id]/share` | VERIFIED WORKING explicit creation/revocation; no default public link |
| `GET /api/shared/[token]` | VERIFIED WORKING result-only retrieval, expiry and revocation |
| `POST /api/enquiries` | VERIFIED WORKING persisted synthetic enquiry, input/consent validation, origin rejection and idempotent retry. Real email IMPLEMENTED, NOT VERIFIED |
| `POST/DELETE /api/admin/session` | VERIFIED WORKING wrong-password rejection, secure sign-in and server-side logout revocation |
| `GET/PATCH /api/admin` | VERIFIED WORKING auth enforcement, enquiry status, catalogue/content/options updates and rejection of identical showcase sources |
| `POST /api/admin/assets` | VERIFIED WORKING isolated licensed fixture upload and decoded public asset |
| `GET /api/catalogue/images/[id]` | VERIFIED WORKING intentionally public admin-uploaded catalogue image; separate from private customer assets |
| `POST /api/admin/retention` | VERIFIED WORKING authorized invocation. Bulk expired-record cleanup logic IMPLEMENTED, NOT VERIFIED at production scale |

### Persistence models

Node 24's built-in SQLite adapter avoids adding a second database provider or package dependency. `records` stores `kind`, `id`, `owner`, JSON metadata and creation time. Kinds are `design`, `enquiry`, `fabric`, `content`, `settings`, `share`, `catalogue-image` and `admin-session`. `limits` stores atomic count/expiry buckets. Large images live in private files or the configured S3-compatible bucket, never database documents.

Private image keys are generated IDs with fixed filenames. Access is served through owner/admin-checked routes. Public catalogue image records are explicitly created by authenticated administrators and are separate from customer images. Share tokens are high entropy, stored as hashes and expire in seven days. Original photos are not included in public shares. Revocation cannot remove copies already downloaded by a recipient.

Sessions use signed HTTP-only SameSite cookies. Administrator role checks run on every privileged endpoint, and logout deletes its server session record. Secrets remain server-side. Mutation requests reject foreign origins; bounded input and decoded-image limits apply. AI attempts have session/IP/global rolling-day caps, including provider failures. No unrestricted paid endpoint is enabled by default.

SQLite and local image storage require a protected durable single-host volume. The installed Node 24 runtime emits an experimental SQLite warning. S3 signing is implemented but needs provider-specific verification. A distributed/serverless deployment needs a shared database/limiter adapter rather than separate per-instance SQLite files. None has been deployed here.

Retention is an explicit authenticated cleanup action, default thirty days, processing up to 200 expired records of each kind per call. Repeat/schedule cleanup operationally and define backup retention before launch. This repository does not provision a scheduler.

### Images and comparison integrity

`lib/assets.ts` centralizes all nine Pexels reference sources, known photographer attribution and license URLs. Optimized local derivatives remain unchanged. See `PHOTOGRAPHY.md` for full credits and the Pexels license context; photos are not verified Dcorhome installations or inventory.

The hero uses the existing original generated before/after pair, both 1120x1400. It is visibly labelled as an AI-created illustration. No new photo or reference-site asset was copied in this task. The green composer uses different actual sample photographs (`residential-room`, `curtain-room`, `living-drapery`) and clearly explains that its separate scene photographs do not simulate every selected combination.

The comparison dataset validator rejects identical paths, byte-identical files and unequal dimensions during predev/prebuild. The reusable component requires both sources and renders a static reference rather than a fake slider if the paths match. True room preservation remains limited by generative editing; there is no pixel-perfect guarantee. No additional unverified transformation showcase was fabricated.

### Design, SEO and accessibility

Existing fonts, typography constants, luxury palette and minimal global CSS are preserved. New styling is Tailwind TSX. No motion library or database SDK was installed. FAQs use native details/summary. Forms have labels, consent and visible states; navigation retains keyboard focus handling and comparison retains pointer capture, keyboard controls, reduced motion and explicit pause.

Page-specific metadata/canonicals/Open Graph, dynamic sitemap, robots rules, article structured data and article breadcrumbs are implemented. No fake Product schema, reviews or business address is emitted. Private routes are excluded from indexing; legal drafts require approval. Until SITE_URL is configured, indexing is discouraged rather than pointing to an invented domain.

### Configuration required

See `.env.example` and README for exact setup:

1. Node 24+ and a private durable `DCORHOME_DATA_DIR`; random `SESSION_SECRET` of at least 32 characters.
2. Local development `ASSET_STORAGE=local`, or private S3-compatible endpoint/region/bucket/access credentials. Block bucket public access; restrict filesystem ACLs and use appropriate encrypted storage/backups.
3. Random `ADMIN_PASSWORD` of at least 20 characters. No built-in/default password exists.
4. `OPENAI_API_KEY`, explicit `AI_ENABLED=true`, optional model and capped `AI_DAILY_LIMIT`; verify account/model access and provider-side budget controls before public use.
5. Optional Resend key plus verified sender and business recipient for actual email notifications.
6. Approved `SITE_URL`, trusted-proxy configuration where applicable, HTTPS cookies for public access, retention scheduling and backup policy.
7. Actual business identity, privacy contact, service area, approved legal policies and verified SKU/material data. No such details were invented.

Current normal-instance storage and AI flags are false. Setting random test secrets for isolated tests did not configure the user's environment.

### Verification record

- TypeScript through the existing `npm run lint` alias: passed. This repository does not have a separate ESLint installation.
- Production builds and comparison asset validation: passed during implementation; final pass recorded below.
- Measurement logic: passed units, repeat rounding, panel/window counts, allowances and invalid-input tests.
- Browser: 14 page/detail templates at 360/390/768/1024/1440 (70 combinations), plus five core pages at 1920. Images loaded, no horizontal overflow, no browser runtime exceptions.
- Interactions: autoplay/reversal, explicit pause, idle resume continuity, focus/reduced motion/offscreen state, simulated hidden-document signal, mouse/touch/keyboard comparison, composer scenes/handoff, fabric selection, mobile navigation/focus, collection filtering, studio upload/heading/sketch, local history and measurement passed.
- Isolated configured API tests: persisted synthetic enquiry; CSRF/consent/idempotency; admin authorization/content/catalogue/options; public catalogue upload; corrupt input; actual decoded fixture response; private ownership; save/download/share/revoke/delete and quotas passed. No real provider or email request was made.
- Isolated browser: provider-fixture result display/comparison, private save/list/reopen, share/revoke and admin sign-in/editor/sign-out passed.
- Actual 1440/390 screenshots reviewed, including composer, studio result fixture and authenticated admin fixture. Fixture imagery is test data, not evidence of a live provider call.
- Physical touch/pen devices, real background-tab throttling, real native file sharing, external S3, Resend delivery and a paid model call were not exercised.

Representative screenshots: `%TEMP%/dcorhome-review-home-1440.png`, `dcorhome-review-home-390.png`, `dcorhome-review-green-1440.png`, `dcorhome-review-fixture-result-1440.png`, `dcorhome-review-fixture-admin-1440.png`.

### Remaining issues / release limits

The application must not be described as fully operational in production while storage, AI and business configuration remain absent. Guest cookies are not customer accounts, SQLite is not a distributed database, provider request caps are not a currency budget guarantee, stock photography is not a verified SKU and draft policies are not approved legal terms. Live external integrations and deployment-specific operational controls remain to be validated by the owner. No production data was changed and nothing was deployed.

### Primary implementation references

- [Curtain AI reference journey](https://curtainai.app/en): studied for the photo/design/compare journey; no source or imagery copied.
- [Official OpenAI image-edit API](https://developers.openai.com/api/reference/typescript/resources/images/methods/edit): multipart server-side editing, existing model, input fidelity and image response handling.
- [Node SQLite documentation](https://nodejs.org/api/sqlite.html): built-in database API; actual installed Node 24 behavior verified locally.


### Final development-server follow-up

A stale/duplicate project development process was found returning a homepage 404. Stopped only Dcorhome development processes, verified the resolved `.next-dev` target stayed directly inside this workspace, and removed only that generated development cache. A clean server then returned HTTP 200 for `/`, `/collections`, `/studio`, `/measure`, `/contact`, `/inspiration`, `/designs` and `/faq` without manifest ENOENT errors.

Separate `tsconfig.dev.json` and `tsconfig.build.json` now keep generated route validators from the two output directories out of the same TypeScript program. This fixes the observed old/new `LayoutRoutes` conflict. Production output remains separate from development output.

The development smoke test also identified an existing custom image-loader width warning for pre-optimized WebP sources. `components/ui/Photograph.tsx` now uses its derivative loader only for local JPGs that have encoded size variants; optimized WebP, blob/data and authenticated image routes are served directly. No runtime optimizer is asked to fetch private photos without their session cookie.


### Final verified handoff

Final `npm run build`, `npm run lint`, comparison dataset validation, measurement logic tests, and the isolated API/browser suite passed. The final fixture flow also verified consultation fabric handoff and an actual persisted synthetic enquiry through the browser form. Share expiry, sitemap/robots and the remaining editorial slugs returned the expected responses.

After the loader correction, eight development routes again returned 200 with no manifest errors or missing-loader-width warnings. One Dcorhome development server is left running at **http://localhost:3000**; the temporary production/API/browser test servers are stopped. Test databases were removed after the isolated runs. The only remaining server warning observed is Node 24's documented experimental SQLite warning.

No new raster assets were generated in this task. No package install, lockfile change, production-data mutation or deployment was performed. The legal drafts, verified supplier data, live provider access/email delivery, managed storage validation and operational hosting configuration remain owner setup requirements.
