# Photographic fabric shade showroom

This phase fixes the displayed fabric imagery. It does not deploy the site or change homepage/Design Studio application code.

## Why the old image did not change

Demo variants had HEX values but no variant photographs. The old resolver used the same `fabric.images` array for every shade. Selection changed text and a flat swatch while the large photograph remained unchanged. The earlier code deliberately avoided inventing a matching supplier photograph, but it did not implement the now-requested digital color tier.

## Working representative products

The existing Linen product at `/collections/sienna` was completed first and its generated Emerald Green/Burgundy imagery visually inspected before reusing the approach. It now has eight photographic digital shade previews, preserving existing color IDs and adding the requested Champagne, Emerald Green and Burgundy studies.

A single Silk Satin Study at `/collections/silk-satin-study` enables the exact Silk-category acceptance journey, with three demonstrable shades. Its satin photograph is a licensed stock texture study, not a verified silk supplier product or proof of fibre composition. No compositions, percentages, widths, GSM, prices or inventory were invented.

All seven published study records now have visual representations for all 31 shades: Linen 8, Velvet 5, Blackout textile study 4, Textured Weave 4, Sheer Weave 4, Fine Voile study 3, Silk Satin Study 3. These are preview palettes, not verified available supplier inventory. Demo preview reference IDs update per shade; actual supplier SKUs remain to be supplied.

## Two-tier image resolution

`lib/curtains/fabric-images.ts` centrally resolves an exact selected variant:

1. Actual variant main, draped, texture, additional and swatch photographs win when supplied.
2. Otherwise use the variant's precomputed digital main and digital texture close-up.
3. A genuinely unsupported variant returns a plainly labelled reference state; an invalid variant ID resolves no images. It never silently substitutes another shade.

New variant fields are `textureImage`, `drapedImage`, `digitalPreviewImage`, `digitalPreviewImages` and `digitalSwatchImage`; the existing actual image fields remain unchanged. The supplier schema, asset-path validation and CSV shade template support these fields. Admin cannot mark a shade available without an actual shade image or digital representation. Actual image fields and digital fields must not be confused during import.

No currently published demo shade has actual supplier-approved shade photography. Every one of its 31 shade galleries uses Tier B. Tier A is exercised by isolated synthetic supplier-record tests and remains ready for approved product imagery.

## Processing and licensing

`npm run prepare:fabric-previews` reads `scripts/fabric-preview-sources.json` and the typed study palettes. Sharp, already supplied by Next.js, creates optimized WebP main images at 1600 x 2000, close-up crops at 960 x 1200, and 160 x 160 swatches. There is no AI call, runtime API request, CSS tint overlay or per-swatch image-processing cost.

The algorithm converts source RGB to linear-light luminance, preserves its spatial weave/fold/shadow information, transfers the selected target color with source-relative luminance, and preserves neutral highlights. It remains an approximation, not a measured physical dye match. Close-up images are crops of the same source, not invented additional product photographs. Camera framing, transparency and construction are not certified by stock reference photography.

Fabric-only crops exclude the velvet background and the glass/window portions of the sheer photograph. Linen, velvet, dark textile, woven texture and silk/satin use distinct base photographs. The two sheer studies use different crops of the same licensed sheer photograph; supplier-specific Fine Voile and Sheer Weave samples remain needed to represent their exact constructions.

The asset manifest is `public/images/fabrics/asset-manifest.json`. It records source pages, photographers, permission status, source/reference versus digital modes, crop coordinates, per-shade HEX values, output paths and SHA-256 hashes. New raw stock sources and generated files live under `public/images/fabrics/`; filenames explicitly include `digital` for recolored outputs.

