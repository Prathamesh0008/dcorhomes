# Dcorhome styling

Tailwind CSS is integrated into the existing Next.js app through `postcss.config.mjs`. All active pages, navigation, footer, product cards and Phase 2 interactions now own their visual styles in JSX/TSX utility classes.

## Component boundaries

- `components/ui/Container.tsx` owns the shared page width and responsive gutters.
- `components/ui/Eyebrow.tsx` owns the repeated editorial label styling.
- Each page owns its layout, headings, forms and section styling.
- `CurtainComparison` owns its images, clipping, handle, focus/drag states and responsive hero/showcase variants. Pointer movement still updates a CSS variable directly, without a React render per move.
- `CurtainOpeningDemo` owns the folded panels and light study. Its inline values are calculated panel widths and daylight intensity.
- `FabricSelector` owns the fabric choices, selected borders and texture studies.
- `ProductCard`, `SiteHeader` and `SiteFooter` own their respective styles. State is expressed through ARIA/data attributes and Tailwind variants rather than global modifier classes.

The former hero, navigation, card, button, collection, studio, measurement, consultation, footer and interactive component selectors have been removed from `app/globals.css`, including obsolete Phase 1 layouts. There are no replacement monolithic stylesheets or `@apply` component classes.

## What remains global

- Tailwind theme/utility imports and source declarations.
- The existing Google Fonts configuration: DM Sans, Manrope and Cormorant Garamond.
- Warm neutral, dark green and bronze tokens, exposed as Tailwind colors and font utilities.
- Minimal browser reset and body defaults, selection color and focus outline.
- A shared reduced-motion accessibility rule.

The existing browser reset is retained instead of enabling all of Tailwind Preflight, to preserve native element spacing. Heading typography is in JSX. Custom Tailwind max-width breakpoints retain the established responsive compositions rather than changing layouts at different widths during this refactor.

Use normal Tailwind utilities for new styling. Use arbitrary values for exact editorial measurements, gradients, masks or clipping when needed. Keep `style` limited to values calculated at runtime, such as fabric colors, drag positions and panel dimensions. Any future animation requiring custom keyframes should use a small component-scoped CSS Module.

## Verification

Run `npm.cmd run lint` and `npm.cmd run build`. For browser checks, start the production app on port 3100 (`npm.cmd run start -- --port 3100`) and run `node scripts/browser-check.cjs`. The browser script uses the installed Chrome executable and needs permission to launch outside this environment's restricted sandbox.

The checks cover all five routes at 360, 390, 768, 1024 and 1440px, mouse and emulated-touch comparison dragging, keyboard Home control, curtain opening, fabric selection/styling, studio uploads and heading variants, the size-guide calculation, reduced motion and consultation validation/error handling. Consultation delivery is mocked during verification; no enquiry is sent. Actual paid AI rendering and physical-device touch behavior are not exercised.

Local before/after layout captures confirmed unchanged fonts, colors, spacing and stable geometry. The product-card entrance now uses Tailwind starting-state transitions with the existing stagger timing, replacing its global keyframes. Card hover and focus interactions remain. Reduced motion disables the entrance transition.

Routes and API integrations remain unchanged. The separately documented photography and provider-configuration needs in `PHASE2.md` still apply. Nothing was deployed.

The subsequent photographic redesign is documented in [PHOTOGRAPHY.md](PHOTOGRAPHY.md). It replaces the opening demonstration and texture illustrations with local photographs, adds PageIntro/ActionLink, and keeps all new styling in TSX. The studio sketch is opt-in; the default view is the original photograph.
