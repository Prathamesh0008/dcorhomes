"use client";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { Field, Feedback, buttonClass } from "./FormControls";
export function Logout() {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  return <><button type="button" disabled={busy} className="min-h-11 px-2 text-[14px] underline" onClick={async () => { setBusy(true); try { const result = await authClient.signOut(); if (result.error) throw Error(); window.location.assign("/login"); } catch { setMessage("Could not log out. Please try again."); setBusy(false); } }}>Logout</button><Feedback>{message}</Feedback></>;
}
export default function AccountActions({ name }: { name: string }) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return; setBusy(true); setMessage("");
    try { const result = await authClient.updateUser({ name: String(new FormData(event.currentTarget).get("name")).trim() }); if (result.error) throw Error(); setMessage("Your profile has been updated."); }
    catch { setMessage("Your profile could not be updated. Please try again."); } finally { setBusy(false); }
  }
  return <form onSubmit={save} className="max-w-md space-y-5"><Field label="Full name" name="name" defaultValue={name} required minLength={2} maxLength={100} autoComplete="name"/><button disabled={busy} className={buttonClass}>{busy ? "Saving…" : "Save profile"}</button><Feedback>{message}</Feedback></form>;
}
