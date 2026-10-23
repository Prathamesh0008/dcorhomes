"use client";
import { useState, type InputHTMLAttributes } from "react";
export const inputClass = "mt-2 min-h-12 w-full min-w-0 border border-solid border-[#cbcfc2] bg-paper px-4 text-base text-ink outline-offset-4 focus:outline-2 focus:outline-ink";
export const buttonClass = "inline-flex min-h-12 items-center justify-center bg-ink px-7 py-3 text-[15px] text-paper disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4";
export function Field({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) { return <label className="block text-[14px] text-ink">{label}<input {...props} className={inputClass}/></label>; }
export function PasswordField({ label = "Password", ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  const [visible, setVisible] = useState(false);
  return <label className="block text-[14px] text-ink">{label}<span className="relative block"><input {...props} type={visible ? "text" : "password"} className={`${inputClass} pr-20`}/><button type="button" aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} aria-pressed={visible} onClick={() => setVisible(!visible)} className="absolute inset-y-0 right-2 mt-2 min-h-12 px-3 text-[13px] underline">{visible ? "Hide" : "Show"}</button></span></label>;
}
export function Feedback({ children }: { children: React.ReactNode }) { return children ? <p role="status" className="border-l-2 border-ink bg-[#e9eee7] p-4 text-[14px] leading-6 text-ink">{children}</p> : null; }
