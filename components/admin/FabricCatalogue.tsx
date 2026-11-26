"use client";
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { Plus, Search, RefreshCw, Download, Layers3, FileEdit, BookOpen, ImageIcon, MoreHorizontal, ArrowLeft } from 'lucide-react';
import schema from '@/lib/curtains/supplier-catalogue.schema.json';
import FabricExportModal from './FabricExportModal';
type RecordData = Record<string, unknown>;
type Draft = { id: string; name: string; payload: unknown; revision: number };
type Item = { id: string; name: string; record: RecordData; revision: number; status: 'draft' | 'published' };
type Rule = { type?: string; enum?: string[]; items?: { type?: string; enum?: string[] }; minimum?: number; maximum?: number };
const fields = schema.items.properties as Record<string, Rule>;
const basic = ['id', 'slug', 'name', 'category', 'categoryId', 'description', 'source', 'active'];
const control = 'mt-1.5 min-h-11 w-full min-w-0 rounded-lg border border-[#DFE4DA] bg-white px-3 py-2 text-sm outline-none focus:border-[#20372E]';
const secondary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[#DFE4DA] bg-white px-4 text-sm hover:bg-[#F5F6F2] disabled:opacity-50';
const primary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#20372E] px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50';
const title = (key: string) => key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase());
const parse = (text: string): RecordData | null => { try { const value: unknown = JSON.parse(text); return value && typeof value === 'object' && !Array.isArray(value) ? value as RecordData : null; } catch { return null; } };
function image(record: RecordData) { return Array.isArray(record.images) && typeof record.images[0] === 'string' ? record.images[0] : ''; }
function Picture({ record }: { record: RecordData }) { const src = image(record); return <div className="grid aspect-[4/3] w-full place-items-center overflow-hidden bg-[#F5F6F2]">{src ? <img src={src} alt="" className="h-full w-full object-cover"/> : <ImageIcon size={25} className="text-[#738377]"/>}</div>; }
function PreviewDialog({ item, close }: { item: Item; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => { const node = dialog.current!, previous = document.activeElement as HTMLElement | null; node.showModal(); return () => { node.close(); previous?.focus(); }; }, []);
  return <dialog ref={dialog} aria-labelledby="fabric-preview-title" onCancel={event => { event.preventDefault(); close(); }} className="m-auto w-[calc(100%-2rem)] max-w-md overflow-hidden rounded-xl border border-[#DFE4DA] bg-white p-0 text-[#20372E] backdrop:bg-black/40"><Picture record={item.record}/><div className="p-5"><h2 id="fabric-preview-title" className="text-lg font-medium">{item.name}</h2><p className="mt-1 text-sm text-[#738377]">{String(item.record.category || '')}</p><p className="mt-3 whitespace-pre-wrap break-words text-sm text-[#738377]">{String(item.record.description || '')}</p><button type="button" autoFocus className={`${secondary} mt-4`} onClick={close}>Close</button></div></dialog>;
}
export default function FabricCatalogue() {
  const [items, setItems] = useState<Item[]>([]), [published, setPublished] = useState<RecordData[]>([]), [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [query, setQuery] = useState(''), [category, setCategory] = useState('all'), [status, setStatus] = useState('all'), [exportOpen, setExportOpen] = useState(false);
  const [editing, setEditing] = useState(false), [editingId, setEditingId] = useState(''), [revision, setRevision] = useState(0), [json, setJson] = useState(''), [initial, setInitial] = useState(''), [preview, setPreview] = useState<Item | null>(null);
  const record = useMemo(() => parse(json), [json]), dirty = editing && json !== initial;
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/drafts?kind=fabric&all=1', { cache: 'no-store' }), data = await response.json();
      if (!response.ok) throw Error(data.error || 'Unable to load fabrics.');
      const originals = data.published as RecordData[], merged = new Map<string, Item>();
      for (const r of originals) if (typeof r.id === 'string') merged.set(r.id, { id: r.id, name: String(r.name || r.id), record: r, revision: 0, status: 'published' });
      for (const d of data.drafts as Draft[]) if (d.payload && typeof d.payload === 'object' && !Array.isArray(d.payload)) merged.set(d.id, { id: d.id, name: d.name, record: d.payload as RecordData, revision: d.revision, status: 'draft' });
      setPublished(originals); setItems([...merged.values()]);
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load().catch(e => setMessage(e.message)); }, [load]);
  useEffect(() => { if (!dirty) return; const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); }; const navigate = (event: MouseEvent) => { const target = event.target; if (!(target instanceof Element)) return; const link = target.closest('a[href]'); if (link && !window.confirm('Discard unsaved fabric changes?')) { event.preventDefault(); event.stopPropagation(); } }; window.addEventListener('beforeunload', warn); document.addEventListener('click', navigate, true); return () => { window.removeEventListener('beforeunload', warn); document.removeEventListener('click', navigate, true); }; }, [dirty]);
  function canLeave() { return !dirty || window.confirm('Discard unsaved fabric changes?'); }
  function open(item?: Item) {
    if (!canLeave()) return;
    const base = item?.record || { ...(published[0] || {}), id: '', slug: '', name: '' };
    const text = JSON.stringify(base, null, 2); setJson(text); setInitial(text); setEditingId(item?.id || ''); setRevision(item?.revision || 0); setMessage(''); setEditing(true);
  }
  function update(key: string, value: unknown) {
    if (!record) return;
    const next = { ...record }; if (value === undefined) delete next[key]; else next[key] = value;
    setJson(JSON.stringify(next, null, 2));
  }
  async function save(event: FormEvent) {
    event.preventDefault(); if (!record || busy) { if (!record) setMessage('Enter valid JSON before saving.'); return; }
    if (typeof record.id !== 'string' || typeof record.name !== 'string') { setMessage('A fabric ID and name are required.'); return; }
    if (editingId && record.id !== editingId) { setMessage('The stable ID of an existing fabric cannot be changed.'); return; }
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/admin/drafts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'fabric', id: record.id, name: record.name, payload: record, revision }) });
      const data = await response.json(); if (!response.ok) throw Error(data.error || 'Unable to save draft.');
      const saved = JSON.stringify(record, null, 2); setJson(saved); setInitial(saved); setEditingId(record.id); setRevision(revision + 1);
      try { await load(); setMessage('Draft saved. Export and review it before publishing.'); } catch { setMessage('Draft saved, but the catalogue could not be refreshed. Reload records to try again.'); }
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to save draft.'); } finally { setBusy(false); }
  }
  async function remove(item: Item) {
    if (!window.confirm('Remove this private draft? Published records are preserved.')) return;
    setBusy(true); setMessage('');
    try { const response = await fetch('/api/admin/drafts', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind: 'fabric', id: item.id, revision: item.revision }) }); const data = await response.json(); if (!response.ok) throw Error(data.error || 'Unable to remove draft.'); await load(); setMessage('Draft removed. Published records are preserved.'); }
    catch (e) { setMessage(e instanceof Error ? e.message : 'Unable to remove draft.'); } finally { setBusy(false); }
  }
  const categories = [...new Set(items.map(item => String(item.record.category || '')).filter(Boolean))].sort();
  const visible = items.filter(item => (status === 'all' || item.status === status) && (category === 'all' || item.record.category === category) && `${item.name} ${item.id} ${item.record.category || ''}`.toLowerCase().includes(query.trim().toLowerCase()));
  function field(key: string) {
    const rule = fields[key], value = record?.[key], required = schema.items.required.includes(key), readOnly = !!editingId && (key === 'id' || key === 'slug');
    if (!rule || !record) return null;
    if (key === 'colors' || key === 'patternRepeatCm') return null;
    let input;
    if (rule.enum) input = <select className={control} value={typeof value === 'string' ? value : ''} onChange={e => update(key, e.target.value)}><option value="">Select</option>{rule.enum.map(option => <option key={option} value={option}>{option}</option>)}</select>;
    else if (rule.type === 'boolean') input = <select className={control} value={value === undefined ? '' : String(value)} onChange={e => update(key, e.target.value === '' ? undefined : e.target.value === 'true')}><option value="">Default</option><option value="true">Yes</option><option value="false">No</option></select>;
    else if (rule.type === 'array') input = <textarea className={`${control} min-h-24`} value={Array.isArray(value) ? value.join('\n') : ''} onChange={e => update(key, e.target.value === '' ? [] : e.target.value.split('\n'))} placeholder="One value per line"/>;
    else if (key === 'description' || key === 'careInstructions') input = <textarea className={`${control} min-h-24`} value={typeof value === 'string' ? value : ''} onChange={e => update(key, e.target.value)}/>;
    else input = <input className={control} readOnly={readOnly} type={rule.type === 'number' ? 'number' : 'text'} step={rule.type === 'number' ? 'any' : undefined} min={rule.minimum} max={rule.maximum} value={typeof value === 'string' || typeof value === 'number' ? value : ''} onChange={e => update(key, rule.type === 'number' ? (e.target.value === '' ? undefined : Number(e.target.value)) : e.target.value)}/>;
    return <label key={key} className="block min-w-0 text-xs font-medium">{title(key)}{required ? ' *' : ''}{input}</label>;
  }
  const propertyKeys = Object.keys(fields).filter(key => !basic.includes(key) && key !== 'images' && key !== 'colors' && key !== 'patternRepeatCm');
  return <div className="min-w-0 space-y-6 text-[#20372E]"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-[10px] uppercase tracking-[.22em] text-[#738377]">Administration</p><h1 className="text-3xl font-medium tracking-tight">Fabric Catalogue</h1><p className="mt-2 text-sm text-[#738377]">Manage private fabric drafts and prepare catalogue changes for review.</p></div><div className="flex flex-wrap gap-2"><button type="button" className={secondary} onClick={() => setExportOpen(true)}><Download size={16}/>Export catalogue</button><button type="button" disabled={busy} className={secondary} onClick={() => void load().then(() => setMessage('Records reloaded.')).catch(e => setMessage(e.message))}><RefreshCw size={16}/>Reload records</button><button type="button" className={primary} onClick={() => open()}><Plus size={16}/>Add Fabric</button></div></div>
  {exportOpen && <FabricExportModal currentId={editing ? editingId : ''} close={() => setExportOpen(false)}/>}
  {message && <p role="status" className="rounded-lg border border-[#DFE4DA] bg-white p-3 text-sm">{message}</p>}
  {editing ? <><button type="button" className={secondary} disabled={busy} onClick={() => { if (canLeave()) { setEditing(false); setMessage(''); } }}><ArrowLeft size={16}/>Back to catalogue</button><form onSubmit={save} className="grid min-w-0 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]"><div className="min-w-0 space-y-4"><div className="rounded-xl border border-[#DFE4DA] bg-white p-5"><h2 className="text-lg font-medium">{editingId ? 'Edit Fabric' : 'Add Fabric'}</h2><p className="mt-1 text-xs text-[#738377]">Changes remain private drafts until reviewed and deployed.</p><h3 className="mb-4 mt-6 text-sm font-medium">Basic Information</h3>{record ? <div className="grid gap-4 sm:grid-cols-2">{basic.map(field)}</div> : <p role="alert" className="text-sm text-[#99463b]">Correct the JSON below to edit structured fields.</p>}</div><div className="rounded-xl border border-[#DFE4DA] bg-white p-5"><h3 className="mb-4 text-sm font-medium">Fabric Images</h3>{record && field('images')}<p className="mt-2 text-xs text-[#738377]">Use existing approved catalogue asset paths, one per line.</p></div><div className="rounded-xl border border-[#DFE4DA] bg-white p-5"><h3 className="mb-4 text-sm font-medium">Fabric Properties</h3>{record && <div className="grid gap-4 sm:grid-cols-2">{propertyKeys.map(field)}</div>}<p className="mt-4 text-xs text-[#738377]">Shade configurations and pattern repeat are available in Advanced Configuration.</p></div><details className="rounded-xl border border-[#DFE4DA] bg-white p-5"><summary className="cursor-pointer text-sm font-medium">Advanced JSON Configuration</summary><label className="mt-4 block text-xs font-medium">Full configuration<textarea value={json} onChange={e => setJson(e.target.value)} spellCheck={false} className={`${control} min-h-96 font-mono`} aria-invalid={!record}/></label><p className="mt-2 text-xs text-[#738377]">Edit nested shades, pattern repeat and all other configuration here. Structured changes preserve the rest of this object.</p></details><div className="flex flex-wrap gap-2"><button type="submit" className={primary} disabled={busy || !record}>{busy ? 'Saving?' : 'Save draft'}</button><button type="button" className={secondary} disabled={busy} onClick={() => { if (canLeave()) setEditing(false); }}>Cancel</button></div></div><aside className="min-w-0 overflow-hidden rounded-xl border border-[#DFE4DA] bg-white"><Picture record={record || {}}/><div className="p-4"><h2 className="break-words font-medium">{typeof record?.name === 'string' && record.name || 'Fabric preview'}</h2><p className="mt-1 break-words text-sm text-[#738377]">{typeof record?.category === 'string' ? record.category : ''}</p><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-[#738377]">{typeof record?.description === 'string' ? record.description : ''}</p></div></aside></form></> : <><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{([['Total Fabrics', items.length, Layers3], ['Draft Fabrics', items.filter(i => i.status === 'draft').length, FileEdit], ['Published Fabrics', published.length, BookOpen]] as const).map(([label,count,Icon]) => <div key={label} className="flex items-center justify-between gap-2 rounded-xl border border-[#DFE4DA] bg-white p-4"><div><p className="text-xs text-[#738377] sm:text-sm">{label}</p><p className="mt-2 text-2xl font-medium">{loading ? '?' : count}</p></div><Icon size={20} className="text-[#738377]"/></div>)}</div><div className="flex flex-wrap gap-3 rounded-xl border border-[#DFE4DA] bg-white p-4"><label className="relative min-w-0 flex-1 basis-full sm:basis-64"><span className="sr-only">Search fabrics</span><Search size={16} className="absolute left-3 top-3.5 text-[#738377]"/><input className={`${control} !mt-0 pl-10`} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search fabrics"/></label><label><span className="sr-only">Filter category</span><select className={`${control} !mt-0`} value={category} onChange={e => setCategory(e.target.value)}><option value="all">All categories</option>{categories.map(c => <option key={c} value={c}>{c}</option>)}</select></label><label><span className="sr-only">Filter status</span><select className={`${control} !mt-0`} value={status} onChange={e => setStatus(e.target.value)}><option value="all">All statuses</option><option value="draft">Draft</option><option value="published">Published</option></select></label></div>{loading ? <p role="status" className="text-sm text-[#738377]">Loading fabrics?</p> : !visible.length ? <p className="rounded-xl border border-[#DFE4DA] bg-white p-8 text-center text-sm text-[#738377]">No fabrics found.</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">{visible.map(item => <article key={item.id} className="min-w-0 rounded-xl border border-[#DFE4DA] bg-white"><div className="overflow-hidden rounded-t-xl"><Picture record={item.record}/></div><div className="p-4"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><h2 className="break-words font-medium">{item.name}</h2><p className="mt-1 text-xs text-[#738377]">{String(item.record.category || 'Unclassified')}</p></div><span className="rounded-md bg-[#E8F0E3] px-2 py-1 text-xs capitalize">{item.status}</span></div><div className="mt-4 flex items-center gap-2"><button type="button" className={primary} onClick={() => open(item)}>Edit Fabric</button><button type="button" className={secondary} onClick={() => setPreview(item)}>Preview</button><details className="relative ml-auto"><summary aria-label={`Actions for ${item.name}`} className="grid size-11 cursor-pointer list-none place-items-center rounded-lg hover:bg-[#F5F6F2]"><MoreHorizontal size={19}/></summary><div className="absolute right-0 z-10 w-44 rounded-lg border border-[#DFE4DA] bg-white p-1 shadow-lg"><button type="button" className="min-h-11 w-full px-3 text-left text-sm" onClick={() => open(item)}>Edit Fabric</button><button type="button" className="min-h-11 w-full px-3 text-left text-sm" onClick={() => setPreview(item)}>Preview</button>{item.revision > 0 && <button type="button" disabled={busy} className="min-h-11 w-full px-3 text-left text-sm text-[#99463b]" onClick={() => void remove(item)}>Delete draft</button>}</div></details></div></div></article>)}</div>}</>}
  {preview && <PreviewDialog item={preview} close={() => setPreview(null)}/>}</div>;
}
