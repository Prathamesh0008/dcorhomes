# AI Room Visualizer — Phase 2 implementation report

## Audit and scope

The starting working tree already contained the restored manual Studio, homepage composer, independent main/sheer controls, photo selection, rectangle selector, comparison component, private guest designs, sharing, enquiries, SQLite records, and local/S3-compatible image storage. The original image route directly posted multipart data with `fetch`, returned base64 images, accepted several client-authored selection fields, and had no persisted upload or generation records. SQLite on its own was unsuitable for Vercel persistence.

This phase reuses those components and the same records/object-storage systems. `/api/visualize` and `/api/visualizer/generate` call one implementation. No homepage hero markup, typography, global stylesheet, or approved visualizer layout was redesigned. Server-rendered catalogue/content consumers became asynchronous to support the shared PostgreSQL adapter. Earlier unrelated working-tree changes were preserved.

## AI integration

- Official `openai` Node SDK, `client.images.edit`, one image output, `maxRetries: 0`, 90-second provider timeout.
- Default model: `gpt-image-2.5-sunburst`; optional `gpt-image-2.5-flare`. Model/quality validated against supported choices. No text-only generation and no obsolete fallback.
- First input is the normalized customer photograph as PNG. A same-size RGBA PNG mask has transparent selected pixels and opaque protected pixels. Mask is ephemeral and is not retained.
- The customer marks the complete installation area, including rail, side panels and hem. Normalized fractions map to the EXIF-corrected, resized source; original dimensions/orientation are retained as metadata. Precise box controls allow repositioning/resizing.
- Prompt builder resolves enabled layers, real catalogue IDs, shade IDs/names/codes/HEX approximations, heading, pattern, room, panels, length, fullness and material properties on the server. Arbitrary client prompts, SKU values and HEX overrides are ignored. Invalid choices are rejected rather than silently replaced.
- Authorized supplier variant texture/swatch/main photographs can be added as optional references, at most one per enabled layer. Only known local catalogue paths or registered catalogue-image IDs are read; arbitrary URLs are never fetched. Demo images and digital previews are not passed as verified supplier swatches. Missing optional references are skipped.
- Provider base64 is decoded on the server, validated with Sharp and kept out of JSON responses/database records. The selected portion is composited onto the normalized original, preserving exterior pixels. The provider still has discretion within the marked rectangle; colour/fit remain illustrative.
- Actual curtain-photo realism, provider model access and reference fidelity require an approved live test. The application's production adapter never substitutes a stock photo, placement sketch or test fixture for a provider result.

