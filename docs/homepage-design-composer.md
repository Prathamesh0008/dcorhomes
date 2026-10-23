# Homepage Style / Pattern / Room composer

## Delivered

Added `components/curtains/CurtainDesignComposer.tsx` immediately after the existing homepage hero and before product discovery. The existing Main Curtain / Sheer Curtain customizer remains in place.

The section has the requested title and subtitle, the established sans-serif/italic-serif pairing, warm ivory cards, champagne selection accents, and a forest-green live summary. It offers eight aesthetic directions, eight pattern inspirations, and six room contexts. It adds no manufacturing controls, furniture customization, app-download promotion, or new dependencies.

Rows support touch swiping, trackpad/mouse scrolling, desktop arrows, keyboard selection, selected borders/checkmarks, and reduced-motion preferences. Each row scrolls independently, keeps its first/last cards reachable, hides native scrollbars, and reveals part of the next card on mobile.

## Integration and compatibility

- Continue Customizing passes validated style, pattern inspiration and room context into the existing studio.
- The intent URL deliberately carries no frozen fabric or shade snapshot. The studio reads the latest existing manual configuration when the customer arrives, so later changes made in the homepage customizer are retained.
- A compatible pattern is applied to that configuration. An unsupported pattern remains a separately labelled inspiration; the current fabric, actual pattern, main shade, sheer fabric, sheer shade and heading are preserved.
- The studio explains the mismatch, offers the actual supported pattern, and carries the unfulfilled inspiration into the enquiry message. It does not silently switch fabrics or claim unavailable stock.
- Explore Fabrics filters by the selected pattern when the actual catalogue has a matching record. Otherwise it opens the fabric library and the summary explains that verified matching inventory is not yet listed.
- An optional local draft stores inspiration preferences only; it is separate from the existing manual fabric configuration and does not represent another fabric-customization system.

## Images and provenance

All 22 cards have photographic assets. No competitor images, generated pattern cartoons, artificial room scenes, or invented product photographs were used.

- `public/images/composer/manifest.json`: complete per-card manifest with local path, source, licence and intended usage.
- `public/images/composer/sources.json`: metadata for nine newly prepared assets.
- Five pattern images are photographs of actual historical textiles from The Met Open Access collection, verified as public domain by the museum API. The floral image is cropped to its floral textile register; the crop is documented. These are inspiration references, never Dcorhome stock claims.
- Four new room-context photographs use the Pexels licence. Existing editorial photographs are reused for the remaining room, style and pattern cards, with provenance recorded in the complete manifest and existing source manifests.
- `scripts/prepare-composer-assets.cjs` records the reproducible download/resize process.

The actual supplier catalogue remains empty. All eight inspirational patterns can be selected without asserting that eight purchasable pattern ranges exist. No source-data fields or catalogue records were modified.

The referenced [Curtain AI page](https://curtainai.app/en) was inspected for its three-row interaction concept. Dcorhome's implementation, branding, imagery and continuation flow are original to this repository. No screenshot file accompanied the brief.

## Files added or integrated for this request

- `components/curtains/CurtainDesignComposer.tsx`: new homepage inspiration section.
- `app/page.tsx`: component import and one insertion after the unchanged hero.
- `components/interactive/ImageSelectionRow.tsx`: reusable light/large appearance and independent mouse-wheel scrolling; default studio behavior retained.
- `lib/curtains/composer.ts`: editorial choices, validation, current-state transfer and intent URL helpers.
- `lib/design-options.ts`: optional `inspirationPattern` selection field.
- `app/studio/page.tsx`: intent intake using existing manual configuration helpers and explicit alternative action.
- `components/curtains/StudioVisualizer.tsx`: compatibility explanation, alternative choice and inspiration-aware enquiry.
- Nine `public/images/composer/*.webp` assets and the two manifests.
- `scripts/prepare-composer-assets.cjs`, `scripts/composer-check.cjs`, `scripts/composer-browser.cjs`, and an opt-in composer branch in `scripts/browser-check.cjs`.

Earlier inner-page and visualizer work was preserved; no repository reset or unrelated reversal was performed.

## Verification

- `npm.cmd run lint`: passed.
- `npm.cmd run build`: passed, including existing asset, configurator, supplier-catalogue and manual-config prebuild checks.
- `node scripts/composer-check.cjs`: passed. Covers all 384 inspiration combinations, validation, preservation of fabric/shade/heading fields, a compatible Floral test record, fresh-state intent URLs, all source/licence records, asset existence and exact hero markup equality with Git HEAD after normalizing line endings.
- Headless Chrome at 1440px, 390px and 768px: correct insertion point, retained homepage customizer, one H1, no broken images and no horizontal page overflow. Desktop and mobile screenshots were visually inspected; artifacts are under `.data/composer/` (gitignored).
- Interaction checks passed for all 22 cards, one selected checkmark per row, immediate summary text, independent carousel scrolling, actual mobile touch drag, transfer of a freshly changed main fabric while preserving both shades/layers, selected room/style intake, unsupported Floral disclosure/enquiry and explicit use of the available pattern.
- Hero markup is unchanged. Hero slider, autoplay/drag sources, logo/header/footer, existing homepage customizer, catalogue data, fonts and global CSS are untouched. The old `check-homepage-hero.cjs` stored baseline still reports its previously documented hash mismatch; that stale baseline was not overwritten. The new preservation check compares the actual hero markup directly with the starting Git source and passes.
- No paid image generation, business enquiry submission, deployment or publishing occurred.

To run the browser check against a local production server:

```powershell
$env:DCORHOME_TEST_BASE_URL='http://localhost:3121'
$env:DCORHOME_COMPOSER='true'
node scripts/browser-check.cjs
```
