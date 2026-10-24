# Manual Curtain Visualizer

Implemented directly in `/studio`. No deployment, new paid generation, runtime AI requests, new dependencies, global stylesheet changes or fabricated supplier records.

## Completion and asset counts

| Item | Status | Delivered and remaining |
| --- | --- | --- |
| Real photographed window scenes | BLOCKED BY MISSING ASSETS | **0** verified real interiors with an aligned photographic asset kit. |
| Illustrative window preview | VERIFIED WORKING | **1** curtain-free generated architectural sample already in the repository. Its source is explicitly recorded as generated, not a real customer interior. |
| Ten genuinely different windows | BLOCKED BY MISSING ASSETS | Ten scene records exist: one illustrative sample and nine missing-asset slots. The prior six room variations share a window/camera; they were not relabelled as six genuinely different scenes. No fake thumbnails or selectable unfinished scenes. |
| Main varieties | VERIFIED WORKING for sample studies; otherwise BLOCKED BY MISSING ASSETS | Ten registered slots. Four available material studies: linen, velvet, silk satin study, textured weave. Cotton, cotton–linen, silk blend, faux silk, jacquard and chenille need textures and construction review. |
| Sheer varieties | VERIFIED WORKING for sample studies; otherwise BLOCKED BY MISSING ASSETS | Ten registered slots. Plain voile and fine voile studies are available. They use two different crops of the existing sheer reference photograph; they are not proof of two supplier constructions. Eight other varieties need suitable source assets. |
| Colours | VERIFIED WORKING | Twelve explicitly illustrative colours per supported study, separate from supplier shade IDs. All six studies can also use their existing catalogue reference shades: 27 demo shade references in total. **0 confirmed commercial products/shades** have been added. |
| Compatible combinations | VERIFIED WORKING within sample capability | One window, four main texture studies, two sheer texture studies, independent shades, either/both/neither layers. These share one prepared sample wave-drape construction. Texture, colour, opacity and sheen vary; material-specific physical drape is not claimed. |
| Comparison and download | VERIFIED WORKING | Before/After buttons, pointer drag and keyboard/touch range. Export recomposes the selected curtains at 1600 × 1200 PNG, independent of comparison position. |
| On-device save | VERIFIED WORKING | Uses existing IndexedDB design store, storing versioned configuration and timestamp, without room/result blobs. Reopen and reconstruct from immutable assets. |
| Account save | VERIFIED WORKING | Signed-in owner-linked metadata records through the existing authentication/database adapters. Guest device saves are not automatically synchronized. |
| Enquiry transfer | VERIFIED WORKING for prefilled route | Existing `/contact` receives window, layers, fabric IDs, shades, variant IDs/SKUs where genuine, and demonstration status. Official email remains sales@dcorhome.com. No business enquiry or email sent during verification. |
| Optional pleats/fullness/lining | BLOCKED BY MISSING ASSETS | Only the prepared wave sample is previewed. No ineffective selectors or unverified blackout/material claims. Advanced physical consultation remains available. |
| Scene-specific perspective/occlusion/shadows | IMPLEMENTED, NOT VERIFIED for additional scenes | Schema and compositing support normalized geometry plus optional shadow/foreground overlays. Current unobstructed sample needs no furniture mask; it reuses source-fold shading and a normalized mounting rail. No separate cast-shadow asset is supplied. |

## Components and changes

