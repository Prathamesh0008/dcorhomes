# DCORHOME manual visualizer asset audit

Audit date: 26 October 2026. Source: `assets/dcorhome-manual-visualizer/`.

**Decision: NEEDS CORRECTION before integration. Zero production-validated rooms.** Ten structurally complete room sets decode; two are usable only for technical experiments after resolving paths, and eight are explicitly provisional. No application, original asset, authentication, catalogue, homepage, environment setting or AI integration was changed. No deployment or external AI call was made.

## 1. Scope and evidence

Read the supplied README, manifest, quality report, demo and all ten geometry records. Independently decoded all **360 images** among **374 files**, checked file hashes/metadata against the inventory, sampled complete image statistics, inspected room/geometry and fabric contact sheets, executed the demo JavaScript against a DOM stub, and exported two fresh composites from actual source pixels.

- [Machine-readable asset evidence](evidence.json): every actual file, hash, dimensions, mode, channel ranges, alpha counts, geometry, duplicate groups and composition differences.
- [Demo execution evidence](demo-evidence.json): presets, all selector values, requested paths and missing files.
- [Room alignment contact sheet](room-alignment-contact-sheet.jpg): original bases beside window/track/curtain overlays.
- [Fabric contact sheet](fabric-contact-sheet.jpg): master plus ten shades for each of twenty varieties.
- Scripts: `scripts/audit-visualizer-assets.py` (Pillow) and `scripts/audit-visualizer-demo.cjs` (Node built-ins). Run from the repository root. Outputs are isolated here; sources are read only.

Status vocabulary: **VERIFIED WORKING** means a stated check passed, not production approval; **NEEDS CORRECTION** means a concrete defect; **MISSING** means a required file or capability is absent; **NOT TESTED** identifies evidence not obtained.

## 2. Reports versus actual inventory

**VERIFIED WORKING:** All actual images decode without error. All ten room directories contain twelve files representing the eleven image roles plus geometry. All scene images are 2048 × 1280. All twenty fabric varieties have masters and ten shades.

**NEEDS CORRECTION:** The manifest lists 369 assets plus itself (370 total), but the directory contains 374 files. **262 listed WebP paths are absent**: 230 fabric images, 22 images for rooms 01/09, and ten draping references. Same-stem PNG alternatives exist. **266 actual files are unlisted**: those 262 PNGs plus four original PNG composition previews. Matching filenames after extension substitution do not establish matching checksums or byte-for-byte preservation. Listed files that do exist match the audited hash, size and image metadata checks.

The quality report's `file_count: 370`, `manifest_references_all_exist: true`, `errors: []`, and claim of unchanged original-file hashes do not validate this actual package. Its Room 01 `base.webp` hash is not the actual `base.png` hash. The earlier ZIP is unavailable, so historical preservation is **NOT TESTED**. No attempt was made to rename sources or manufacture the missing WebPs.

The README correctly discloses eight concept-sheet crops, estimated geometry, unresolved foreground masks and illustrative fabrics. Its assertion that the demo accepts all materials does not mean their images load. Its broad statement about transparency must be distinguished from the actual opaque luminance masks and intentionally empty overlays.

## 3. Room-by-room results

Counts: **10 structurally complete / decodable sets; 2 technical prototypes needing corrections; 8 provisional sets unsuitable for customer previews; 0 production-validated rooms.** All numeric geometry coordinates are finite, ordered and in [0,1], and canvas declarations match image dimensions. This proves coordinate validity, not image alignment.

