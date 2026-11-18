'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { enquiryStatuses, enquiryStatusLabels, type CustomerEmailState, type EnquirySummary, type EnquiryDetail } from '@/lib/enquiries';
const control = 'mt-2 min-h-11 w-full rounded-lg border border-[#dce1d7] bg-white p-3 text-sm text-ink focus:outline-ink';
const button = 'inline-flex min-h-11 items-center justify-center rounded-lg border border-[#dce1d7] px-4 text-sm disabled:opacity-50';
const date = (value: string) => new Date(value).toLocaleString();
const label = (value: string) => value.replaceAll('-', ' ').replace(/^./, s => s.toUpperCase());
const customerEmailLabels: Record<CustomerEmailState, string> = {
  'not-sent': 'Not sent', pending: 'Pending', accepted: 'Accepted by email provider', delivered: 'Delivered',
  failed: 'Failed', 'not-configured': 'Not configured', 'no-email': 'No customer email available',
};
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: 'no-store', ...options }), data = await response.json();
  if (!response.ok) throw Error(data.error || 'Unable to complete this enquiry action.'); return data;
}
function Fields({ rows }: { rows: [string, string | undefined][] }) {
  return <dl className="space-y-3">{rows.filter(([,value]) => value).map(([key,value]) => <div key={key} className="grid gap-1 text-sm sm:grid-cols-[10rem_1fr]"><dt className="text-muted">{key}</dt><dd className="m-0 whitespace-pre-wrap break-words">{value}</dd></div>)}</dl>;
}
export default function EnquiryManagement() {
  const [list, setList] = useState<{ enquiries: EnquirySummary[]; total: number; page: number; pages: number }>({ enquiries: [], total: 0, page: 1, pages: 1 });
  const [filters, setFilters] = useState(''), [page, setPage] = useState(1), [detail, setDetail] = useState<EnquiryDetail | null>(null);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const actionLock = useRef(false), generation = useRef(0);
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try { setList(await request(`/api/admin/enquiries?${filters}&page=${page}`, { signal })); }
    catch (error) { if (!signal?.aborted) setMessage(error instanceof Error ? error.message : 'Unable to load enquiries.'); }
    finally { if (!signal?.aborted) setLoading(false); }
  }, [filters, page]);
  useEffect(() => { const controller = new AbortController(); setMessage(''); void load(controller.signal); return () => controller.abort(); }, [load]);
  async function open(id: string) {
    if (actionLock.current) return;
    const current = ++generation.current; setBusy(true); setMessage(''); setDetail(null);
    try { const next = await request<EnquiryDetail>(`/api/admin/enquiries?id=${id}`); if (current === generation.current) setDetail(next); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to open enquiry.'); }
    finally { if (current === generation.current) setBusy(false); }
  }
  async function save(retry?: 'retry-email' | 'retry-customer-email') {
    if (!detail || actionLock.current) return;
    actionLock.current = true; setBusy(true); setMessage('');
    try {
      const next = await request<EnquiryDetail>('/api/admin/enquiries', { method: retry ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(retry ? { id: detail.id, action: retry } : { id: detail.id, status: detail.status, note: detail.note, revision: detail.revision }) });
      setDetail(next);
      const customerState = next.customerAcceptanceEmail.state;
      if (retry === 'retry-email') setMessage(`Email notification: ${label(next.notification.deliveryStatus || next.notification.state)}. The enquiry remains saved.`);
      else if (retry === 'retry-customer-email' || customerState !== detail.customerAcceptanceEmail.state) setMessage(`Enquiry saved. Customer acceptance email: ${customerEmailLabels[customerState]}.`);
      else setMessage('Enquiry updated. Administrator action recorded.');
      await load();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to update enquiry.'); }
    finally { actionLock.current = false; setBusy(false); }
  }
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const values = new FormData(event.currentTarget), params = new URLSearchParams();
    for (const [key,value] of values) if (typeof value === 'string' && value) params.set(key,value);
    setPage(1); setFilters(params.toString()); setDetail(null);
  }
  const data = detail?.data, customerEmail = detail?.customerAcceptanceEmail;
  return <div className="space-y-7"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-muted">Customer care</p><h1 className="text-3xl font-medium">Enquiries</h1><p className="mt-3 text-sm leading-7 text-muted">Every submitted request is saved before its email notification is attempted.</p></div><Link href="/admin/enquiries/history" className="min-h-11 py-3 text-sm underline">Earlier email inbox</Link></div>
    <form onSubmit={search} className="grid gap-4 rounded-xl border border-[#dce1d7] bg-[#fdfdf8] p-5 sm:grid-cols-2 xl:grid-cols-6"><label className="text-xs sm:col-span-2">Search reference, customer or requirements<input name="search" maxLength={100} className={control} placeholder="Name, email, phone or reference"/></label><label className="text-xs">Enquiry status<select name="status" className={control}><option value="all">All statuses</option>{enquiryStatuses.map(status => <option key={status} value={status}>{enquiryStatusLabels[status]}</option>)}</select></label><label className="text-xs">Email status<select name="emailStatus" className={control}><option value="all">All email states</option><option value="needs-attention">Needs attention</option><option value="accepted">Provider accepted</option><option value="delivered">Delivered</option></select></label><label className="text-xs">Submitted from (UTC)<input type="date" name="from" className={control}/></label><label className="text-xs">Submitted through (UTC)<input type="date" name="to" className={control}/></label><button disabled={busy} className={`${button} bg-ink text-paper sm:col-span-2 xl:col-span-1`}>Apply filters</button><button type="button" disabled={busy || loading} className={button} onClick={() => void load()}>Refresh</button></form>
    <p role="status" aria-live="polite" className="text-sm leading-6">{message || (loading ? 'Loading enquiries…' : `${list.total} enquiries found`)}</p>
    <div className="grid gap-7 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.2fr)]"><section aria-label="Enquiry list" className="space-y-3">{list.enquiries.map(enquiry => <button type="button" key={enquiry.id} disabled={busy} aria-pressed={detail?.id === enquiry.id} onClick={() => void open(enquiry.id)} className="block w-full rounded-xl border border-[#dce1d7] bg-[#fdfdf8] p-5 text-left hover:border-ink aria-pressed:border-ink disabled:opacity-50"><span className="text-[10px] font-medium uppercase tracking-wider text-muted">{enquiry.reference}</span><span className="mt-2 block break-words text-lg font-medium">{enquiry.name}</span><span className="mt-1 block break-all text-xs text-muted">{enquiry.email || enquiry.phone}</span><span className="mt-3 flex flex-wrap gap-2 text-xs"><span className="rounded-md bg-[#e9f0e6] px-2 py-1">{enquiryStatusLabels[enquiry.status]}</span><span className="rounded-md bg-[#efeee7] px-2 py-1">Email: {label(enquiry.notification.deliveryStatus || enquiry.notification.state)}</span></span><span className="mt-3 block text-xs text-muted">{date(enquiry.createdAt)}</span></button>)}{!loading && !list.enquiries.length && <p className="rounded-xl border border-[#dce1d7] p-6 text-sm text-muted">No enquiries match these filters.</p>}<div className="flex items-center justify-between gap-3"><button type="button" disabled={page <= 1 || busy || loading} className={button} onClick={() => setPage(value => value - 1)}>Previous</button><span className="text-xs text-muted">Page {list.page} of {list.pages}</span><button type="button" disabled={page >= list.pages || busy || loading} className={button} onClick={() => setPage(value => value + 1)}>Next</button></div></section>
    {detail && data ? <section aria-label="Enquiry details" className="min-w-0 space-y-6 rounded-xl border border-[#dce1d7] bg-[#fdfdf8] p-5 sm:p-7"><div><p className="break-all text-xs text-muted">{detail.reference}</p><h2 className="mt-2 break-words text-2xl font-medium">{data.name}</h2></div><Fields rows={[["Email",data.email],["Phone",data.phone],["Submitted",date(detail.createdAt)],["Enquiry",data.enquiryType || 'General Enquiry'],["Room",data.room],["Requirements",data.message],["Fabric / interest",data.interest],["Colour",data.color],["City",data.city],["Measurements",data.measurements],["Preferred contact",data.method]]}/>
      {data.designDetails && <div className="space-y-4 border-t border-[#dce1d7] pt-5"><h3 className="text-lg">Selected curtain design</h3><Fields rows={data.designDetails.rows.map(row => [row.label,row.value])}/><p className="text-xs leading-6 text-muted">{data.designDetails.disclaimer}</p></div>}
      {data.selectedFabric && <div className="space-y-4 border-t border-[#dce1d7] pt-5"><h3 className="text-lg">Selected fabric</h3><Fields rows={['name','collection','color','fabricSku','variantSku','shadeCode','quantityMetres'].map(key => [label(key.replace(/([A-Z])/g,' $1')), data.selectedFabric?.[key] == null ? undefined : String(data.selectedFabric[key])])}/></div>}
      <div className="space-y-3 border-y border-[#dce1d7] py-5"><h3 className="text-lg">Email notification</h3><p className="text-sm">{label(detail.notification.deliveryStatus || detail.notification.state)} · {detail.notification.attempts} attempts</p>{detail.notification.failure && <p className="text-xs text-muted">Last issue: {label(detail.notification.failure.replaceAll('_',' '))}</p>}<p className="text-xs leading-6 text-muted">Provider acceptance is separate from inbox delivery. Delivery events are shown when signed Resend webhooks are configured. Uncertain sends are retried with the same provider key; older uncertain sends require checking Resend first.</p>{detail.emailRetryAllowed && <button type="button" disabled={busy} className={button} onClick={() => void save('retry-email')}>Retry email notification</button>}</div>
      {customerEmail && <section aria-label="Customer Acceptance Email" className="space-y-3 border-b border-[#dce1d7] pb-5">
        <h3 className="text-lg">Customer Acceptance Email</h3>
        <p className="text-sm">{customerEmailLabels[customerEmail.state]}</p>
        {customerEmail.lastAttemptAt && <p className="text-xs text-muted">Last attempt: {date(customerEmail.lastAttemptAt)}</p>}
        {customerEmail.reason && <p className="text-xs leading-6 text-muted">{customerEmail.reason}</p>}
        {customerEmail.retryAllowed && <button type="button" disabled={busy} className={button} onClick={() => void save('retry-customer-email')}>Retry Customer Email</button>}
      </section>}
      <form onSubmit={event => { event.preventDefault(); void save(); }} className="space-y-4"><fieldset disabled={busy} className="m-0 min-w-0 space-y-4 border-0 p-0"><label className="block text-sm">Status<select className={control} value={detail.status} onChange={event => setDetail({ ...detail, status: event.target.value as EnquiryDetail['status'] })}>{enquiryStatuses.map(status => <option key={status} value={status}>{enquiryStatusLabels[status]}</option>)}</select></label><label className="block text-sm">Private notes<textarea className={`${control} min-h-28`} maxLength={3000} value={detail.note} onChange={event => setDetail({ ...detail, note: event.target.value })}/></label><button className={`${button} bg-ink text-paper`}>Save enquiry</button></fieldset></form>
      <section aria-label="Enquiry activity" className="space-y-3 border-t border-[#dce1d7] pt-5"><h3 className="text-lg">Activity history</h3><ol className="max-h-80 space-y-4 overflow-y-auto">{detail.history.slice().reverse().map((entry,index) => <li key={`${entry.at}-${index}`} className="border-l-2 border-[#b29a79] pl-3 text-xs leading-6"><p>{label(entry.action)}{entry.to ? ` · ${enquiryStatusLabels[entry.to]}` : ''}</p><p className="break-all text-muted">{date(entry.at)} · {entry.actor}</p>{entry.note && <p className="whitespace-pre-wrap break-words">{entry.note}</p>}</li>)}</ol></section><button type="button" disabled={busy} className="min-h-11 text-sm underline" onClick={() => void open(detail.id)}>Reload enquiry</button>
    </section> : <p className="p-6 text-sm text-muted">Select an enquiry to view its details and history.</p>}</div></div>;
}