Source pages were checked against the [Pexels License](https://www.pexels.com/license/), which permits website use and modification:

- [Linen reference / Lisett Kruusimae](https://www.pexels.com/photo/beige-wrinkled-fabric-15679399/)
- [Velvet reference / Eugenia Remark](https://www.pexels.com/photo/brown-velvet-fabric-16975989/)
- [Dark textile / Engin Akyurt](https://www.pexels.com/photo/close-up-photo-of-black-textile-1487821/)
- [Sheer reference / Alexey Demidov](https://www.pexels.com/photo/checkered-curtain-near-glass-window-10624309/)
- [Silk/satin texture / Qwirki & Co.](https://www.pexels.com/photo/rippled-white-silk-fabric-in-close-up-photography-14380623/)
- [Woven texture / Eva Bronzini](https://www.pexels.com/photo/a-texture-of-a-fabric-7598534/)

No supplier permission, Dcorhome ownership or photographer endorsement is implied. Stock descriptions are not treated as verified product specifications.

## Product interaction and presentation

- Fabric viewer occupies approximately 55% of the desktop content columns.
- Reusable FabricColorSelector uses 56px photographic swatches, large targets, selected checkmarks, names/codes, responsive wrapping, search for large palettes, arrow keys and Home/End.
- Shade changes replace the large image and thumbnails immediately without reload, and update the URL parameter, code, preview reference/actual variant SKU, availability, WhatsApp text and quote context.
- Swipe/arrow-key gallery, thumbnails and a viewport-filling zoom dialog provide texture inspection. Magnification spans 100-300%; previous/next and explicit Escape handling remain accessible. Range input arrow keys adjust magnification rather than navigating the gallery.
- Main images provide loading, failure and retry states. Digital images are visibly labelled in both the normal viewer and zoom.
- Specifications use readable primary rows for composition, roll width cm, GSM, weave, pattern, filtering, lining, care and supplier reference. Unknown values say Ask for specification. Detailed identification/care/commercial information is expandable, rather than burying the primary specification table.
- Collection cards have larger 4:5 photographs, a maximum of three columns within the established page width, swatches directly under the imagery, readable descriptions and View Fabric links. Category photographs derive only from matching existing records; empty categories do not borrow unrelated photos. Blackout remains a functional collection/filter.

## Enquiries and configuration

The business WhatsApp number is still not configured locally. No number was invented. With a valid `DCORHOME_WHATSAPP_NUMBER`, an explicit click opens WhatsApp with an encoded fabric, selected shade, shade code, SKU/reference and product URL. Width and GSM are included only when supplied. Without that number, the disabled WhatsApp primary button is removed and the enabled Request a Quote form becomes primary.

Request Quote reuses the real enquiry endpoint and preserves duplicate-submission prevention, input validation, privacy consent, loading/error states and confirmed-storage success. Name, contact number, email, selected fabric/shade/reference, optional approximate metres and message are available.

Initial status checks reported WhatsApp=false, private storage=false and email delivery=false. A new ignored `.env.local` now enables private local quotation storage at `.data/showroom-local`, with a generated session secret and local HTTP cookie support. Existing configuration was not overwritten and the secret was not printed. The default local quote endpoint was then verified to persist the correct Burgundy shade/reference; its synthetic test row was removed afterward. WhatsApp and email remain unconfigured. The unavailable-storage error path was verified before enabling local persistence, and successful browser quote saves were also verified in a separate test database. Production still requires its own durable private volume/secrets, HTTPS settings, admin access and delivery configuration. Do not copy the local HTTP setting to deployment. No WhatsApp message or live email was sent.

## Verification

Passed: focused TypeScript, `npm run lint` (the project's TypeScript lint check), production build, existing prebuild asset/configuration checks, catalogue query/CSV logic, and the image checks below.

`npm run check:fabric-images` verifies all 31 selected-variant galleries exist with unique SHA-256 image content and matching manifest entries; Champagne/Emerald Green/Burgundy contain the expected RGB relationships; texture variance is retained; actual photographs outrank digital images; invalid and unsupported variant states remain explicit.

The production Chrome suite checks the exact `/collections -> Silk -> Silk Satin Study -> Champagne -> Emerald Green -> Burgundy` flow. It samples the image pixels, verifies distinct main and thumbnail paths, reference/code changes, matching WhatsApp text, same-document navigation and zero AI POSTs. It covers zoom, keyboard selection, mobile widths, image failure/retry and unchanged unknown-specification handling.

Final checks passed the production collection/detail layouts without overflow or broken images at 390/768/1440px, with screenshots visually reviewed. The compact collection header brings product cards higher on the page.

The broader isolated catalogue tests cover actual-photo switching, quotation persistence, duplicate submissions, admin validation, filters, Studio transfer and existing manual configurator scenarios. Separate unconfigured-site checks verify an enabled quote fallback and an honest unavailable-storage error, never fake success. Desktop/mobile screenshots are written to the OS temporary directory for visual review.

## Files for this phase

Created: ignored local development storage/session configuration (`.env.local`), FabricColorSelector, the fabric-images resolver, preview source configuration/generator, generated assets and manifest, image logic/browser checks, and this report.

Updated: FabricGallery, FabricDetail, FabricQuote, FabricSpecifications, CatalogueBrowser, demo catalogue palettes/asset references, category image resolution, enquiry message formatting, variant type/schema and image validation, CSV shade template, verification scripts and package commands.

No new UI, animation or image-processing dependency. Global CSS, fonts, homepage layout, and Design Studio application code were not edited in this phase.

## Remaining work

The customer-visible color/image interaction is implemented. Supplier-ready commerce content is not complete: actual variants/SKUs, supplier-approved photographs and swatches, verified composition, width, GSM, performance/lining/care and stock still need Dcorhome's supplier records. The Silk Satin Study is a demonstration, not a verified Dupioni Silk product. Photograph any precise cloth construction before representing it as a supplied product. Configure the real business number, production durable enquiry storage, administrator access and optional notification delivery before launch. Local enquiry persistence is enabled and verified in this checkout. Nothing was deployed.
