'use client';

import { useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { enquiryAttempt, enquiryReceipt, type EnquiryAttempt } from '@/lib/enquiry-submission';

const inputClass = 'block min-h-11 w-full min-w-0 border-0 border-b border-solid border-[#b7b7b1] bg-transparent px-0 py-2 text-base text-[#243b30] outline-none focus:border-[#34563e] focus:ring-1 focus:ring-[#34563e]/30 md:text-sm';

export default function HomeContactForm() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');
  const attempt = useRef<EnquiryAttempt | null>(null);
  const locked = useRef(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const company = String(data.get('company') || '').trim();
    const message = String(data.get('message') || '').trim();
    const payload = {
      name: String(data.get('name') || ''), email: String(data.get('email') || ''),
      phone: String(data.get('phone') || ''), enquiryType: 'General Enquiry',
      message: [company && `Company: ${company}`, message].filter(Boolean).join('\n\n'),
      consent: data.get('consent') === 'on', website: String(data.get('website') || ''),
    };
    locked.current = true;
    setBusy(true);
    setStatus('');
    try {
      attempt.current = enquiryAttempt(attempt.current, payload);
      const response = await fetch('/api/enquiries', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': attempt.current.id }, body: attempt.current.body });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || 'Could not submit your enquiry.');
      setStatus(enquiryReceipt(result));
      attempt.current = null;
      form.reset();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Could not submit your enquiry.');
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }

  return <form onSubmit={submit} className="relative w-full min-w-0 max-w-[750px] justify-self-center rounded-lg bg-white px-5 py-4 text-[#243b30] shadow-[0_14px_34px_rgb(101_52_19_/_0.16)] sm:w-[90%] sm:px-7 sm:py-5 lg:w-full lg:justify-self-end">
    <div className="grid gap-x-6 gap-y-2 md:grid-cols-2">
      <label className="text-xs">Name *<input className={inputClass} name="name" autoComplete="name" minLength={2} maxLength={100} required /></label>
      <label className="text-xs">Email address *<input className={inputClass} name="email" type="email" autoComplete="email" maxLength={200} required /></label>
      <label className="text-xs">Phone number *<input className={inputClass} name="phone" type="tel" autoComplete="tel" maxLength={40} required /></label>
      <label className="text-xs">Company name<input className={inputClass} name="company" autoComplete="organization" maxLength={100} /></label>
      <label className="text-xs md:col-span-2">Additional message<textarea className={`${inputClass} h-13 resize-y md:h-12`} name="message" maxLength={2800} /></label>
    </div>
    <div className="absolute left-[-9999px]" aria-hidden="true"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
    <div className="mt-3 flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between md:gap-5">
      <label className="flex min-h-11 items-center gap-2.5 text-xs leading-5 md:leading-4"><input type="checkbox" name="consent" required className="h-4 w-4 shrink-0 accent-[#34563e]" /><span>I agree to the <Link href="/privacy" className="underline">privacy policy</Link> and to being contacted about my enquiry. *</span></label>
      <button type="submit" disabled={busy} className="min-h-11 shrink-0 bg-[#34563e] px-7 text-sm font-medium text-white hover:bg-[#243f2d] disabled:opacity-60">{busy ? 'Sending…' : 'Send enquiry'}</button>
    </div>
    {status && <p role="status" className="mb-0 mt-4 text-sm leading-6">{status}</p>}
  </form>;
}
