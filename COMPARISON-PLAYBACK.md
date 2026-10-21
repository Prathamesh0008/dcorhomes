# Automatic and manual comparison

## Changes

- `components/interactive/useComparisonAutoplay.ts`: reusable playback controller using requestAnimationFrame and refs. No per-frame React state updates, interval loop or animation-frame layout measurement.
- `components/interactive/CurtainComparison.tsx`: optional `autoPlay` (default false), `autoResumeDelay` (4500ms), and `autoPlayDuration` (4500ms); accessible Play/Pause action and subtle handle shadow. Pointer and keyboard controls remain intact.
- `app/page.tsx`: enables autoplay only on the main hero. The green section and studio comparisons remain manual.
- `scripts/browser-check.cjs`: adds browser checks for playback timing, reversal, direct manual control, idle resume, explicit pause, focus, offscreen state, visibility signal and reduced motion.

## Behavior

The hero starts at 50%, heads toward 90%, then alternates between 10% and 90%. Each full direction takes 4.5 seconds, with cosine easing that slows at the endpoints. The initial half-traversal is shorter. Manual movement still spans the full 0–100% range.

Pointer input immediately cancels animation. On release, the selected position stays unchanged for 4.5 seconds, then playback accelerates from that exact position. Keyboard focus blocks playback until blur, followed by the idle delay. Explicit Pause persists through manual input, viewport changes and visibility changes while the component remains mounted.

IntersectionObserver suspends offscreen playback; document visibility pauses background playback. Reduced motion disables autoplay but leaves manual controls available. The effect cancels animation frames and idle timers and removes observers/listeners on cleanup. Resume does not catch up elapsed background time or reset the reveal position.

No image, font, global stylesheet, dependency or API changes. Existing generated demonstration imagery remains clearly identified as an illustration. Nothing is deployed.

## Verification

TypeScript and production build passed. Chrome verified 25 route/width combinations (five pages at 360, 390, 768, 1024 and 1440px), loaded images and no overflow. Actual desktop/mobile hero screenshots were captured and the mobile Play/Pause placement reviewed.

Timed checks passed for rightward start, reversal, explicit pause persistence after dragging, the 4.5-second idle delay, position continuity at resume, keyboard-focus suspension, reduced motion and offscreen suspension. The visibility-change handler was tested with a simulated hidden-document signal, not a real background-tab session. Mouse/touch drag, keyboard Home/End/arrows, green comparison, navigation focus, fabrics, studio upload/modes and calculator regression checks passed. Consultation error handling was mocked; no enquiry was sent. No browser runtime exceptions were observed.

Fresh route targets were created/closed throughout browser testing. Effect cleanup also explicitly cancels frames/timers and disconnects observers/listeners; a full development hot-reload session was not separately exercised.
