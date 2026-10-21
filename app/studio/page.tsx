"use client";
import CurtainConfigurator from "@/components/curtains/CurtainConfigurator";
import { manualSelection, readManual, storageKey, type ManualConfig } from '@/lib/curtains/manual-config';
import { curtainFabrics, curtainStyles } from "@/lib/curtains/configurator-data";
import type { DesignSelection } from "@/lib/design-options";
import { useDesignOptions } from "@/lib/useDesignOptions";
import { useCatalogue } from "@/lib/useCatalogue";
import { products as sampleProducts } from "@/lib/catalog";
import { typography } from "@/lib/typography";
import { defaultSelection } from "@/lib/design-options";
import { localDesigns } from "@/lib/local-designs";
import DesignActions from "@/components/interactive/DesignActions";
import Container from "@/components/ui/Container";
import Eyebrow from "@/components/ui/Eyebrow";

import { ChangeEvent, Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowDownToLine,
  ImagePlus,
  Loader2,
  RotateCcw,
  WandSparkles,
} from "lucide-react";
import { images } from "@/lib/urls";
import NextImage from "@/components/ui/Photograph";
import ActionLink from "@/components/ui/ActionLink";
import CurtainPlacementSketch from "@/components/interactive/CurtainPlacementSketch";
import CurtainComparison from "@/components/interactive/CurtainComparison";