| Room | Actual image format / native source | Visual and alignment finding | Result |
| --- | --- | --- | --- |
| 01 | PNG; generated 1586 × 992 source, upscaled | Base appears curtain-free. Window bounds broadly match the opening. Flat panels extend to foreground rug; furniture segmentation creates square holes, hard notches and retained colored fragments on the table. Demo expects missing WebPs. | NEEDS CORRECTION; technical prototype |
| 02 | WebP; 390 × 189 crop | Existing dark drapes baked into base. Estimated mask spans bed/bench; foreground overlay empty. Upscaled concept image. | NEEDS CORRECTION; provisional |
| 03 | WebP; 393 × 189 crop | Existing left drape, multiple corner window planes, dining furniture and pendant lights. A single rectangular front-facing mask does not follow perspective and covers furniture. Empty occlusion. | NEEDS CORRECTION; provisional |
| 04 | WebP; 393 × 189 crop | Existing right drape. Sliding doors have sloping perspective; flat mask/track do not follow it and extend across foreground furnishings. Empty occlusion. | NEEDS CORRECTION; provisional |
| 05 | WebP; 393 × 185 crop | No obvious existing drapes at contact-sheet scale, but three arched openings require separate geometry. One rectangle covers walls between openings and furniture. Source-sheet border visible. Empty occlusion. | NEEDS CORRECTION; provisional |
| 06 | WebP; 392 × 185 crop | Existing pale drapes; geometry spans bed in foreground. Source-sheet borders remain. Empty occlusion. | NEEDS CORRECTION; provisional |
| 07 | WebP; 392 × 185 crop | No obvious drapes at contact-sheet scale; corner glazing needs multiple perspective planes. Straight track and flat mask do not follow the room and cross furniture. Source-sheet artifacts visible. Empty occlusion. | NEEDS CORRECTION; provisional |
| 08 | WebP; 393 × 185 crop | Existing pale curtains; office desk/chair overlap curtain footprint. Source-sheet artifacts visible. Empty occlusion. | NEEDS CORRECTION; provisional |
| 09 | PNG; generated 1586 × 992 source, upscaled | Base appears curtain-free. Window bounds broadly match opening. Prototype floor-length masks cross furniture and rug; segmentation still needs manual inspection/cleanup. Demo expects missing WebPs. | NEEDS CORRECTION; technical prototype |
| 10 | WebP; 312 × 178 crop | Existing burgundy curtains and white sheers are baked into base. Mask/track fail to follow balcony-door extent/perspective and cannot replace existing curtains. Empty occlusion. | NEEDS CORRECTION; provisional |

All actual curtain/track layers have RGBA storage, usable nonempty alpha support and correct canvas dimensions. All eight provisional foreground overlays have alpha **0 everywhere**; corresponding masks are black everywhere. This is missing segmentation rather than a successful occlusion check. Room 01/09 foreground overlays intersect the curtain footprints at **224,518 / 239,920 pixels** respectively; overlap is expected for furniture, but visual inspection of Room 01 demonstrates incorrect segmentation. Correct physical curtain placement, provenance of actual photography and photorealistic folds have **not passed**.

## 4. Fabrics and colors

**VERIFIED WORKING:** Ten sheer varieties × ten decoded, distinct shade files = **100 valid illustrative shade files**. Ten main varieties × ten = **100 valid illustrative shade files**. Each variety also has a master; each sheer has an opacity map. All **230 fabric images are 1024 × 1024 PNGs**. Every master/shade has nonzero image variation; within each variety the ten shade hashes are distinct and mean colors differ. Visual inspection shows different synthetic weave/pattern treatments, not evidence of measured supplier textiles.

| Layer | Variety | Master / shade files | Notes |
| --- | --- | --- | --- |
| Sheer | Plain voile | 1 / 10 valid | Fine illustrative noise weave; opacity map constant 77/255 |
| Sheer | Fine voile | 1 / 10 valid | Subtler weave; opacity 68/255 |
| Sheer | Linen sheer | 1 / 10 valid | Stronger directional slub; opacity 100/255 |
| Sheer | Cotton sheer | 1 / 10 valid | Soft noise weave; opacity 108/255 |
| Sheer | Organza sheer | 1 / 10 valid | Diagonal pattern; opacity 59/255 |
| Sheer | Embroidered sheer | 1 / 10 valid | Repeated motif; opacity 92/255 |
| Sheer | Net sheer | 1 / 10 valid | Fine open structure; opacity varies 0–215/255 |
| Sheer | Textured sheer | 1 / 10 valid | Coarser illustrated weave; opacity 91/255 |
| Sheer | Striped sheer | 1 / 10 valid | Repeated vertical stripes; opacity 89/255 |
| Sheer | Jacquard sheer | 1 / 10 valid | Repeated grid motif; opacity 100/255 |
| Main | Pure linen | 1 / 10 valid | Horizontal slub |
| Main | Cotton | 1 / 10 valid | Subtle noise |
| Main | Cotton-linen blend | 1 / 10 valid | More textured noise/slub |
| Main | Velvet | 1 / 10 valid | Strong directional grain; obvious seams when tiled |
| Main | Silk | 1 / 10 valid | Diagonal synthetic highlights baked into swatch |
| Main | Silk blend | 1 / 10 valid | Softer diagonal highlights baked into swatch |
| Main | Faux silk | 1 / 10 valid | Vertical synthetic highlights baked into swatch |
| Main | Jacquard | 1 / 10 valid | Repeated geometric motif |
| Main | Chenille | 1 / 10 valid | Coarser noise |
| Main | Textured polyester weave | 1 / 10 valid | Fine subtle texture |

