"use client";

import { useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import type { FabricRecord } from '@/lib/curtains/catalogue';
import { scenes } from '@/lib/manual-visualizer/manifest';
import { designPreviewKey, mainPreviewSelection, type VisualizerDesign } from '@/lib/manual-visualizer/model';
import { composeDesign } from '@/lib/manual-visualizer/renderer';
import { renderCapability } from '@/lib/manual-visualizer/types';
import StudioImage from './StudioImage';

type Props = {
 design: VisualizerDesign;
 records: FabricRecord[];
 onReady: (ready: boolean) => void;
 onSelectSample: () => void;
};

const revealDuration = 1500;
const curtainFadeDuration = 600;
const beforePosition = 0;
const afterPosition = 100;

function paintFrame(target: HTMLCanvasElement, source: HTMLCanvasElement) {
 if (target.width !== source.width) target.width = source.width;
 if (target.height !== source.height) target.height = source.height;
 const context = target.getContext('2d');
 if (!context) throw Error('The curtain preview is unavailable in this browser.');
 context.clearRect(0, 0, target.width, target.height);
 context.drawImage(source, 0, 0);
}

export default function WindowPreview({design, records, onReady, onSelectSample}: Props) {
 const scene = scenes.find(scene => scene.id === design.sceneId)!;
 const capability = renderCapability(scene);
 const live = capability.comparison;
 const key = designPreviewKey(design, Boolean(scene.photo));
 const mainSelection = mainPreviewSelection(design.main);
 const mainKey = JSON.stringify(mainSelection);
 const host = useRef<HTMLDivElement>(null);
 const canvas = useRef<HTMLCanvasElement>(null);
 const backdrop = useRef<HTMLCanvasElement>(null);
 const hasPreviousFrame = useRef(false);
 const handle = useRef<HTMLDivElement>(null);
 const animation = useRef(0);
 const fade = useRef<Animation | null>(null);
 const pointer = useRef<number | null>(null);
 const reveal = useRef(afterPosition);
 const lastCompleted = useRef<{sceneId: string; key: string; mainKey: string; width: number; records: FabricRecord[]; retry: number} | null>(null);
 const [endpoint, setEndpoint] = useState<number | null>(afterPosition);
 const [measuredWidth, setWidth] = useState(0);
 const width = scene.photo ? scene.width : measuredWidth;
 const [retry, setRetry] = useState(0);
 const [imageRetry, setImageRetry] = useState(0);
 const [imageError, setImageError] = useState('');
 const [error, setError] = useState('');
 const [frame, setFrame] = useState({sceneId: '', key: '', width: 0});
 const imageFailed = imageError === scene.id;
 const visibleFrame = live && frame.sceneId === scene.id;
 const ready = visibleFrame && frame.key === key && frame.width === width && !error && !imageFailed;
 const sliderReady = ready && capability.mode === 'live-study' && mainSelection !== null;

 function show(value: number) {
  const previous = reveal.current;
  reveal.current = Math.max(0, Math.min(100, value));
  host.current?.style.setProperty('--reveal', `${reveal.current}%`);
  const rounded = Math.round(reveal.current);
  if (rounded !== Math.round(previous)) {
   handle.current?.setAttribute('aria-valuenow', String(rounded));
   handle.current?.setAttribute('aria-valuetext', `${rounded}% after view`);
  }
  const before = previous === 0 || previous === 100 ? previous : null;
  const after = reveal.current === 0 || reveal.current === 100 ? reveal.current : null;
  if (after === afterPosition && backdrop.current) backdrop.current.hidden = true;
  if (before !== after) setEndpoint(after);
 }

 function stopAnimation() {
  cancelAnimationFrame(animation.current);
  animation.current = 0;
  if (fade.current) {
   fade.current.cancel();
   fade.current = null;
   if (backdrop.current) backdrop.current.hidden = true;
  }
 }

 function animateReveal(fromPreviousFrame = false) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
   show(afterPosition);
   return;
  }
  if (backdrop.current) backdrop.current.hidden = !fromPreviousFrame || !hasPreviousFrame.current;
  show(beforePosition);
  const started = performance.now();
  const tick = (now: number) => {
   const progress = Math.max(0, Math.min(1, (now - started) / revealDuration));
   show((1 - Math.cos(Math.PI * progress)) * 50);
   animation.current = progress < 1 ? requestAnimationFrame(tick) : 0;
  };
  animation.current = requestAnimationFrame(tick);
 }

 function replay() {
  stopAnimation();
  animateReveal();
 }

 function chooseView(value: number) {
  stopAnimation();
  if (backdrop.current) backdrop.current.hidden = true;
  show(value);
 }

 function dragTo(x: number) {
  const rect = host.current?.getBoundingClientRect();
  if (rect?.width) chooseView((x - rect.left) / rect.width * 100);
 }

 function moveWithKeyboard(event: KeyboardEvent<HTMLDivElement>) {
  const step = event.shiftKey ? 10 : 2;
  const positions: Record<string, number> = {
   ArrowLeft: reveal.current - step,
   ArrowDown: reveal.current - step,
   ArrowRight: reveal.current + step,
   ArrowUp: reveal.current + step,
   Home: 0,
   End: 100,
  };
  if (!Object.hasOwn(positions, event.key)) return;
  event.preventDefault();
  chooseView(positions[event.key]);
 }

 useLayoutEffect(() => {
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finish = () => { if (motion.matches && (animation.current || fade.current)) chooseView(afterPosition); };
  motion.addEventListener('change', finish);
  return () => motion.removeEventListener('change', finish);
 }, []);

 useLayoutEffect(() => {
  let timer: ReturnType<typeof setTimeout>;
  const measure = () => setWidth(Math.min(1280, Math.max(360, Math.round(
   (host.current?.clientWidth || 800) * Math.min(window.devicePixelRatio || 1, 1.5),
  ))));
  measure();
  const observer = new ResizeObserver(() => {
   clearTimeout(timer);
   timer = setTimeout(measure, 80);
  });
  if (host.current) observer.observe(host.current);
  return () => { observer.disconnect(); clearTimeout(timer); };
 }, []);

 useLayoutEffect(() => {
  const controller = new AbortController();
  const previous = lastCompleted.current;
  const changed = previous?.key !== key || previous.records !== records || previous.retry !== retry;
  if (!changed && previous.width === width && live && !imageFailed) {
   onReady(true);
   return;
  }
  // Keep the last complete composition visible while the next one is prepared.
  if (changed || animation.current) chooseView(afterPosition);
  setError('');
  onReady(false);
  if (!live || !width || imageFailed) {
   lastCompleted.current = null;
   hasPreviousFrame.current = false;
   return;
  }

  const present = (result: HTMLCanvasElement) => {
   try {
    const target = canvas.current;
    const prior = backdrop.current;
    if (controller.signal.aborted || !target || !prior) return;
    if (changed) {
     hasPreviousFrame.current = previous?.sceneId === scene.id;
     if (hasPreviousFrame.current) paintFrame(prior, target);
    }
    paintFrame(target, result);
    lastCompleted.current = {sceneId: scene.id, key, mainKey, width, records, retry};
    setFrame({sceneId: scene.id, key, width});
    const mainChanged = previous?.sceneId === scene.id ? previous.mainKey !== mainKey : mainKey !== 'null';
    const animateMain = capability.mode === 'live-study' && mainKey !== 'null' && previous?.mainKey !== mainKey;
    if (mainChanged && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
     prior.hidden = animateMain || !hasPreviousFrame.current;
     const transition = target.animate([{opacity: 0}, {opacity: 1}], {duration: curtainFadeDuration, easing: 'ease-in-out'});
     fade.current = transition;
     transition.onfinish = () => {
      if (fade.current !== transition) return;
      fade.current = null;
      prior.hidden = true;
     };
    }
    if (animateMain) animateReveal();
    else if (changed && !scene.photo && !mainChanged) animateReveal(true);
    onReady(true);
   } finally {
    result.width = 0;
   }
  };

  const fail = (reason: unknown) => {
   if (controller.signal.aborted) return;
   setError(reason instanceof Error ? reason.message : 'Your selected fabrics could not be shown.');
   onReady(false);
  };

  void composeDesign(design, records, width, controller.signal).then(present).catch(fail);
  return () => {
   controller.abort();
   stopAnimation();
   pointer.current = null;
  };
 }, [key, mainKey, records, width, retry, imageFailed, onReady, live, capability.mode]);

 function retryPreview() {
  if (imageFailed) {
   setImageError('');
   setImageRetry(value => value + 1);
  }
  setRetry(value => value + 1);
 }

 const failure = imageFailed ? 'The room image could not load.' : error;
 const roomNotice = capability.reason || 'A curtain preview is not available in this room yet.';

 return (
  <figure className="m-0 min-w-0" data-testid="manual-window-preview" data-render-state={failure ? 'error' : !live ? 'room-only' : ready ? 'ready' : 'loading'}>
   <div className="mb-4 flex min-h-11 flex-wrap items-center justify-between gap-3">
    <figcaption className="text-[13px] font-medium">{scene.name}</figcaption>
    {live && <div role="group" aria-label="Compare your curtains" className="inline-flex rounded-full bg-[#eeeee6] p-1">
     {[beforePosition, afterPosition].map(value => <button type="button" key={value} disabled={!ready} aria-pressed={ready && endpoint === value} onClick={() => chooseView(value)} className="min-h-9 rounded-full border-0 bg-transparent px-3 text-[11px] transition-colors aria-pressed:bg-paper aria-pressed:shadow-sm disabled:opacity-50">{value === beforePosition ? 'Before' : 'After'}</button>)}
     <button type="button" disabled={!ready} onClick={replay} className="inline-flex min-h-9 items-center gap-1.5 rounded-full border-0 bg-transparent px-3 text-[11px] disabled:opacity-50"><RotateCcw aria-hidden="true" size={12}/>Replay</button>
    </div>}
   </div>
   <div
    ref={host}
    style={{aspectRatio: `${scene.width}/${scene.height}`}}
    aria-busy={live && !ready && !failure}
    className="relative overflow-hidden rounded-[6px] bg-[#eeeae2] shadow-[0_12px_45px_-24px_#25342f35]"
   >
    <StudioImage key={`${scene.id}:${imageRetry}`} src={scene.base} alt={scene.name + ' room reference'} priority onError={() => setImageError(scene.id)} className="absolute inset-0 h-full w-full object-contain"/>
    <canvas ref={backdrop} data-testid="previous-curtain-composition" aria-hidden="true" hidden className="pointer-events-none absolute inset-0 h-full w-full"/>
    <canvas ref={canvas} data-testid="composed-curtains" aria-hidden={!visibleFrame} aria-label="Curtain composition" role="img" className="pointer-events-none absolute inset-0 h-full w-full [clip-path:inset(0_calc(100%_-_var(--reveal,100%))_0_0)]" style={{visibility: visibleFrame ? 'visible' : 'hidden'}}/>
    {live && <div
     hidden={!sliderReady}
     className="absolute inset-0 touch-pan-y select-none"
     onPointerDown={event => {
      if (!event.isPrimary || event.button !== 0) return;
      pointer.current = event.pointerId;
      event.currentTarget.setPointerCapture(event.pointerId);
      handle.current?.focus({preventScroll: true});
      dragTo(event.clientX);
     }}
     onPointerMove={event => { if (pointer.current === event.pointerId) dragTo(event.clientX); }}
     onLostPointerCapture={() => { pointer.current = null; }}
    >
     <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-[var(--reveal,100%)] w-px bg-white shadow-sm"/>
     <div ref={handle} role="slider" tabIndex={0} aria-label="Before and after curtain reveal" aria-valuemin={0} aria-valuemax={100} aria-valuenow={afterPosition} aria-valuetext="100% after view" onKeyDown={moveWithKeyboard} className="absolute left-[clamp(22px,var(--reveal,100%),calc(100%_-_22px))] top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full border border-solid border-[#d9d4c7] bg-paper text-ink shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink">
      <ChevronLeft aria-hidden="true" size={14}/><ChevronRight aria-hidden="true" size={14}/>
     </div>
    </div>}
    {live && !ready && !failure && <span role="status" className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-paper/95 px-3 py-2 text-[11px]"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ink motion-reduce:animate-none"/>Updating your fabrics</span>}
   </div>
   {failure
    ? <div role="alert" className="mt-4 flex flex-wrap items-center justify-between gap-3 text-[12px] leading-6"><p className="m-0">{failure}</p><button type="button" onClick={retryPreview} className="inline-flex min-h-11 items-center gap-2 border-0 bg-transparent p-0 underline">Try again<RotateCcw aria-hidden="true" size={13}/></button></div>
    : live
      ? <p className="mb-0 mt-4 text-[11px] leading-6 text-muted">{capability.reason || (scene.photo ? 'Choose a main fabric to preview it on these curtains.' : 'An illustrative fabric study. Confirm colour and drape with a physical sample.')}</p>
      : <div className="mt-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-1 text-[12px] leading-6 text-muted"><p className="m-0 max-w-md">{roomNotice}</p><button type="button" onClick={onSelectSample} className="inline-flex min-h-11 shrink-0 items-center gap-2 border-0 bg-transparent p-0 text-[12px] text-ink underline underline-offset-4">Explore the homepage rooms<ArrowUpRight aria-hidden="true" size={14}/></button></div>}
  </figure>
 );
}
