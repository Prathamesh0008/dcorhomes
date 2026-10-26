# Design Studio: supplied asset library integration

The actual `/studio` route continues to use `ManualCurtainStudio`. The source package was found at `assets/dcorhome-manual-visualizer/`; no source files were modified. The earlier audit remains in `docs/manual-visualizer-audit/AUDIT.md`.

## What is available

- **Ten supplied room bases** are selectable under **Choose Your Room**, using their own generated 480px thumbnails. Rooms 01 and 09 use their actual PNG filenames; the other eight use WebP. Browser paths never point at filesystem locations or nonexistent WebPs.
- **One existing live sample room** retains its existing geometry, prepared masks, fold maps and rendering support. It is explicitly presented as a sample, not substituted for a selected supplied room.
- **All ten supplied sheer varieties and all ten main varieties**, each with ten shade-specific textures (200 shades), are available for material studies in the live sample. These are illustrative assets, not supplier stock. Every variety has its supplied thumbnail/master and actual shade swatches.
- **No Sheer / No Main Curtains**, independent layer selections, luminance-driven sheer transmission, fold-aware textile mapping, before/after comparison, PNG download, on-device saving/reopening and enquiry summaries are connected to the existing implementation.
- Existing supported catalogue links and earlier configurations retain their IDs and validation. Earlier studies remain under an expandable section. Unsupported incoming catalogue selections retain the existing assistance/enquiry fallback rather than being silently replaced with a library fabric.

| Sheer varieties | Main curtain varieties |
| --- | --- |
| Plain voile | Pure linen |
| Fine voile | Cotton |
| Linen sheer | Cotton-linen blend |
| Cotton sheer | Velvet |
| Organza sheer | Silk |
| Embroidered sheer | Silk blend |
| Net sheer | Faux silk |
| Textured sheer | Jacquard |
| Striped sheer | Chenille |
| Jacquard sheer | Textured polyester weave |

Every sheer variety has Pure White, Soft Ivory, Cream, Champagne, Sand, Light Beige, Warm Grey, Pale Blue, Sage Green and Blush. Every main variety has Ivory, Champagne, Sand Beige, Taupe, Mocha, Sage Green, Olive Green, Navy Blue, Burgundy and Charcoal Grey. All 200 shade-specific texture paths resolve and decode during preparation; their illustrated appearance is preserved rather than replaced by flat tint swatches in the live preview.

## Deliberate limits

**None of the ten supplied rooms has passed accurate curtain-preview validation.** Rooms 01/09 have faulty foreground cutouts and prototype folds. Rooms 02–08/10 additionally have low-resolution concept-sheet bases, estimated geometry, empty foreground masks, and in several cases curtains baked into the base.

All ten therefore show **room view / inspiration only**, with an explicit notice that selected curtains have not been rendered. No supplied invalid curtain overlay is drawn. Fabric selections are retained when changing rooms, can be saved as selections and included in an enquiry, and can be viewed immediately by choosing **See my fabrics in the live sample room**. Downloads and comparison are available for the live sample; unsupported room-composition export is rejected in the renderer itself, including when reopening an older saved selection.

Production-quality curtains in those ten rooms require corrected scene contours, neutral fold/lighting maps and foreground segmentation; the eight provisional rooms also need independent curtain-free bases. This integration does not claim to fix the underlying assets or verify real-world fabric appearance.

## Files and architecture

- `public/images/manual-visualizer/library-v1/`: 240 decoded, byte-identical source copies (10 bases, 20 masters, 200 shades, 10 opacity maps) and ten generated thumbnail derivatives. Relative source paths and original formats are preserved. Invalid scene overlays, precomposed proof images, draping references and the broken demo were excluded from runtime delivery.
- `lib/manual-visualizer/library-assets.json`: generated runtime paths, illustrative shade colors, room metadata and source checksums.
- `lib/manual-visualizer/library.ts`: typed scene/material adapter and isolated demonstration records; these are never merged into the public commercial catalogue.
- `lib/manual-visualizer/manifest.ts`: additive room and material definitions; existing version/IDs retained for saved configurations.
- `lib/manual-visualizer/model.ts`: library selection resolution shared by client and account-save validation; enquiry text distinguishes unrendered selections from sample compositions.
- `lib/manual-visualizer/renderer.ts`: actual shade texture sampling, luminance opacity maps, existing fold displacement, failed-decode cache eviction and explicit unsupported-scene rejection. It retains the existing base/sheers/main/shadow/occlusion order and bounded caches. No AI request is made.
- `components/curtains/manual-visualizer/RoomChoices.tsx`: ten room cards and the distinct live-sample option.
- `LayerChoices.tsx`: independent material/shade controls, actual texture swatches and optional layers.
- `WindowPreview.tsx`: correct scene aspect ratio, honest room-only states, stale-frame hiding and a direct route back to the live sample.
- `ManualCurtainStudio.tsx`: existing page layout, actions and restore flows reused; restored controls mount after initialization, avoiding a flash of incorrect saved selections.
- `scripts/prepare-visualizer-library.cjs`: reproducible preparation without source mutation.
- `scripts/visualizer-library-check.cjs`: library/model/path/hash/legacy checks.
- `scripts/visualizer-browser-smoke.cjs`: focused local Chrome smoke check with Node's built-in CDP/WebSocket support, without adding browser-test dependencies.

Header/logo, homepage, catalogue UI, About, Contact, authentication, globals and AI configuration were not edited during this integration. Enquiry navigation uses the existing Contact route; no enquiry was submitted by the checks.

## Verification and opening the studio

Run `npm.cmd run dev` on Windows (or `npm run dev` in a compatible shell), then open `/studio` on the printed local address. Choose **Live sample room**, change a sheer/color, then change a main fabric/color. Use **Before / After**, **Download My Design** and **Save on this device**. Choose any of the ten room cards to inspect its actual base and the unavailable-preview notice; return to the live sample without losing fabric selections.

Checks:

- `npm.cmd run lint`: TypeScript passed.
- `node scripts/visualizer-library-check.cjs`: all 200 shades resolve, 240 runtime copies match source hashes, all ten unsupported overlay paths are gated, and prior supported design IDs validate.
- `npm.cmd run build`: production build passed, including repository prebuild validators. The first sandboxed attempt could not fetch the existing Inter font; the network-enabled build succeeded without changing the header or font configuration.
- All 374 original package files were rehashed against the audit inventory: unchanged.
- `browser-results.json`: focused rendered-browser results, including canvas pixel hashes, selection independence, ten actual bases, download, local persistence, mobile ordering, image decoding, network failures and AI requests. Screenshots: `desktop.png`, `mobile.png`; actual browser-exported composition: `dcorhome-curtains-garden-living.png`.

Signed-in account storage and real enquiry submission are not end-to-end tested; server-side configuration validation is covered, and the existing account/enquiry implementations are reused. Source truth remains the supplied audit: no room or illustrated textile is promoted to verified commercial photography by this work. Nothing was deployed.
