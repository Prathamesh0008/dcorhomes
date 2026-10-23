# Fabric Swatch Search parity

## Reference inspection before implementation

Reference: https://ashleywildegroup.com/fabrics/swatch-search/ and https://ashleywildegroup.com/abella/ (23 October 2026).

Accessible web text confirms a compact title, shade-level names, grid/list controls, item range/total, sort selector and direction, numbered pagination, page-size selection, and filter groups for name, colour, brand, style, rub test and usage. Abella exposes a gallery, collection, product code, configuration-dependent stock, composition, origin, usage, style, repeats, width, g/m, GSM and care. These are structural observations only; no reference products, pictures, branding or copy are imported.

Actual Chrome inspection attempted desktop 1440px and mobile 390px, plus Abella, Woburn and Zyra detail pages. All returned Cloudflare block pages. Opera connector also required reauthentication. Exact layout proportions, responsive drawer behavior, applied-filter behavior, shade interactions and account/wishlist operation could not be observed. Implement accessible conventional equivalents and do not claim verified pixel parity or verified reference interactions.

## Implementation checklist

- Compact breadcrumb/title/search/toolbar; left accordion filters, mobile modal drawer.
- Shade variants as individual search results, one parent product per fabric.
- AND across groups, OR within groups; counts, chips, clear, URL/history.
- Grid/list, sort direction, pagination/range/page size; server-side queries.
- Shade-aware detail gallery/zoom/specifications/enquiries and saved fabrics.
- Existing protected admin, validated create-only import, honest missing-data handling.
- Preserve homepage/hero/header/footer and paused AI development.

## Results

Supplier catalogue JSON remains empty. Existing demo references are explicitly labelled, with approximate digital shades. No technical supplier values, commercial stock, prices or delivery commitments were invented. Synthetic fixtures used during testing exist only in a temporary test database, never in the production catalogue.

| Feature | Status | Evidence / limits |
| --- | --- | --- |
| Breadcrumb/title, compact toolbar, left sidebar | VERIFIED WORKING | Desktop screenshot inspected at 1440px; oversized catalogue hero removed |
| Name/family/shade/code/SKU substring search | VERIFIED WORKING | Case-insensitive SQL queries and browser SKU search; literal `%` does not become a wildcard |
| Multi-select colours and combined filter groups | VERIFIED WORKING | OR within groups, AND across groups; repeated URL parameters preserved |
| Brand/collection, category, pattern, usage, composition, light filters | VERIFIED WORKING | Actual metadata drives options; supplier fixture exercises collection/composition/usage; no copied reference brands |
| Rub/width/GSM bounds | VERIFIED WORKING | Typed numeric ranges, unknown values excluded, valid units; inverted ranges produce no results |
| Counts, chips, remove, Clear All, empty results | VERIFIED WORKING | Disjunctive counts exclude the current facet's own selections; SQL and browser tests |
| Grid/list and shade-level records | VERIFIED WORKING | Thirty test shades under one parent, list specifications and preserved filters |
| Sort A–Z/Z–A, collection, code, date capability | VERIFIED WORKING | Query whitelist, direction, stable ID tie-breaker; browser verifies direction and code selection |
| Newest on real products | BLOCKED BY MISSING DATA | No verified publication dates in current catalogue; publication choice hidden until dates exist |
| Server pagination, page size, total/range, invalid pages | VERIFIED WORKING | SQL LIMIT/OFFSET; 12/24/48/90 options; last-page clamping and previous/next/page numbers |
| URL refresh/history | VERIFIED WORKING | Filters/view/sort/page/size in URL; actual browser back/forward restores state |
| Detail page, gallery, zoom, shade/SKU/URL changes | VERIFIED WORKING | Existing gallery reused; mobile browser changed to a different source photograph and opened zoom |
| Technical specification rendering | VERIFIED WORKING | Optional origin/rubs/stock added; GSM and g/m distinct; unknown fields omitted rather than invented |
| Real supplier photographs/specifications/inventory/prices/PDFs | BLOCKED BY MISSING DATA | Import/admin schema supports data; no authorized supplier feed has been populated |
| Guest saved fabric + shade | VERIFIED WORKING | Browser-local save/reopen preserves exact shade; clearly labelled guest storage |
| Account saved fabric + shade | VERIFIED WORKING | Authenticated durable API saves/removes; separate test accounts cannot read each other's saves |
| Automatic guest-to-account save migration | NOT IMPLEMENTED | Guest device saves and account saves are intentionally distinct; no implied synchronization |
| Swatch enquiry | VERIFIED WORKING | Real isolated request persisted with exact selected SKU; physical fulfilment not promised |
| Quotation enquiry | VERIFIED WORKING | Real isolated request persisted with exact selected SKU and customer message |
| Email notification/delivery | BLOCKED BY MISSING DATA | Test email disabled; production notification depends on existing mail configuration. Success means persisted, not mailed |
| WhatsApp | BLOCKED BY MISSING DATA | Existing verified-number gate reused; no number fabricated; Contact link available |
| Normalized database query architecture | VERIFIED WORKING | Parent/variant/facet projection in the existing SQLite database, indexed facets/sort/ranges; no new database |
| PostgreSQL execution | IMPLEMENTED, NOT VERIFIED | Same parameterized SQL through existing adapter; no PostgreSQL test instance available |
| Thousands-of-shades production performance | IMPLEMENTED, NOT VERIFIED | Bounded page rendering and indexed SQL; not load-tested. Existing global Studio provider still receives catalogue metadata, and projection reconciliation reads metadata to detect changes. Only page images mount/load; no thousands of full-resolution photos load |
| Excel/CSV import | VERIFIED WORKING | Header template, parent/child conversion, row errors, duplicate IDs/SKUs, rights attestation; create-only admin validation |
| Admin management | IMPLEMENTED, NOT VERIFIED | Existing protected JSON editor/image upload/category/product/shade/availability controls reused. Protected API update/inactivation, projection refresh, duplicate-SKU import rejection and unauthenticated denial passed; full admin editing/upload browser journey not rerun |
| Mobile filters/responsive controls | VERIFIED WORKING | 390px modal drawer keeps selections; desktop/mobile screenshot inspection; no horizontal overflow |
| Pixel/interaction parity with reference | IMPLEMENTED, NOT VERIFIED | Accessible reference structure followed; Cloudflare prevented actual desktop/mobile layout inspection and additional detail-page inspection |

