'use client';
import Link from 'next/link';
import { Search, SlidersHorizontal, RefreshCw, Inbox, Clock3, CircleCheck, BadgeCheck, X, ArrowUpRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { enquiryStatuses, enquiryStatusLabels, type CustomerEmailState, type EnquirySummary, type EnquiryDetail } from '@/lib/enquiries';
const control = 'mt-2 min-h-11 w-full rounded-lg border border-[#DFE4DA] bg-white p-3 text-sm text-ink focus:outline-ink';
const button = 'inline-flex min-h-11 items-center justify-center rounded-lg border border-[#DFE4DA] px-4 text-sm disabled:opacity-50';
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
function Drawer({ children, close }: { children: React.ReactNode; close: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    dialog.showModal();
    return () => { dialog.close(); previous?.focus(); };
  }, []);
  return <dialog ref={ref} aria-labelledby="enquiry-drawer-title" onCancel={event => { event.preventDefault(); close(); }} className="fixed inset-y-0 right-0 left-auto m-0 h-[100dvh] max-h-none w-full max-w-none overflow-y-auto border-0 bg-white p-0 text-ink shadow-xl backdrop:bg-[#152a20]/40 sm:w-[min(36rem,100%)]"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#DFE4DA] bg-white px-5 py-4 sm:px-7"><h2 id="enquiry-drawer-title" className="text-lg font-medium">Enquiry details</h2><button type="button" onClick={close} aria-label="Close enquiry details" className="grid size-11 place-items-center rounded-lg text-muted hover:bg-[#F5F6F2]"><X size={19}/></button></div>{children}</dialog>;
}
export default function EnquiryManagement() {
  const [list, setList] = useState<{ enquiries: EnquirySummary[]; total: number; page: number; pages: number }>({ enquiries: [], total: 0, page: 1, pages: 1 });
  const [filters, setFilters] = useState(''), [page, setPage] = useState(1), [detail, setDetail] = useState<EnquiryDetail | null>(null);
  const [loading, setLoading] = useState(true), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const actionLock = useRef(false), generation = useRef(0), filterForm = useRef<HTMLFormElement>(null);
  const [statusFilter, setStatusFilter] = useState('all'), [searchText, setSearchText] = useState('');
  const [stats, setStats] = useState<{ total: number; pending: number; accepted: number; completed: number } | null>(null);
  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const [result, total, pending, accepted, completed] = await Promise.all([request<typeof list>(`/api/admin/enquiries?${filters}&page=${page}`, { signal }), ...['all', 'pending', 'accepted', 'completed'].map(status => request<{ total: number }>(`/api/admin/enquiries?status=${status}&page=1`, { signal }))]);
      setList(result); setStats({ total: total.total, pending: pending.total, accepted: accepted.total, completed: completed.total });
    }
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
  function applyFilters(status = statusFilter, searchOverride?: string) {
    if (!filterForm.current) return;
    const values = new FormData(filterForm.current), params = new URLSearchParams();
    for (const [key, value] of values) if (typeof value === 'string' && value) params.set(key, value);
    if (searchOverride !== undefined) { if (searchOverride) params.set('search', searchOverride); else params.delete('search'); }
    params.set('status', status); setStatusFilter(status); setPage(1); setFilters(params.toString()); setDetail(null);
  }
  function search(event: FormEvent<HTMLFormElement>) { event.preventDefault(); applyFilters(); }
  const closeDrawer = () => { if (actionLock.current) return; ++generation.current; setDetail(null); };
  const data = detail?.data, customerEmail = detail?.customerAcceptanceEmail;
  const summary = [['Total Enquiries', stats?.total, Inbox], ['Pending', stats?.pending, Clock3], ['Accepted', stats?.accepted, BadgeCheck], ['Completed', stats?.completed, CircleCheck]] as const;
  const avatar = (name: string) => name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase();
  const statusBadge = (value: string) => <span className="inline-flex rounded-md bg-[#E8F0E3] px-2.5 py-1 text-xs font-medium text-[#355C3E]">{value}</span>;
  return <div className="min-w-0 space-y-6"><div className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-2 text-[10px] uppercase tracking-[0.22em] text-muted">Customer care</p><h1 className="text-3xl font-medium tracking-tight">Enquiries</h1><p className="mt-2 text-sm leading-6 text-muted">Manage customer enquiries and follow-ups.</p></div><div className="flex flex-wrap items-center gap-2"><Link href="/admin/enquiries/history" className="inline-flex min-h-11 items-center px-2 text-sm underline underline-offset-4">Earlier email inbox</Link><button type="button" disabled={busy || loading} className={`${button} gap-2 bg-white`} onClick={() => void load()}><RefreshCw size={16}/>Refresh</button></div></div>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{summary.map(([title, count, Icon]) => <div key={title} className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-[#DFE4DA] bg-white p-4 sm:p-5"><div className="min-w-0"><p className="text-xs text-muted sm:text-sm">{title}</p><p className="mt-2 text-2xl font-medium">{count ?? '?'}</p></div><span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#E8F0E3]"><Icon size={19} strokeWidth={1.6}/></span></div>)}</div>
    <section aria-label="Customer enquiries" className="min-w-0 rounded-xl border border-[#DFE4DA] bg-white"><div className="flex flex-wrap items-baseline gap-2 px-5 pt-5"><h2 className="text-lg font-medium">Customer Enquiries</h2><span className="text-xs text-muted">{loading ? '' : `${list.total} enquiries`}</span></div>
    <form ref={filterForm} onSubmit={search} className="space-y-4 border-b border-[#DFE4DA] p-4 sm:p-5"><div className="flex flex-wrap items-end gap-2"><div className="relative min-w-0 flex-1 basis-full sm:basis-64"><label htmlFor="enquiry-search" className="sr-only">Search reference, customer or requirements</label><Search size={16} className="pointer-events-none absolute left-3 top-3.5 text-muted"/><input id="enquiry-search" name="search" maxLength={100} value={searchText} onChange={event => setSearchText(event.target.value)} className={`${control} !mt-0 pl-10 pr-12`} placeholder="Search name, email, phone or reference"/>{searchText && <button type="button" aria-label="Clear search" onClick={() => { setSearchText(''); applyFilters(statusFilter, ''); }} className="absolute right-0 top-0 grid size-11 place-items-center rounded-lg text-muted hover:text-ink"><X size={17}/></button>}</div><button className={`${button} bg-[#20372E] text-white`}>Search</button></div>
    <div className="flex flex-wrap gap-1 rounded-lg bg-[#F5F6F2] p-1" aria-label="Enquiry status filters">{[['all', 'All enquiries'], ...enquiryStatuses.map(status => [status, enquiryStatusLabels[status]])].map(([value, text]) => <button key={value} type="button" aria-pressed={statusFilter === value} onClick={() => applyFilters(value)} className={`min-h-10 rounded-md px-3 text-xs font-medium ${statusFilter === value ? 'bg-white text-[#20372E] shadow-sm' : 'text-muted hover:text-ink'}`}>{text}</button>)}</div>
    <details className="group rounded-lg border border-[#DFE4DA] bg-[#FAFBF9]"><summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 px-4 text-sm font-medium"><SlidersHorizontal size={16}/>Advanced filters <span className="ml-auto text-xs font-normal text-muted">Email status and UTC dates</span></summary><div className="grid gap-3 border-t border-[#DFE4DA] p-4 sm:grid-cols-3"><label className="text-xs">Email status<select name="emailStatus" className={control}><option value="all">All email states</option><option value="needs-attention">Needs attention</option><option value="accepted">Provider accepted</option><option value="delivered">Delivered</option></select></label><label className="text-xs">Submitted from (UTC)<input type="date" name="from" className={control}/></label><label className="text-xs">Submitted through (UTC)<input type="date" name="to" className={control}/></label><button disabled={busy} className={`${button} bg-[#20372E] text-white sm:w-fit`}>Apply filters</button></div></details></form>
    <p role="status" aria-live="polite" className="px-5 py-3 text-sm text-muted">{message || (loading ? 'Loading enquiries?' : `${list.total} enquiries found`)}</p>
    {!loading && !list.enquiries.length ? <p className="border-t border-[#DFE4DA] p-8 text-center text-sm text-muted">{new URLSearchParams(filters).get('search')?.trim() ? 'No matching enquiries found.' : 'No enquiries match these filters.'}</p> : <><table className="hidden w-full table-fixed text-left text-sm lg:table"><thead className="border-y border-[#DFE4DA] bg-[#F8F9F6] text-[10px] uppercase tracking-wider text-muted"><tr><th className="w-[24%] px-5 py-3 font-medium">Customer</th><th className="w-[18%] px-3 py-3 font-medium">Reference</th><th className="w-[13%] px-3 py-3 font-medium">Status</th><th className="w-[16%] px-3 py-3 font-medium">Email status</th><th className="w-[18%] px-3 py-3 font-medium">Submitted</th><th className="w-[11%] px-3 py-3 text-right font-medium">Details</th></tr></thead><tbody className="divide-y divide-[#E9EDE6]">{list.enquiries.map(enquiry => <tr key={enquiry.id} className="hover:bg-[#F8F9F6]"><td className="px-5 py-3"><div className="flex min-w-0 items-center gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#E8F0E3] text-xs font-medium">{avatar(enquiry.name)}</span><div className="min-w-0"><p className="break-words font-medium">{enquiry.name}</p><p className="mt-1 break-all text-xs text-muted">{enquiry.email || enquiry.phone || '?'}</p></div></div></td><td className="break-all px-3 py-3 text-xs text-muted">{enquiry.reference}</td><td className="px-3 py-3">{statusBadge(enquiryStatusLabels[enquiry.status])}</td><td className="px-3 py-3 text-xs text-muted">{label(enquiry.notification.deliveryStatus || enquiry.notification.state)}</td><td className="px-3 py-3 text-xs text-muted">{date(enquiry.createdAt)}</td><td className="px-3 py-3 text-right"><button type="button" disabled={busy} onClick={() => void open(enquiry.id)} className="inline-flex min-h-11 items-center gap-1 text-xs font-medium underline underline-offset-4 disabled:opacity-50">View <ArrowUpRight size={14}/></button></td></tr>)}</tbody></table>
    <div className="divide-y divide-[#E9EDE6] lg:hidden">{list.enquiries.map(enquiry => <article key={enquiry.id} className="p-4"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#E8F0E3] text-xs font-medium">{avatar(enquiry.name)}</span><div className="min-w-0 flex-1"><p className="break-words text-sm font-medium">{enquiry.name}</p><p className="mt-1 break-all text-xs text-muted">{enquiry.email || enquiry.phone || '?'}</p><p className="mt-2 break-all text-xs text-muted">{enquiry.reference} ? {date(enquiry.createdAt)}</p><div className="mt-3 flex flex-wrap items-center gap-2">{statusBadge(enquiryStatusLabels[enquiry.status])}<span className="text-xs text-muted">Email: {label(enquiry.notification.deliveryStatus || enquiry.notification.state)}</span></div></div><button type="button" disabled={busy} onClick={() => void open(enquiry.id)} className="min-h-11 shrink-0 px-2 text-xs font-medium underline underline-offset-4">View</button></div></article>)}</div></>}
    <div className="flex items-center justify-between gap-3 border-t border-[#DFE4DA] p-4"><button type="button" disabled={page <= 1 || busy || loading} className={button} onClick={() => setPage(value => value - 1)}>Previous</button><span className="text-xs text-muted">Page {list.page} of {list.pages}</span><button type="button" disabled={page >= list.pages || busy || loading} className={button} onClick={() => setPage(value => value + 1)}>Next</button></div></section>
    {detail && data && <Drawer close={closeDrawer}><section aria-label="Enquiry details" className="min-w-0 space-y-6 bg-white p-5 sm:p-7"><div><p className="break-all text-xs text-muted">{detail.reference}</p><h3 className="mt-2 break-words text-2xl font-medium">{data.name}</h3><p className="mt-2 text-xs text-muted">Submitted {date(detail.createdAt)}</p><div className="mt-3">{statusBadge(enquiryStatusLabels[detail.status])}</div></div>{message && <p role="status" className="rounded-lg bg-[#F5F6F2] p-3 text-sm">{message}</p>}<Fields rows={[["Email",data.email],["Phone",data.phone],["Submitted",date(detail.createdAt)],["Enquiry",data.enquiryType || 'General Enquiry'],["Room",data.room],["Requirements",data.message],["Fabric / interest",data.interest],["Colour",data.color],["City",data.city],["Measurements",data.measurements],["Preferred contact",data.method]]}/>
      {data.designDetails && <div className="space-y-4 border-t border-[#DFE4DA] pt-5"><h3 className="text-lg">Selected curtain design</h3><Fields rows={data.designDetails.rows.map(row => [row.label,row.value])}/><p className="text-xs leading-6 text-muted">{data.designDetails.disclaimer}</p></div>}
      {data.selectedFabric && <div className="space-y-4 border-t border-[#DFE4DA] pt-5"><h3 className="text-lg">Selected fabric</h3><Fields rows={['name','collection','color','fabricSku','variantSku','shadeCode','quantityMetres'].map(key => [label(key.replace(/([A-Z])/g,' $1')), data.selectedFabric?.[key] == null ? undefined : String(data.selectedFabric[key])])}/></div>}
      <div className="space-y-3 border-y border-[#DFE4DA] py-5"><h3 className="text-lg">Email notification</h3><p className="text-sm">{label(detail.notification.deliveryStatus || detail.notification.state)} · {detail.notification.attempts} attempts</p>{detail.notification.failure && <p className="text-xs text-muted">Last issue: {label(detail.notification.failure.replaceAll('_',' '))}</p>}<p className="text-xs leading-6 text-muted">Provider acceptance is separate from inbox delivery. Delivery events are shown when signed Resend webhooks are configured. Uncertain sends are retried with the same provider key; older uncertain sends require checking Resend first.</p>{detail.emailRetryAllowed && <button type="button" disabled={busy} className={button} onClick={() => void save('retry-email')}>Retry email notification</button>}</div>
      {customerEmail && <section aria-label="Customer Acceptance Email" className="space-y-3 border-b border-[#DFE4DA] pb-5">
        <h3 className="text-lg">Customer Acceptance Email</h3>
        <p className="text-sm">{customerEmailLabels[customerEmail.state]}</p>
        {customerEmail.lastAttemptAt && <p className="text-xs text-muted">Last attempt: {date(customerEmail.lastAttemptAt)}</p>}
        {customerEmail.reason && <p className="text-xs leading-6 text-muted">{customerEmail.reason}</p>}
        {customerEmail.retryAllowed && <button type="button" disabled={busy} className={button} onClick={() => void save('retry-customer-email')}>Retry Customer Email</button>}
      </section>}
      <form onSubmit={event => { event.preventDefault(); void save(); }} className="space-y-4"><fieldset disabled={busy} className="m-0 min-w-0 space-y-4 border-0 p-0"><label className="block text-sm">Status<select className={control} value={detail.status} onChange={event => setDetail({ ...detail, status: event.target.value as EnquiryDetail['status'] })}>{enquiryStatuses.map(status => <option key={status} value={status}>{enquiryStatusLabels[status]}</option>)}</select></label><label className="block text-sm">Private notes<textarea className={`${control} min-h-28`} maxLength={3000} value={detail.note} onChange={event => setDetail({ ...detail, note: event.target.value })}/></label><button className={`${button} bg-ink text-paper`}>Save enquiry</button></fieldset></form>
      <section aria-label="Enquiry activity" className="space-y-3 border-t border-[#DFE4DA] pt-5"><h3 className="text-lg">Activity history</h3><ol className="max-h-80 space-y-4 overflow-y-auto">{detail.history.slice().reverse().map((entry,index) => <li key={`${entry.at}-${index}`} className="border-l-2 border-[#b29a79] pl-3 text-xs leading-6"><p>{label(entry.action)}{entry.to ? ` · ${enquiryStatusLabels[entry.to]}` : ''}</p><p className="break-all text-muted">{date(entry.at)} · {entry.actor}</p>{entry.note && <p className="whitespace-pre-wrap break-words">{entry.note}</p>}</li>)}</ol></section><button type="button" disabled={busy} className="min-h-11 text-sm underline" onClick={() => void open(detail.id)}>Reload enquiry</button>
    </section></Drawer>}</div>;
}