Sheer shade IDs: pure-white, soft-ivory, cream, champagne, sand, light-beige, warm-grey, pale-blue, sage-green, blush. Main IDs: ivory, champagne, sand-beige, taupe, mocha, sage-green, olive-green, navy-blue, burgundy, charcoal-grey. Naming within directories is consistent; the demo/manifest extension naming is not.

No fabric image has an alpha channel or palette transparency. Shade PNGs are indexed opaque color images; masters/opacity maps are grayscale. The material opacity maps must be sampled as scalar luminance, not image alpha. The demo ignores all ten variety-specific opacity maps and applies the same 0.37 opacity to every sheer. That prevents accurate net openings and variety-dependent transmission.

**NEEDS CORRECTION:** Flat tiles can be clipped to the supplied silhouettes, as demonstrated, but seamless tiling, physical pattern scale, fold-dependent UV displacement and material-dependent lighting are not established. Baked swatch highlights may conflict with scene folds. **NOT TESTED:** real stock availability, calibrated color, physical fabric scale/transmission, seam-free production maps, supplier fidelity. These are demonstration records, not verified commercial variants.

## 5. Transparency, masks and geometry

**VERIFIED WORKING:** Room 01/09 masks are single-channel `L` PNGs, **without alpha**. Other room masks are `RGB` WebPs, **without alpha**. Curtain/window masks span luminance 0–255. Read black as outside and white as inside, with gray edge coverage. Direct Canvas `drawImage(mask)` followed by `destination-in` would use opaque image alpha and fail to clip the curtain; explicitly convert luminance to coverage alpha first. CSS uses `mask-mode:luminance`, which is the intended encoding; browser-specific behavior remains unverified here.

Room 01/09 sheer layer alpha ranges 0–99, main alpha 0–248, track/foreground alpha 0–255. Provisional sheer alpha ranges 0–81, main 0–247, track 0–225, foreground 0–0. Alpha existence does not demonstrate a correct cutout. The transparent layers combine lighting/color and coverage; they are not separately calibrated neutral fold maps, normal maps or UV maps.

**NEEDS CORRECTION:** Synthetic straight panel silhouettes do not produce credible hanging folds. Geometry must be rebuilt from actual openings, not inferred from equal image dimensions. Multiple windows/corner planes and arches require explicit scene-specific treatment. Foreground masks must preserve furniture without leaking fragments of background through curtains.

## 6. Fresh same-room compositions

- [Test A: Room 01 / soft-ivory plain voile / olive-green pure linen](test-A-ivory-voile-olive-linen.png).
- [Test B: Room 01 / pure-white fine voile / burgundy velvet](test-B-white-sheer-burgundy-velvet.png).

Both are **new, lossless 2048 × 1280 PNG exports**, using the same actual `rooms/room-01/base.png` (SHA-256 `64f7f25f85927542b7ba5ca929cfb3511958df0893576b9b80e1fd081b3aa6f1`). They use actual texture files, luminance scene masks, supplied translucent lighting layers and unchanged track/foreground overlays. No unrelated completed room image or supplied proof image was substituted.

The offline Pillow compositor approximates the demo's 260 × 500 tiled texture, 0.37 sheer/0.96 main opacity and 0.22 multiply-lighting stack, with actual PNG paths. These exports are **not browser screenshots or pixel-equivalent CSS captures**; browser texture scale depends on displayed scene size. They demonstrate what the source inputs can support after path resolution.

