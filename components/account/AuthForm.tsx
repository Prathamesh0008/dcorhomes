"use client";
import { useState, type FormEvent } from 'react';
import { buttonClass, Field, PasswordField, Feedback } from './FormControls';
type Mode = 'login' | 'signup' | 'forgot-password' | 'reset-password';
export default function AuthForm({ mode }: { mode: Mode }) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const values = new FormData(event.currentTarget); setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/auth/sign-in/username', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: String(values.get('userId') || '').trim(), password: values.get('password') }) });
      const result = await response.json();
      if (!response.ok) throw Error(result.message || result.error || 'Unable to sign in. Check your User ID and password.');
      window.location.assign('/account');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Unable to sign in. Please try again.'); }
    finally { setBusy(false); }
  }
  if (mode !== 'login') return <p className="text-[15px] leading-7 text-muted">Accounts and password resets are managed privately by our team. Contact <a href="mailto:sales@dcorhome.com" className="underline">sales@dcorhome.com</a> for assistance. <a href="/login" className="underline">Back to Login</a></p>;
  return <form onSubmit={submit} className="space-y-6">
    <Field label="USER ID" name="userId" autoComplete="username" required minLength={3} maxLength={30} spellCheck={false} autoCapitalize="none"/>
    <PasswordField label="PASSWORD" name="password" autoComplete="current-password" required maxLength={128}/>
    <Feedback>{message}</Feedback>
    <button disabled={busy} className={`${buttonClass} w-full`}>{busy ? 'Signing in…' : 'SIGN IN'}</button>
    <p className="text-[13px] leading-6 text-muted">Access is available to authorized Dcorhome members only. Please contact our team for account assistance. <a href="mailto:sales@dcorhome.com" className="underline">sales@dcorhome.com</a></p>
  </form>;
}
