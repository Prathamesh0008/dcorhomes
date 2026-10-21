# Phase 3 implementation

## Typography

`lib/typography.ts` defines reusable Tailwind classes for hero, page, section and card headings, body text and buttons. Existing DM Sans/Manrope sans and Cormorant Garamond serif definitions are preserved. Headings use medium sans, controlled tracking and responsive sizes. Selected italic phrases use the existing serif. Body prose uses 15px/1.8; actions use 13px medium sans. Small labels remain smaller for hierarchy. Global CSS has no new typography rules.

Applied to homepage, shared page intros, catalogue cards/details, studio, measurement and consultation. Footer prose and links now follow the same sans-serif approach.

## Navigation

Larger wordmark with three subtle vertical pleat lines; centered pill navigation with a clear active item; dark green “Design your space” studio action; translucent sticky surface and fine divider. Mobile menu has animated visibility, inert hidden content, initial focus, Tab cycling, Escape focus return, same-route closing and a studio CTA. It closes when switching to desktop.

## Comparison root cause and fix

The green homepage section omitted `before` and `after`. `CurtainComparison` therefore used its optional-source fallback: one reference photo for both layers. Its pointer interaction worked but could reveal no change.

The section now explicitly receives `/images/hero-room-before.webp` and `/images/hero-room-after.webp`, the existing aligned 1120×1400 generated pair created in the preceding homepage task. No new photography was generated in Phase 3. The images show the same room framing and furniture, with linen panels added in the edited image. This is an AI-created illustration, not an authentic photographed installation, and the visible caption says so. No unrelated photographs or invented completed studio results are used. No gallery alternative is needed for this existing pair.

Removed pending-asset/provider messages from the homepage section. BEFORE/AFTER labels have explicit dark text for contrast on the green background. Existing pointer capture, direct clipping, bounded handle and keyboard controls are preserved.

## Changed files

- `lib/typography.ts`
- `app/page.tsx`
- `app/collections/page.tsx`
- `app/studio/page.tsx`
- `app/measure/page.tsx`
- `app/contact/page.tsx`
- `components/editorial/PageIntro.tsx`
- `components/ProductCard.tsx`
- `components/interactive/FabricSelector.tsx`
- `components/interactive/CurtainComparison.tsx`
- `components/SiteHeader.tsx`
- `components/SiteFooter.tsx`
- `components/ui/ActionLink.tsx`
- `scripts/browser-check.cjs`
- `PHASE3.md`

API logic, studio state and rendering, catalogue filtering, measurements, enquiry logic, routes and font families are preserved. No dependency changes and no deployment.

## Verification

TypeScript and final production build passed. Chrome checked all five pages at 360, 390, 768, 1024 and 1440 pixels, with loaded images and no horizontal overflow. Actual screenshots at 1440 and 390 were reviewed, including the green section, catalogue, studio, measurement, consultation and mobile menu.

Both homepage comparisons have distinct, equally sized image sources. Direct dragging of the green-section comparison passed. Mouse, simulated touch, Home/End/arrow controls, fabric selection, mobile opening/Escape/focus return/initial focus, catalogue filtering, studio uploads and modes, heading selection and measurement calculation passed. Consultation validation/error used a mocked response and sent no enquiry. Reduced motion and runtime-exception checks passed. Live paid AI generation was not invoked.

Screenshots are in `%TEMP%`: `dcorhome-review-home-1440.png`, `dcorhome-review-home-390.png`, `dcorhome-review-green-1440.png`, `dcorhome-review-menu-390.png`, and corresponding route screenshots.
