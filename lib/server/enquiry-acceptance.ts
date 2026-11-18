import 'server-only';
import { randomUUID } from 'node:crypto';
import type { Collection } from 'mongodb';
import type { CustomerAcceptanceEmail, DeliveryState, EmailState } from '@/lib/enquiries';
import { HttpError } from './http';
import { buildAcceptanceEmail } from './enquiry-email-template';
import { enquiryEmailConfiguration, resendFailure, sendEnquiryEmail } from './enquiry-email-configuration';
import type { EnquiryRecord } from './enquiry-store';

export type CustomerNotification = {
  state: EmailState | 'no-email';
  attempts: number;
  lastAttemptAt?: Date;
  failure?: string;
  key?: string;
  body?: string;
  startedAt?: Date;
  leaseToken?: string;
  leaseUntil?: Date;
  providerId?: string;
  deliveryStatus?: DeliveryState;
  deliveryAt?: Date;
  deliveryEvent?: string;
};

// Leave a margin before Resend's 24-hour idempotency guarantee expires.
const safeWindow = 23 * 60 * 60 * 1000;
const attemptTag = 'customer_acceptance_key';
const failureReasons: Record<string, string> = {
  invalid_api_key: 'Resend rejected the API key.',
  key_permission: 'The Resend key cannot send from this domain.',
  key_suspended: 'The Resend API key is suspended.',
  sender_domain_unverified: 'The sender domain is unverified in Resend.',
  testing_recipient_restriction: 'The Resend test sender cannot email this customer.',
  provider_rate_limit: 'Resend rate-limited the request.',
  provider_quota: 'The Resend sending quota was exceeded.',
  provider_rejected: 'Resend rejected the email request.',
  provider_unavailable: 'Resend did not confirm the request.',
  transport_failure: 'The connection ended before Resend confirmed the request.',
  missing_provider_confirmation: 'Resend returned no email identifier.',
  idempotency_conflict: 'Resend could not confirm the result of this send attempt.',
};
const deliveryFailures: Partial<Record<DeliveryState, string>> = {
  failed: 'Resend confirmed that it could not send the email.',
  bounced: 'The recipient’s mail server bounced the email.',
  complained: 'The recipient reported the email as spam.',
  suppressed: 'Resend suppressed the recipient address.',
};

export function initialCustomerEmail(value: string): CustomerNotification {
  return { state: /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(value?.trim()) ? 'pending' : 'no-email', attempts: 0 };
}

export function canQueueUntrackedCustomerEmail(record: EnquiryRecord) {
  return record.status === 'accepted' && !record.customerAcceptance && initialCustomerEmail(record.data.email).state === 'pending' &&
    !record.history.some(entry => entry.action.startsWith('customer-acceptance-email-'));
}

function uncertain(n: CustomerNotification) {
  return n.state === 'unknown' || n.state === 'sending';
}

function needsReconciliation(n: CustomerNotification, now: Date) {
  return uncertain(n) && (!n.key || !n.body || !n.startedAt || now.getTime() - n.startedAt.getTime() >= safeWindow);
}

export function customerEmailDetails(record: EnquiryRecord, now = new Date()): CustomerAcceptanceEmail {
  const n = record.customerAcceptance;
  if (!n) return { state: 'not-sent', retryAllowed: canQueueUntrackedCustomerEmail(record) };
  const result: CustomerAcceptanceEmail = { state: 'pending', lastAttemptAt: n.lastAttemptAt?.toISOString(), retryAllowed: false };
  const deliveryIssue = n.deliveryStatus && deliveryFailures[n.deliveryStatus];
  if (n.deliveryStatus === 'delivered') return { ...result, state: 'delivered' };
  if (deliveryIssue) return { ...result, state: 'failed', reason: deliveryIssue, retryAllowed: record.status === 'accepted' && n.deliveryStatus === 'failed' };
  if (n.state === 'no-email' || n.state === 'accepted') return { ...result, state: n.state };
  if (n.state === 'sending' && n.leaseUntil && n.leaseUntil > now) return result;
  if (needsReconciliation(n, now)) return { ...result, state: 'failed', reason: 'The previous outcome is unconfirmed. Check the matching email in Resend and replay its signed status event before retrying.' };
  const configuration = n.failure?.startsWith('configuration:') ? n.failure.slice('configuration:'.length) : undefined;
  const reason = configuration ? `Configure ${configuration} and retry.` : n.failure ? failureReasons[n.failure] : undefined;
  return { ...result, state: n.state === 'not-configured' ? 'not-configured' : n.state === 'pending' ? 'pending' : 'failed',
    reason: reason || (uncertain(n) ? 'The previous attempt did not confirm a result.' : undefined), retryAllowed: record.status === 'accepted' };
}