- `app/studio/page.tsx`: Studio now mounts the manual three-step flow. Ordinary visits make no calls to generation, upload or generation-status endpoints. Earlier saved private/local image previews remain viewable and downloadable, without enabling generation.
- `components/curtains/manual-visualizer/ManualCurtainStudio.tsx`: restore/save/download/enquiry, optional independent layers, responsive preview-first mobile layout, sticky desktop preview. Unsupported incoming catalogue fabrics are explicitly unrendered and retained in the enquiry; they are not silently rendered as another cloth.
- `WindowPreview.tsx`: canvas output, pointer/keyboard/touch comparison, stale-job protection and clear missing-asset errors. Retains the previous composed frame during ordinary recolouring, avoiding a flash of the empty room.
- `LayerChoices.tsx`: image material cards, six popular colours initially, all colours accessible, existing shade references and a separate demonstration palette. Missing materials are listed as unavailable.
- `ManualSavedDesigns.tsx`: existing Saved designs page integration, device/account listing, reopen, reconstructed download and owner deletion.
- `lib/manual-visualizer/manifest.ts`: ten scene records, ten main and ten sheer slots, normalized window/mount/placement geometry, explicit asset capabilities/provenance and separate preview palette.
- `lib/manual-visualizer/model.ts`: strict version/scene/material/shade validation, commercial-vs-demo separation, existing ManualConfig transfer and honest consultation summaries.
- `lib/manual-visualizer/renderer.ts`: dependency-free Canvas 2D composition and export.
- `lib/local-designs.ts`: existing design records additionally accept metadata-only manual configurations; legacy image records are retained.
- `app/api/manual-designs/route.ts`: validated account-linked save/list/delete, owner isolation, same-origin mutation validation, throttling and a 50-design limit. No changes to authentication implementation.
- `app/designs/page.tsx`: renders the new manual saved-design section alongside earlier private/local records.
- `scripts/prepare-manual-visualizer.cjs`: offline deterministic preparation, not a runtime service.
- `scripts/manual-visualizer-check.cjs`, `manual-visualizer-integration.cjs`, `manual-visualizer-browser.cjs`: focused asset/model, isolated API ownership and browser checks.
- `public/images/manual-visualizer/v1/`: one room/thumbnail, alpha/fold maps, six prepared textile-detail maps and hash/provenance manifest.

The previously edited Fabrics catalogue, product pages, homepage, approved hero, logo/navigation, About, Contact, authentication and AI provider configuration are unchanged by this task. Next's generated `next-env.d.ts` development reference is preserved after building.

## Rendering and performance

The room is drawn first, then the sheer, opaque left/right main panels, then optional scene shadow/foreground assets. Placements are normalized to the original 1280 × 960 coordinate system. The sample panel envelopes cover about 60% of the window width; the alpha silhouette makes the edges and hems organic.

Prepared alpha masks retain the largest connected cloth region, discarding isolated cutout specks. Main-panel interiors are made opaque so a sheer change cannot bleed through them. Fold maps come from the existing draped construction. The renderer does not stretch a flat swatch into a curtain: it tiles textile detail with fold-dependent UV displacement and applies linear-light colour, source-fold luminance, transparency and restrained sheen inside the cloth mask. Offline high-pass extraction removes broad lighting/folds from stock textures; mirrored tiles reduce visible seams.

The current preview is an approximation of textile appearance on a shared construction, not a calibrated physical simulator or a guarantee of supplier fibre, weave, colour or drape. Complex patterns must use actual variant-specific textures; single-colour tinting of a multicolour pattern is rejected.

Only active layer textures and the selected room decode for rendering. Other choice images use lazy loading. The decoded-image cache holds at most 16 entries; composed-layer cache holds at most four bounded canvases. Layer keys are independent, so recolouring a sheer reuses the main render. Canvas display is capped at 1200px and export at 1600px; CSS scales the common coordinate system. No thousands-of-room-combination image set and no base64 room copies in saved records.

## Asset registration workflow

1. Obtain owned/licensed curtain-free images for each missing scene. Supply the original dimensions, source/permission record and a stable versioned local path. Existing images with curtains cannot be treated as uncovered bases. No third-party imagery was downloaded for this task.
2. Measure the window plane, mounting rail, floor contact and sheer/main panel regions in the same image coordinates. Normalize x/y/width/height to 0–1. Panoramic, multi-panel and arched windows need their own compatible placement/construction kits and perspective review; do not merely reuse this sample's offsets.
3. Prepare separate main left/right or compatible mirrored construction masks, fold/normal-light maps and a translucent sheer mask for each supported construction. Alpha alone does not establish folds. The current generic fold kit is suitable only for the frontal sample study. Perspective or asymmetric rooms need an extended scene-specific kit before enabling the scene.
4. Add per-scene foreground furniture occlusion and cast-shadow overlays where needed, aligned to the same canvas. Keep uncovered bases immutable for before/after comparison.
5. Obtain separate source textures for each missing material. For embroidery, stripes and multicolour jacquard, supply actual shade-specific pattern textures; use photographic mode. Preserve supplier rights and actual shade IDs/SKUs. Do not create availability, abrasion, width, composition or GSM data to fill gaps.
6. Update the typed manifest and preparation script for the new version. Supplier mappings must explicitly use `catalogueSource: 'supplier'`; the current illustrative mappings require `source: 'demo'`, preventing accidental substitution by a supplier record with the same ID.
7. Run `node scripts/prepare-manual-visualizer.cjs` for the current sample pipeline and `node scripts/manual-visualizer-check.cjs`. Review mask boundaries, textile seams, placement and export at full size. Freeze released version directories; use a new asset version for subsequent changes so saved designs reconstruct consistently. Never overwrite released imagery in place.
8. Mark a slot available only after its complete scene/material kit passes visual review. Missing entries deliberately remain unselectable and are not counted as completed scenes or commercial inventory.

