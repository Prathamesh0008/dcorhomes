"use client";
import { useFabricRecords, useShowroomWhatsApp } from '@/components/curtains/FabricCatalogueProvider';
import { composerTransfer, validateComposer } from "@/lib/curtains/composer";
import { whatsappHref } from "@/lib/curtains/enquiry";
import Link from "next/link";
import WindowAreaSelector from "@/components/curtains/WindowAreaSelector";
import { validWindowArea, type WindowArea } from "@/lib/visualizer-area";
import StudioVisualizer from "@/components/curtains/StudioVisualizer";
import { fabricFor, manualSelection, manualSummary, readManual, storageKey, type ManualConfig } from '@/lib/curtains/manual-config';
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
  const [windowArea,setWindowArea]=useState<WindowArea|null>(null),[validating,setValidating]=useState(false);
  const generateLock=useRef(false),uploadVersion=useRef(0);
  const [photoRatio,setPhotoRatio]=useState(4/3);
  const records=useFabricRecords(),whatsappNumber=useShowroomWhatsApp();
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
  const [preferences,setPreferences]=useState<DesignSelection>({...defaultSelection,...Object.fromEntries([...query.entries()].filter(([k])=>['style','roomType','curtainLength','fullness','layers','sheerColor','configuratorFabric','configuratorStyle','manual','sheerFabric','sheerHeading','mainEnabled','sheerEnabled','inspirationPattern'].includes(k)))});
  const [designId,setDesignId]=useState('');
  const [originalResult,setOriginalResult]=useState('');
  const generation=useRef<AbortController | null>(null);
  useEffect(()=>{fetch('/api/session').catch(()=>{});return()=>generation.current?.abort();},[]);
  useEffect(()=>{let cancelled=false;const urls:string[]=[];
    async function restore(){try{let saved;
      if(query.get('local')){const record=(await localDesigns()).find(r=>r.id===query.get('local'));if(!record)return;const original=URL.createObjectURL(record.original);urls.push(original);const edited=record.result?URL.createObjectURL(record.result):'';if(edited)urls.push(edited);saved={selection:record.selection,original,result:edited,id:''};}
      else if(query.get('design')){const r=await fetch('/api/designs/'+encodeURIComponent(query.get('design')!));if(!r.ok)throw Error('This private design is unavailable in your current session.');const data=await r.json();saved={selection:data.selection,original:`/api/designs/${data.id}/image?type=original`,result:`/api/designs/${data.id}/image`,id:data.id};}
      if(saved&&!cancelled){const restoredPhoto=await fetch(saved.original).then(r=>{if(!r.ok)throw Error("Original image unavailable.");return r.blob();});if(cancelled)return;const bitmap=await createImageBitmap(restoredPhoto);setPhotoRatio(bitmap.width/bitmap.height);bitmap.close();setFile(new File([restoredPhoto],"saved-room.webp",{type:restoredPhoto.type}));setPreferences(saved.selection);if(saved.selection.windowArea){try{const a=JSON.parse(saved.selection.windowArea);if(validWindowArea(a))setWindowArea(a);}catch{}}setFabricId(saved.selection.fabric);setHeading(saved.selection.heading);setPattern(saved.selection.pattern);setColor(saved.selection.color);setRoom(saved.original);setOriginalResult(saved.original);setResult(saved.result);setDesignId(saved.id);setView(saved.result?'render':'original');}
    }catch(e){if(!cancelled)setError(e instanceof Error?e.message:'Could not reopen design.');}}restore();return()=>{cancelled=true;urls.forEach(u=>URL.revokeObjectURL(u));};
  },[query]);
  const selection={...preferences,windowArea:windowArea?JSON.stringify(windowArea):undefined,fabric:fabricId,heading,pattern,color:actualColor,sheerColor:preferences.sheerColor || '#f3efdf'};
  const previewConfig=readManual(selection,records),previewMain=fabricFor(previewConfig.mainFabric,'main',records),previewSheer=fabricFor(previewConfig.sheerFabric,'sheer',records);
  const enquirySummary=`Style: ${selection.style} / Pattern: ${selection.pattern} / Room: ${selection.roomType}\n${manualSummary(readManual(selection,records),records)}`;
  const whatsapp=whatsappHref(whatsappNumber,enquirySummary);
  const patterns=(curtainFabrics.find(f=>f.name===preferences.configuratorFabric) || curtainFabrics.find(f=>f.catalogueId===fabric.id) || curtainFabrics.find(f=>f.name===fabric.category))?.patterns || designOptions.patterns;
  const [studioMode,setStudioMode]=useState<'sample'|'upload'>(query.get('mode')==='upload'||query.get('design')||query.get('local')?'upload':'sample');
  function changeMode(mode:'sample'|'upload'){setStudioMode(mode);const params=new URLSearchParams(window.location.search);params.set('mode',mode);window.history.replaceState(window.history.state,'',window.location.pathname+'?'+params);window.scrollTo({top:0,behavior:'instant'});}
  function chooseStyle(style:string){
    setPreferences(current=>({...current,style}));
    clearResult();
    const params=new URLSearchParams(window.location.search);
    params.set('style',style);
    window.history.replaceState(window.history.state,'',window.location.pathname+'?'+params);
  }
  function configure(next:ManualConfig){const transferred=manualSelection(next,records);setPreferences(p=>({...p,...transferred}));setFabricId(transferred.fabric!);setHeading(transferred.heading!);setPattern(transferred.pattern!);setColor(transferred.color!);clearResult();try{localStorage.setItem(storageKey,JSON.stringify(next));const params=new URLSearchParams(window.location.search);for(const [key,value]of Object.entries(transferred))params.set(key,value);if(params.toString()!==window.location.search.slice(1))window.history.replaceState(window.history.state,'',window.location.pathname+'?'+params.toString());}catch{}}
  useEffect(()=>{
    if(query.get('design')||query.get('local'))return;
    const current=readManual(Object.fromEntries(query.entries()),records);
    if(query.get('composer')==='1'){
      const intent=validateComposer({style:query.get('style')||undefined,pattern:query.get('inspirationPattern')||undefined,room:current.room});
      configure(composerTransfer(intent,current,records).manual);
      setPreferences(p=>({...p,style:intent.style,inspirationPattern:intent.pattern}));
    }else configure(current);
  },[query]);
  function useAvailablePattern(){
    setPreferences(p=>({...p,inspirationPattern:undefined}));
    const params=new URLSearchParams(window.location.search);
    params.delete('inspirationPattern');params.delete('composer');
    window.history.replaceState(window.history.state,'',window.location.pathname+'?'+params);
  }


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
  const [availability,setAvailability]=useState('Checking preview availability.');
  const [retentionDays,setRetentionDays]=useState(30);
  const privateUpload=useRef<{file:File;id:string}|null>(null);
  const attempt=useRef<{signature:string;id:string}|null>(null);
  async function discardUpload(){const old=privateUpload.current;privateUpload.current=null;attempt.current=null;if(old)await fetch('/api/visualizer/uploads/'+old.id,{method:'DELETE'}).catch(()=>{});}
  useEffect(() => {
    fetch("/api/visualizer/generate")
      .then((r) => r.json())
      .then((data) => {setConfigured(data.configured === true);setAvailability(data.reason||'');setRetentionDays(data.retentionDays||30);})
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
    if(busy||validating)return;
    const version=++uploadVersion.current;
    if(!['image/png','image/jpeg','image/webp'].includes(incoming.type)||incoming.size===0||incoming.size>3*1024*1024){setError('Choose a JPG, PNG or WebP photograph smaller than 3 MB.');return;}
    setValidating(true);
    try{const bitmap=await createImageBitmap(incoming);const ratio=bitmap.width/bitmap.height;const valid=bitmap.width>=256&&bitmap.height>=256&&bitmap.width*bitmap.height<=24000000;bitmap.close();if(!valid)throw Error('Use an image at least 256px per side and at most 24 megapixels.');
      if(version!==uploadVersion.current)return;void discardUpload();setPhotoRatio(ratio);setView('original');setRoom(URL.createObjectURL(incoming));setFile(incoming);setWindowArea(null);clearResult();setError('');
    }catch(e){setError(e instanceof Error?e.message:'This image is corrupted or unsupported.');}finally{if(version===uploadVersion.current)setValidating(false);}
  }
  function upload(e:ChangeEvent<HTMLInputElement>){const incoming=e.target.files?.[0];if(incoming)void acceptFile(incoming);e.target.value='';}
  function useSample() {
    uploadVersion.current++;setValidating(false);void discardUpload();
    setView("original");
    setRoom(images.living);
    setFile(null);
    setWindowArea(null);
    clearResult();
    setError("");
    if (uploader.current) uploader.current.value = "";
  }
  async function generate() {
    if (!file || !configured || busy || validating || !validWindowArea(windowArea) || generateLock.current) return;
    generateLock.current=true;
    generation.current=new AbortController();
    setBusy(true);
    setError("");
    clearResult();
    try {
      if(privateUpload.current?.file!==file){
        const data=new FormData();data.append('image',file);
        const uploaded=await fetch('/api/visualizer/upload',{method:'POST',body:data,signal:generation.current.signal});
        const photo=await uploaded.json();if(!uploaded.ok)throw Error(photo.error||'Your room photo could not be uploaded.');
        privateUpload.current={file,id:photo.id};
      }
      const body={uploadId:privateUpload.current.id,windowArea,manual:previewConfig,style:selection.style};
      const signature=JSON.stringify(body);
      if(attempt.current?.signature!==signature)attempt.current={signature,id:crypto.randomUUID()};
      const requestId=attempt.current.id;
      const response=await fetch('/api/visualizer/generate',{method:'POST',headers:{'Content-Type':'application/json','Idempotency-Key':requestId},body:signature,signal:generation.current.signal});
      let payload=await response.json();
      // Polling reads status only; it never starts another provider request.
      if(response.status===202){
        for(let tries=0;tries<60&&payload.status==='processing';tries++){
          await new Promise(resolve=>setTimeout(resolve,2000));
          if(generation.current.signal.aborted)throw Error('Preview check stopped.');
          const status=await fetch('/api/visualizer/generations/'+requestId,{signal:generation.current.signal});payload=await status.json();
        }
      }
      if(payload.status!=='completed'){
        if(payload.status==='failed')attempt.current=null;
        throw Error(payload.error||(payload.status==='processing'?'Your preview is still being prepared. Press Generate to check the same request.':'Unable to generate your design right now.'));
      }
      if(typeof payload.result!=='string'||!payload.id)throw Error('The service returned no valid design.');
      setResult(payload.result);setDesignId(payload.id);setOriginalResult(payload.original);
      attempt.current=null;
      setView("render");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to complete the preview.",
      );
    } finally {
      generateLock.current=false;
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
        <Container><Eyebrow>THE DCORHOME DESIGN STUDIO</Eyebrow><h1 className={`mb-4 mt-5 ${typography.page}`}>Your room. <em className="font-serif font-normal text-[#97836b]">Considered anew.</em></h1><p className={`mb-0 max-w-[580px] text-muted ${typography.body}`}>A photograph, a material, a new perspective. Explore your choices at your own pace, then let us help with the details.</p></Container>
      </section>
      <Container className="flex flex-wrap gap-3 py-5" aria-label="Visualizer modes"><button type="button" aria-pressed={studioMode==='sample'} disabled={busy} onClick={()=>changeMode('sample')} className="min-h-12 rounded-full border border-solid border-[#b3b7a8] bg-transparent px-5 text-[15px] aria-pressed:bg-ink aria-pressed:text-paper">Sample preview</button><button type="button" aria-pressed={studioMode==='upload'} disabled={busy} onClick={()=>changeMode('upload')} className="min-h-12 rounded-full border border-solid border-[#b3b7a8] bg-transparent px-5 text-[15px] aria-pressed:bg-ink aria-pressed:text-paper">Room photo ? AI on hold</button></Container>
      {studioMode==='sample' ? <section className="bg-ink py-8 md:py-12"><Container><StudioVisualizer selection={selection} onManualChange={configure} onStyleChange={chooseStyle} onUseAvailablePattern={useAvailablePattern} onTryRoom={()=>changeMode('upload')}/></Container></section> : <>
      <section className="bg-ink py-5 text-paper"><Container><details><summary className="min-h-11 cursor-pointer py-3 text-[16px]">01 / Review your curtain choices</summary><fieldset disabled={busy} className="m-0 min-w-0 border-0 p-0"><StudioVisualizer selection={selection} onManualChange={configure} onStyleChange={chooseStyle} onUseAvailablePattern={useAvailablePattern} onTryRoom={()=>changeMode('upload')}/></fieldset></details></Container></section>
      <Container
        as="section"
        className="grid items-start gap-10 py-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,.85fr)] lg:gap-12 lg:py-14"
      >
        <div className="min-w-0 lg:sticky lg:top-[110px]" onDragOver={event=>event.preventDefault()} onDrop={event=>{event.preventDefault();const incoming=event.dataTransfer.files[0];if(incoming)void acceptFile(incoming);}}>
          <p className="text-[12px] leading-relaxed text-muted">AI room generation is on hold. You can explore fabrics and combinations in the working sample preview. Room photos can be selected locally (JPG, PNG or WebP, up to 3 MB); no AI generation is available.</p>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <span className="text-[13px] uppercase tracking-[1.5px] text-muted">
              {result && view === "render"
                ? "AI-edited photograph"
                : view === "concept"
                  ? "Illustrative placement sketch"
                  : "Original photograph"}
            </span>
            <button
              disabled={busy||validating}
              type="button"
              onClick={() => uploader.current?.click()}
              className="flex min-h-11 items-center gap-2 border-0 bg-transparent p-0 text-[15px] text-ink disabled:opacity-50"
            >
              <ImagePlus size={15} />{" "}
              {validating ? "Checking photograph..." : file ? "Replace photograph" : "Upload your room"}
            </button>
          </div>
          {file&&<button type="button" disabled={busy} onClick={useSample} className="mb-4 min-h-11 bg-transparent px-0 text-[14px] underline">Remove photograph</button>}
          <input
            ref={uploader}
            className="sr-only"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            aria-label="Upload your room photograph"
            onChange={upload}
          />
          {validating&&<p role="status" className="bg-cream p-4 text-[15px]">Checking your photograph...</p>}
          {result && view === "render" ? (
            <CurtainComparison
              aspectRatio={photoRatio}
              before={originalResult || room}
              after={result}
              caption="AI-edited image compared with your original. Review architectural details before deciding."
              afterLabel="AI edit"
            />
          ) : file && view === "original" ? (
            <WindowAreaSelector key={room} src={room} value={windowArea} disabled={busy} onChange={area=>{setWindowArea(area);clearResult();}}/>
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
                className="min-h-11 border-b border-solid border-transparent bg-transparent p-0 text-[15px] text-muted aria-pressed:border-ink aria-pressed:text-ink disabled:cursor-not-allowed disabled:opacity-40"
              >
                {mode.label}
              </button>
            ))}
          </div>
          <p className="mt-4 text-[14px] leading-[1.8] text-muted">
            {file
              ? file.name
              : "Reference room, already dressed with curtains. Upload your own room for an AI edit."}
          </p>
          <div className="my-5 flex items-center gap-4">
            <span className="text-[13px] uppercase tracking-[1px] text-muted">
              Or use a reference
            </span>
            {[images.living, images.studio].map((source, i) => (
              <button
                type="button"
                disabled={busy}
                key={source}
                aria-label={`Select sample room ${i + 1}`}
                onClick={() => {
                  void discardUpload();
                  setRoom(source);
                  setFile(null);
                  setWindowArea(null);
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
              className="flex min-h-11 items-center gap-2 border-0 bg-transparent px-0 text-[15px] text-ink disabled:opacity-50"
            >
              <ArrowDownToLine size={15} /> Download placement sketch
            </button>
            {result && (
              <a
                href={result}
                download="dcorhome-ai-design.webp"
                className="flex min-h-11 items-center gap-2 text-[15px]"
              >
                <ArrowDownToLine size={15} />
                Download AI edit
              </a>
            )}
          </div>
          <p className="mt-5 text-[14px] leading-7 text-muted">AI-generated preview for design inspiration. Actual fabric color, folds and fit may vary. Preview is illustrative and intended to help visualize curtain direction, layering, and color mood. Final physical appearance may vary.</p>
          <div className="my-5 border-y border-solid border-[#dedbd2] py-5"><p className="mb-2 text-[12px] uppercase tracking-[2px] text-bronze">YOUR CURTAIN DESIGN</p><p className="m-0 text-[15px] leading-7">{selection.style} / {selection.pattern} / {selection.roomType}<br/>Main curtain: {previewConfig.mainEnabled?`${previewMain.name} / ${previewMain.colors.find(c=>c.id===previewConfig.mainColor)?.name}`:'Not included'}<br/>Sheer curtain: {previewConfig.sheerEnabled?`${previewSheer.name} / ${previewSheer.colors.find(c=>c.id===previewConfig.sheerColor)?.name}`:'Not included'}</p></div>
          <DesignActions original={originalResult || room} result={result} selection={selection} designId={designId}/>
          {result&&<div className="mt-5 flex flex-wrap gap-3"><Link href={`/contact?${new URLSearchParams({designId,interest:'AI curtain preview quotation',room:selection.roomType,message:enquirySummary})}`} className="inline-flex min-h-12 items-center justify-center bg-ink px-6 text-[15px] text-paper">Request a Quote</Link>{whatsapp&&<a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center border-b border-solid border-ink px-3 text-[15px]">Enquire on WhatsApp</a>}</div>}
          {result && (
            <p
              role="status"
              className="border-l border-solid border-[#b2a18a] pl-3 text-[15px] leading-[1.8] text-muted"
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
            <details><summary className="min-h-11 cursor-pointer py-3 text-[16px]">Advanced Customization</summary>
            <div className="my-5 grid grid-cols-2 gap-3">{([['style','Overall direction',designOptions.styles],['curtainLength','Curtain length',designOptions.lengths],['fullness','Fullness',['1.5','2','2.5']]] as const).map(([key,label,options])=><label key={key} className="text-[12px] text-muted">{label}<select className="mt-2 h-11 w-full border border-solid border-[#d2d1c5] bg-paper px-2 text-[13px] text-ink" value={preferences[key]} onChange={e=>{if(key==='curtainLength'||key==='fullness')configure({...readManual(selection,records),[key]:e.target.value});else{setPreferences(p=>({...p,[key]:e.target.value}));clearResult();}}}>{options.map(option=><option key={option}>{option}</option>)}</select></label>)}</div>
            <details className="border-b border-solid border-[#dedbd2] py-6">
              <summary className="cursor-pointer py-2 text-[12px]">
                Optional placement sketch
              </summary>
              <p className="text-[14px] leading-[1.8] text-muted">
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
                    className="mb-4 block text-[14px] text-muted"
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
            </details>
            <div className="pt-6">
              <h3 className="mb-4 text-[12px] font-medium">
                03 / Preview your curtains
              </h3>
              <p
                className="mb-4 text-[15px] leading-[1.85] text-muted"
                role="status"
              >
                {configured
                  ? file
                    ? validWindowArea(windowArea) ? "Your photograph and window area are ready. Generate when you are happy with your curtain choices." : "Mark your window area on the photograph before generating."
                    : "AI rendering is connected. Upload your own photograph to begin."
                  : `${availability} You can still explore and save your design direction on this device.`}
              </p>
              <button
                onClick={generate}
                disabled={!file || !configured || busy || validating || !validWindowArea(windowArea)}
                type="button"
                className="inline-flex min-h-12 w-full items-center justify-center gap-3 bg-ink px-4 text-[15px] text-paper transition-colors hover:bg-[#40564a] disabled:cursor-not-allowed disabled:bg-[#d5d7cc] disabled:text-[#68715e]"
              >
                {busy ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Preparing your design…
                  </>
                ) : (
                  <>
                    <WandSparkles size={15} />
                    {result ? "Regenerate My Room Preview" : "Generate My Room Preview"}
                  </>
                )}
              </button>
              <p className="mb-0 mt-3 text-[13px] leading-[1.8] text-muted">
                Generate sends your photo to our image provider. Unused uploads expire after 24 hours; previews expire after {retentionDays} days. Delete saved previews in My designs. <Link href="/privacy" className="underline">Photo privacy</Link>. Confirm final fabric, dimensions and installation with us.
              </p>
            </div>
          </fieldset>
          {error && (
            <p
              role="alert"
              className="mt-5 border-l-2 border-solid border-[#9b6a52] bg-[#f6eee5] p-4 text-[15px] leading-[1.8] text-[#835342]"
            >
              {error}
            </p>
          )}
        </aside>
      </Container>
      </>}
      {studioMode==='upload'&&<section className="border-t border-solid border-[#dedbd2] bg-cream py-16">
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
          <ActionLink href={`/contact?${new URLSearchParams({interest:'Curtain quotation',message:`Style: ${selection.style}\n${manualSummary(readManual(selection,records),records)}`}).toString()}`}>Discuss your design</ActionLink>
        </Container>
      </section>}
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
