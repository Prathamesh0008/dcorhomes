import 'server-only';
import { HttpError } from './http';
type SentEmail = { id: string; subject: string; to: string[]; from: string; created_at: string; text?: string | null };
export function isEnquiry(email: SentEmail) {
  const sender = (process.env.RESEND_FROM_EMAIL || process.env.ENQUIRY_FROM_EMAIL || process.env.EMAIL_FROM || '').trim();
  const address = (value: string) => (value.match(/<([^<>]+)>$/)?.[1] || value).toLowerCase();
  return email.to.includes('sales@dcorhome.com') && /^New .+ \| .+ \| Dcorhome$/.test(email.subject) && Boolean(sender) && address(email.from) === address(sender);
}
export function emailId(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)) throw new HttpError(400, 'Invalid enquiry reference.');
  return value;
}
async function resend<T>(path: string): Promise<T> {
  const key = process.env.RESEND_ADMIN_API_KEY || process.env.RESEND_API_KEY;
  if (!key) throw new HttpError(503, 'Configure a Resend key with email read access for enquiry management.');
  try {
    const response = await fetch(`https://api.resend.com/emails${path}`, { headers: { Authorization: `Bearer ${key}` }, cache: 'no-store', signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new HttpError(503, 'Enquiries could not be loaded. Check Resend email read permissions or try again later.');
    return await response.json() as T;
  } catch (error) { if (error instanceof HttpError) throw error; throw new HttpError(503, 'Enquiries are temporarily unavailable.'); }
}
export async function sentEnquiries(after?: string) {
  const result = await resend<{ data: SentEmail[]; has_more: boolean }>(`?limit=50${after ? `&after=${emailId(after)}` : ''}`);
  return { emails: result.data.filter(isEnquiry).map(email => ({ id: email.id, subject: email.subject, createdAt: email.created_at })), next: result.has_more ? result.data.at(-1)?.id : undefined };
}
export async function sentEnquiry(id: string) {
  const email = await resend<SentEmail>(`/${emailId(id)}`);
  if (!isEnquiry(email)) throw new HttpError(404, 'Enquiry not found.');
  return { id: email.id, subject: email.subject, createdAt: email.created_at, text: email.text || 'Open this enquiry in the sales mailbox to read its contents.' };
}
