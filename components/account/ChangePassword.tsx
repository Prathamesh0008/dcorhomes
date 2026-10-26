"use client";
import { useState, type FormEvent } from 'react';
import { buttonClass, Feedback, PasswordField } from './FormControls';
export default function ChangePassword({ userId }: { userId: string }) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const form = new FormData(event.currentTarget);
    if (form.get('newPassword') !== form.get('confirm')) { setMessage('Your new passwords do not match.'); return; }
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/account/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword: form.get('currentPassword'), newPassword: form.get('newPassword') }) });
      const result = await response.json(); if (!response.ok) throw Error(result.error || 'Unable to change password.');
      // Establish a fresh library session after all previous sessions are revoked.
      const login = await fetch('/api/auth/sign-in/username', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: userId, password: form.get('newPassword') }) });
      window.location.assign(login.ok ? '/account' : '/login?passwordChanged=1');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="max-w-md space-y-6"><PasswordField name="currentPassword" label="Current or temporary password" required autoComplete="current-password" maxLength={128}/><PasswordField name="newPassword" label="New password" required autoComplete="new-password" minLength={12} maxLength={128}/><PasswordField name="confirm" label="Confirm new password" required autoComplete="new-password" minLength={12} maxLength={128}/><p className="text-[14px] leading-6 text-muted">Use 12–128 characters. Choose a unique passphrase. Other sessions will be signed out.</p><Feedback>{message}</Feedback><button className={buttonClass} disabled={busy}>{busy ? 'Updating…' : 'Change password'}</button></form>;
}
