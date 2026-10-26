# DCORHOME Manual Curtain Visualizer — Incremental Technical Asset Update

Original assets from the prior **14 MB lightweight ZIP** were preserved byte-for-byte where valid: **254 fabric or existing-room assets**. Room 01 and room 09 retain their files. Fabrics and colours were not regenerated.

## Included
* Rooms 01–10; **only rooms 01 and 09** retain the previously delivered 2048x1280 concept photographs. The new rooms 02, 03, 04, 05, 06, 07, 08 and 10 contain individual upscaled crops of AI-generated multi-scene concepts (not independent, high-resolution room photos).
* Each of the 10 room directories has exactly the 12 expected files including a geometry.json.
* 10 varieties and 100 colour textures of inner sheer; 10 varieties and 100 of main curtain.
* 10 representative draping reference renders unchanged.
* Previews `preview-thumbnails/room-01_ivory-voile_olive-linen_proof.webp` and `room-01_white-fine-voile_burgundy-velvet_proof.webp` use the identical Room 01 background.
* `interactive-demo/index.html` accepts all 10 scenes and 20 materials and shade options. Open from a local server (not file:// if blocked by your browser's image policy): e.g. `python -m http.server 8000` from this folder, then visit http://localhost:8000/interactive-demo/ .

## Validation and production blockers
1. The 8 newly added scenes are **provisional mockups**. An automated collage-generation attempt supplied these source concept sheets, so actual separate high-resolution and curtain-free images have NOT been produced for the eight missing rooms. Some scene crops already include drawn drapes.
2. All new masks/layers match their backgrounds and contain real transparency. **Geometric alignment does not establish pixel-perfect alignment**. New masks have manually estimated window bounds and synthetic fold lighting.
3. **Foreground occlusion masks for the eight new rooms remain unresolved**. The corresponding transparent overlay is intentionally empty rather than falsely claiming good segmentation. Please replace it with a true traced foreground segmentation once independent base photographs exist.
4. Old room-01/room-09 masks and textures are prototype-grade and were left unchanged per the request.
5. Texture-files are digitized illustrative weaves. Checksums prove files are not byte-identical, not that they accurately match supplier real-world textiles.
6. `asset-manifest.json` contains a complete file-by-file inventory and each asset's size, image mode, dimensions, checksum, and quality tier. `quality-report.json` contains checks and known gaps. The manifest omits itself to avoid self-hash recursion.

## Practical next step
Commission or generate 8 separate full-size curtain-free architectural images, replace only provisional `base.webp` files, then remake pixel-exact window/furniture masks from each new base before launching customer previews. **Do not deploy eight provisional scenes as photorealistic product representations.**
