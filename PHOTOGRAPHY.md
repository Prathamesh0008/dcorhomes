# Photographic assets and redesign notes

All photographs below were downloaded locally from Pexels on 21 October 2026. The source pages marked them free under the [Pexels License](https://www.pexels.com/license/), whose published terms permit website/promotional use and modification. They are stock editorial references, not Dcorhome installations, owned photography, confirmed inventory, or proof of fabric performance. No endorsement is implied. No images were copied from Curtain AI.

| Local file under public/images | Source | Photographer where verified | Use |
| --- | --- | --- | --- |
| atelier-interior.jpg | [17767778](https://www.pexels.com/photo/view-of-brown-curtains-hanging-in-a-room-17767778/) | Paulina Lazauskaite | Hero; real gathered drapery; size-guide detail |
| residential-room.jpg | [34538289](https://www.pexels.com/photo/modern-living-room-with-elegant-decor-34538289/) | HONG SON | Studio room reference; aligned comparison placeholder |
| living-drapery.jpg | [7786781](https://www.pexels.com/photo/brown-couch-in-the-living-room-7786781/) | Furkan Tumer | Real sheer/outer drape layering reference |
| curtain-room.jpg | [16045145](https://www.pexels.com/photo/curtain-on-windows-16045145/) | hello aesthe | Tall window and sheer reference |
| sheer-window.jpg | [3255244](https://www.pexels.com/photo/opened-white-window-with-sheer-curtain-3255244/) | Jonathan Borba | Sheer curtain reference, homepage editorial, consultation |
| linen-detail.jpg | [15679399](https://www.pexels.com/photo/beige-wrinkled-fabric-15679399/) | Lisett Kruusimäe | Actual linen close-up |
| velvet-detail.jpg | [16975989](https://www.pexels.com/photo/brown-velvet-fabric-16975989/) | Eugenia Remark | Actual velvet close-up |
| dark-textile.jpg | [1487821](https://www.pexels.com/photo/close-up-photo-of-black-textile-1487821/) | Engin Akyurt | Dark textile aesthetic; not evidence of blackout performance |
| sheer-detail.jpg | [10624309](https://www.pexels.com/photo/checkered-curtain-near-glass-window-10624309/) | See source page | Actual patterned curtain; texture reference |

Downloaded via the Pexels image service with automatic compression and a 2000px width request. Next.js Image uses the Photograph wrapper to serve pre-encoded 640/1280/1920px WebP derivatives directly. This avoids runtime image-optimizer requests. Derivatives retain the photographic content; only size and encoding change. Regenerate them with node scripts/prepare-photography.cjs (Sharp is already supplied by Next.js). Local hosting removes runtime dependency on external stock-photo URLs. The dark textile is not represented as a verified blackout product, and the patterned curtain is not represented as a Dcorhome SKU.

## Realism and behavior

- Original fonts and brand colors remain. All component styling stays in Tailwind className utilities; globals.css remains unchanged and minimal.
- Homepage is an editorial split hero with real curtain photography, restrained actions, a photographic material explorer, studio introduction, a quieter process section, measurement introduction and consultation.
- The flat SVG rooms and animated CSS curtain panels are no longer used in the website. Legacy SVG files remain unused in public/demo-rooms; no illustration is substituted for missing photography.
- CurtainOpeningDemo is now a compatibility wrapper for the photographic comparison fallback; the artificial opening demonstration is absent from the prominent homepage.
- Comparison uses Pointer Events and pointer capture, direct CSS-variable updates, bounded positions and keyboard controls. Handle is smaller and cleaner with a 44px target. Images share the same frame, fit and origin. There is no easing during a drag.
- The homepage comparison currently uses the *same* unedited reference photograph on both sides, labelled REFERENCE. Its caption explicitly says this is a drag preview with a matched edit pending. It is not a before/after transformation. Real AI renders in the studio compare the uploaded original with the actual returned edited image.
- Studio defaults to the original photograph. A user must select Placement sketch to see the schematic. The sketch is visibly diagrammatic and labelled; the exported PNG includes a NOT AN AI RENDER annotation. Fabric, color, heading, pattern, placement, download, sample selection, upload validation and the existing AI integration remain. Placement sliders affect the sketch only, as explained in the UI.
- Catalogue names are design directions with stable existing IDs, not invented commercial SKUs. Demo prices, stock-like claims, badges and material performance guarantees were removed. No products are represented as available to buy.
- Measurement quantity planning remains. Cost uses an optional user-entered quoted rate instead of an invented catalogue price. The 140cm roll width and 30cm allowance are explicitly stated planning assumptions, not product specifications.
- Header, footer, mobile navigation, collections, size guide and consultation use restrained editorial layouts. Form submission and API routes remain unchanged. No packages were added, no fonts were changed, and nothing was deployed.

## Photography still required

1. A genuine matched before/after pair: same room, camera, dimensions, furniture, window geometry and lighting; curtain installation the only meaningful change. Pass both paths to CurtainComparison. Until then, keep its labelled reference fallback.
2. Transparent photographic left/right curtain layers and an exactly matching unobstructed room plate, with rail and floor alignment, for any future opening interaction. No fake animation is displayed in their absence.
3. Approved Dcorhome SKU/sample photography, actual product compositions, linings, available colors and verified rates. Stock reference photos must not be repurposed as claims about inventory.
4. An authentic bedroom installation and verified blackout fabric/sample imagery; these are not fabricated in this redesign.

Actual successful AI generation depends on OPENAI_API_KEY, provider access and billing. Consultation delivery retains its existing environment requirements. Credentials were not read, changed or added. Physical-device testing and a paid AI generation were not performed.


## Files changed

Pages: app/page.tsx, app/collections/page.tsx, app/studio/page.tsx, app/measure/page.tsx and app/contact/page.tsx.
Components: SiteHeader, SiteFooter, ProductCard, interactive/FabricSelector, interactive/CurtainComparison and interactive/CurtainOpeningDemo.
New components: editorial/PageIntro, ui/ActionLink and interactive/CurtainPlacementSketch.
Data and verification: lib/catalog.ts, lib/urls.ts and scripts/browser-check.cjs; nine source JPGs and 27 WebP derivatives under public/images; this documentation.

app/globals.css, the font configuration, API route implementations, dependency versions and build-output isolation were preserved.

The final delivery pass adds components/ui/Photograph.tsx and scripts/prepare-photography.cjs. No custom global image-loader configuration was introduced; dynamic uploaded/AI images continue to bypass static derivatives.


## Final verification

- TypeScript (`npm.cmd run lint`): passed.
- Production build (`npm.cmd run build`): passed; all existing routes and API handlers included.
- Browser: all five routes passed overflow and loaded-image checks at 360, 390, 768, 1024 and 1440px. No active room illustrations or broken photographic assets were detected.
- Mouse drag, emulated touch, Home/End/arrows, fabric selection, mobile navigation/Escape, catalogue filtering, studio original/sketch modes, uploads, heading selection, measurement quantity, unpriced state, reduced motion and consultation validation/error handling passed. Consultation delivery was mocked; no enquiry was sent. No browser runtime exceptions were recorded.
- Actual desktop and mobile homepage screenshots plus desktop collections/studio screenshots were inspected. Mobile hero actions were tightened so photography appears earlier. Screenshots from scripts/browser-check.cjs are written to the OS temporary directory as dcorhome-review-home-390.png, dcorhome-review-home-1440.png, dcorhome-review-collections-1440.png and dcorhome-review-studio-1440.png.
- The isolated dev/production output configuration remains intact. Local test servers are stopped after verification. Nothing was deployed.
