# Phase 2 implementation notes

Changed: app/page.tsx, app/globals.css, app/studio/page.tsx, app/api/visualize/route.ts, components/BeforeAfter.tsx.
Added: components/interactive/CurtainComparison.tsx, CurtainOpeningDemo.tsx, FabricSelector.tsx, and the two original SVG room illustrations in public/demo-rooms/.

The homepage now follows the curtain-focused customer journey: comparison hero, value strip, opening demonstration, fabric exploration, studio introduction, comparison study, process, measurements, consultation and existing footer. Existing fonts, navigation, collections, measurement calculator, enquiry endpoint and AI POST integration are preserved. No dependencies were added and nothing was deployed.

Interactions:
- Comparison uses Pointer Events, pointer capture, bounded coordinates and direct CSS custom property updates rather than React renders while dragging. Keyboard: arrows, Shift+arrows, Home and End. Native slider semantics announce the current value. Touch permits vertical page scrolling. Image failure and no-JavaScript messages are included.
- Opening demo coordinates two folded panels with an indicative daylight change, plus a native keyboard range control. No perpetual animation or rendering engine.
- Six fabric choices update the texture study, suitability, light guidance and studio link. The layered option links to a base linen palette; the studio does not offer a true layered render control.
- Studio adds a visible six-step journey, color picker, keyboard concept comparison, reusable comparison for returned AI renders and provider configuration status. Existing upload validation and save/error behavior remain.

Photography still needed:
- Licensed atelier-before.webp and atelier-after.webp: exact same room, dimensions, window geometry and camera angle; only the curtains should differ. Place in public/demo-rooms/ and pass these paths to CurtainComparison. The current atelier-before.svg and atelier-after.svg are original, aligned illustrations, clearly labelled as such, not photography or AI renders.
- Six genuine fabric close-ups (sheer, linen, blackout, velvet, textured, layered). Current swatches are labelled illustrative texture studies, not product photography.
- Existing collection catalogue images and pricing remain demo data, as noted in lib/catalog.ts; approved SKU photography and rates are still needed before launch.

Configuration:
- OPENAI_API_KEY enables the existing AI image-edit provider. GET /api/visualize exposes only a boolean availability flag; it does not expose secrets. Actual successful generation still depends on provider access, billing and network availability.
- Consultation delivery retains its existing server configuration requirements; see .env.example and README.md. No credentials were read or changed.
- Studio heading/pattern controls remain available. Fullness for AI generation is not implemented; fullness planning remains in /measure. Concept length/position controls are illustrative and are not sent as exact installation geometry to the AI provider.

Validation results are reported in the final implementation response. Real mobile device touch checks and approved photographic assets remain needed for final visual sign-off.

Verified: npm.cmd run lint and npm.cmd run build pass. HTTP 200 for homepage, studio, collections, measurement, contact, provider status and both local room assets. Chrome browser check passed homepage overflow/image checks at 360, 390, 768, 1024 and 1440px, mouse comparison drag, emulated touch drag, Home keyboard control, fabric selection, mobile route layouts and no runtime exceptions. Browser verification requires Chrome outside the restricted sandbox; run node scripts/browser-check.cjs with the app on port 3100. Real-device touch and successful paid AI generation were not tested.

Styling architecture update: Tailwind CSS is now installed, and all active page/component rules have moved into JSX utilities. See [STYLING.md](STYLING.md). The earlier statement about no new dependencies describes the initial Phase 2 implementation.
