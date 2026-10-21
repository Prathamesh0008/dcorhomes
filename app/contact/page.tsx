"use client";
import { typography } from "@/lib/typography";
import { designOptions } from "@/lib/design-options";
import { products } from "@/lib/catalog";
import PageIntro from "@/components/editorial/PageIntro";
import Container from "@/components/ui/Container";
import Eyebrow from "@/components/ui/Eyebrow";

import { FormEvent, useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Copy,
  Mail,
  MessageCircle,
  Phone,
  Sparkles,
} from "lucide-react";
export default function ContactPage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    room: "Living room",
    interest: "Curtain consultation",
    message: "",
  });
  const [extra,setExtra]=useState({city:'',method:'Email',measurements:'',designId:'',website:'',consent:false});
  const submitLock=useRef(false),submissionId=useRef('');
  useEffect(()=>{const q=new URLSearchParams(location.search);setForm(f=>({...f,interest:products.find(p=>p.id===q.get('interest'))?.name||q.get('interest')?.slice(0,100)||f.interest,room:q.get('room')?.slice(0,60)||f.room,message:q.get('message')?.slice(0,2000)||f.message}));setExtra(e=>({...e,measurements:q.get('measurements')?.slice(0,1500)||'',designId:q.get('designId')||''}));fetch('/api/session').catch(()=>{});},[]);
  const [busy, setBusy] = useState(false),
    [status, setStatus] = useState<"idle" | "success" | "error">("idle"),
    [message, setMessage] = useState("");
  const summary = `Dcorhome consultation request\nName: ${form.name}\nEmail: ${form.email}\nPhone: ${form.phone || "Not given"}\nRoom: ${form.room}\nInterest: ${form.interest}\nNotes: ${form.message || "None"}\nCity: ${extra.city}\nContact method: ${extra.method}\nMeasurements: ${extra.measurements}\nPrivate design reference: ${extra.designId}`;
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if(submitLock.current)return;submitLock.current=true;
    submissionId.current ||= crypto.randomUUID();
    setBusy(true);
    setStatus("idle");
    try {
      const response = await fetch("/api/enquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Idempotency-Key":submissionId.current },
        body: JSON.stringify({...form,...extra}),
      });
      const json = await response.json();
      if (!response.ok)
        throw new Error(json.error || "Could not submit your request.");
      if(!json.stored)throw new Error("Your request was not confirmed as saved.");
      submissionId.current="";
      setStatus("success");
      setMessage(
        "Your consultation request was saved. We look forward to connecting with you.",
      );
      setForm({
        name: "",
        email: "",
        phone: "",
        room: "Living room",
        interest: "Curtain consultation",
        message: "",
      });
    } catch (err) {
      setStatus("error");
      setMessage(
        err instanceof Error ? err.message : "Could not send your request.",
      );
    } finally {
      submitLock.current=false;
      setBusy(false);
    }
  }
  return (
    <>
      <PageIntro
        eyebrow="A PERSONAL CONVERSATION"
        title={
          <>
            Let&apos;s consider
            <br />
            <em className="font-serif font-normal text-[#97836b]">your space.</em>
          </>
        }
        description="From the first fabric sample to the finished window. Tell us a little about your room and what you have in mind."
        image="/images/sheer-window.jpg"
        alt="Soft daylight filtering through a real white sheer curtain"
      />
      <Container
        as="section"
        className="grid grid-cols-[.87fr_1.13fr] py-20 gap-[90px] max-[1271px]:gap-[50px] max-[981px]:grid-cols-[1fr_1fr] max-[981px]:gap-8 max-[681px]:pt-[77px] max-[681px]:pb-[78px] max-[681px]:block"
      >
        <div>
          <Eyebrow>PERSONAL DESIGN SUPPORT</Eyebrow>
          <h2 className={`my-6 mx-0 max-[981px]:text-[44px] max-[681px]:text-[40px] ${typography.section}`}>
            We&apos;d love to hear
            <br />
            what you&apos;re{" "}
            <em className="font-serif italic font-normal text-[#a28d75]">
              imagining.
            </em>
          </h2>
          <p className="text-[14px] text-[#798177] leading-[1.9] max-w-[440px] mb-10">
            Whether you&apos;re dressing one window or refreshing your entire
            home, share your ideas with us. We&apos;re here to help you navigate
            the details.
          </p>
          <div className="border-t border-solid border-t-[#e1e3d9]">
            <div className="flex py-[23px] px-0 gap-[17px] border-b border-solid border-b-[#e1e3d9]">
              <span className="h-10 w-10 bg-[#eef0e9] grid place-items-center text-[#849284] shrink-0">
                <Sparkles size={20} />
              </span>
              <div>
                <h3 className="text-[14px] font-[650] mt-[3px] mb-1.5 mx-0">
                  Style consultations
                </h3>
                <p className={`text-[#849086] m-0 ${typography.body}`}>
                  Choose a look and finish for your space.
                </p>
              </div>
            </div>
            <div className="flex py-[23px] px-0 gap-[17px] border-b border-solid border-b-[#e1e3d9]">
              <span className="h-10 w-10 bg-[#eef0e9] grid place-items-center text-[#849284] shrink-0">
                <MessageCircle size={20} />
              </span>
              <div>
                <h3 className="text-[14px] font-[650] mt-[3px] mb-1.5 mx-0">
                  Fabric & color advice
                </h3>
                <p className={`text-[#849086] m-0 ${typography.body}`}>
                  Find the mood, texture and palette that fit.
                </p>
              </div>
            </div>
            <div className="flex py-[23px] px-0 gap-[17px] border-b border-solid border-b-[#e1e3d9]">
              <span className="h-10 w-10 bg-[#eef0e9] grid place-items-center text-[#849284] shrink-0">
                <Phone size={20} />
              </span>
              <div>
                <h3 className="text-[14px] font-[650] mt-[3px] mb-1.5 mx-0">
                  Measurements & planning
                </h3>
                <p className={`text-[#849086] m-0 ${typography.body}`}>
                  Talk through sizing and getting a final quote.
                </p>
              </div>
            </div>
          </div>
          <div className="text-[9px] tracking-[1.2px] text-[#999e93] font-bold mt-[35px]">
            NOT QUITE READY?{" "}
            <Link
              className="flex items-center text-[#3a523c] mt-2.5 gap-2"
              href="/studio"
            >
              EXPLORE THE DESIGN STUDIO <ArrowUpRight size={15} />
            </Link>
          </div>
        </div>
        <div className="bg-[#f5f3ec] p-[45px] max-[981px]:p-[31px] max-[681px]:mt-[58px] max-[681px]:py-[26px] max-[681px]:px-5">
          <Eyebrow>TELL US ABOUT YOUR PROJECT</Eyebrow>
          <h2 className={`mt-[13px] mb-[5px] mx-0 max-[681px]:text-[36px] ${typography.section}`}>
            Let&apos;s get started.
          </h2>
          <p className={`text-[#7f867c] mt-3.5 mb-[31px] mx-0 ${typography.body}`}>
            Leave a few details and we&apos;ll take it from there.
          </p>
          <form onSubmit={submit}>
            <div className="grid grid-cols-[1fr_1fr] gap-y-6 gap-x-[17px] mb-[29px] max-[681px]:gap-y-[18px] max-[681px]:gap-x-3 max-[381px]:grid-cols-[1fr]">
              <label className="block text-[11px] text-[#647163] font-bold max-[681px]:text-[10px]">
                Your name <span className="text-[#b97967]">*</span>
                <input
                  className="w-full block mt-2.5 h-[46px] rounded-[0] bg-[#fffcf7] text-[#344235] [outline-color:#899988] text-[13px] py-0 px-3.5 border border-solid border-[#d8dcd3] max-[681px]:text-[12px] max-[681px]:px-2.5"
                  required
                  maxLength={100}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Your full name"
                />
              </label>
              <label className="block text-[11px] text-[#647163] font-bold max-[681px]:text-[10px]">
                Email address <span className="text-[#b97967]">*</span>
                <input
                  className="w-full block mt-2.5 h-[46px] rounded-[0] bg-[#fffcf7] text-[#344235] [outline-color:#899988] text-[13px] py-0 px-3.5 border border-solid border-[#d8dcd3] max-[681px]:text-[12px] max-[681px]:px-2.5"
                  required
                  maxLength={200}
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </label>
              <label className="block text-[11px] text-[#647163] font-bold max-[681px]:text-[10px]">
                Phone number{" "}
                <small className="text-[9px] tracking-[1px] text-[#a0a59b]">
                  OPTIONAL
                </small>
                <input
                  className="w-full block mt-2.5 h-[46px] rounded-[0] bg-[#fffcf7] text-[#344235] [outline-color:#899988] text-[13px] py-0 px-3.5 border border-solid border-[#d8dcd3] max-[681px]:text-[12px] max-[681px]:px-2.5"
                  maxLength={30}
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  type="tel"
                  placeholder="+91 ..."
                />
              </label>
              <label className="block text-[11px] text-[#647163] font-bold max-[681px]:text-[10px]">
                Space you're designing
                <div className="relative mt-2">
                  <select
                    className="appearance-none w-full h-[46px] bg-[#fffefa] text-[#25342f] pr-8 pl-[13px] [outline:0] text-[12px] mt-2.5 py-0 border border-solid border-[#d8dcd3] max-[681px]:pl-2 max-[681px]:text-[11px]"
                    value={form.room}
                    onChange={(e) => setForm({ ...form, room: e.target.value })}
                  >
                    {[...new Set([...designOptions.rooms,"Whole home","Other",form.room])].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-[50%] [transform:translateY(-50%)] pointer-events-none text-[#798277]"
                    size={16}
                  />
                </div>
              </label>
              <label className="[grid-column:1/-1] block text-[11px] text-[#647163] font-bold max-[681px]:text-[10px]">
                I'm interested in
                <div className="relative mt-2">
                  <select
                    className="appearance-none w-full h-[46px] bg-[#fffefa] text-[#25342f] pr-8 pl-[13px] [outline:0] text-[12px] mt-2.5 py-0 border border-solid border-[#d8dcd3] max-[681px]:pl-2 max-[681px]:text-[11px]"
                    value={form.interest}
                    onChange={(e) =>
                      setForm({ ...form, interest: e.target.value })
                    }
                  >
                    {[...new Set(["Curtain consultation","Custom curtains","Fabric selection","Measurement & installation","Other enquiry",form.interest])].map((v) => (
                      <option key={v}>{v}</option>
                    ))}
                  </select>
                  <ChevronDown
                    className="absolute right-3 top-[50%] [transform:translateY(-50%)] pointer-events-none text-[#798277]"
                    size={16}
                  />
                </div>
              </label>
              <label className="[grid-column:1/-1] block text-[11px] text-[#647163] font-bold max-[681px]:text-[10px]">
                Tell us more{" "}
                <small className="text-[9px] tracking-[1px] text-[#a0a59b]">
                  OPTIONAL
                </small>
                <textarea
                  className="w-full block mt-2.5 h-auto rounded-[0] bg-[#fffcf7] text-[#344235] [outline-color:#899988] text-[13px] min-h-[113px] resize-y p-[13px] border border-solid border-[#d8dcd3]"
                  rows={5}
                  maxLength={2000}
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                  placeholder="Your ideas, window measurements, preferred styles, or anything that would help us..."
                />
              </label>
            </div>
            <div className="my-5 grid gap-4 sm:grid-cols-2"><label className="text-[12px] text-muted">City<input value={extra.city} onChange={e=>setExtra(x=>({...x,city:e.target.value}))} maxLength={100} className="mt-2 h-11 w-full border border-solid border-[#d8dcd3] bg-paper px-3"/></label><label className="text-[12px] text-muted">Preferred contact method<select value={extra.method} onChange={e=>setExtra(x=>({...x,method:e.target.value}))} className="mt-2 h-11 w-full border border-solid border-[#d8dcd3] bg-paper px-3"><option>Email</option><option>Phone</option></select></label><label className="text-[12px] text-muted sm:col-span-2">Preliminary measurements<textarea value={extra.measurements} maxLength={1500} onChange={e=>setExtra(x=>({...x,measurements:e.target.value}))} className="mt-2 min-h-24 w-full border border-solid border-[#d8dcd3] bg-paper p-3"/></label><label aria-hidden="true" className="hidden">Website<input tabIndex={-1} autoComplete="off" value={extra.website} onChange={e=>setExtra(x=>({...x,website:e.target.value}))}/></label></div><label className="mb-5 flex items-start gap-3 text-[12px] leading-relaxed text-muted"><input type="checkbox" required checked={extra.consent} onChange={e=>setExtra(x=>({...x,consent:e.target.checked}))} className="mt-1 h-4 w-4 shrink-0"/> <span>I agree to the use of my details to respond to this request. <Link href="/privacy" className="underline">Read the privacy notice.</Link></span></label>
            <button
              type="submit"
              className="group/contact1 inline-flex items-center justify-center min-h-14 text-[13px] tracking-[.35px] font-medium transition-[transform,background,color] duration-250 ease-[ease] whitespace-nowrap text-[white] bg-ink w-full py-0 px-[25px] gap-7 border border-solid border-[transparent] hover:[transform:translateY(-2px)] hover:bg-[#40564a]"
              disabled={busy}
            >
              {busy ? "Sending your enquiry..." : "Send my enquiry"}{" "}
              <ArrowUpRight
                className="transition-transform duration-250 ease-[ease] group-hover/contact1:[transform:translate(3px,-3px)]"
                size={18}
              />
            </button>
            <p className="text-center text-[#9a9f95] text-[10px] mt-[15px] mb-0 mx-0">
              We use your contact details only to respond to your enquiry.
            </p>
            {status !== "idle" && (
              <div
                role="status"
                className="flex items-start leading-[1.5] bg-[#e9eee7] text-[12px] mt-[15px] text-[#3a5940] p-3.5 gap-3 [&[data-status=error]]:bg-[#f8eae5] [&[data-status=error]]:text-[#935d4c]"
                data-status={status}
              >
                {status === "success" ? (
                  <Check size={18} />
                ) : (
                  <Mail size={18} />
                )}
                <span>{message}</span>
              </div>
            )}
            {status === "error" && (
              <button
                type="button"
                onClick={() =>
                  navigator.clipboard
                    .writeText(summary)
                    .then(() =>
                      setMessage(
                        "Details copied. Your enquiry has not been sent; keep a copy for later.",
                      ),
                    )
                }
                className="bg-none bg-transparent text-[#3c5943] underline flex items-center text-[11px] mt-[15px] p-0 gap-[9px] border-0"
              >
                <Copy size={15} /> Copy my enquiry instead
              </button>
            )}
          </form>
        </div>
      </Container>
    </>
  );
}
