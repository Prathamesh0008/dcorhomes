# Homepage visualizer redesign

The homepage now leads with a split hero: expressive typography and studio/fabric actions on the left, a large interactive room comparison on the right. Fabric exploration immediately follows it. The header has a larger wordmark, readable navigation and a Start Designing action.

## Files

- `app/page.tsx`: replaces the static editorial hero and introduces the new fabric heading.
- `components/SiteHeader.tsx`: stronger wordmark/navigation, translucent sticky background and studio CTA.
- `components/ui/ActionLink.tsx`: restrained arrow hover motion.
- `components/interactive/CurtainComparison.tsx`: tall rounded hero variant, bounded handle, fixed aligned image clipping, pointer capture and cached drag bounds. Arrow keys, Home and End remain available.
- `components/interactive/HeroEntrance.module.css`: small scoped entrance animation, disabled for reduced motion.
- `public/images/hero-room-before.webp` and `hero-room-after.webp`: original generated demonstration assets, not product photography or an actual customer installation.

## Asset provenance and generation

Audited `public/images` and `public/demo-rooms`: existing photographs are unrelated single images; the archived SVG pair is unsuitable for this hero. No reference-site imagery was copied.

Used the built-in imagegen tool. Before prompt: original photorealistic warm ivory living room, frontal tall three-part uncovered window, dark slim frames, leafy garden, cream sofa left, walnut table and ceramic vase right, oak floor and neutral rug; soft daylight, portrait 4:5 framing; no curtains, people, text or watermark.

After edit prompt: add warm ivory floor-length linen panels from a discreet ceiling track, leaving the central garden visible; preserve exact framing, camera, canvas, window mullions, garden, furniture, rug, floor and lighting; change only curtains and necessary local shadows. No text or borders.

The hero explicitly identifies these as AI-created room illustrations. They demonstrate a design direction and do not establish fabric specifications or stock availability. Additional room selectors are omitted because there is only one pair. Existing licensed fabric photography remains unchanged.

## Scope

Font families, global CSS, routes, studio integration, collection behavior, measurement calculator, consultation and API handlers are preserved. Nothing is deployed.

## Verification

TypeScript and production compilation passed. Chrome checked homepage, collections, studio, measure and contact at 360, 390, 768, 1024 and 1440 pixels: images loaded and no horizontal overflow. Mouse dragging, simulated touch dragging, keyboard Home/End/arrows, fabric selection, mobile navigation, catalogue filtering, studio upload/modes/headings and quantity calculation passed. Consultation validation/error was tested with a mocked response; no enquiry was sent. Reduced motion and browser runtime checks passed.

Reviewed actual desktop and mobile screenshots at 1440px and 390px. The comparison is the hero centerpiece; on mobile it follows the headline/actions. Screenshots: `%TEMP%/dcorhome-review-home-1440.png` and `%TEMP%/dcorhome-review-home-390.png`. The live reference page was consulted for its visualizer-first hierarchy; no supplied screenshot files were present in the attachment.

No additional assets are required for this one-room illustrated demo. Real customer/SKU photography and additional matched room pairs remain future inputs, rather than being represented by fake selectors. Generated originals remain in the Codex generated-images folder; optimized project assets are the two WebP paths listed above.
