# AI room visualizer

## Implemented flow

The existing `/studio` now supports: existing style/pattern/room and fabric selection → upload a room photograph → mark the curtain/window area → explicitly Generate My Room Preview → compare, regenerate, save, download or enquire.

The manual visualizer, independent main/sheer choices, composer intent/compatibility handling, catalogue, saved designs, private-session storage and contact routes remain in place. The homepage hero and autoplay logic were not redesigned.

Upload supports click, drag/drop, replacement/removal, decoding feedback and the existing JPG/PNG/WebP, 10 MB and 24 MP limits. Uploads remain in the browser until generation. Window selection uses a rectangle drawn directly over the full, uncropped photograph, with a centred-box shortcut and keyboard-accessible precise adjustment. Replacing a photo clears the previous area/result. Changes invalidate stale results; active generation locks the relevant controls and prevents double submission.

Generation only runs after an explicit click. A valid area is mandatory for the new endpoint. Results preserve the uploaded photo aspect ratio in the comparison view. The requested customer disclaimer is displayed. Quote links include the actual selected direction and private design reference; WhatsApp appears only when the existing verified business number is configured.

## API and AI integration

- New `GET /api/visualizer/generate`: existing provider/storage readiness status.
- New `POST /api/visualizer/generate`: multipart `image`, `windowArea` JSON (`x`, `y`, `width`, `height` as normalized fractions), and the existing validated configuration fields (`style`, `pattern`, `roomType`, `fabricId`, `color`, `manual`, sheer selections, headings, length, fullness and layer flags).
- Existing `/api/visualize` remains compatible with previous callers and shares its private-session, image validation, quota, error handling and storage pipeline with the new endpoint. Old callers may omit an area; the new endpoint requires one.
- A separate upload API is unnecessary: the multipart generation request handles the upload atomically after the customer's explicit action, avoiding orphaned uploads.
- Provider: existing OpenAI Images Edit endpoint, `https://api.openai.com/v1/images/edits`, with the configured model (default `gpt-image-1.5`). The request contains a PNG photograph and same-size PNG mask; alpha-zero pixels identify the editable rectangle. See the [official OpenAI mask requirements](https://developers.openai.com/api/reference/go/resources/images/methods/edit).
- Structured prompt covers the allowed region, preserving architecture/camera/furniture/walls/flooring, main fabric/color, independent translucent sheers, style, compatible pattern, hanging position, folds, shadows and daylight.
- The server does not rely solely on model obedience: it extracts the returned selected region and composites it onto the normalized original. Lossless result encoding preserves every exterior pixel of that stored original. Edits or shadows extending beyond the selected rectangle are excluded, so customers should include rail, side-panel and hem space in the area.
- The generated result and original remain private using the existing storage layer. Area coordinates are persisted with the design and restored when reopened. No placeholder result is returned on provider failure.

## Files added/updated for this request

Added:

- `components/curtains/WindowAreaSelector.tsx`
- `lib/visualizer-area.ts`
- `lib/server/curtain-edit.ts`
- `app/api/visualizer/generate/route.ts`
- `scripts/ai-window-integration.cjs`
- `scripts/ai-window-browser.cjs`

Updated:

- `app/studio/page.tsx`: uploader state, area selection, explicit masked generation, responsive result/actions, concise summary and restoration.
- `app/api/visualize/route.ts`: shared mask-aware provider pipeline, prompt and constrained composition.
- `lib/design-options.ts`: optional saved area field.
- `components/interactive/CurtainComparison.tsx`: optional aspect ratio for uploaded photographs; the hero branch and comparison/autoplay interactions retain their existing behavior.
- `scripts/provider-fixture.cjs`: test-only mask assertions and controlled response.
- `scripts/browser-check.cjs`: opt-in AI-window checks.
- `.env.example`: clarifying setup comment; no credentials changed.

No new dependencies or global styles were added. Earlier homepage/composer and inner-page work remains intact.

## Environment configuration

Required for live generation:

```dotenv
AI_ENABLED=true
OPENAI_API_KEY=<server-side project key with image-edit access and billing>
OPENAI_IMAGE_MODEL=gpt-image-1.5
DCORHOME_DATA_DIR=<durable private directory outside public>
SESSION_SECRET=<at least 32 random characters>
ASSET_STORAGE=local
AI_DAILY_LIMIT=5
```

`ASSET_STORAGE=local` is appropriate for development or a single host with durable protected storage. For the existing S3-compatible option, configure `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY` instead. Preserve the application's existing trusted-proxy/origin and HTTPS configuration. `ALLOW_LOCAL_HTTP=true` is for isolated local HTTP testing only.

Optional: `DCORHOME_WHATSAPP_NUMBER` enables the verified business WhatsApp action; existing Resend variables enable notifications. Neither is invented or required to display a stored enquiry confirmation.

Current environment audit (booleans only; no keys printed): AI opt-in is off, no OpenAI key is configured, private metadata is configured, and private image storage is not configured. Live generation therefore remains unavailable until the required setup is completed. No credentials or production settings were enabled during implementation.

## Verification and limits

- TypeScript and production build passed, including existing asset/catalogue/manual-config prebuild checks.
- Existing composer/visualizer logic checks passed.
- Isolated API test: missing/out-of-bounds areas rejected; provider received a matching PNG mask and selected configuration; interior pixels changed; all exterior pixels exactly matched the normalized stored original; unauthenticated image access was denied; area persisted in private design metadata.
- Isolated browser test at 390px and 1440px: valid upload, rectangle drawing, disabled generation before selection, zero generation requests from drawing, exactly one request on the explicit action, before/after keyboard interaction, download link, selection-aware enquiry, private save and no horizontal overflow. Screenshots under `.data/ai-window/` were visually reviewed.
- Test provider runs only in an explicitly flagged, isolated process using a fake test key and a separate `.test-data/` directory. It returns a solid-color diagnostic patch to expose unintended exterior edits; those screenshots are **not** evidence of live AI curtain quality. It cannot replace the live provider in application code.
- No live paid generation was run. Real photographic quality, shade interpretation and provider access remain to be verified with configured credentials. Current demo/supplier-data limitations remain: exact fabric weave/color and availability are not guaranteed by an AI image.
- No real enquiry notifications, public sharing, publishing or deployment occurred.

Run targeted verification after a production build:

```powershell
node scripts/ai-window-integration.cjs
$env:DCORHOME_AI_BROWSER='true'
node scripts/ai-window-integration.cjs
```

The browser run needs permission to launch local headless Chrome in restricted environments. Test processes stop their local server on completion; isolated test artifacts remain gitignored.
