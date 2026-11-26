'use client';
import { useCallback, useEffect, useState } from 'react';
import { defaultDesign } from '@/lib/manual-visualizer/model';
import FabricExportModal from './FabricExportModal';
type Draft = { id: string; name: string; payload: unknown; revision: number };
type Fabric = { id: string; name: string } & Record<string, unknown>;
const control = 'min-h-11 w-full rounded-lg border border-[#dce1d7] bg-white p-3 text-sm focus:outline-ink';
export default function ContentDrafts({ kind }: { kind: 'fabric' | 'design' }) {
  const [drafts, setDrafts] = useState<Draft[]>([]), [published, setPublished] = useState<Fabric[]>([]);
  const [id, setId] = useState(''), [name, setName] = useState(''), [payload, setPayload] = useState(''), [revision, setRevision] = useState(0);
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [exportOpen, setExportOpen] = useState(false);
  const load = useCallback(async () => {
    const response = await fetch(`/api/admin/drafts?kind=${kind}`, { cache: 'no-store' });
    const data = await response.json(); if (!response.ok) throw Error(data.error || 'Unable to load drafts.');
    setDrafts(data.drafts); setPublished(data.published); return data.drafts as Draft[];
  }, [kind]);
  useEffect(() => { void load().catch(error => setMessage(error.message)); }, [load]);
  function select(value: string) {
    const draft = drafts.find(d => d.id === value), record = published.find(d => d.id === value);
    setId(value); setName(draft?.name || record?.name || ''); setRevision(draft?.revision || 0);
    setPayload(JSON.stringify(draft?.payload || record || (kind === 'design' ? defaultDesign : published[0] || {}), null, 2)); setMessage('');
  }
  async function mutate(remove = false) {
    setBusy(true); setMessage('');
    try {
      let parsed: unknown; try { parsed = JSON.parse(payload); } catch { throw Error('Enter valid JSON before saving.'); }
      if (kind === 'fabric' && parsed && typeof parsed === 'object') parsed = { ...parsed, id, slug: id, name };
      const response = await fetch('/api/admin/drafts', { method: remove ? 'DELETE' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, id, name, payload: parsed, revision }) });
      const data = await response.json(); if (!response.ok) throw Error(data.error || 'Unable to save draft.');
      const fresh = await load(); setRevision(fresh.find(d => d.id === id)?.revision || 0);
      if (remove) { setId(''); setName(''); setPayload(''); }
      setMessage(remove ? 'Draft removed. Published records are preserved.' : 'Draft saved. Export and review it before publishing.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  const choices = new Map(published.map(record => [record.id, record.name])); for (const draft of drafts) choices.set(draft.id, `${draft.name} · draft`);
  return <div className="space-y-6"><h1 className="text-3xl font-medium">{kind === 'fabric' ? 'Fabric' : 'Curtain design'} drafts</h1><p className="max-w-3xl text-sm leading-7 text-muted">Save and manage private drafts here. Public fabrics and Studio options are published through the existing repository review and deployment workflow. Export fabric changes to data/catalogue/fabrics.json; curtain designs export as named configurations for review.</p>
    <div className="flex flex-wrap gap-3 rounded-xl border border-[#DFE4DA] bg-white p-4">{kind === 'fabric' ? <button type="button" className="inline-flex min-h-11 items-center rounded-lg border border-[#DFE4DA] px-4 text-sm" onClick={() => setExportOpen(true)}>Export catalogue</button> : <a className="inline-flex min-h-11 items-center rounded-lg border border-[#DFE4DA] px-4 text-sm" href="/api/admin/drafts?kind=design&export=1">Export designs</a>}<button type="button" className="min-h-11 rounded-lg border border-[#DFE4DA] px-4 text-sm" disabled={busy} onClick={() => void load().then(() => setMessage('Reloaded. Select the record again to edit its latest revision.')).catch(e => setMessage(e.message))}>Reload records</button></div>
    {exportOpen && <FabricExportModal currentId={id} close={() => setExportOpen(false)}/>}
    <label className="block text-sm">Open a record<select className={`${control} mt-2`} value={id && choices.has(id) ? id : ''} onChange={event => select(event.target.value)} disabled={busy}><option value="">New draft</option>{[...choices].map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    <form className="space-y-5 rounded-xl border border-[#DFE4DA] bg-white p-5 sm:p-6" onSubmit={event => { event.preventDefault(); void mutate(); }}><div className="grid gap-5 sm:grid-cols-2"><label className="text-sm">Stable ID<input className={`${control} mt-2`} value={id} readOnly={revision > 0} required pattern="[a-z0-9][a-z0-9-]{1,59}" onChange={e => setId(e.target.value)}/></label><label className="text-sm">Name<input className={`${control} mt-2`} value={name} required minLength={2} maxLength={100} onChange={e => setName(e.target.value)}/></label></div><label className="block text-sm">Configuration JSON<textarea className={`${control} mt-2 min-h-96 font-mono`} value={payload} required spellCheck={false} onChange={e => setPayload(e.target.value)}/></label><p className="text-xs leading-6 text-muted">Existing schemas and approved local assets are validated on save. To add a record, select New draft and use an existing configuration as a starting point.</p><div className="flex flex-wrap gap-4"><button type="submit" disabled={busy} className="min-h-11 rounded-lg bg-ink px-6 text-paper disabled:opacity-50">Save draft</button>{kind === 'design' && <button type="button" disabled={busy} className="min-h-11 underline" onClick={() => setPayload(JSON.stringify(defaultDesign, null, 2))}>Use starter design</button>}{revision > 0 && <button type="button" disabled={busy} className="min-h-11 text-red-800 underline" onClick={() => { if (window.confirm('Remove this private draft? Published records are preserved.')) void mutate(true); }}>Delete draft</button>}</div></form><p role="status" className="text-sm leading-7">{message}</p>
  </div>;
}
