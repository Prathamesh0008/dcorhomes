# DCORHOME Studio rebuild — implementation and verification

This rebuild replaces the customer-facing `/studio` experience. It does not add a second visualizer. The source package remains at `assets/dcorhome-manual-visualizer/`, intact. The approved homepage, hero, navbar/logo, catalogue/product layouts, About, Contact and authentication code were not changed during this rebuild. No AI service was called or activated, and nothing was deployed.

## What was wrong

The previous layout gave a long catalogue of room/fabric cards priority over the composition. Mobile visitors had to pass excessive introduction/secondary copy to reach their controls. Color and fabric selection information was repeated across bordered panels. Swatches were tiled abruptly, their baked lighting competed with the prepared folds, and strong grain obscured drape depth. A texture change was visible but did not convincingly preserve the appearance of folded cloth.

Most supplied room overlays still fail image-quality validation: equal dimensions and numeric geometry do not establish correct window alignment or furniture segmentation. That problem cannot be repaired by a better layout or a colored overlay.

## Customer experience

- Desktop: a roughly 65/35 split, with the room preview on the left and three compact selection areas on the right. The preview stays visible while scrolling through the controls.
- Mobile/tablet: preview first, controls below, comfortable touch targets, contained horizontal image rails and no page overflow.
- Exactly three primary areas: **Where shall we begin?**, **Let the light in.**, **Add the finishing touch.** Only the chosen area expands. Selected values remain visible in the collapsed headings.
- Ten supplied room thumbnails show the actual source scenes, plus a separate, explicitly named garden sample for live fabric studies. There is no silent scene substitution.
- Fabric selectors use actual textile images. Six initial shades are shown, with View all colours for the remainder. A previously selected shade remains visible. Changing the material retains its shade ID where compatible and never resets the other curtain layer.
- One restrained Before/After toggle compares the exact same base with the current composition. Redundant sliders, developer-facing construction text, repeated warning cards and duplicated customization controls were removed.
- Selected fabric thumbnails are brought into view horizontally without scrolling the page away from the preview.

## Components replaced and separated

- `components/curtains/manual-visualizer/ManualCurtainStudio.tsx`: new page composition and three-area navigation.
- `RoomChoices.tsx`: compact room image rail and explicitly separate live-sample choice.
- `LayerChoices.tsx`: fabric rails, Yes/No layer inclusion and expandable shade selection.
- `WindowPreview.tsx`: comparison, current-frame readiness, scene/aspect preservation, responsive rendering, safe asset fallback and retry.
- `DesignReview.tsx`: concise selected configuration, primary **Enquire About This Design**, download and guest/account save actions.
- `StudioImage.tsx`: missing-image fallback that never substitutes a different room or textile.
- `useVisualizerConfiguration.ts`: restore from device/account/URL/catalogue links, persistence and legacy preview access.
- `useDesignActions.ts`: save/download behavior and object-URL cleanup.
- `useSelectionRail.ts`: horizontal selection visibility and observer cleanup.
- `lib/manual-visualizer/configuration.ts`: immutable layer/room reducer, separate from customer UI.

Existing account endpoints, local design storage and enquiry routing are reused. The original catalogue records remain the source for actual product selections; library study IDs remain a separate demonstration namespace without invented SKU, price or stock claims.

## One rendering architecture

`types.ts` defines reusable `RoomScene`, `CurtainLayer`, `FabricMaterial`, catalogue-compatible `FabricVariant`, `VisualizerConfiguration` and `RenderCapability` types. The existing manifest and prepared geometry remain the foundation.

`renderer.ts` is the single compositor used by both preview and download:

1. Resolve and validate the chosen scene, material and shade. A conservative capability gate rejects unapproved scene overlays even if filenames exist.
2. Decode only required same-origin inputs through a 32 MiB / 16-entry LRU image cache. Failed decodes are removed so retries can recover.
3. Sample the supplied neutral fold photographs and prepared silhouettes at the scene's normalized placement. Read coverage from luminance unless a layer explicitly declares alpha encoding.
4. Preserve the selected shade's representative color and real swatch detail. Local textile normalization removes broad lighting already baked into the illustrated swatch; the neutral curtain folds now supply the drape lighting.
5. Mirror texture repeats at boundaries and displace their sampling with the fold gradient. This avoids the old abrupt tiling seam and avoids stretching a square swatch into a panel. Patterned fabrics retain their illustrated pattern contrast; woven, velvet and silk studies have restrained detail responses.
6. Multiply sheer coverage by its actual supplied opacity map and fold density. Main and sheer selections remain independent.
7. Composite base → track → sheer → left/right main → optional scene shadow → optional foreground occlusion. Do not draw unsupported room masks or faulty furniture cutouts.

Completed layers have a separate 24 MiB / 6-entry cache. Resize observation is debounced. Abort signals, sequence tokens, current configuration keys and output-width readiness prevent stale work from replacing a newer selection or enabling an outdated export. Temporary Canvas surfaces are released after use. Observers, animation callbacks, download URLs and restore requests are cleaned up.

The saved asset version remains `manual-v1`; the serialized renderer version is **`atelier-2`**. Previous saved configurations without a renderer version are migrated on validation. Unknown future renderer versions are rejected clearly instead of being silently misinterpreted.

## Rooms that genuinely work

