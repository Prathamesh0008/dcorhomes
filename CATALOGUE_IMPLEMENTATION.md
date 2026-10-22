# Premium curtain fabric catalogue

Implemented in the existing Dcorhome project. No deployment, checkout, payment flow, production data replacement, or invented supplier inventory.

## Customer experience

- `/collections` now has original Dcorhome category navigation, textile photography, server-side search, category/type/layer/color filters, verified composition/pattern/transparency and numeric filters when those values exist, blackout as a secondary functional collection, sorting and 12-record pagination. Filters and sort survive as shareable URL parameters. Submit Search or Apply filters to apply form values.
- Cards group shades under a parent fabric. They show category, description, six shade previews, verified available counts separately from demo counts, supplied technical highlights, and an accessible full-card View Fabric link. The layout uses two columns on mobile and three/four at larger widths.
- Existing `/collections/[id]` URLs now resolve the stable fabric slug. Detail pages provide breadcrumbs, a swipeable/keyboard gallery, thumbnails, native-dialog zoom, searchable shade libraries for large palettes, shade codes/SKUs/availability, technical details, enquiries and the existing Studio handoff.
- A shade updates without reload and is represented by `?shade=...`. Its main image, additional images and swatch form the selected shade gallery. If no such photos exist, the general fabric references are explicitly labelled as not depicting the selected shade. No digital recoloring is presented as a product photograph. Empty image lists display a text unavailable state.
- Every quote preserves the fabric, selected shade, actual identifiers and optional metres. Existing CSRF/origin checks, signed sessions, rate limits, honeypot, consent, private SQLite storage, optional notification service and idempotency are reused. The server resolves actual fabric and variant data rather than trusting client-supplied names or SKUs. Success requires confirmed storage; email notification status is separate.
- WhatsApp opens only after an explicit click. The correctly encoded message includes fabric, collection, shade, shade code, SKUs and the shade-specific product link. There is no guessed business number. With no configured number, the WhatsApp button explains its unavailable state and the quote/contact paths remain available.
- Studio receives the existing serialized manual configuration including the selected variant ID, main/sheer layer, shade, and any supplied HEX. The shared server catalogue snapshot reaches direct Studio visits as well as navigation. Missing HEX does not invent a selected color or render a paid AI image; the preview discloses missing digital color references.

## Parent/child data model

`FabricCategory -> FabricRecord (variety) -> FabricVariant -> images`.

Shared technical fields stay on FabricRecord: composition, weave, texture, construction, pattern/repeat, roll width cm, GSM, optional linear weight g/m and roll length m, filtering/transparency, tested blackout percentage, lining compatibility, applications, care subfields, shrinkage, certifications, actual price/currency, minimum order and lead time. Variant records contain stable IDs, names, unique shade codes, actual SKUs, optional HEX, swatch/main/additional images, availability and active status.

Admin nulls for unknown optional technical fields are normalized to omitted values and displayed as pending. Roll width and GSM explanations distinguish them from finished panel width and total curtain weight. Demo colors do not become verified inventory.

Category classification is separate from fabric type and functional blackout filtering. Silk, Cotton, Jacquard and the other empty classifications do not assert stock. The current published seed remains six demo materials; no real Silk variety or extra shades were invented.

## Persistence and administration

The existing authenticated `/admin` is extended, not replaced. Its full-record JSON editor manages fabric varieties, shared specifications, nested shades and photographs, categories, availability and active status. Adding/removing shade entries requires no TSX changes. Use the existing authenticated public image upload for approved catalogue photographs. Legacy direction/editorial editing and enquiry management remain available. Legacy records without shade information retain detail access but cannot silently become configurable variants.

Structured records use the existing private SQLite records table under `fabric-record` and categories under `fabric-category`. Reads merge seed data, legacy entries and explicit structured overrides without rewriting supplier JSON or production records. Imports validate all entries before a transaction, reject duplicate/existing IDs, and roll back on write failure. Explicit updates remain an authorized admin operation. Categories can be created before importing their products.

Public records and server query logic support filters, sort, pagination and slug lookup. Rich record reads do not inherit the old 200-row admin listing limit. The layout is dynamic so changes are visible to direct Studio requests instead of embedding a stale build-time catalogue snapshot.

## Supplier Excel/CSV intake

