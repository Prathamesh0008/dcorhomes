import { assessPassword, type PasswordContext } from './password-policy';

type Input = { requestId: number; password: string; context?: PasswordContext };
const worker = globalThis as unknown as { onmessage: ((event: MessageEvent<Input>) => void) | null; postMessage: (value: unknown) => void };
let pending: ReturnType<typeof setTimeout>;
worker.onmessage = ({ data }) => {
  // Coalesce queued keystrokes, then score off the UI thread. No network or persistence.
  clearTimeout(pending);
  pending = setTimeout(() => {
    try { worker.postMessage({ requestId: data.requestId, assessment: assessPassword(data.password, data.context) }); }
    catch { worker.postMessage({ requestId: data.requestId, error: true }); }
  }, 0);
};