| Scene | Available behavior | Limitation |
| --- | --- | --- |
| Existing garden room | Live illustrative drape; independent sheers/main, all library shades, comparison and composition export | Generated architectural sample and illustrative fabrics, not calibrated supplier photography |
| Room 01 — Modern living room | Actual base image, room selection, retained fabric choices, save/enquiry | Supplied fold/panel assets and foreground cutouts need correction before an accurate curtain preview |
| Room 09 — Minimalist living room | A genuinely different actual base, retained choices, save/enquiry | Same prototype cutout/fold limitations |
| Rooms 02–08 and 10 | Actual source concept views, room selection, retained choices, save/enquiry | Upscaled concept-sheet crops, existing curtains in some bases, estimated geometry and empty foreground segmentation |

**No claim is made that the ten supplied rooms have working accurate overlays.** Downloads and comparison are withheld for those room-only views. One concise explanation and an explicit link to the garden sample preserve a graceful journey without pretending another room is the selected room.

For Rooms 01/09, replace/correct the panel silhouettes, neutral fold lighting and furniture segmentation. For the other eight, first provide independent curtain-free bases at useful native resolution, then remake the aligned window, panel, fold and foreground assets, including separate planes for corner/multiple/arched windows. Supplier-calibrated weave scale, transmission and shade photographs are still required before claiming exact commercial fabric appearance.

## Fabrics, shades and visually inspected combinations

All ten supplied sheer varieties and ten main varieties are registered through the existing library adapter. Each has ten actual shade textures: **200 individually resolved shade assets**. Plain/fine voile, linen/cotton/organza/embroidered/net/textured/striped/jacquard sheers and pure linen/cotton/cotton-linen/velvet/silk/silk-blend/faux-silk/jacquard/chenille/textured-polyester main studies remain available.

Visually inspected browser compositions:

- [A — ivory plain voile with olive-green pure linen](A-ivory-voile-olive-linen.png).
- [B — white fine voile with burgundy velvet](B-white-voile-burgundy-velvet.png).
- Sheer shade change with main selection unchanged; main fabric/shade changes with sheer unchanged; sheers disabled with main curtains retained.

Every shade path is validated and decoded during preparation. The two compositions above are visually inspected examples, not a claim that every possible pairing has been individually judged photorealistic. All library colors are illustrative and require a physical sample.

## Optimized delivery assets

`scripts/prepare-studio-runtime.cjs` creates `public/images/manual-visualizer/atelier-v2/` from source pixels, without changing originals or the prior delivery namespace. It publishes only the ten bases, their ten thumbnails, twenty fabric masters, two hundred shades and ten opacity maps required by this experience. Unsupported room layers and draping-reference photographs are not served as fake compositions.

There are 250 delivery images. Room bases are viewport-appropriate WebPs, swatches/opacity maps are lossless WebPs at the 256px sampling resolution, and selector thumbnails remain 480px WebPs. Prepared inputs totaling **85,092,670 bytes** become **12,571,094 bytes** including thumbnails, about **85% smaller**. This is a complete library size, not an initial-load payload. Browsers load the current scene, selected texture inputs and lazy selectors rather than all 200 shades at startup.

## Download, saving and enquiry

- **Download Design** uses the same renderer and current configuration at 1600px width. It contains the curtain composition, not only the base. Unsupported compositions are rejected inside the renderer as well as disabled in the UI. The focused browser check compares the exported PNG with the displayed composition after resolution scaling.
- **Save Design** retains the existing account/guest behavior. Explicit **Save on this device** is available if account storage is unavailable. Saved data includes room, both independent material/shade selections, enabled flags and asset/renderer versions. Prior supported catalogue and saved IDs remain valid.
- **Enquire About This Design** carries the actual chosen scene, materials, shade IDs, enabled flags and illustrative/unrendered status into the existing Contact route. It does not submit an enquiry automatically or claim stock availability. The official email remains `sales@dcorhome.com`.
- Signed-in account writes and real enquiry submission are not performed during verification; shared server validation and the reused endpoints are preserved.

## Verification and opening

Open `/studio` on the local server. Choose the garden sample to see live fabric changes, or explore each of the ten source room views. No instructions are required to move among the three selection areas.

- `npm.cmd run lint`: TypeScript check.
- `npm.cmd run build`: production compilation, type checking and existing prebuild validators.
- `node scripts/visualizer-library-check.cjs`: 200 shade paths, immutable selection reducer, room capability gates, saved-version migration, repeat continuity, fold lighting and original runtime-copy hashes.
- `node scripts/studio-rebuild-smoke.cjs`: focused disposable-Chrome check, without Playwright or new dependencies. Covers all ten actual room views, independent layers, unchanged background pixels, Before/After source identity, export fidelity, device save/restore, 390/768/1440px layouts and an intentionally blocked texture followed by recovery. It also checks missing images, browser exceptions and AI requests.

Rendered evidence: [1440px desktop](studio-1440.png), [768px tablet](studio-768.png), [390px mobile](studio-390.png), [browser results](results.json), [delivery sizes](runtime-assets.json), and the actual [downloaded PNG](dcorhome-curtains-garden-living.png).

Final results: TypeScript and production build **passed**. The focused production-browser check **passed** with ten distinct room views, independent layers, zero changed pixels outside the curtain footprint, successful guest save/restore, and missing-texture failure/recovery. The 1600 × 1200 PNG differs from the displayed composition by a mean of **1.24 RGB levels out of 255** after resolution scaling. No page overflow at any of the three tested widths; no broken images, browser exceptions, HTTP errors or AI requests. All 374 original package files were rehashed against the audit inventory and remain unchanged.

The earlier integration report describes the superseded interface. This report and the associated rendered results describe the rebuilt experience.
