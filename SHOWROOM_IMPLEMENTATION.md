# Curtain showroom implementation

Implemented in the existing project; no deployment and no new project.

## Changed files

- `lib/curtains/manual-config.ts`: panel count, length and fullness; centralized compatibility validation, catalogue-backed patterns, summary with variant references, URL transfer and storage migration defaults. Corrupt non-object storage is ignored.
- `components/curtains/CurtainConfigurator.tsx`: additional controls, live summary, catalogue-specific options, prefilled quotation link and explicit sample/upload links. Initial values are normalized against imported records.
- `components/curtains/ManualPreview.tsx`: independent local luminance/alpha color composition, single/pair panel visibility, loading/error states and cached image hydration handling. Removed procedural fake weave, velvet, stripes and heading treatments.
- `components/curtains/CatalogueBrowser.tsx`: technical values and SKU cards use records rather than unconditional pending text.
- `components/curtains/FabricDetail.tsx`: Design Curtains With This Fabric CTA, explicit demo variant identification.
- `lib/server/catalogue.ts`: published collection names, descriptions and photographs derive from the same fabric records as the configurator. Existing admin overrides remain available.
- `app/studio/page.tsx`: upload-mode length/fullness controls update the serialized manual selection as well as the AI preferences.
- `scripts/manual-config-check.cjs`: additional validation and serialized round trips for all panel/length/fullness choices.
- `scripts/manual-browser-scenarios.cjs`: panel output, length/fullness transfer, quotation summary and honest unsupported heading checks; longer development navigation wait.
- `scripts/browser-check.cjs`: per-command timeout and safe handling of late debugging responses.
- This report is the only new file. No image assets were added.

## Existing capabilities reused

Independent main/sheer fabrics, compatible palettes and headings, layer switches, six room photographs, local persistence, sample/upload Studio modes, search, layer/category/color-family filters, optional technical filters, fabric detail variants, and the real enquiry endpoint remain in place. Detail selection transfers the exact fabric and color while retaining the other layer. The quotation CTA prepopulates the existing contact form; the customer supplies contact details and submits it. No enquiry was submitted during testing.

## Catalogue model and supplier intake

`lib/curtains/catalogue.ts` defines FabricRecord and FabricVariant. Stable IDs, usage, source, variant references, color families, images, compatible headings, optional technical and commercial fields are separate. `supplier-catalogue.json` is currently empty; six explicitly marked demo records are used instead. No supplier names, widths, GSM, composition, prices or inventory have been invented. Missing technical fields remain pending.

For later CSV/Excel intake, map one fabric row to a FabricRecord and join color rows by stable fabric ID into its colors array. Map only verified columns to optional fields. The existing JSON schema and supplier validation command provide the target structure and asset checks; there is no Excel/CSV uploader yet. Imported supplier records must cover both layers and include selectable variants. Fabric patterns are taken from the record; absent pattern information permits only the demo solid study.

## Preview scope and assets still required

Existing `public/images/curtains/manual/` contains six sample rooms plus transparent main and sheer reference layers. Canvas preserves source luminance and alpha while changing each layer color independently. Single panels hide the right reference panel; pair shows both. Room pixels are not recolored. Controls do not request paid AI rendering.

These are generic reference drapery studies, visibly labelled visual approximations. They are not verified renders of the chosen fabric. Headings, material construction, pattern, length and fullness update the saved design and its visible summary, but their exact appearance is unsupported and explicitly disclosed beside the preview. There is no claim of full realistic configurator completion.

Required for accurate previews: matched camera/rail/window registration for every room; cleaned high-resolution alpha masks without edge halos; separate main and sheer shading/transmission maps; supplier-specific weave/texture maps and color swatches or photographic variants; heading-specific geometry or photographs; single/pair, length and fullness variants for combinations advertised as rendered. Asset preparation and alignment must be visually reviewed per room. No synthetic material maps are substituted.

## AI rendering

The existing optional uploaded-room generation flow and provider route remain. Manual configuration carries length/fullness and the serialized panel choice to Studio and its generation payload. The provider status endpoint currently reports configured=false. No live AI render was requested, and none is claimed verified. Credentials and a real uploaded-room acceptance test are still required.

## Verification

- Focused TypeScript check: passed (`npx.cmd tsc --noEmit -p tsconfig.build.json`).
- Prebuild checks: asset validation, legacy selector compatibility, supplier schema/demo separation and manual configuration invariants passed.
- Headless Chrome against the local development app: passed independent main/sheer pixel changes, palette compatibility, unsupported heading disclosure behavior, toggles, six rooms, single/pair pixel changes, length/fullness serialization, quotation URL contents, local persistence, refreshed Studio URL, exact detail-to-Studio color handoff, mobile filter drawer and empty state.
- Responsive checks: 390, 768, 1024 and 1440 px; sample/upload Studio, collection and details checked for overflow and broken images. Mobile preview screenshot visually reviewed.
- Route smoke checks: homepage, collection and detail, sample/upload Studio, contact, measurement, how-it-works, inspiration, saved designs, privacy, terms, catalogue API and provider-status API returned 200.
- Final production build passed after cached-image and wording fixes (23 static pages generated; all App Router routes compiled).
- No deployment. No live AI generation or real enquiry submission tested.

## Exact next task

Obtain one verified main fabric and one verified sheer fabric with variant SKUs, supplier specification sheets, color swatches and an aligned room/layer asset set. Import the records and validate the first fabric/color/heading/length/fullness combination visually before marking it preview-supported. Extend the asset coverage manifest only as each combination is verified.
