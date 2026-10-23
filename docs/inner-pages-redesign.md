# Inner-page redesign review

## Scope

Updated the existing routes in place: `/collections`, `/collections/[id]` (fabric slug URLs), `/studio`, `/measure`, `/inspiration`, `/inspiration/[slug]`, `/contact`, `/designs`, `/faq`, `/how-it-works`, `/privacy`, and `/terms`. No deployment was performed.

## Design and components

- Reused the existing DM Sans / Cormorant Garamond typography, ivory / green / bronze palette, Container, Eyebrow, ActionLink, and Photograph components. No new fonts, libraries, or global CSS were added.
- Refined the reusable `components/editorial/PageIntro.tsx` with a balanced photographic composition and responsive image framing.
- Collections retain catalogue-driven categories, search, sorting, desktop filters, mobile drawer, 4:5 images, and variant-aware links. Digital approximations are now visibly disclosed on cards.
- Product details have a more generous image/information proportion, readable verified specifications, expandable additional known details, and one shade-aware request for complete specifications. Underlying import fields remain intact. Gallery zoom, shade codes, quote form, configured WhatsApp routing, and studio transfer remain in place.
- Studio retains its existing main / sheer / review flow, palette fallback, optional advanced controls, and upload/AI integration; heading scale and spacing now align with the editorial pages. Ordinary swatch changes do not request AI generation.
- Measurement guide adds an accessible SVG measurement schematic and collapsible advanced inputs. Whole-width, panel, fullness, repeat and allowance mathematics remain in `lib/measurements.ts`. The new `lib/useMeasurementDimension.ts` preserves physical measurements across unit changes, avoiding rounding-driven increases in estimated fabric.
- Inspiration has topic anchors, a featured story, larger article cards, comfortable article text width, related articles, collection links, and a restrained consultation prompt. Existing articles and policy text are retained.
- Consultation uses the requested headline, larger form labels and controls, collapsible optional details, existing URL prefilling, existing stored-success validation, and configured WhatsApp access. The backend's existing email requirement remains in force.
- Saved designs add a photographic introduction, loading state, dates, download, selected-direction enquiry, confirmation before deletion, and a designed empty state. Existing private session and local storage behavior remains unchanged.
- FAQ groups existing questions using native keyboard-accessible disclosure controls. How It Works gains a photographic introduction and fabric-first guidance. Privacy and terms gain readable section hierarchy while retaining draft status and policy wording.
- Header, footer, logo, homepage, homepage sections, global styles, and comparison/autoplay sources remain unchanged. The existing shell already contains all requested navigation and legal destinations.

## Files changed

Pages: the ten `app/*/page.tsx` inner-page files and `app/inspiration/[slug]/page.tsx`.

Catalogue components: `CatalogueBrowser.tsx`, `FabricCatalogueCard.tsx`, `FabricDetail.tsx`, `FabricSpecifications.tsx`.

Editorial components: `PageIntro.tsx`, `FAQ.tsx`, new `MeasurementDiagram.tsx`.

Other: new `lib/useMeasurementDimension.ts`, new `scripts/inner-page-browser.cjs`, new `scripts/measurement-display-check.cjs`, an opt-in hook in `scripts/browser-check.cjs`, and this report.

## Assets and data limitations

- Supplier catalogue validation reports no supplier records. Existing demo entries remain illustrative, with availability subject to confirmation.
- Missing composition, width, GSM, care, performance, and commercial fields are not fabricated. Request complete specifications for missing details.
- Existing digital shade previews remain approximate. Actual supplier-approved shade and draping photography still needs to be supplied. No arbitrary replacement product photographs were introduced.
- All photography is reused from the repository; existing source manifests are `scripts/curtain-image-sources.json`, `scripts/fabric-preview-sources.json`, and the manual-preview source manifests. No new downloads or generated imagery were added.
- AI rendering, WhatsApp, private server storage, and notification delivery depend on the existing runtime configuration. No real AI generation, public sharing, or business enquiry was sent during this UI review.
- Saved designs do not promise account synchronization. Existing privacy and terms remain drafts requiring owner completion.

## Verification

- TypeScript: `npm.cmd run lint`.
- Production: `npm.cmd run build`, including existing asset, configurator, supplier-catalogue, and manual-config checks.
- Logic: `node scripts/logic-check.cjs`, `node scripts/catalogue-logic-check.cjs`, and `node scripts/measurement-display-check.cjs` passed.
- Headless Chrome: all 12 representative inner routes passed image loading, one-H1 and horizontal-overflow checks at 1440, 390 and 768 pixels (36 combinations). Screenshots are in `.data/inner-page-review/` (gitignored). Consultation desktop, collection mobile, inspiration mobile, and measurement tablet screenshots were visually inspected. Tablet form layouts were subsequently given full width for more comfortable controls.
- Final focused production browser checks passed for mobile filter drawer, studio step navigation without AI calls, gallery zoom, absence of repetitive missing-specification rows, unchanged estimate on cm/in conversion, consultation prefilling and the saved-design empty state. Updated measurement and consultation layouts also passed an additional four mobile/tablet route checks.
- Homepage preservation: Git diff confirms no homepage, homepage component, comparison, shared header/footer, global style, or typography changes. Eighteen homepage/shell/interaction source files match HEAD after normalizing Git line endings. The old `scripts/check-homepage-hero.cjs` baseline reports a pre-existing markup hash mismatch; its stored baseline was not overwritten to conceal the failure.
