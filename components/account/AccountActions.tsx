"use client";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Feedback } from "./FormControls";
export function Logout() {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");

  async function logout() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const result = await authClient.signOut();
      if (result.error || !result.data?.success) throw Error("Sign-out failed.");
      window.location.replace("/admin/login");
    } catch {
      setMessage("Could not log out. Please try again.");
      setBusy(false);
    }
  }

  return <><button type="button" disabled={busy} className="min-h-11 px-2 text-[14px] underline" onClick={logout}>Logout</button><Feedback>{message}</Feedback></>;
}
