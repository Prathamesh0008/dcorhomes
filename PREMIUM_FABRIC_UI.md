# Premium fabric collection UI

This phase redesigns the existing collection and product pages in place. No deployment was performed.

## Changed UI files

- `components/SiteHeader.tsx`: larger brand and navigation, understated active underline, preserved responsive menu and routes.
- `components/curtains/CatalogueBrowser.tsx`: editorial curtain hero, responsive toolbar, immediate URL-backed filters, applied chips, custom sort, empty states and mobile filter drawer.
- `components/curtains/FabricCategoryNavigation.tsx`: image-led category rail, hidden native scrollbar, accessible previous/next controls and reduced-motion support.
- `components/curtains/FabricFilters.tsx`: collapsible categories/materials, color swatches, curtain layers and relevant supplier-only technical controls.
- `components/curtains/FabricCatalogueCard.tsx`: consistent 4:5 photography, interactive shade swatches updating image, name and every product link; overflow shade count.
- `components/curtains/FabricDetail.tsx`: larger image-led split, readable heading, selected-shade hierarchy, simpler enquiry actions and concise digital-preview disclosure.
- `components/curtains/FabricGallery.tsx`, `FabricColorSelector.tsx`, `FabricQuote.tsx`, `FabricSpecifications.tsx`: refined framing, controls, type and spacing. Unknown technical fields are grouped under an expandable request section.

All styling uses Tailwind in TSX. Existing fonts, server catalogue, enquiry persistence, admin data, image resolution and Studio selection logic are retained.

Regression scripts updated: `scripts/catalogue-browser-scenarios.cjs`, `scripts/fabric-image-browser-scenarios.cjs` and `scripts/manual-browser-scenarios.cjs`. This report is `PREMIUM_FABRIC_UI.md`.

## Verification

- TypeScript and production build.
- Catalogue and photographic asset validation.
- Browser coverage for category navigation, immediate mobile filtering, applied-chip removal, sort, card shade/image/link synchronization, mobile navigation and empty results.
- Isolated API/browser regression for supplier records, selected shade photos and references, WhatsApp message encoding, quote persistence and duplicate protection, image zoom/keyboard controls, Studio handoff and manual curtain configuration.
- Full-page collection and Silk Satin Study screenshots at 390, 768 and 1440 pixels. Browser checks reject horizontal overflow and broken images. Screenshot review prompted a full-width mobile search field, aligned card actions and condensed unconfirmed specifications.
- Screenshot files: `%TEMP%/dcorhome-premium-{collections,detail}-{390,768,1440}-full.png`.

## Assets and configuration

Existing licensed local curtain and fabric images are used; no new image dependency is required for this redesign. Demo shades remain approximate digital previews rather than verified supplier photographs or inventory. Authentic supplier shade photos, composition, GSM, roll widths and commercial details still require supplier data.

The local WhatsApp number and email delivery credentials remain unconfigured. WhatsApp links are verified using an isolated synthetic test number; the normal local UI offers the working quote form. No external messages were sent. Local quote storage is configured, but production configuration remains a deployment responsibility.