1. Export supplier worksheets as UTF-8 CSV, using `scripts/supplier-fabrics-template.csv` and `scripts/supplier-shades-template.csv`. The files contain headers only, with no fabricated data.
2. Use one parent row per fabric and one child row per shade, joined by `fabricId`. IDs are stable URL-safe strings; `slug` equals the fabric ID. Each supplier fabric needs its actual SKU and `categoryId`; each shade needs its actual variant SKU and unique shade code. Unknown specifications stay blank.
3. Pipe-separate arrays: `usage`, `compatibleHeadingStyles`, `images`, `certifications`. `patternRepeatCm` is a quoted JSON object. Boolean fields accept `true`/`false`; shade availability also accepts `unknown` or `null`. HEX is optional. Uploaded asset paths or approved local image paths must exist before publication.
4. Run `npm run import:supplier-csv -- fabrics.csv shades.csv output.json`. The converter validates structure, identifiers and shade relationships, refuses to overwrite its output file, and does not write the database.
5. Review the output. In authenticated Admin choose Import validated supplier records and paste the object. Server validation checks image paths, actual uploaded asset records, categories, unique shade codes/SKUs, heading choices, ranges and conflicts before creating records. Native XLSX parsing and direct browser CSV upload are not included; export CSV first.

## External configuration and missing content

- `DCORHOME_WHATSAPP_NUMBER`: verified business number, country code plus digits only, no `+`/spaces. Empty or malformed disables the action.
- `SITE_URL`: approved canonical public origin; until set, links use the existing local-development origin and robots remain noindex.
- `DCORHOME_DATA_DIR`, a random `SESSION_SECRET` of at least 32 characters and `ADMIN_PASSWORD` of at least 20 characters: durable private SQLite and authenticated admin. Public writes fail honestly when private storage is unconfigured.
- Optional `RESEND_API_KEY`, `ENQUIRY_FROM_EMAIL`, `ENQUIRY_TO_EMAIL`: enquiry email notification. Storage confirmation and notification delivery are reported separately.
- Existing AI/provider/private-image configuration remains necessary for actual uploaded-room generation. No live AI image or notification delivery is claimed tested.
- Still needed: actual supplier records, genuine fabric/variant SKUs and shade photographs, specifications and confirmed stock. Current demo images are project references, not newly acquired product photography. Exact curtain rendering still requires the matched assets described in SHOWROOM_IMPLEMENTATION.md.

## Files

Created:
- `components/curtains/FabricCatalogueProvider.tsx`, `FabricGallery.tsx`, `FabricQuote.tsx`
- `lib/curtains/categories.ts`, `catalogue-query.ts`, `enquiry.ts`
- `lib/server/fabric-records.ts`
- `scripts/import-supplier-csv.cjs`, both supplier CSV templates
- `scripts/catalogue-logic-check.cjs`, `catalogue-browser-scenarios.cjs`, `catalogue-integration-check.cjs`
- This report.

Updated:
- Collection listing/detail routes, `app/admin/page.tsx`, `app/layout.tsx`, `app/sitemap.ts`, `app/studio/page.tsx`
- Admin/catalogue/enquiry/visualize API routes
- CatalogueBrowser, FabricDetail, FabricSpecifications, CurtainConfigurator, ManualPreview and ProductCard
- Catalogue types/schema, manual-config helpers, Studio URL helper, server catalogue adapter
- Browser/manual regression scenarios, `.env.example`, `package.json`

Existing fonts, global CSS and homepage layout remain intact. No image or animation dependency was added.

## Verification

- TypeScript and production build passed.
- Existing prebuild asset, compatibility, supplier/demo and manual-state checks passed.
- `npm run check:catalogue`: hierarchy, 30-shade model, matched/fallback galleries, filters, sorting/pagination, WhatsApp encoding and CSV parent/child validation passed.
- `npm run test:catalogue` starts a separate production instance and a unique private `.test-data/catalogue-UUID` database. All records with claimed supplier values in this test are explicitly synthetic test fixtures; none are added to the published seed catalogue.
- Production browser tests passed Silk -> synthetic variety -> shade-specific gallery/SKU -> encoded WhatsApp data -> actual isolated quotation save with duplicate-submission guard -> exact Studio fabric/shade transfer, zoom, 390/768/1440 widths, filters and empty states.
- Existing manual configurator browser regression passed pixel isolation, palette/heading compatibility, single/pair panels, length/fullness, quotation handoff, refreshed URL/local persistence, detail handoff and four responsive widths.
- API tests passed authenticated full-record writes, validation rejection, unknown/unsafe paths, supplier numeric filters, sitemap discovery, stored server-validated quote identifiers, idempotency, create-only atomic imports and inactive-record removal.
- Actual WhatsApp delivery, live email notifications and paid AI calls were not made. Screenshots use local test fixtures and remain in the temporary directory.

## Next task

Obtain and review a genuine supplier workbook, shade photographs and the verified business WhatsApp number. Import one category with one fabric and its real shades, configure durable storage/canonical origin/notification settings, and have Dcorhome approve its photographs and technical details before publication.
