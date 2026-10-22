# Premium homepage redesign

Implemented in the existing Next.js project. Nothing was deployed.

## Hero protection

The inline first section of `app/page.tsx` is retained verbatim. Its headline, copy, CTA destinations, images, proportions, spacing and typography were not edited. Neither were `CurtainComparison`, its autoplay hook, entrance animation, shared image/container/action/eyebrow components, typography constants, global CSS, header, root layout or image assets.

`scripts/homepage-hero-protection.json` records the original hero markup and hashes for 15 protected dependencies/assets. `node scripts/check-homepage-hero.cjs` verifies these exactly. Before/after screenshots verify identical hero dimensions at 360, 390, 768, 1024 and 1440 pixels. The visual comparison permits a small browser text-antialiasing difference; it does not claim byte-identical screenshot rasterization. Autoplay, manual dragging and keyboard adjustment are checked in the actual browser.

The existing premium header was deliberately retained to avoid changing the hero's surroundings. The footer was redesigned independently.

## Audit and resulting sections

The former homepage repeated configuration/design-direction explanations, used a separate static fabric selector, emphasized upload/render mechanics in the process section, displayed every FAQ, and ended in another generic consultation block. These presentations have been replaced by a clear discovery-to-enquiry sequence:

1. **Curtain discovery:** populated catalogue categories only, large staggered photographic previews, horizontal touch scrolling and working previous/next controls. Sheer, Silk, Velvet, Linen, Blackout and Textured currently have content. No empty cotton/jacquard/etc. collections are advertised.
2. **Signature customizer:** the same existing `ManualConfig` and catalogue provider power the three-step main/sheers/review flow. Six featured colors expand to all shades. Homepage actions are Explore My Design and Enquire About This Combination. Manufacturing controls remain in the full Studio.
3. **Material edit:** three substantial, asymmetric fabric features populated from catalogue records. Shade controls update the large photograph, name and product destination. Real palette counts are shown as catalogue shades, with no claims of verified stock.
4. **Art of layering:** selectable Sheer, Main curtain and Layered photographic scenes with short guidance. These are explicitly different rooms, rather than an invented same-room transformation.
5. **How it works:** Discover, Customize, Enquire; large editorial numerals and restrained line graphics replace generic boxed cards and technical generation instructions.
6. **Measurement assistance:** a green editorial split with floor-length curtain photography and plain-language guidance on dimensions, drop, fullness and installation, linked to `/measure`.
7. **Inspiration:** two distinct photographic curtain stories linked to existing guides.
8. **FAQ:** four readable customer questions with native accessible accordions and a link to the full FAQ page.
9. **Consultation:** a full-width green composition, with selected fabrics/shades and saved advanced details carried from the existing persisted configuration into the consultation form. The process-section enquiry uses the same behavior.

The footer now has readable curtain-focused navigation, populated category shortcuts, consultation links and legal pages. Mobile navigation groups use two columns. No address, phone number, social account, testimonial, rating or manufacturing guarantee was invented.

## Files changed in this phase

- `app/page.tsx`: imports and below-hero composition only; protected hero remains verbatim.
- `components/home/HomeBelowHero.tsx`: editorial section composition, process, measurements, inspiration, FAQ and consultation.
- `components/home/HomeCategoryDiscovery.tsx`: responsive photographic category rail.
- `components/home/HomeFabricShowcase.tsx`: interactive catalogue-based fabric features.
- `components/home/HomeLayering.tsx`: photographic layering gallery.
- `components/home/HomeEnquiryLink.tsx`: reads the existing saved configuration for consultation links; no duplicate configuration state.
- `components/home/HomeHeading.tsx`: consistent local heading classes using the existing font combination.
- `lib/homepage.ts`: catalogue-derived category and feature selection, plus editorial image assignments.
- `components/interactive/DesignComposer.tsx`: signature homepage customizer presentation.
- `components/curtains/CurtainConfigurator.tsx`: optional homepage presentation, Studio/enquiry actions and advanced-control visibility. The full Studio mode and underlying model remain intact.
- `components/SiteFooter.tsx`: hierarchy, category links and responsive layout.
- `public/images/home/`: six editorial photographs, three responsive WebP sizes each and `sources.json`.
- `scripts/prepare-home-photos.cjs`: reproducible photo downloads and optimization.
- `scripts/homepage-redesign-browser.cjs`, `scripts/browser-check.cjs`: focused homepage visual/interaction checks.
- `scripts/homepage-hero-protection.json`, `scripts/check-homepage-hero.cjs`: protected hero baseline and verification.

No product-detail pages, backend infrastructure, global styles or font definitions were changed in this phase. Existing shared FAQ/other components remain available to their routes.

## Photography and data limits

The six new editorial photographs are from Pexels photo IDs 9980246, 7679435, 7587742, 36586178, 36810651 and 35979769. Exact source/download URLs and the [Pexels license](https://www.pexels.com/license/) are recorded in `public/images/home/sources.json`. Existing editorial sources are recorded in `lib/assets.ts`; existing fabric-preview sources are in `scripts/fabric-preview-sources.json`.

Major editorial sections use distinct photographs. The hero's comparison images never appear below it. Catalogue thumbnails may naturally recur in the functional customizer and fabric links. Below-hero images load lazily; new room photographs have 640/1280/1920px WebP derivatives, and reserved aspect ratios keep layouts stable.

Room scenes are styling inspiration, not supplier product photographs. Existing demo shade studies remain labelled digital previews, with physical-sample guidance. Actual supplier shade photography, composition, widths, GSM, availability, pricing and verified layered preview assets still require supplier data. No exact fabric combination render or configured paid-AI capability is claimed by the new sections. Ordinary swatch changes make no paid AI requests. The locked hero retains its existing AI-illustration disclosure.

## Verification

- TypeScript / `npm.cmd run lint` and production build.
- Exact protected-source hash checks.
- Full local production homepage screenshots at 360, 390, 768, 1024 and 1440 pixels; no horizontal overflow or broken images.
- Before/after hero geometry and screenshot comparisons; autoplay, drag and keyboard behavior preserved.
- Category scrolling and all local homepage/footer destinations.
- Fabric-feature swatches updating photos and shade-specific product links.
- Main shade changes, optional sheer removal, review/enquiry state, hidden homepage advanced controls and zero swatch-triggered AI POSTs.
- Final consultation link carrying the selected main shade, omitted sheers and existing variant details.
- Layering gallery and FAQ interactions.
- Full-page visual review prompted a wider mobile discovery heading, compact two-column footer links and a more balanced starting material palette.

This was a focused homepage check, not an extensive Playwright/E2E suite. Screenshots and review crops are in `.data/homepage-redesign/`; the main files are `homepage-{360,390,768,1024,1440}-full.png` and `hero-{before,after}-{width}.png`. Verification was against the local production build. No enquiries or external messages were sent.