SDK/API references consulted: [OpenAI image generation guide](https://developers.openai.com/api/docs/guides/image-generation), [official Node SDK](https://github.com/openai/openai-node), [Postgres.js](https://github.com/porsager/postgres).

## API contract

All private JSON/image responses use `private, no-store`. Guest ownership is a signed HttpOnly SameSite=Strict cookie, Secure over HTTPS. Mutations enforce same-origin checks. ID knowledge alone does not authorize private access.

| Endpoint | Input and response | Authorization |
| --- | --- | --- |
| `GET /api/visualizer/generate` (also `/api/visualize`) | `{configured, uploadConfigured, reason, retentionDays}`; readiness is configuration-based, not a live provider/storage health probe | Public; no credentials returned |
| `POST /api/visualizer/upload` | Multipart `image`; returns `201 {id,width,height,expires,image}` | Creates/reuses signed guest session; shared/IP upload throttle |
| `GET /api/visualizer/uploads/[id]/image` | Normalized private WebP; expired uploads return 410 | Owning guest only |
| `DELETE /api/visualizer/uploads/[id]` | Deletes source upload, returns `{ok:true}`; rejects deletion while actively used by a generation | Owning guest + same-origin mutation |
| `POST /api/visualizer/generate` (also `/api/visualize`) | JSON `{uploadId,windowArea:{x,y,width,height},manual:ManualConfig,style}` and UUID `Idempotency-Key`; returns completed result below, 202 processing, or safe error | Owning signed guest; enabled AI; quotas/concurrency; validated catalogue |
| `GET /api/visualizer/generations/[id]` | `{generationId,status}` while processing; completed `{generationId,id,status:'completed',result,original,selection,retentionDays}`; failed `{generationId,status:'failed',error}` with suitable error status | Owning guest only |
| Existing `GET/POST /api/designs` | List saved unexpired designs; save via `{id}` | Owning guest |
| Existing `GET/DELETE /api/designs/[id]` | Reopen metadata or delete images/design and revoke shares | Owning guest |
| Existing `GET /api/designs/[id]/image?type=original` | Original or generated private WebP; suitable for download | Owner, or authenticated admin; expiry enforced |
| Existing `POST/DELETE /api/designs/[id]/share` | Explicit result-only link creation/revocation | Owning guest |
| Existing `GET /api/shared/[token]` | Result only; 7-day link expiration, also constrained by design expiry | Explicit bearer share token; never original |
| Existing `POST /api/enquiries` | Existing contact/consent fields plus optional `designId`; attaches server-owned canonical design selection | Guest/session ownership; no automatic image attachment/public link |
| `GET /api/visualizer/retention` | Bounded cleanup `{ok,deleted,uploads,jobs,batchLimit}` | `Authorization: Bearer <CRON_SECRET>`, minimum 32 characters |
| Existing `POST /api/admin/retention` | Same cleanup service | Admin + same-origin mutation |

Legacy multipart generation requests must migrate to the upload-ID contract; both generation paths intentionally enforce the same security pipeline.

## Persistence, privacy and cost controls

`lib/server/db.ts` is the shared adapter for the existing `records` and `limits` tables. `DCORHOME_DATABASE_URL` selects PostgreSQL; private SQLite is for non-Vercel development/single-host use only. PostgreSQL uses parameterized queries and transaction-scoped advisory locking for admission and quotas; no provider call occurs inside that lock. Tables/indexes initialize automatically with a role permitted to create them. Existing local records are not automatically copied into PostgreSQL: migrate required catalogue/settings/design records before changing a populated environment.

Private S3-compatible objects use UUID keys. Upload originals use `<uploadId>/original.webp`; generated originals/results use `<generationId>/original.webp` and `result.webp`. No customer photographs go into `public`, database base64 fields or permanent Vercel filesystem storage. The existing separately managed public catalogue-image endpoint remains public because those are business catalogue assets, not room uploads. Configure a genuinely private bucket with public access disabled; provider configuration has not been inspected remotely.

Uploads: JPEG/PNG/WebP, actual Sharp decode, still images only, 3 MiB maximum, minimum 256px per side, maximum 24MP; auto-orientation, sRGB, flatten transparency, max 1600px edge without enlargement, metadata stripped. The request reader is bounded before multipart decoding. The application upload limit leaves room for multipart overhead.

Generation records store ownership, upload ID, canonical specification snapshot, selected area, model/quality, timestamps, deadline, fingerprint, safe failure information, and provider request/token usage metadata when returned. No raw prompt logging. Synchronous state is `processing -> completed | failed`; no separate pending queue is needed. A status read marks an expired processing record failed after its 180-second deadline. It never restarts the provider call.

A durable transaction admits only the configured global concurrent total and one active generation per guest. Defaults: 3 attempts per signed guest per 30-day window, 1 concurrent generation, 5 attempts per rolling 24-hour studio window. Failed admitted attempts still count. IP/shared abuse buckets supplement cookies; an IP is not treated as a person. `TRUST_PROXY=false` uses a conservative shared bucket; set true only when the edge replaces untrusted forwarding headers. Cookie deletion can create a new guest; global/IP controls and daily spending caps remain necessary.

A repeated UUID with the same canonical request returns the existing state/result. Reusing it with different data/ownership returns 409. Failed/completed requests are not reissued to OpenAI. SDK retries are disabled. Browser transport failures retain the request UUID; status polling performs reads only. A new explicit regenerate action after completion or terminal failure gets a new UUID and consumes another allowance.

Unused source uploads expire after 24 hours; generated designs expire after `RETENTION_DAYS` (30 by default), including saved designs. Expired reads are denied immediately; physical removal requires the authenticated cleanup schedule or administrator action. Cleanup operates in batches of up to 200 per record kind; schedule frequently enough to drain the workload and monitor failures. Failed partial objects remain discoverable through generation records for cleanup. Deleting a design removes its copied original/result and share records; a separate source upload may remain until its own 24-hour expiry. Small idempotency tombstones survive until at least the signed guest-session lifetime to prevent replay after deletion. Guest cookies last at most 30 days; longer retention does not promise continued guest access.

Saving is browser-session scoped, with separate existing IndexedDB local saving. No account recovery or permanent cross-device storage is promised. Downloads fetch the actual authorized result. Sharing an image/file or creating a public result-only link requires a separate explicit action. Quote requests carry selections/design ID, not automatically attached room photographs. The backend attaches the canonical saved design selection rather than trusting a client-authored summary.

## Local and Vercel configuration

Put real local secrets in ignored `.env.local`; never use `NEXT_PUBLIC_` for a provider/storage/database key. This implementation did not modify `.env.local`, create cloud services, update production variables, or deploy.

For Vercel, configure these server variables in the appropriate project environment and redeploy only after approval outside this task:

```dotenv
OPENAI_API_KEY=<server-only project API key with image model access>
DCORHOME_AI_ENABLED=false
DCORHOME_IMAGE_MODEL=gpt-image-2.5-sunburst
DCORHOME_IMAGE_QUALITY=medium
SESSION_SECRET=<at least 32 random characters>
DCORHOME_DATABASE_URL=<managed PostgreSQL URL with required TLS/pooler settings>
ASSET_STORAGE=s3
S3_ENDPOINT=<HTTPS S3-compatible endpoint>
S3_REGION=us-east-1
S3_BUCKET=<private bucket>
S3_ACCESS_KEY_ID=<server credential>
S3_SECRET_ACCESS_KEY=<server credential>
SITE_URL=<approved HTTPS application origin>
CRON_SECRET=<at least 32 random characters>
DCORHOME_MAX_GENERATIONS_PER_GUEST=3
DCORHOME_MAX_CONCURRENT_GENERATIONS=1
AI_DAILY_LIMIT=5
RETENTION_DAYS=30
TRUST_PROXY=false
ALLOW_LOCAL_HTTP=false
```

`DCORHOME_AI_ENABLED` defaults off. Enable only after the database, private bucket, model access, budget and runtime are confirmed. Old `AI_ENABLED` and `OPENAI_IMAGE_MODEL` remain fallback aliases when the corresponding new variable is absent; old unsupported model values fail readiness rather than choosing another paid model. Quality supports low/medium/high/xhigh/max. Quota settings must be positive integers within documented code caps (guest at most 20, concurrency at most 5, daily at most 100, retention at most 365); invalid settings use conservative defaults.

Outside Vercel, local development can replace PostgreSQL/S3 with `DCORHOME_DATA_DIR=<private absolute path outside public>` and `ASSET_STORAGE=local`. Requires Node 24+. Vercel rejects local persistence even if those local variables are present.

Generation handlers request `maxDuration=180` and await the complete operation. Confirm the actual Vercel plan, Node runtime and upstream time limits support this setting. No detached promises or in-memory queue implement generation. If a real workload cannot reliably finish within that bound, a durable external worker/job system is required before launch; none is silently assumed here. Schedule authenticated `GET /api/visualizer/retention` (Bearer cron secret) or the admin cleanup; no production cron was installed.

Optional existing variables: `ADMIN_PASSWORD` (at least 20 characters), verified `DCORHOME_WHATSAPP_NUMBER`, and `RESEND_API_KEY` / `ENQUIRY_FROM_EMAIL` / `ENQUIRY_TO_EMAIL`. WhatsApp stays absent without a verified configured number; enquiry storage does not require email delivery credentials. Business privacy identity/contact and cleanup operations still need owner approval before launch.

## Verification and current status

| Feature | Status | Evidence / limit |
| --- | --- | --- |
| Decoded upload validation, size/dimensions, EXIF rotation and metadata stripping | VERIFIED WORKING | Isolated API tests with real encoded files |
| Private upload ownership, expiry and deletion | VERIFIED WORKING | Separate signed guest sessions, authenticated cleanup tests |
| Rectangle drawing, normalized coordinate conversion, matching alpha mask | VERIFIED WORKING | Service/API checks; Chrome at 390px and 1440px |
| Main/sheer canonical configuration and structured prompt | VERIFIED WORKING | Invalid shade rejected; outbound SDK multipart inspected |
| Official SDK call shape and successful result handling | VERIFIED WORKING | Real SDK serialization with intercepted provider response; no external call |
| Duplicate request protection, concurrent admission and quota | VERIFIED WORKING | Local SQLite integration; duplicate produces one mock call |
| Auth/rate/unavailable/empty-result/storage failures | VERIFIED WORKING | Controlled error responses, persisted failed status and replay checks |
| Timeout mapping / missing-key readiness and API rejection | VERIFIED WORKING | Isolated service/API tests, no network |
| Exact exterior pixel preservation, authorized result/download | VERIFIED WORKING | Pixel comparison against decoded original; owner-only response checks |
| Save/reopen, enquiry selections, explicit shares and revocation | VERIFIED WORKING | Private APIs + focused Studio browser journey |
| Mobile/desktop Studio upload and comparison | VERIFIED WORKING | 390px/1440px, keyboard slider and no horizontal overflow |
| Existing composer/hero preservation | VERIFIED WORKING | Composer transfer/source-hero assertions; production prebuild checks |
| Existing catalogue/admin/enquiry and restored Studio | VERIFIED WORKING | Catalogue integration, import atomicity, shade imagery, independent layers and mobile handoff checks passed after updating stale UI assertions |
| Managed PostgreSQL adapter | IMPLEMENTED, NOT VERIFIED | No real PostgreSQL connection supplied; multi-instance locking not exercised against a service |
| Private remote S3 storage | IMPLEMENTED, NOT VERIFIED | Existing adapter reused; no configured bucket to verify |
| Real OpenAI curtain edit / model access / photorealism | BLOCKED BY CONFIGURATION | No provider credential and no explicit approval for a paid test; zero real AI calls |
| Supplier-reference visual fidelity | IMPLEMENTED, NOT VERIFIED | No verified supplier catalogue photographs currently supplied |
| Vercel runtime and scheduled physical cleanup | BLOCKED BY CONFIGURATION | Plan/runtime and real cloud services/schedule not configured or deployed |
| Brush masks, customer accounts and external durable worker | NOT IMPLEMENTED | Optional future capabilities; rectangle/signed guests/bounded synchronous request used |

Checks: `npm.cmd run lint`, `npm.cmd run build`, `node scripts/ai-services-check.cjs`, `node scripts/composer-check.cjs`, `node scripts/ai-window-integration.cjs`, `node scripts/catalogue-integration-check.cjs`; focused browser mode `$env:DCORHOME_AI_BROWSER='true'; node scripts/ai-window-integration.cjs`. The catalogue runner now targets the already restored Studio rather than the obsolete guided wizard; its fabric dropdown and specification-link assertions match the approved UI. The provider fixture is explicitly test-only, requires fake credentials/opt-in, and is never imported by the application. Test-generated solid patches validate plumbing and pixel boundaries, not visual realism. No uncontrolled paid generations, extensive end-to-end sweep, deployment or live notification was performed.

## Phase 2 files

Created:

- `lib/ai/config.ts`
- `lib/ai/image-processing.ts`
- `lib/ai/validate-configuration.ts`
- `lib/ai/build-curtain-edit-prompt.ts`
- `lib/ai/provider.ts`
- `lib/ai/fabric-references.ts`
- `lib/server/visualizer-upload.ts`
- `lib/server/visualizer-generation.ts`
- `lib/server/visualizer-retention.ts`
- `app/api/visualizer/upload/route.ts`
- `app/api/visualizer/uploads/[id]/route.ts`
- `app/api/visualizer/uploads/[id]/image/route.ts`
- `app/api/visualizer/generations/[id]/route.ts`
- `app/api/visualizer/retention/route.ts`
- `scripts/ai-services-check.cjs`
- `docs/ai-room-visualizer-phase-2.md`

Updated integration/persistence/configuration:

- `.env.example`, `package.json`, `package-lock.json`
- `lib/server/db.ts`, `lib/server/assets.ts`, `lib/server/security.ts`
- `lib/server/fabric-records.ts`, `lib/server/catalogue.ts`, `lib/server/options.ts`, `lib/server/content.ts`, `lib/server/showcase.ts`
- `app/api/visualize/route.ts`, `app/api/visualizer/generate/route.ts`
- `app/api/designs/route.ts`, `app/api/designs/[id]/route.ts`, `app/api/designs/[id]/image/route.ts`, `app/api/designs/[id]/share/route.ts`, `app/api/shared/[token]/route.ts`
- `app/api/enquiries/route.ts`
- `app/api/admin/route.ts`, `app/api/admin/assets/route.ts`, `app/api/admin/session/route.ts`, `app/api/admin/retention/route.ts`
- `app/api/catalogue/route.ts`, `app/api/catalogue/images/[id]/route.ts`, `app/api/options/route.ts`
- `app/studio/page.tsx`, `app/privacy/page.tsx`
- `scripts/provider-fixture.cjs`, `scripts/ai-window-integration.cjs`, `scripts/ai-window-browser.cjs`, `scripts/catalogue-browser-scenarios.cjs`, `scripts/fabric-image-browser-scenarios.cjs`, `scripts/catalogue-integration-check.cjs`

Updated shared server-rendered consumers to await durable metadata reads (same presentation):

- `app/layout.tsx`, `app/page.tsx`, `app/sitemap.ts`
- `app/collections/page.tsx`, `app/collections/[id]/page.tsx`
- `app/faq/page.tsx`, `app/inspiration/page.tsx`, `app/inspiration/[slug]/page.tsx`
- `components/SiteFooter.tsx`, `components/home/HomeBelowHero.tsx`, `components/editorial/FAQ.tsx`

Other modified/untracked files visible in Git originated in earlier phases and were retained. Build-generated route-type references are not application changes.