| Check | Measured result | Assessment |
| --- | --- | --- |
| A versus B | 1,057,304 pixels differ; 0 outside union of curtain masks | VERIFIED WORKING: same base and placement |
| Sheer color only, other inputs fixed | 632,805 pixels differ; 0 outside curtain mask union | VERIFIED WORKING: actual pixel change, independent of main selection |
| Main color only, other inputs fixed | 563,502 pixels differ; 0 outside curtain mask union | VERIFIED WORKING: actual shade change |
| Main variety only at same shade | 554,925 pixels differ; 0 outside curtain mask union | VERIFIED WORKING: actual texture/material change |
| Main color/texture visible | Olive slub versus burgundy directional grain | VERIFIED WORKING for illustrative changes |
| Sheer transmission | Background remains visible | VERIFIED WORKING for coarse constant-opacity preview |
| Realistic folds/lighting | Panels look flat; tiled velvet has horizontal seams | NEEDS CORRECTION |
| Correct foreground occlusion | Hard square holes, furniture-edge notches, color fragments on tabletop | NEEDS CORRECTION |

The architecture supports independent 2D material changes, but **does not meet the requested realistic-fold/occlusion result**. Needed: corrected foreground segmentation, production panel contours, neutral fold/shading maps, seamless/material-scaled textures and fold-aware mapping. More detailed sheer opacity treatment is also needed. There is no need for runtime AI to implement those features once assets exist.

## 7. Interactive demo

**VERIFIED WORKING by source inspection and JavaScript execution:** Ten rooms, ten sheer varieties, ten main varieties, ten colors per layer, five change listeners, and two functional preset handlers. It constructs paths to scene assets and shade textures and changes actual `src`, `backgroundImage`, and `maskImage` properties. This is intended real CSS layer composition, not selection among pre-rendered room photographs. No AI/network generation call is present. `geometry.json`, `window-mask`, material opacity maps and draping-reference images are not consumed.

**NEEDS CORRECTION:** Exhaustive selector-path enumeration found **290 distinct requested image URLs; 218 are absent**: all 200 shade WebPs plus nine requested room images for each of rooms 01/09. PNG alternatives exist for all 218. The other eight bases load by path, but none of their material shade textures does. Default preset A therefore requests a missing base as well as missing curtain inputs. UI state changes cannot be counted as a successful visible render. The demo has no load/error gating, decode cache, atomic scene transition or render completion state; fast changes can mix old and new images.

**NOT TESTED:** Successful browser CSS rendering, mobile rendering, interactive responsiveness, performance timing, Safari mask support and Canvas export. A minimal local Chrome headless smoke attempt failed to produce a screenshot in this environment (GPU/context failures / stalled process). No extensive browser E2E suite was run. Node DOM-stub results validate event wiring and file paths only.

## 8. Performance

Package size: **122,044,016 bytes (116.4 MiB)**, not the README's historical 14 MB ZIP size. Rooms account for 20.8 MB, fabrics 76.9 MB, previews 16.8 MB and draping references 7.3 MB (decimal MB).

- Largest individual assets: room-01 foreground PNG 3.84 MB; room-09 foreground 3.73 MB; bases 3.45/3.36 MB. Large full-canvas overlays carry sparse coverage; derivative transparent crops plus offsets could reduce decode/memory cost.
- Every 2048 × 1280 RGBA image consumes about **10 MiB decoded**, independently of compressed size. Nine simultaneously decoded room images can approach 90 MiB before surfaces and textures. Ten eagerly decoded scenes would be wasteful.
- Fabric textures are 1024²; two selected RGBA textures consume about 8 MiB decoded. Do not load all 200 shades at startup.
- Four PNG preview originals duplicate the purpose of smaller same-stem 1200 × 750 WebP derivatives (approximately 83–87 KB each), but are not byte-identical. Two proof previews are full-size 2048 × 1280 images around 1.9 MB each, inappropriate as tiny thumbnails.
- Exact duplicates: one pair of sheer opacity maps (jacquard/linen), eight identical blank foreground masks and eight identical transparent foreground overlays. Blank duplicates are also evidence of missing segmentation, not disposable validated furniture assets.
- Initial load should include one approved scene, its needed masks/lighting/occlusion and the two selected materials only. Lazy-load other scenes, draping references, full-size exports and unused textures. Prefer real small thumbnails for selectors. Cache decoded images with a byte budget, not an unlimited map; release bitmaps/canvases on eviction.
- Generate versioned delivery derivatives only after approval, preserve originals, and use viewport-sized previews plus larger export-on-demand. No originals were compressed or removed during this audit.