## Data and behavior

`swatch_parents`, `swatch_variants`, `swatch_facets` and `swatch_revision` are derived normalized query tables in the same configured metadata database. Existing `fabric-record` JSON remains the source of truth for admin and Studio compatibility. A transaction reconciles the projection when its content digest changes. Subsequent filter/count/sort/page operations run in SQL; full photographs are not loaded to filter in the browser. The nonconfigured-storage fallback filters only on the server in memory. Leading-wildcard substring search can scan text; no full-text performance claim is made.

Only supplied metadata creates commercial filter choices. Demo category/colour directions remain visible, clearly contextualized as demo references; demo technical values cannot satisfy numeric filters or create verified usage/composition/style/brand options. Every result is one active child shade linked to a stable parent route with `?shade=...`. Missing shade photos show an explicit reference/pending message; digital approximations are disclosed.

Saved fabric records retain fabric ID, shade ID and variant SKU, using the existing authenticated customer ID and owner-filtered storage. Guests use browser storage. Account saves do not import guest saves. Saved pages reopen the correct shade; unavailable records can still be removed. Enquiries store a server-resolved product/variant snapshot and `requestPurpose`, retaining existing consent, throttling, idempotency, account association and honest mail-notification results.

## Files changed in this task

- `app/collections/page.tsx`: new server-paged catalogue entry. Existing dynamic `[id]` product route retained.
- `app/collections/saved/page.tsx`, `app/api/fabrics/route.ts`, `app/api/fabrics/saved/route.ts`: saved page, paged search API and authenticated saves.
- `components/curtains/CatalogueBrowser.tsx`: catalogue composition and URL interactions.
- New `SwatchFilters.tsx`, `SwatchToolbar.tsx`, `SwatchCard.tsx`, `SwatchPagination.tsx`, `SavedFabrics.tsx`: reusable filtering, search/toolbar/view switcher/applied chips, product/result row, paging and saves.
- `FabricDetail.tsx`, `FabricQuote.tsx`: save actions, shade history, PDF link, selected-variant swatch/quote dialogs. Existing image gallery, selector and specifications reused.
- `lib/curtains/swatch-query.ts`, `lib/server/swatch-search.ts`: typed query parsing and indexed search.
- `lib/server/db.ts`: internal parameterized catalogue query adapter; same database configuration.
- `lib/curtains/catalogue.ts`, `supplier-catalogue.schema.json`: optional verified specification fields; unknown heading compatibility can remain empty.
- `lib/server/fabric-records.ts`, `app/api/admin/route.ts`: atomic create/update validation and global SKU conflicts.
- `app/api/enquiries/route.ts`: validated swatch/quote purpose on existing persisted enquiry path.
- `scripts/import-swatch-csv.cjs`, `scripts/import-supplier-csv.cjs`, CSV template and import guide: normalized import, optional missing values, no-overwrite strategy.
- `scripts/swatch-search-check.cjs`, `swatch-search-browser.cjs`, `swatch-reference-browser.cjs`, `browser-check.cjs`: focused isolated checks and reference inspection.

Earlier unrelated working-tree changes were preserved. No homepage/hero/header/footer/About/Contact/authentication-screen/Size Guide/Inspiration/manual-configurator redesign. AI remains disabled. No deployment.

## Validation

The focused isolated SQLite/browser run passed search/facets/counts/ranges/sort/pagination, flat CSV validation, account save isolation, history, mobile drawer, shade changes, zoom, guest saves and both real persisted enquiry requests. Screenshots inspected at 1440px and 390px; no broken product images/overflow or captured browser runtime exceptions. Temporary auth tables were migrated before test signups; the migration probe printed the expected missing-tables diagnostic on an empty test store. No test emails sent.

Final `npm run lint` (the repository's TypeScript check) and `npm run build` passed after all source changes, including the paged API, save-SKU persistence, toolbar extraction and accordion indicator correction. Existing asset/manual configurator/catalogue prebuild checks passed. `node scripts/check-homepage-hero.cjs` passed with all 113 protected dependencies and the approved hero markup intact; the protection snapshot was not changed in this task. Final `node scripts/swatch-search-check.cjs` passed against the production build, including the new paged API and protected admin update/inactivation/duplicate-SKU checks. This was one focused catalogue journey, not an extensive Playwright/full-site suite. SQLite experimental warnings are unchanged.
