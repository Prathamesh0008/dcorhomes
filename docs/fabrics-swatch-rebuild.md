# Fabrics swatch catalogue rebuild

Scope: /collections and the existing fabric detail enquiry integration only. No deployment. Homepage, navigation, logo, fonts, globals, Studio, authentication and other pages are unchanged.

## Files
- components/curtains/CatalogueBrowser.tsx: white catalogue, breadcrumbs, forest-green title strip, 210px sidebar, applied filters in sidebar, responsive drawer.
- components/curtains/FabricSwatchGrid.tsx (new), SwatchCard.tsx: 2/3/4/5/6 columns at mobile/640/1024/1280/1440px, 12px horizontal and 20px vertical gaps, square texture images, a single Fabric Name / Shade caption and whole-item shade link. No card decoration or extra listing actions.
- components/curtains/FabricColorFilter.tsx (new), SwatchFilters.tsx: compact square multi-select colour palette, searchable patterns, collapsible metadata-driven checkboxes and optional numeric ranges. Unknown rub ratings never create a rub filter.
- components/curtains/SwatchToolbar.tsx, SwatchPagination.tsx: actual counts, compact sort/direction, numbered pages, ranges and configurable page size. Catalogue is always a swatch grid; legacy view URLs remain parseable.
- lib/curtains/swatch-query.ts, lib/server/swatch-search.ts: verified rub-data capability flag. Existing server SQL filtering/pagination, stable ordering, OR within facets and AND across facets, debounced search, URL persistence and history retained.
- components/curtains/FabricDetail.tsx: explicit enquiry mail link to sales@dcorhome.com with selected fabric/shade and existing enquiry message. Existing gallery, zoom, specifications, shade selector and request workflows retained.
- scripts/swatch-search-browser.cjs: focused catalogue check updated for compact grid/caption and six-column/square-image assertions.

## Routing and imports
Each active shade links to /collections/{parent-slug}?shade={encoded-shade-id}. Parent and child records remain normalized; existing schema, CSV template, rights attestation and create-only supplier import are reused. No products or technical values added or overwritten.

## Assets and limitations
Supplier catalogue JSON is empty. Existing records are explicitly marked demo; they must not be represented as genuine supplier stock. Existing locally hosted photographic digital approximations are reused, with the listing-wide demo notice and image alt disclosure. Cards prefer swatchImage / textureImage; missing shade photography never falls back to a room or another shade. No Ashley Wilde images were downloaded or hotlinked.

Existing source/rights records: public/images/fabrics/asset-manifest.json, scripts/fabric-preview-sources.json and PHOTOGRAPHY.md. They record Pexels source pages, photographers, website/modification permission and digital recolouring provenance; these are licensed illustrative references, not supplier-approved product photography. No new license claim or supplier authorization is made.

Still needed: approved supplier catalogue, original shade-specific square photographs, actual shade/SKU codes, composition, width, GSM, repeats, care, usage, abrasion data where relevant, publication dates and verified availability. No ten-shade range or rating is invented.

No screenshot was attached with this request. The linked Ashley Wilde swatch-search page and supplied written density/layout requirements informed the implementation; exact screenshot parity cannot be certified.

## Validation
Results are recorded after the final production build and focused local checks.

- npm.cmd run lint: PASS (repository lint command is TypeScript, no separate ESLint configured).
- npm.cmd run build: PASS after final application edits; asset/configurator/supplier/manual prebuild checks passed.
- node scripts/fabric-image-check.cjs: PASS, all 31 existing demo shade galleries and source manifest hashes.
- node scripts/check-homepage-hero.cjs: PASS, all 113 protected dependencies unchanged.
- git diff --check: PASS.
- Focused isolated SQL/import/API checks: PASS for search, combined OR/AND filters, facet counts, literal matching, numeric ranges, sorting, page clamping, memory fallback, duplicate SKU rejection, rights attestation, saved-variant isolation and admin projection refresh. Synthetic fixtures stayed in temporary databases.
- Browser portion: BLOCKED on both attempts by Chrome Runtime.enable initialization timeout, before page interaction. Six-column/square assertions, mobile drawer/overflow, browser history and shade-navigation browser assertions were updated but could not execute. No fresh screenshot or pixel comparison can be claimed. No extensive E2E suite run.
- Existing next-env.d.ts development-output reference preserved after Next build regenerated it.