## 9. Missing work before integration

**MISSING at specified paths:** 262 manifest WebPs (PNG counterparts present). **MISSING for production:** eight independent high-resolution curtain-free bases and corresponding accurate window/panel/furniture segmentation; functioning foreground masks for those eight; validated material-scale/UV/neutral lighting assets; supplier-calibrated fabric evidence. The source concept-sheet images referenced by provisional geometry are not included for lineage review.

**NEEDS CORRECTION:** Room 01/09 foreground cutouts and hanging folds, all approximate scene geometry, existing curtains baked into provisional bases, source-sheet border artifacts, texture seams, stale manifest/quality declarations and demo loading paths. Existing images need not be silently overwritten: author corrected assets under a new version with explicit provenance.

## 10. Recommended Next.js architecture

The existing studio already has `lib/manual-visualizer/{manifest,model,renderer}.ts` and `components/curtains/manual-visualizer/`. Reuse that separation after asset corrections; a studio rebuild is unnecessary. The current scene schema uses panel-local construction maps resized into normalized rectangles. **Do not feed this package's full-scene masks into that path:** it would resize/position them twice.

1. Create a versioned, audited asset manifest with actual paths, dimensions, hashes, mask encoding (`luminance`/`alpha`), provenance and explicit `prototype`/`approved` status. Build-time validation should reject missing references and keep provisional rooms unavailable to customer previews.
2. Extend reusable typed `RoomScene` definitions to declare `coordinateSpace: 'scene' | 'panel'`, track path, opening geometry, independent sheer/left/right mask and neutral lighting sources, foreground overlay, optional perspective/UV mapping and physical pattern scale. Version saved designs against those definitions; old scene IDs need explicit migration, not silent replacement.
3. Add typed illustrative fabric/material records separate from supplier records. Store each material's real shade texture path, opacity-map path, physical repeat, weave strength and lighting treatment. Keep demonstration shade IDs out of supplier stock IDs and enquiry SKU claims. The existing `resolveLayer` catalogue coupling needs a deliberate adapter for this independent sample package.
4. Use client-side Canvas with same-origin assets: base → track behind fabric where appropriate → sheer → independently rendered main panels → scene-appropriate shadows → corrected foreground. For scene-space maps, sample at scene coordinates; for panel-space maps, transform once. Convert luminance mask pixels to alpha explicitly, multiply by material transmission/opacity and apply neutral fold lighting/UV displacement. Never multiply the base photograph itself to recolor fabric.
5. Cache decoded `ImageBitmap`/image promises and prepared alpha maps with memory bounds and rejection eviction. The existing renderer has bounded caches, but needs scene-space support and decode-failure cleanup. Await all selected resources and discard stale render requests using a generation token before atomically committing a frame.
6. Render an interactive preview at a viewport-appropriate resolution (existing width cap can be retained initially), move heavier work to an OffscreenCanvas worker where supported after profiling, and decode higher resolution only for explicit export. Preserve original aspect ratio and immutable background. Keep all assets same-origin for untainted Canvas export.
7. Keep the current TSX layout and Tailwind styling. No global stylesheet expansion or homepage/catalogue/authentication changes are needed. Add only targeted validation for mask conversion, scene coordinate handling, stale-render rejection and independent layer changes when integration is authorized.

Browser-side 2D composition is **feasible**, demonstrated offline at full resolution; production realism and successful cross-browser rendering remain unvalidated. First repair paths/metadata and approve Room 01/09 scene assets, then integrate one validated scene as a controlled milestone. Add the other eight only after replacement bases, geometry and occlusion pass visual review. No runtime AI generation is required or recommended for this manual flow.