export async function sendCustomerAcceptance(collection: Collection<EnquiryRecord>, record: EnquiryRecord, actor: string) {
  const n = record.customerAcceptance, now = new Date();
  if (!n || record.status !== 'accepted') return record;
  if (needsReconciliation(n, now)) throw new HttpError(409, 'The previous outcome is unconfirmed. Check Resend and replay its signed status event before retrying.');
  if (!customerEmailDetails(record, now).retryAllowed) return record;

  const settings = enquiryEmailConfiguration(), reuse = uncertain(n), leaseToken = randomUUID();
  // A lost response can be replayed only with the exact request Resend may already have accepted.
  const key = reuse ? n.key! : `dcorhome-customer-acceptance-${randomUUID()}`;
  const body = reuse ? n.body! : JSON.stringify({
    from: `DCOR HOME <${settings.recipient}>`, to: [record.data.email.trim()],
    reply_to: settings.recipient, ...buildAcceptanceEmail(record.reference, record.data), tags: [{ name: attemptTag, value: key }],
  });
  const filter = { _id: record._id, kind: record.kind, status: 'accepted' as const,
    'customerAcceptance.attempts': n.attempts, 'customerAcceptance.state': n.state,
    'customerAcceptance.deliveryStatus': n.deliveryStatus ?? { $exists: false } };
  const current = async () => await collection.findOne({ _id: record._id, kind: record.kind }) || record;

  if (settings.issues.length) {
    const state = reuse ? 'unknown' : 'not-configured';
    return await collection.findOneAndUpdate(filter, {
      $set: { 'customerAcceptance.state': state, 'customerAcceptance.lastAttemptAt': now, 'customerAcceptance.failure': `configuration:${settings.issues.join(', ')}` },
      $unset: { 'customerAcceptance.leaseToken': '', 'customerAcceptance.leaseUntil': '',
        ...(!reuse ? { 'customerAcceptance.key': '', 'customerAcceptance.startedAt': '', 'customerAcceptance.providerId': '',
          'customerAcceptance.deliveryStatus': '', 'customerAcceptance.deliveryAt': '', 'customerAcceptance.deliveryEvent': '' } : {}) },
      $inc: { 'customerAcceptance.attempts': 1 },
      $push: { history: { action: `customer-acceptance-email-${state}`, actor, at: now } },
    }, { returnDocument: 'after', writeConcern: { w: 'majority' } }) || await current();
  }

  const claimed = await collection.updateOne(filter, {
    $set: { 'customerAcceptance.state': 'sending', 'customerAcceptance.key': key, 'customerAcceptance.body': body,
      'customerAcceptance.startedAt': reuse ? n.startedAt! : now, 'customerAcceptance.lastAttemptAt': now,
      'customerAcceptance.leaseToken': leaseToken, 'customerAcceptance.leaseUntil': new Date(now.getTime() + 90000) },
    $unset: { 'customerAcceptance.failure': '', ...(!reuse ? { 'customerAcceptance.providerId': '', 'customerAcceptance.deliveryStatus': '',
      'customerAcceptance.deliveryAt': '', 'customerAcceptance.deliveryEvent': '' } : {}) },
    $inc: { 'customerAcceptance.attempts': 1 },
    $push: { history: { action: 'customer-acceptance-email-attempt', actor, at: now } },
  }, { writeConcern: { w: 'majority' } });
  if (!claimed.modifiedCount) return current();

  let state: EmailState = 'unknown', providerId: string | undefined, failure: string | undefined;
  try {
    const response = await sendEnquiryEmail(settings.apiKey, key, body);
    if (response.providerId) { state = 'accepted'; providerId = response.providerId; }
    else if (response.ok) failure = 'missing_provider_confirmation';
    else {
      const safe = resendFailure(response.status, response.result);
      failure = safe.category;
      if (!reuse && response.status >= 400 && response.status < 500 && ![408, 409].includes(response.status)) state = 'failed';
      console.error(JSON.stringify({ event: 'customer_acceptance_email_failure', ...safe }));
    }
  } catch { failure = 'transport_failure'; }

  return await collection.findOneAndUpdate({ _id: record._id, 'customerAcceptance.leaseToken': leaseToken }, {
    $set: { 'customerAcceptance.state': state, ...(providerId ? { 'customerAcceptance.providerId': providerId } : {}),
      ...(failure ? { 'customerAcceptance.failure': failure } : {}) },
    $unset: { 'customerAcceptance.leaseToken': '', 'customerAcceptance.leaseUntil': '', ...(state !== 'unknown' ? { 'customerAcceptance.body': '' } : {}) },
    $push: { history: { action: `customer-acceptance-email-${state}`, actor, at: new Date() } },
  }, { returnDocument: 'after', writeConcern: { w: 'majority' } }) || await current();
}

export async function recordCustomerDelivery(collection: Collection<EnquiryRecord>, data: { email_id: string; tags?: Record<string, string> }, status: DeliveryState, at: Date, eventId: string) {
  const key = data.tags?.[attemptTag];
  // A reported send or successful delivery must never reopen a send attempt.
  const earlier: Record<DeliveryState, DeliveryState[]> = {
    sent: [], delayed: ['sent'], failed: [], delivered: ['sent', 'delayed', 'failed'],
    bounced: ['sent', 'delayed', 'failed'], suppressed: ['sent', 'delayed', 'failed'],
    complained: ['sent', 'delayed', 'delivered'],
  };
  await collection.updateOne({ kind: 'customer-enquiry', 'customerAcceptance.deliveryEvent': { $ne: eventId },
    $and: [
      { $or: [{ 'customerAcceptance.providerId': data.email_id },
        ...(key && /^dcorhome-customer-acceptance-[a-f0-9-]{36}$/i.test(key) ? [{ 'customerAcceptance.key': key }] : [])] },
      { $or: [{ 'customerAcceptance.providerId': data.email_id }, { 'customerAcceptance.providerId': { $exists: false } }] },
      { $or: [{ 'customerAcceptance.deliveryStatus': { $exists: false } }, { 'customerAcceptance.deliveryStatus': { $in: earlier[status] }, 'customerAcceptance.deliveryAt': { $lte: at } }] },
    ],
  }, {
    $set: { 'customerAcceptance.state': 'accepted', 'customerAcceptance.providerId': data.email_id,
      'customerAcceptance.deliveryStatus': status, 'customerAcceptance.deliveryAt': at, 'customerAcceptance.deliveryEvent': eventId },
    $unset: { 'customerAcceptance.failure': '', 'customerAcceptance.body': '', 'customerAcceptance.leaseToken': '', 'customerAcceptance.leaseUntil': '' },
    $push: { history: { action: `customer-acceptance-email-${status}`, actor: 'resend', at } },
  }, { writeConcern: { w: 'majority' } });
}
