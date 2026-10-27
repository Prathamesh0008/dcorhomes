"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Feedback } from "./FormControls";
export function Logout() {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  return <><button type="button" disabled={busy} className="min-h-11 px-2 text-[14px] underline" onClick={async () => { setBusy(true); try { const result = await authClient.signOut(); if (result.error) throw Error(); window.location.assign("/login"); } catch { setMessage("Could not log out. Please try again."); setBusy(false); } }}>Logout</button><Feedback>{message}</Feedback></>;
}
