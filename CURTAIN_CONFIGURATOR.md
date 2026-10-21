# Curtain configurator implementation

Historical report: the prepared-look component described below has been replaced by the [manual layered configurator](MANUAL_CURTAIN_CONFIGURATOR.md).

The homepage composer and Studio now share a data-driven curtain configurator. Existing fonts, branding, API security and curtain comparison interactions are preserved. Styling stays in Tailwind classes in TSX; no component rules were added to globals.css. Nothing was deployed.

## Files and data

- `components/curtains/CurtainConfigurator.tsx`: reusable controls, photographic preview, prepared-look thumbnails, live summary and Studio links.
- `components/interactive/DesignComposer.tsx`: homepage section containing the configurator.
- `lib/curtains/types.ts` and `configurator-data.ts`: six configuration fields, seven headings, seven illustrative materials, ten main colors, six sheer colors, six rooms, six patterns, compatibility and deterministic preview matching.
- `lib/design-options.ts`: optional configurator material, heading and sheer-color fields carried with existing design selections.
- `app/studio/page.tsx`: sample/upload modes, query prefilling, independent material and sheer controls, configuration transfer and generation payload.
- `app/api/visualize/route.ts`: validates material/heading/color/pattern and includes both colors, material, heading, pattern and room in the existing image-edit prompt and persisted options.
- `scripts/configurator-check.cjs`, `browser-check.cjs`, `api-check.cjs`, `provider-fixture.cjs`: asset/model, browser and isolated provider verification. `package.json` runs asset/model validation before dev and build.

## How previews work

Ten distinct complete photographic illustrations are stored in `public/images/curtains/`, with matching thumbnails. Main images are 1440 by 1080 WebP, approximately 195–303 KB each; thumbnails are 320 pixels wide. They are original AI-generated illustrations made with the built-in image generation tool, copied into the project and encoded locally. Full generation prompts and original output paths are recorded in [curtain-image-sources.json](scripts/curtain-image-sources.json).

**Instant prepared looks** chooses a complete supported photographic combination. Changing a valid selector changes the actual image, and linked options update to describe what that image shows. All listed styles, materials, colors and rooms are represented across the ten assets. These are illustrative material choices, not assertions of stocked inventory.

**Custom combination for AI** preserves independent choices and displays the nearest prepared example. The UI explicitly labels approximate previews and lists the combination actually shown. There is no exhaustive rendering of every possible combination; a custom change can retain the same nearest image. Physical swatches remain necessary for color and material approval.

Pattern compatibility is enforced in controls, normalized when material changes, and validated again by the generation endpoint. No CSS rectangles or color overlays simulate curtains.

## Studio and API

Both homepage actions pass all six choices through query parameters. Visualize My Curtains opens sample mode; Upload My Room opens upload mode. Switching modes and uploading a room preserve the choices. Existing saved-design, private-image, download, sharing and consultation flows retain their behavior.

Own-room generation uses the existing server-only provider integration. Layered requests explicitly describe the main curtain color and separate sheer color; single-layer requests do not add an unwanted sheer. No new API keys, provider models, dependencies or deployment settings were introduced.

The normal local environment does not have live AI/persistence fully configured. Provider wiring was verified using an explicitly isolated mock provider and temporary storage; no paid image-generation or real email request was made. Live output quality and provider availability therefore remain unverified.

## Verification

- Production build and its TypeScript checks: passed.
- Data/asset checks: ten unique image contents, existing thumbnails, compatible patterns, image changes for prepared selectors and complete Studio conversion roundtrips passed.
- Isolated API and browser fixture: generation prompt fields, upload decoding, result rendering, persistence, private ownership, save/history/reopen, download, sharing/revocation, quotas and admin flow passed using a mock provider.
- Responsive browser suite: 15 route/mode templates at 360, 390, 768, 1024 and 1440 pixels passed layout and asset checks (75 combinations). This covers homepage, collections/detail, both Studio modes, measurement, consultation and supporting pages.
- Interaction checks passed: actual main/sheers/style/material/room/pattern image swaps, compatibility, query handoff, comparison autoplay/pause/resume, mouse/touch/keyboard controls, mobile navigation/focus, catalogue filters, Studio upload/heading, local history, measurement and consultation error handling. No browser runtime exceptions were observed.
- `npm run lint`: passed.

Development and production retain separate `.next-dev` and `.next` output directories. Only one development process should run for this project at a time.