function StudioContent() {
  const products=useCatalogue();
  const designOptions=useDesignOptions();

  const headings=[...new Set([...designOptions.headings,...curtainStyles])];
  const query = useSearchParams();
  const initialFabric = query.get("fabric");
  const [fabricId, setFabricId] = useState(
    products.some((p) => p.id === initialFabric)
      ? initialFabric!
      : (products[1] || products[0] || sampleProducts[1]).id,
  );
  useEffect(()=>{if(initialFabric&&products.some(p=>p.id===initialFabric))setFabricId(initialFabric);},[initialFabric,products]);
  const fabric = products.find((p) => p.id === fabricId) || products[0] || sampleProducts[1];
  const [heading, setHeading] = useState(query.get("heading") || "Wave fold");
  const [pattern, setPattern] = useState(query.get("pattern") || "Solid");
  const [color, setColor] = useState<string | null>(query.get("color"));
  const actualColor = color || fabric.color;
  const [preferences,setPreferences]=useState<DesignSelection>({...defaultSelection,...Object.fromEntries([...query.entries()].filter(([k])=>['style','roomType','curtainLength','fullness','layers','sheerColor','configuratorFabric','configuratorStyle','manual','sheerFabric','sheerHeading','mainEnabled','sheerEnabled'].includes(k)))});
  const [designId,setDesignId]=useState('');
  const [originalResult,setOriginalResult]=useState('');
  const generation=useRef<AbortController | null>(null);
  useEffect(()=>{fetch('/api/session').catch(()=>{});return()=>generation.current?.abort();},[]);
  useEffect(()=>{let cancelled=false;const urls:string[]=[];
    async function restore(){try{let saved;
      if(query.get('local')){const record=(await localDesigns()).find(r=>r.id===query.get('local'));if(!record)return;const original=URL.createObjectURL(record.original);urls.push(original);const edited=record.result?URL.createObjectURL(record.result):'';if(edited)urls.push(edited);saved={selection:record.selection,original,result:edited,id:''};}
      else if(query.get('design')){const r=await fetch('/api/designs/'+encodeURIComponent(query.get('design')!));if(!r.ok)throw Error('This private design is unavailable in your current session.');const data=await r.json();saved={selection:data.selection,original:`/api/designs/${data.id}/image?type=original`,result:`/api/designs/${data.id}/image`,id:data.id};}
      if(saved&&!cancelled){const restoredPhoto=await fetch(saved.original).then(r=>{if(!r.ok)throw Error("Original image unavailable.");return r.blob();});if(cancelled)return;setFile(new File([restoredPhoto],"saved-room.webp",{type:restoredPhoto.type}));setPreferences(saved.selection);setFabricId(saved.selection.fabric);setHeading(saved.selection.heading);setPattern(saved.selection.pattern);setColor(saved.selection.color);setRoom(saved.original);setOriginalResult(saved.original);setResult(saved.result);setDesignId(saved.id);setView(saved.result?'render':'original');}
    }catch(e){if(!cancelled)setError(e instanceof Error?e.message:'Could not reopen design.');}}restore();return()=>{cancelled=true;urls.forEach(u=>URL.revokeObjectURL(u));};
  },[query]);
  const selection={...preferences,fabric:fabricId,heading,pattern,color:actualColor,sheerColor:preferences.sheerColor || '#f3efdf'};
  const patterns=(curtainFabrics.find(f=>f.name===preferences.configuratorFabric) || curtainFabrics.find(f=>f.catalogueId===fabric.id) || curtainFabrics.find(f=>f.name===fabric.category))?.patterns || designOptions.patterns;
  const [studioMode,setStudioMode]=useState<'sample'|'upload'>(query.get('mode')==='upload'||query.get('design')||query.get('local')?'upload':'sample');
  function configure(next:ManualConfig){const transferred=manualSelection(next);setPreferences(p=>({...p,...transferred}));setFabricId(transferred.fabric!);setHeading(transferred.heading!);setPattern(transferred.pattern!);setColor(transferred.color!);clearResult();try{localStorage.setItem(storageKey,JSON.stringify(next));const params=new URLSearchParams(window.location.search);for(const [key,value]of Object.entries(transferred))params.set(key,value);if(params.toString()!==window.location.search.slice(1))window.history.replaceState(window.history.state,'',window.location.pathname+'?'+params.toString());}catch{}}
  useEffect(()=>{if(!query.get('design')&&!query.get('local'))configure(readManual(Object.fromEntries(query.entries())));},[query]);

  const [x, setX] = useState(50),
    [width, setWidth] = useState(64),
    [top, setTop] = useState(11),
    [length, setLength] = useState(75),
    [open, setOpen] = useState(46);
  const [view, setView] = useState<"original" | "concept" | "render">(
    "original",
  );
  const [room, setRoom] = useState(images.living);
  const [file, setFile] = useState<File | null>(null);
  const [configured, setConfigured] = useState(false);
  useEffect(() => {
    fetch("/api/visualize")
      .then((r) => r.json())
      .then((data) => setConfigured(data.configured === true))
      .catch(() => setConfigured(false));
  }, []);
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [result, setResult] = useState("");
  const uploader = useRef<HTMLInputElement>(null);
  useEffect(() => {
    return () => {
      if (room.startsWith("blob:")) URL.revokeObjectURL(room);
    };
  }, [room]);
  function clearResult() {
    setResult("");
    setDesignId("");
    setOriginalResult("");
    setView((current) => (current === "render" ? "original" : current));
  }
  async function acceptFile(incoming:File){
    if(busy)return;
    if(!['image/png','image/jpeg','image/webp'].includes(incoming.type)||incoming.size===0||incoming.size>10*1024*1024){setError('Choose a JPG, PNG or WebP photograph smaller than 10 MB.');return;}
    try{const bitmap=await createImageBitmap(incoming);const valid=bitmap.width>=256&&bitmap.height>=256&&bitmap.width*bitmap.height<=24000000;bitmap.close();if(!valid)throw Error('Use an image at least 256px per side and at most 24 megapixels.');
      setView('original');setRoom(URL.createObjectURL(incoming));setFile(incoming);clearResult();setError('');
    }catch(e){setError(e instanceof Error?e.message:'This image is corrupted or unsupported.');}
  }
  function upload(e:ChangeEvent<HTMLInputElement>){const incoming=e.target.files?.[0];if(incoming)void acceptFile(incoming);e.target.value='';}
  function useSample() {
    setView("original");
    setRoom(images.living);
    setFile(null);
    clearResult();
    setError("");
    if (uploader.current) uploader.current.value = "";
  }
  async function generate() {
    if (!file || !configured || busy) return;
    generation.current=new AbortController();
    setBusy(true);
    setError("");
    clearResult();
    try {
      const data = new FormData();
      data.append("image", file);
      data.append("fabricId", fabricId);
      data.append("heading", heading);
      data.append("pattern", pattern);
      data.append("color", actualColor);
      data.append("sheerColor",selection.sheerColor);
      for(const key of ['manual','sheerFabric','sheerHeading','mainEnabled','sheerEnabled'] as const)if(selection[key])data.append(key,selection[key]!);
      if(selection.configuratorFabric)data.append("configuratorFabric",selection.configuratorFabric);
      if(curtainStyles.includes(heading))data.append("configuratorStyle",heading);
      for(const key of ["style","roomType","curtainLength","fullness","layers"] as const)data.append(key,selection[key]);
      const response = await fetch("/api/visualize", {
        method: "POST",
        body: data,
        signal:generation.current.signal,
      });
      const payload = await response.json();
      if (!response.ok)
        throw new Error(
          payload.error || "Unable to generate your design right now.",
        );
      if(typeof payload.image!=="string"||!payload.id)throw Error("The service returned no valid design.");
      setResult(`data:${payload.mime||"image/webp"};base64,${payload.image}`);
      setDesignId(payload.id);
      setOriginalResult(payload.original);
      setView("render");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to complete the preview.",
      );
    } finally {
      setBusy(false);
    }
  }
  function drawToCanvas() {
    setError("");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const w = 1200,
          h = 825;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const ratio = Math.max(w / img.width, h / img.height),
          scaledW = img.width * ratio,
          scaledH = img.height * ratio;
        ctx.drawImage(
          img,
          (w - scaledW) / 2,
          (h - scaledH) / 2,
          scaledW,
          scaledH,
        );
        const xp = ((x - width / 2) / 100) * w,
          wp = (width / 100) * w,
          yp = (top / 100) * h,
          hp = (length / 100) * h;
        const pw = ((100 - open) / 200) * wp;
        const panel = (start: number) => {
          ctx.save();
          ctx.globalAlpha = fabric.category === "Sheer" ? 0.65 : 0.92;
          ctx.globalAlpha = 0.5;
          ctx.fillStyle = actualColor;
          ctx.fillRect(start, yp, pw, hp);
          ctx.globalAlpha = 1;
          ctx.strokeStyle = "#fff";
          ctx.setLineDash([8, 8]);
          ctx.strokeRect(start, yp, pw, hp);
          ctx.restore();
        };
        ctx.fillStyle = "#675e53";
        ctx.fillRect(xp - 7, yp - 8, wp + 14, 4);
        panel(xp);
        panel(xp + wp - pw);
        ctx.setLineDash([]);
        ctx.fillStyle = "#fffdf9";
        ctx.fillRect(0, h - 48, w, 48);
        ctx.fillStyle = "#25342f";
        ctx.font = "14px Arial";
        ctx.fillText(
          "DCORHOME / ILLUSTRATIVE PLACEMENT SKETCH / NOT AN AI RENDER",
          24,
          h - 19,
        );
        const anchor = document.createElement("a");
        anchor.download = "dcorhome-curtain-concept.png";
        anchor.href = canvas.toDataURL("image/png");
        anchor.click();
      } catch {
        setError(
          "This sample image cannot be exported in your browser. Upload your own room photo and try again.",
        );
      }
    };
    img.onerror = () =>
      setError(
        "Could not prepare this image for download. Try uploading a local photo.",
      );
    img.src = room;
  }
  return (
    <>
      <section className="border-b border-solid border-[#dedbd2] bg-cream py-10 md:py-14">
        <Container>
          <Eyebrow>THE DCORHOME DESIGN STUDIO</Eyebrow>
          <h1 className={`mb-4 mt-5 ${typography.page}`}>
            Your room.{" "}
            <em className="font-serif font-normal text-[#97836b]">Considered anew.</em>
          </h1>
          <p className={`mb-0 max-w-[580px] text-muted ${typography.body}`}>
            A photograph, a material, a new perspective. Explore your choices at
            your own pace, then let us help with the details.
          </p>
        </Container>
      </section>
      <Container
        className="flex flex-wrap gap-x-7 gap-y-3 border-b border-solid border-[#dedbd2] py-6 text-[10px] text-muted"
        aria-label="Design steps"
      >
        <span>01 / Choose a room</span>
        <span>02 / Fabric & color</span>
        <span>03 / Heading & placement</span>
        <span>04 / Render, compare & save</span>
      </Container>
      <Container className="flex flex-wrap gap-4 py-5" ><button type="button" aria-pressed={studioMode==='sample'} onClick={()=>setStudioMode('sample')} className="min-h-11 rounded-full border border-solid border-[#b3b7a8] bg-transparent px-5 text-[13px] aria-pressed:bg-ink aria-pressed:text-paper">Sample preview</button><button type="button" aria-pressed={studioMode==='upload'} onClick={()=>setStudioMode('upload')} className="min-h-11 rounded-full border border-solid border-[#b3b7a8] bg-transparent px-5 text-[13px] aria-pressed:bg-ink aria-pressed:text-paper">My room AI preview</button></Container>
      {studioMode==='sample' ? <section className="bg-ink py-10"><Container><CurtainConfigurator studio selection={selection} onManualChange={configure}/><button type="button" onClick={()=>setStudioMode('upload')} className="mt-8 min-h-12 rounded-full bg-paper px-6 text-[13px] text-ink">Upload my room with these choices</button></Container></section> : <>
      <section className="bg-ink py-6 text-paper"><Container><details><summary className="min-h-11 cursor-pointer py-3 text-[14px]">Edit main and sheer configuration</summary><CurtainConfigurator studio selection={selection} onManualChange={configure}/></details></Container></section>
      <Container
        as="section"
        className="grid items-start gap-10 py-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,.85fr)] lg:gap-12 lg:py-14"
      >
        <div className="min-w-0 lg:sticky lg:top-[110px]" onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();const incoming=event.dataTransfer.files[0];if(incoming)void acceptFile(incoming);}}>
          <p className="text-[12px] leading-relaxed text-muted">Drop your photograph here or choose a file. JPG, PNG or WebP, up to 10 MB. Nothing is uploaded until you press Generate.</p>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[9px] uppercase tracking-[1.5px] text-muted">
              {result && view === "render"
                ? "AI-edited photograph"
                : view === "concept"
                  ? "Illustrative placement sketch"
                  : "Original photograph"}
            </span>
            <button
              disabled={busy}
              type="button"
              onClick={() => uploader.current?.click()}
              className="flex min-h-11 items-center gap-2 border-0 bg-transparent p-0 text-[11px] text-ink disabled:opacity-50"
            >
              <ImagePlus size={15} />{" "}
              {file ? "Change photograph" : "Upload your room"}
            </button>
          </div>
          <input
            ref={uploader}
            className="sr-only"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            aria-label="Upload your room photograph"
            onChange={upload}
          />
          {result && view === "render" ? (
            <CurtainComparison
              before={originalResult || room}
              after={result}
              caption="AI-edited image compared with your original. Review architectural details before deciding."
              afterLabel="AI edit"
            />
          ) : view === "concept" ? (
            <div className="relative aspect-[4/3] overflow-hidden bg-sand"><NextImage src={room} alt="Your room with an illustrative placement diagram" fill sizes="(max-width:1023px) 100vw,60vw" className="object-cover" unoptimized={room.startsWith('blob:')}/><CurtainPlacementSketch x={x} width={width} top={top} length={length} opening={open} color={actualColor} heading={heading} pattern={pattern}/></div>
          ) : (
            <div className="relative aspect-[4/3] overflow-hidden bg-sand">
              <NextImage
                src={room}
                alt={
                  file
                    ? "Your uploaded room"
                    : "Sample room photograph with full-height drapery"
                }
                fill
                sizes="(max-width: 1023px) 100vw, 60vw"
                className="object-cover"
                priority
                unoptimized={room.startsWith("blob:")}
              />
            </div>
          )}
          <div
            className="mt-5 flex flex-wrap gap-x-6 border-b border-solid border-[#dedbd2] pb-3"
            role="group"
            aria-label="Preview mode"
          >
            {[
              { id: "original", label: "Original photo" },
              { id: "concept", label: "Placement sketch" },
              { id: "render", label: "AI edit" },
            ].map((mode) => (
              <button
                key={mode.id}
                type="button"
                disabled={mode.id === "render" && !result}
                aria-pressed={view === mode.id}
                onClick={() => setView(mode.id as typeof view)}
                className="min-h-11 border-b border-solid border-transparent bg-transparent p-0 text-[11px] text-muted aria-pressed:border-ink aria-pressed:text-ink disabled:cursor-not-allowed disabled:opacity-40"
              >
                {mode.label}
              </button>
            ))}
          </div>
          <p className="mt-4 text-[10px] leading-[1.8] text-muted">
            {file
              ? file.name
              : "Reference room, already dressed with curtains. Upload your own room for an AI edit."}
          </p>
          <div className="my-5 flex items-center gap-4">
            <span className="text-[9px] uppercase tracking-[1px] text-muted">
              Or use a reference
            </span>
            {[images.living, images.studio].map((source, i) => (
              <button
                type="button"
                disabled={busy}
                key={source}
                aria-label={`Select sample room ${i + 1}`}
                onClick={() => {
                  setRoom(source);
                  setFile(null);
                  clearResult();
                  setView("original");
                  if (uploader.current) uploader.current.value = "";
                }}
                className="relative h-14 w-20 overflow-hidden border border-solid border-[#d2d1c5] bg-sand"
              >
                <NextImage
                  src={source}
                  alt=""
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              </button>
            ))}
            <button
              type="button"
              disabled={busy}
              onClick={useSample}
              className="grid h-11 w-11 place-items-center border-0 bg-transparent text-muted"
              aria-label="Reset to sample room"
            >
              <RotateCcw size={15} />
            </button>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <button
              onClick={drawToCanvas}
              disabled={busy}
              type="button"
              className="flex min-h-11 items-center gap-2 border-0 bg-transparent px-0 text-[11px] text-ink disabled:opacity-50"
            >
              <ArrowDownToLine size={15} /> Download placement sketch
            </button>
            {result && (
              <a
                href={result}
                download="dcorhome-ai-design.webp"
                className="flex min-h-11 items-center gap-2 text-[11px]"
              >
                <ArrowDownToLine size={15} />
                Download AI edit
              </a>
            )}
          </div>
          <DesignActions original={originalResult || room} result={result} selection={selection} designId={designId}/>
          {result && (
            <p
              role="status"
              className="border-l border-solid border-[#b2a18a] pl-3 text-[11px] leading-[1.8] text-muted"
            >
              Your design is ready. Compare with your original and save the
              edited image. AI results are illustrative and may alter room
              details.
            </p>
          )}
        </div>
        <aside className="min-w-0 border-t border-solid border-[#c9c9bc] pt-6">
          <fieldset
            disabled={busy}
            className="m-0 min-w-0 border-0 p-0 disabled:opacity-60"
          >
            <Eyebrow>YOUR DESIGN DIRECTION</Eyebrow>
            <div className="my-5 grid grid-cols-2 gap-3">{([['style','Overall direction',designOptions.styles],['curtainLength','Curtain length',designOptions.lengths],['fullness','Fullness',['1.5','2','2.5']]] as const).map(([key,label,options])=><label key={key} className="text-[12px] text-muted">{label}<select className="mt-2 h-11 w-full border border-solid border-[#d2d1c5] bg-paper px-2 text-[13px] text-ink" value={preferences[key]} onChange={e=>{setPreferences(p=>({...p,[key]:e.target.value}));clearResult();}}>{options.map(option=><option key={option}>{option}</option>)}</select></label>)}</div>
            <div className="my-6 border-y border-solid border-[#dedbd2] py-5 text-[12px] leading-relaxed text-muted"><p>{preferences.configuratorFabric || fabric.name} ? {heading} ? {pattern}</p><p>Main: {actualColor} ? Sheer: {selection.sheerColor}</p><p>Use ?Edit main and sheer configuration? above to adjust independent layers, materials, palettes and headings.</p></div>
            <details className="border-b border-solid border-[#dedbd2] py-6">
              <summary className="cursor-pointer py-2 text-[12px]">
                03 / Placement sketch controls
              </summary>
              <p className="text-[10px] leading-[1.8] text-muted">
                These controls adjust the optional schematic only. AI rendering
                uses your fabric, color, pattern and heading; exact sizing is
                agreed separately.
              </p>
              <div className="pt-3">
                {[
                  {
                    name: "Window horizontal position",
                    v: x,
                    set: setX,
                    min: 15,
                    max: 85,
                  },
                  {
                    name: "Curtain track width",
                    v: width,
                    set: setWidth,
                    min: 30,
                    max: 92,
                  },
                  {
                    name: "Distance from top",
                    v: top,
                    set: setTop,
                    min: 0,
                    max: 44,
                  },
                  {
                    name: "Curtain length",
                    v: length,
                    set: setLength,
                    min: 30,
                    max: 100 - top,
                  },
                  {
                    name: "Curtain opening",
                    v: open,
                    set: setOpen,
                    min: 8,
                    max: 86,
                  },
                ].map((s) => (
                  <label
                    key={s.name}
                    className="mb-4 block text-[10px] text-muted"
                  >
                    <span className="flex justify-between gap-3">
                      {s.name}
                      <output>{s.v}%</output>
                    </span>
                    <input
                      aria-label={s.name}
                      className="h-11 w-full accent-ink"
                      type="range"
                      min={s.min}
                      max={s.max}
                      value={s.v}
                      onChange={(e) => {
                        s.set(Number(e.target.value));
                        setView("concept");
                      }}
                    />
                  </label>
                ))}
              </div>
            </details>
            <div className="pt-6">
              <h3 className="mb-4 text-[12px] font-medium">
                04 / Create your edited photograph
              </h3>
              <p
                className="mb-4 text-[11px] leading-[1.85] text-muted"
                role="status"
              >
                {configured
                  ? file
                    ? "Ready to create an AI edit from your uploaded photograph."
                    : "AI rendering is connected. Upload your own photograph to begin."
                  : "AI visualization is currently unavailable. You can explore materials and save your design direction on this device."}
              </p>
              <button
                onClick={generate}
                disabled={!file || !configured || busy}
                type="button"
                className="inline-flex min-h-12 w-full items-center justify-center gap-3 bg-ink px-4 text-[11px] text-paper transition-colors hover:bg-[#40564a] disabled:cursor-not-allowed disabled:bg-[#d5d7cc] disabled:text-[#68715e]"
              >
                {busy ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Preparing your design…
                  </>
                ) : (
                  <>
                    <WandSparkles size={15} />
                    Generate AI design
                  </>
                )}
              </button>
              <p className="mb-0 mt-3 text-[9px] leading-[1.8] text-muted">
                Generation processes your uploaded image with the configured
                provider and may incur usage costs. Confirm final fabric,
                dimensions and installation with us.
              </p>
            </div>
          </fieldset>
          {error && (
            <p
              role="alert"
              className="mt-5 border-l-2 border-solid border-[#9b6a52] bg-[#f6eee5] p-4 text-[11px] leading-[1.8] text-[#835342]"
            >
              {error}
            </p>
          )}
        </aside>
      </Container>
      </>}
      <section className="border-t border-solid border-[#dedbd2] bg-cream py-16">
        <Container className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className={`mb-3 ${typography.section}`}>
              From an idea to your everyday.
            </h2>
            <p className={`mb-0 text-muted ${typography.body}`}>
              Share your direction with us. We’ll help refine the fabric and the
              fit.
            </p>
          </div>
          <ActionLink href="/contact">Discuss your design</ActionLink>
        </Container>
      </section>
    </>
  );
}
export default function StudioPage() {
  return (
    <Suspense
      fallback={
        <div className="grid min-h-[50vh] place-items-center text-[13px] text-muted">
          Preparing your studio…
        </div>
      }
    >
      <StudioContent />
    </Suspense>
  );
}