Existing source records: `scripts/manual-base-sources.json`, `scripts/manual-room-sources.json`, `scripts/fabric-preview-sources.json`, `public/images/fabrics/asset-manifest.json` and `PHOTOGRAPHY.md`. The new `public/images/manual-visualizer/v1/sources.json` records derivative paths and SHA-256 hashes. Existing Pexels permissions apply to the textile reference photographs; the architectural sample and source cutouts are recorded as previously generated assets. No Ashley Wilde media, new generated imagery or supplier authorization is asserted.

## Verification

Final outcomes are appended after the final production build and focused local run. Test users/data use an isolated temporary database; mail and AI keys are empty for the runner. Browser checks block external Google font requests so external font availability cannot stall local hydration; the application font configuration remains untouched. No extensive full-site E2E suite is used.


### Final results

- VERIFIED WORKING: npm.cmd run lint (repository TypeScript validation) and npm.cmd run build after the final renderer/model/UI edits. Existing prebuild asset, supplier, configurator and manual-configuration checks passed.
- VERIFIED WORKING: node scripts/manual-visualizer-check.cjs. Counts are honest; all derivative hashes match; source dimensions, normalized regions and 60% panel envelope coverage pass; masks/fold maps and six distinct prepared texture maps pass; all supported study/preview-colour mappings validate; unavailable scenes/materials/shades and wrong asset versions reject; existing manual IDs and consultation inspiration survive transfer.
- VERIFIED WORKING: isolated API run checks guest denial, account-linked metadata-only saving/timestamps, two-account isolation, invalid scene/shade rejection and owner-only deletion. Test data lives in a temporary directory. The empty test database migration emits its expected missing-table diagnostic before creating its isolated auth tables. No production customer data or email touched.
- VERIFIED WORKING: one focused Chrome journey checks independent layer pixel changes, main-only/sheer-only toggles, unchanged room pixels, different material pixels, pointer and keyboard comparison, a 1600x1200 PNG containing the configured curtains rather than only the room, responsive layouts without overflow at 360/390/768/1024/1440, preview-first mobile ordering, local save/list/reopen, selected shade preservation, demo-labelled consultation URLs and zero AI requests.
- VERIFIED WORKING: incoming unsupported Blackout reference is explicitly unrendered; its original selection remains in the consultation URL. Saved Design Composer direction/pattern/room inspiration is kept as consultation metadata and explicitly not represented by the sample geometry.
- VERIFIED WORKING: node scripts/check-homepage-hero.cjs; all 113 protected hero dependencies are unchanged. git diff --check passes. Earlier Fabrics work is preserved.
- Desktop and 390px screenshots inspected in .data/manual-visualizer-verification/studio-1440.png and studio-390.png. These show synthetic test selections, not supplier stock.
- IMPLEMENTED, NOT VERIFIED: physical-device touch behavior, additional scene-specific/asymmetric construction kits, optional foreground/shadow assets and PostgreSQL execution (no separate PostgreSQL instance available). Native touch controls/pointer handling are implemented; responsive Chrome emulation is not a physical-device test.
- BLOCKED BY MISSING ASSETS: ten real photographed windows, fourteen additional material kits, supplier shade/stock data, manufacturer-specific drapes and alternative heading/fullness/lining render kits. These are not counted as completed previews.
- No new library, paid image generation, runtime AI request, business enquiry or deployment. All verification servers were stopped by the runner.

Reproduce the focused checks:

    node scripts/manual-visualizer-check.cjs
    npm.cmd run lint
    npm.cmd run build
    $env:DCORHOME_MANUAL_BROWSER='1'
    node scripts/manual-visualizer-integration.cjs

The integration script owns a local production server on port 3231 and uses isolated temporary storage. The browser portion performs the single Studio journey described above; it does not run a full-site E2E suite.
