# Ten curtain transformations

Ten pairs prepared from the supplied room photographs using built-in `image_gen` in offline edit mode. All 20 selected full-resolution images were inspected: curtain-free before views; layered sheer/main curtain after views; same room, people, camera, window and furniture positions. Coverage was assessed over actual glass, excluding fabric beyond a window. These are AI-edited design concepts, not photographed installations or claims about stocked fabrics. Small texture/shadow differences can occur with generative edits; visual alignment review does not guarantee pixel-identical unedited regions.

No missing scenes. Base images are 1448 × 1086, with 640 × 480 and 1280 × 960 derivatives. All 60 WebPs live under `public/images/hero/`.

## Source and selected asset mapping

For row NN, outputs are `public/images/hero/hero-NN-before.webp` and `hero-NN-after.webp`. Edit masters are `.data/hero-transformations/sources/hero-NN-before.png` and `hero-NN-after.png`, except selected after masters for 02, 03 and 04 have `-v2` before `.png`. Originals remain unchanged. Labels follow the actual photographs rather than mismatched example room names in the brief.

| Pair | Source | Actual room | Sheer + main curtain | Approximate main coverage / review |
| --- | --- | --- | --- | --- |
| 01 | `public/hero/1.png` | Lakeside living room | White + warm beige linen | 50–60%; sofa/fireplace/trees aligned |
| 02 | `public/hero/2.png` | Sunlit bedroom | Ivory + champagne silk | 55–60%; bed/bench/window aligned |
| 03 | `public/hero/3.png` | Arched window hall | Soft white + charcoal velvet | 50–60%; arches/planters/sconces aligned |
| 04 | `public/hero/4.png` | Family reading room | Cream + olive green linen | 60–65%; woman/sofa/table aligned |
| 05 | `public/hero/5.png` | Master bedroom | Ivory + taupe blackout | 50–60%; woman/bed/bench aligned |
| 06 | `public/hero/6.png` | Bright lakeside living room | White + mocha textured | 60–65%; couple/sofa/table aligned |
| 07 | `public/hero/7.png` | Sunset dining and living room | Warm ivory + deep brown velvet | 60–65%; child/table/sofa aligned |
| 08 | `public/hero/8.png` | City apartment sitting room | Cream + sage green | About half across openings; plants/arches/chair aligned |
| 09 | `public/hero/9.png` | Arched window residence | Pale grey + navy blue | 50–60%; woman/sofa/fireplace aligned; mirror updated |
| 10 | `public/hero/10.png` | City-view bedroom | White + burgundy velvet | About 60%; man/bed/bench aligned |

Ranges are visual estimates affected by perspective and foreground occlusion. All ten show substantial main fabric over actual glass with translucent sheers. Before images have no curtains/sheers. Initial after variants 02–04 were rejected for insufficient glass coverage and replaced by v2; rejected masters are retained locally but not exported/referenced by the app.

## Prompts and reproduction

`hero-transformations-prompts.json` records exact retained prompts, including rejected attempts and corrected v2 prompts. The first five calls preceded prompt-log retention: 01-before removed curtains/sheers while locking the room; 01-after added full white sheers and warm beige linen over 60% of glass; 02/03/04-before removed curtains while preserving camera, architecture, furnishings and daylight. These five descriptions are reconstructed briefs, not verbatim records. Subsequent exact prompts are retained in JSON. Built-in imagegen was used; no CLI/API fallback or live customer generation.

`node scripts/prepare-hero-transformations.cjs` encodes selected PNG masters into WebP derivatives and writes `lib/hero-comparisons.ts`. Resizing/encoding is deterministic; photographic edits were performed with imagegen. Masters are ignored `.data` working files; final WebPs and prompts are project files.

## Playback and interaction (approved clean hero update)

