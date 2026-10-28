"use client";
import { useEffect, useRef, useState } from 'react';
import type { assessPassword, PasswordContext } from '@/lib/password-policy';

export default function PasswordStrength({ password, context, id }: { password: string; context?: PasswordContext; id: string }) {
  const worker = useRef<Worker | null>(null), requestId = useRef(0);
  const [assessment, setAssessment] = useState<ReturnType<typeof assessPassword> | null>(null);
  const [failed, setFailed] = useState(false);
  const [checking, setChecking] = useState(false);
  useEffect(() => {
    try {
      const instance = new Worker(new URL('../../lib/password-strength.worker.ts', import.meta.url)); worker.current = instance;
      instance.onmessage = ({ data }) => { if (data.requestId === requestId.current) { setAssessment(data.assessment || null); setFailed(Boolean(data.error)); setChecking(false); } };
      instance.onerror = () => { instance.terminate(); worker.current = null; setAssessment(null); setFailed(true); setChecking(false); };
      return () => { instance.terminate(); worker.current = null; };
    } catch { setFailed(true); }
  }, []);
  useEffect(() => {
    if (!worker.current) { setFailed(true); return; }
    setChecking(true); setFailed(false);
    worker.current.postMessage({ requestId: ++requestId.current, password, context: { userId: context?.userId, name: context?.name, email: context?.email } });
  }, [password, context?.userId, context?.name, context?.email]);
  return <div id={id} className="mt-3 space-y-2">
    <div className="h-1.5 overflow-hidden rounded-full bg-[#e3e6dc]" role="meter" aria-label="Password strength" aria-valuemin={0} aria-valuemax={4} aria-valuenow={assessment?.score || 0} aria-valuetext={password ? checking ? 'Checking' : assessment?.label || 'Unavailable' : 'Not entered'} aria-busy={checking}>
      <div className="h-full rounded-full transition-[width,background-color] duration-300 ease-out motion-reduce:transition-none" style={{ width: (password ? assessment?.fill || 0 : 0) + '%', backgroundColor: assessment?.color || '#DC4545' }}/>
    </div>
    <div aria-live="polite" aria-atomic="true" className="text-xs leading-5"><p className="m-0 text-[10px] font-semibold tracking-[.12em] text-ink">{password ? checking ? 'CHECKING…' : assessment?.label || 'CHECK ON SAVE' : 'PASSWORD STRENGTH'}</p><p className="m-0 mt-1 text-muted">{failed ? 'Live feedback is unavailable. Your password will still be checked securely when saved.' : checking ? 'Checking common patterns and account information…' : assessment?.message || 'Use 12–128 characters. Try several unrelated words or Generate.'}</p></div>
  </div>;
}
