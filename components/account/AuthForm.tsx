"use client";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { authClient } from "@/lib/auth-client";
import { buttonClass, Field, PasswordField, Feedback } from "./FormControls";
type Mode = "login" | "signup" | "forgot-password" | "reset-password";
export default function AuthForm({ mode }: { mode: Mode }) {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    const values = new FormData(event.currentTarget), email = String(values.get("email") || "").trim(), password = String(values.get("password") || "");
    if ((mode === "signup" || mode === "reset-password") && password !== values.get("confirm")) { setMessage("Your passwords do not match."); return; }
    setBusy(true); setMessage("");
    try {
      if (mode === "signup") {
        const result = await authClient.signUp.email({ email, password, name: String(values.get("name")).trim(), callbackURL: "/account" });
        if (result.error) throw Error("Registration could not be completed. Try signing in, or try again later.");
        setMessage("Registration processed. If email verification is enabled, check your inbox before signing in.");
        if (result.data?.token) { window.location.assign("/account"); return; }
      } else if (mode === "login") {
        const result = await authClient.signIn.email({ email, password });
        if (result.error) throw Error("Unable to sign in. Check your details and email verification, or try again later.");
        window.location.assign("/account"); return;
      } else if (mode === "forgot-password") {
        const response = await fetch("/api/auth/request-password-reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, redirectTo: `${location.origin}/reset-password` }) });
        if (!response.ok) throw Error("Password reset could not be processed. Please try later or contact sales@dcorhome.com.");
        setMessage("Request processed. If an eligible account exists, check its inbox for a reset link.");
      } else {
        const token = new URLSearchParams(location.search).get("token");
        if (!token) throw Error("This reset link is invalid. Request a new link.");
        const result = await authClient.resetPassword({ newPassword: password, token });
        if (result.error) throw Error("This reset link is invalid or expired. Please request a new link.");
        setMessage("Password updated. You can now sign in.");
      }
    } catch (error) { setMessage(error instanceof Error ? error.message : "Please try again later."); }
    finally { setBusy(false); }
  }
  return <form onSubmit={submit} className="space-y-6">
    {mode === "signup" && <Field label="Full name" name="name" required minLength={2} maxLength={100} autoComplete="name"/>}
    {mode !== "reset-password" && <Field label="Email address" name="email" required type="email" maxLength={200} autoComplete="email"/>}
    {mode !== "forgot-password" && <PasswordField name="password" required minLength={mode === "login" ? 1 : 12} maxLength={128} autoComplete={mode === "login" ? "current-password" : "new-password"}/>}
    {(mode === "signup" || mode === "reset-password") && <><p className="text-[13px] text-muted">Use at least 12 characters for your password.</p><PasswordField label="Confirm password" name="confirm" required minLength={12} maxLength={128} autoComplete="new-password"/></>}
    <Feedback>{message}</Feedback><button disabled={busy} className={`${buttonClass} w-full`}>{busy ? "Please wait…" : { login: "Login", signup: "Create account", "forgot-password": "Request reset link", "reset-password": "Update password" }[mode]}</button>
    <div className="flex flex-wrap justify-between gap-4 text-[14px] underline underline-offset-4"><Link className="inline-flex min-h-11 items-center" href={mode === "login" ? "/signup" : "/login"}>{mode === "login" ? "Create an account" : "Back to login"}</Link>{mode === "login" && <Link className="inline-flex min-h-11 items-center" href="/forgot-password">Forgot password?</Link>}</div>
  </form>;
}