- Each scene starts at 5% after / 95% before, settles 0.5 seconds, reveals after to 95% over 3.8 seconds with cosine easing, then holds 1.5 seconds. A 700ms crossfade introduces the next room at 5%; after room ten, playback loops to room one. The incoming pair must be loaded before the transition.
- Root cause of stationary playback: the old hover handler set a pause flag whenever the pointer entered the hero and kept it paused while hovered. Hover no longer gates autoplay. One requestAnimationFrame hook controls reveal, hold and completion; no second animation system was introduced.
- Mouse/touch dragging stops motion immediately. Five seconds after release, playback resumes smoothly from the current reveal position. Keyboard focus/adjustment pauses until focus leaves; Escape blurs the handle and resumes after five seconds. Hidden tabs and offscreen media pause; reduced motion provides a static manually adjustable comparison.
- Removed the entire bottom control strip, counter, selector, progress indicators, previous/next and play/pause. No visible captions or replacement controls. The existing circular handle is the sole visible interaction element. Accessible image descriptions and screen-reader instructions remain. The existing fine print beneath the text-side CTAs now says ?AI-edited curtain concepts shown for inspiration.?
- All photographs, natural 4:3 image dimensions, rounded frame, heading/CTA copy, layout ordering, fonts and other sections remain unchanged. Only the small text-side disclosure was clarified. The 60 image hashes remain protected and unchanged.

## Files and scope

Updated comparison slide/slider, shared controls, central manifest, asset validator, browser harness, hero protection snapshot and related reports. Added `useHeroTransformationSequence.ts`, export script, live browser scenario, prompt log and 60 WebPs. Homepage markup/headline/CTA copy, typography, logo, other sections, catalogue, studio, auth, backend and live AI configuration remain unchanged in this task. No dependencies added or deployment.

## Verification

- `npm run lint` (TypeScript): passed.
- `npm run build`: passed, including existing prebuild asset/catalogue/manual configurator checks. Existing Node SQLite experimental warnings were emitted.
- `node scripts/check-hero-comparisons.cjs`: ten unique sources, twenty distinct base views, matching 1448 × 1086 dimensions, forty correctly sized derivatives and manifest metadata passed. Base WebPs are approximately 163–258 KB each; 640px versions are 44–74 KB.
- `node scripts/check-homepage-hero.cjs`: unchanged approved hero markup and 113 protected dependencies/assets passed after refreshing only authorized changed hero files and adding the hook/new media. Other protected hashes were verified before refreshing.
- Production build served locally with an isolated temporary data store. Chrome scenario `DCORHOME_HERO_TRANSFORMATIONS=1` passed at 360/390/768/1024/1440px, with no horizontal overflow or broken images; screenshots at mobile and desktop reviewed. Mobile/tablet image-first and desktop image-right positioning passed.
- All ten live scenes were selected; twenty unique loaded views, pair dimensions, 50% reset, wraparound previous/next, keyboard endpoints and reduced-motion stability passed. Real CDP touch input reached 25%, stayed still during inactivity, and resumed after five seconds. The reveal-after/hold/uncover-before/hold sequence reached the next ready room and explicit pause held its position. No captured browser runtime/hydration exceptions in this run.
- Live AI remains disabled. No deployment or external enquiry/email requests.

## Clean autoplay follow-up validation

Final production build and TypeScript check passed. The focused Chrome scenario observed all ten actual scenes reveal to 95%, hold, advance loaded pairs and wrap from ten to one while hovered, using real time rather than fake timers. Mouse dragging paused playback, five-second idle resume preserved the manual position, keyboard focus held for more than five seconds, Escape resumed, reduced motion stayed static, and mobile touch reached the requested position. Desktop/mobile screenshots were reviewed: clean rounded image bottoms, no toolbar/counter/captions, unchanged image size and mobile image-first ordering. No broken images, horizontal overflow or captured browser runtime exceptions. Asset validation and all 113 protected dependencies passed; only authorized component/hook hashes and the clarified text-side fine print were refreshed. No images, manifest or unrelated protected dependencies changed. No deployment.
