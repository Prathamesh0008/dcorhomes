# Ten-image hero showcase

Historical gallery report. Superseded by [the ten-scene transformation implementation](hero-transformations.md). The ten supplied images and older derivatives remain available; the hero now uses ten reviewed, offline AI-edited before/after concepts.

The homepage hero now uses the ten supplied files `public/hero/1.png` through `10.png`, in numeric order. Originals remain unchanged. All ten are 1448 × 1086, so the media uses their natural 4:3 aspect ratio without cropping away curtain areas.

## Assets and performance

`node scripts/prepare-hero-images.cjs` prepares 640, 1280 and 1448px WebP versions under `public/images/hero/hero-curtain-01-640.webp` through `hero-curtain-10-1448.webp` and generates `lib/hero-showcase.ts` with meaningful alt text and individual captions. No upscaling or generated replacement imagery. Typical output is about 49KB at 640px and 150KB at 1280px per image.

Next Image supplies responsive sizing and first-image priority. The carousel initially mounts the first and upcoming image; subsequent slides load as needed, with one image prepared ahead. The outgoing image stays mounted through its fade. Browser resource checks confirmed only two showcase image sources were requested initially.

## Behavior

- Desktop: approved text/CTAs on the left, gallery on the right.
- Below 1024px: Tailwind order utilities place the image above the text.
- Five-second autoplay with a 700ms crossfade. Incoming images must load before the active slide changes.
- Pauses for desktop hover, keyboard focus within the showcase, explicit Pause, an inactive browser tab, the showcase leaving the viewport, and comparison mode.
- Reduced motion disables autoplay and fading while retaining manual navigation.
- Previous/next buttons, keyboard arrows, direct image selector, current-position indicators and explicit Play/Pause controls.
- Only manual slide changes announce their description to assistive technology; autoplay does not repeatedly interrupt screen-reader users.
- A failed image produces honest feedback and keeps navigation available.

The headline, supporting copy, CTA destinations and CTA styling are preserved. Only the image-specific fine print now reads “Curtain views shown for inspiration.” The homepage sections after the hero are unchanged.

## Comparison honesty

No matching original-room images were supplied for the ten styled views. They are not labelled Before/After and no fake divider or fake before image was added.

“Explore the interactive room illustration” opens the existing matched comparison using the existing CurtainComparison component. It is explicitly labelled **Original illustration / Curtain illustration** and **AI-created room illustration, not a photographed installation**. Its draggable/keyboard comparison remains functional. Comparison animation is off in this mode, and gallery autoplay pauses until the customer returns. This is an illustration example, not an installation claim or a before version of any supplied slide.

## Files

Created:

- `components/home/HeroCurtainShowcase.tsx`
- `components/home/HeroShowcaseSlide.tsx`
- `components/home/HeroShowcaseControls.tsx`
- `lib/hero-showcase.ts`
- Thirty responsive WebP assets in `public/images/hero/`
- `scripts/prepare-hero-images.cjs`
- `scripts/hero-showcase-browser.cjs`
- This report.

Updated:

- `app/page.tsx`: gallery integration and responsive ordering within the hero only.
- `scripts/browser-check.cjs`: opt-in focused showcase scenario.
- `scripts/homepage-hero-protection.json`: snapshot refreshed for the user-authorized hero upgrade; new components, manifest and derivatives added to protection.
- `scripts/check-homepage-hero.cjs`: reports the actual protected-dependency count rather than the previous hardcoded count.

Logo, navigation, global CSS/fonts, existing comparison component, Studio, authentication, catalogue and AI configuration were not edited. No new dependencies.

## Verification — passed

- `npm run lint` and `npm run build`, including existing prebuild asset/configurator checks.
- `node scripts/check-homepage-hero.cjs`: authorized hero and all 49 protected dependencies/assets match the refreshed snapshot.
- Focused Chrome checks at 360, 390, 768, 1024, 1440 and 1920px: no overflow, broken images or header overlap; desktop and mobile ordering correct.
- Real-time autoplay, hover pause and explicit pause; all ten images through the selector; previous/next, wraparound and keyboard navigation.
- Reduced-motion autoplay disabled with manual navigation still working.
- Stable media height and zero measured layout-shift score during the checked autoplay change, after fonts loaded.
- Existing comparison keyboard interaction and visible illustration provenance.
- No captured runtime exceptions; actual 390px and 1440px screenshots reviewed (`dcorhome-hero-showcase-*.png` in the OS temporary directory).

Nothing deployed. No emails, production data mutations, paid AI requests or new API integration.
