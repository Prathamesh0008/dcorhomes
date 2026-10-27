"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import PageIntro from "@/components/editorial/PageIntro";
import ActionLink from "@/components/ui/ActionLink";
import Container from "@/components/ui/Container";
import { localDesigns, deleteLocalDesign, type LocalDesign } from "@/lib/local-designs";
import { useFabricRecords } from "@/components/curtains/FabricCatalogueProvider";
import { readManual, manualSummary } from "@/lib/curtains/manual-config";
import { typography } from "@/lib/typography";
import ImportLocalDesigns from '@/components/curtains/manual-visualizer/ImportLocalDesigns';
import ManualSavedDesigns from '@/components/curtains/manual-visualizer/ManualSavedDesigns';
export default function Designs() {
    const records = useFabricRecords();
    const [manualCount,setManualCount]=useState<number|null>(null);
    const [local, setLocal] = useState<LocalDesign[]>([]), [loaded, setLoaded] = useState(false), [message, setMessage] = useState(''), [previews, setPreviews] = useState<Record<string, string>>({});
    useEffect(() => { let active = true; const urls: string[] = []; (async () => { try {
        const saved = (await localDesigns()).filter(item=>!item.visualizer&&item.original);
        if (!active)
            return;
        setLocal(saved);
        setPreviews(Object.fromEntries(saved.map(d => { const url = URL.createObjectURL((d.result || d.original)!); urls.push(url); return [d.id, url]; })));
    }
    catch {
        if (active)
            setMessage('Browser storage may be unavailable. Download important images to keep a separate copy.');
    }
    finally {
        if (active)
            setLoaded(true);
    } })(); return () => { active = false; urls.forEach(u => URL.revokeObjectURL(u)); }; }, []);
    return <><PageIntro eyebrow="YOUR PERSONAL CURTAIN EDIT" title={<>Ideas worth <em className="font-serif font-normal text-bronze">keeping.</em></>} description="A collection of your favourite directions. Revisit a fabric palette, return to a room design, and take the next step when you are ready." image="/images/living-drapery.jpg" alt="Curtain folds catching warm natural light"/><Container as="section" className="py-12 md:py-16"><ImportLocalDesigns/><ManualSavedDesigns onCount={setManualCount}/><p className={`max-w-2xl text-muted ${typography.body}`}>Designs are saved only in this browser/device. Clearing browser storage removes them; there is no account-wide or cross-device synchronization. Earlier cloud designs have not been deleted: contact Dcorhome for a private export and import it here.</p><Link href="/studio" className="inline-flex min-h-11 items-center border-b border-solid border-ink text-[13px]">Create a design</Link><p role="status" className="text-[13px] text-muted">{message}</p><div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">{local.map(d => ({ ...d, local: true })).map(d => <article key={d.id} className="min-w-0 border-b border-solid border-[#dedbd2] pb-6"><div className="relative aspect-[4/3] overflow-hidden bg-sand">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={previews[d.id]} alt="Saved curtain design" className="h-full w-full object-cover"/></div><p className="mb-2 mt-5 text-[15px] font-medium">{d.selection.style} · {d.selection.roomType}</p><p className="text-[12px] text-muted">{d.selection.fabric} · {d.local ? 'On this device' : 'Private session'}</p><p className="text-[13px] leading-6 text-muted">{records.find(f=>f.id===d.selection.fabric)?.colors.find(c=>c.id===d.selection.color || c.hexPreview===d.selection.color)?.name || d.selection.color}{d.selection.layers ? ` / ${d.selection.layers}` : ""}<br /><time dateTime={new Date(d.created).toISOString()}>{new Date(d.created).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</time></p><div className="flex flex-wrap gap-x-5 gap-y-2 text-[14px]"><Link className="flex min-h-11 items-center underline" href={`/studio?${'local'}=${d.id}`}>Reopen</Link><a href={previews[d.id]} download={`dcorhome-${d.id}`} className="flex min-h-11 items-center underline">Download</a><Link href={`/contact?${new URLSearchParams({ interest: "Saved curtain design",  message: d.selection.manual ? manualSummary(readManual(d.selection, records), records) : `Please help me with my saved curtain direction: ${d.selection.fabric}, shade ${d.selection.color}, ${d.selection.heading}, ${d.selection.roomType}.` })}`} className="flex min-h-11 items-center underline">Enquire</Link><button className="min-h-11 bg-transparent text-ink underline" onClick={async () => { if (!window.confirm("Delete this saved design? This cannot be undone."))
        return; try {
        if (d.local) {
            await deleteLocalDesign(d.id);
            setLocal(a => a.filter(x => x.id !== d.id));
        }
        setMessage('Design deleted.');
    }
    catch (e) {
        setMessage(e instanceof Error ? e.message : 'Deletion failed.');
    } }}>Delete</button></div></article>)}</div>{!loaded && <p role="status" className="py-10 text-[15px] text-muted">Gathering your saved designs...</p>}{loaded && manualCount===0 && !local.length && <div className="grid items-center gap-8 bg-cream p-7 md:grid-cols-[.7fr_1fr] md:p-12"><div className="flex aspect-square items-center justify-center border border-solid border-[#dadbd3] p-8"><span className="font-serif text-[90px] italic text-bronze">Your edit.</span></div><div><p className="text-[12px] uppercase tracking-[2px] text-bronze">ROOM FOR INSPIRATION</p><h2 className={typography.section}>Every room begins with an idea.</h2><p className="mb-6 text-[16px] leading-7 text-muted">Save a curtain direction from the studio, then come back to compare your favourites. Local designs stay on this device.</p><ActionLink href="/studio">Create Your First Design</ActionLink></div></div>}</Container></>;
}
