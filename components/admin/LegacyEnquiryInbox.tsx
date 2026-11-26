'use client';
import { useEffect, useState } from 'react';
type Summary = { id: string; subject: string; createdAt: string; status: string };
type Detail = Summary & { text: string; note: string };
const control = 'mt-2 min-h-11 w-full rounded-lg border border-[#DFE4DA] bg-white p-3';
export default function LegacyEnquiryInbox() {
  const [emails, setEmails] = useState<Summary[]>([]), [detail, setDetail] = useState<Detail | null>(null);
  const [next, setNext] = useState<string>(), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  async function request(url: string, options?: RequestInit) {
    const response = await fetch(url, { cache: 'no-store', ...options }), data = await response.json();
    if (!response.ok) throw Error(data.error || 'Unable to load enquiries.'); return data;
  }
  async function perform(action: () => Promise<void>) {
    setBusy(true); setMessage('');
    try { await action(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  const load = (after?: string) => perform(async () => {
    const data = await request(`/api/admin/enquiries/history${after ? `?after=${after}` : ''}`);
    setEmails(previous => after ? [...new Map([...previous, ...data.emails as Summary[]].map(email => [email.id, email])).values()] : data.emails); setNext(data.next);
  });
  useEffect(() => { void load(); }, []);
  const open = (id: string) => perform(async () => { setDetail(null); setDetail(await request(`/api/admin/enquiries/history?id=${id}`)); });
  const save = () => perform(async () => {
    if (!detail) return;
    await request('/api/admin/enquiries/history', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: detail.id, status: detail.status, note: detail.note }) });
    setEmails(previous => previous.map(email => email.id === detail.id ? { ...email, status: detail.status } : email)); setMessage('Enquiry updated.');
  });
  return <div className="space-y-6"><h1 className="text-3xl font-medium">Product enquiries</h1><p className="max-w-3xl text-sm leading-7 text-muted">Website emails sent to sales@dcorhome.com appear here while retained by Resend. Track follow-up with private notes and status. Reply from the sales mailbox. Earlier database records remain preserved.</p><button type="button" disabled={busy} onClick={() => void load()} className="min-h-11 underline">Refresh</button><p role="status" className="text-sm">{busy ? 'Loading…' : message}</p><div className="grid gap-8 lg:grid-cols-2"><div className="space-y-3">{emails.map(email => <button type="button" disabled={busy} key={email.id} onClick={() => void open(email.id)} className="block min-h-20 w-full rounded-lg border border-[#DFE4DA] bg-white p-4 text-left hover:border-ink"><span className="block text-sm font-medium">{email.subject}</span><span className="mt-2 block text-xs text-muted">{new Date(email.createdAt).toLocaleDateString()} · {email.status}</span></button>)}{!busy && !emails.length && <p className="text-sm text-muted">No enquiries on this page.</p>}{next && <button type="button" disabled={busy} className="min-h-11 underline" onClick={() => void load(next)}>Load older emails</button>}</div>{detail && <form onSubmit={event => { event.preventDefault(); void save(); }} className="space-y-5"><h2 className="text-xl">{detail.subject}</h2><pre className="max-h-[32rem] overflow-y-auto whitespace-pre-wrap break-words rounded-lg bg-white p-5 font-sans text-sm leading-7">{detail.text}</pre><label className="block text-sm">Status<select className={control} value={detail.status} onChange={event => setDetail({ ...detail, status: event.target.value })}><option value="new">New</option><option value="in-progress">In progress</option><option value="closed">Closed</option></select></label><label className="block text-sm">Private notes<textarea className={`${control} min-h-32`} maxLength={3000} value={detail.note} onChange={event => setDetail({ ...detail, note: event.target.value })}/></label><button disabled={busy} className="min-h-11 rounded-lg bg-ink px-6 text-paper disabled:opacity-50">Save follow-up</button></form>}</div></div>;
}
