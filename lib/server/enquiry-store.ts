import 'server-only';
import { createHash, randomUUID } from 'node:crypto';
import { ObjectId, type Filter } from 'mongodb';
import { mongoDatabase } from './mongodb';
import { HttpError } from './http';
import { buildEnquiryEmail } from './enquiry-email-template';
import { enquiryEmailConfiguration, resendFailure, sendEnquiryEmail } from './enquiry-email-configuration';
import { canQueueUntrackedCustomerEmail, customerEmailDetails, initialCustomerEmail, sendCustomerAcceptance, recordCustomerDelivery, type CustomerNotification } from './enquiry-acceptance';
import { logDatabaseFailure } from './database-diagnostics';
import { enquiryStatuses, type EnquiryStatus, type EnquiryData, type EmailState, type DeliveryState, type EnquirySummary, type EnquiryDetail } from '@/lib/enquiries';

const kind = 'customer-enquiry';
type History = { action: string; actor: string; at: Date; from?: EnquiryStatus; to?: EnquiryStatus; note?: string };
export type EnquiryRecord = {
  _id: ObjectId; kind: typeof kind; id: string; reference: string; requestKey: string; fingerprint: string;
  data: EnquiryData; status: EnquiryStatus; createdAt: Date; updatedAt: Date; revision: number; note: string; history: History[];
  notification: { state: EmailState; attempts: number; updatedAt: Date; failure?: string; providerId?: string;
    leaseToken?: string; leaseUntil?: Date; key?: string; body?: string; startedAt?: Date;
    deliveryStatus?: DeliveryState; deliveryAt?: Date; deliveryEvent?: string };
  customerAcceptance?: CustomerNotification;
};
let indexes: Promise<void> | undefined;
export async function enquiriesCollection() {
  const collection = (await mongoDatabase()).collection<EnquiryRecord>('enquiries');
  if (!indexes) indexes = (async () => {
    // Partial indexes leave every historical record and its indexes intact.
    await collection.createIndex({ requestKey: 1 }, { name: 'customer_enquiry_request', unique: true, partialFilterExpression: { kind } });
    await collection.createIndex({ reference: 1 }, { name: 'customer_enquiry_reference', unique: true, partialFilterExpression: { kind } });
    await collection.createIndex({ kind: 1, status: 1, createdAt: -1, _id: -1 }, { name: 'customer_enquiry_status_date' });
    await collection.createIndex({ kind: 1, 'notification.providerId': 1 }, { name: 'customer_enquiry_email' });
    await collection.createIndex({ 'customerAcceptance.providerId': 1 }, { name: 'customer_acceptance_provider', sparse: true });
    await collection.createIndex({ 'customerAcceptance.key': 1 }, { name: 'customer_acceptance_attempt', sparse: true });
  })().catch(error => { indexes = undefined; throw error; });
  await indexes;
  return collection;
}
function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).filter(([,v]) => v !== undefined).sort(([a],[b]) => a.localeCompare(b)).map(([k,v]) => [k, stable(v)]));
  return value;
}
export function enquiryId(value: unknown) {
  if (typeof value !== 'string' || !/^[a-f0-9]{24}$/i.test(value)) throw new HttpError(400, 'Invalid enquiry reference.');
  return new ObjectId(value);
}
export function enquiryRequestKey(value: unknown) {
  if (typeof value !== 'string' || !/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i.test(value)) throw new HttpError(400, 'Reopen the enquiry form and try again with a valid submission reference.');
  return value.toLowerCase();
}
export async function storeEnquiry(requestKey: string, data: EnquiryData) {
  const collection = await enquiriesCollection(), now = new Date(), _id = new ObjectId();
  const { consentAt: _consent, ...content } = data;
  const fingerprint = createHash('sha256').update(JSON.stringify(stable(content))).digest('hex');
  const document: EnquiryRecord = { _id, kind, id: _id.toHexString(), requestKey, fingerprint,
    reference: `DCOR-${now.toISOString().slice(0,10).replaceAll('-','')}-${_id.toHexString().toUpperCase()}`,
    data, status: 'pending', createdAt: now, updatedAt: now, revision: 1, note: '',
    notification: { state: 'pending', attempts: 0, updatedAt: now }, history: [{ action: 'submitted', actor: 'customer', at: now }] };
  try { await collection.insertOne(document, { writeConcern: { w: 'majority' } }); return { record: document, duplicate: false }; }
  catch (error) {
    if ((error as { code?: number }).code !== 11000) throw error;
    const previous = await collection.findOne({ kind, requestKey });
    if (!previous || previous.fingerprint !== fingerprint) throw new HttpError(409, 'This submission reference was already used for different details. Reopen the form before submitting.');
    return { record: previous, duplicate: true };
  }
}
export async function findEnquiry(id: unknown) {
  const record = await (await enquiriesCollection()).findOne({ kind, _id: enquiryId(id) });
  if (!record) throw new HttpError(404, 'Enquiry not found.');
  return record;
}
export function enquirySummary(record: EnquiryRecord): EnquirySummary {
  const { state, attempts, failure, deliveryStatus, updatedAt } = record.notification;
  return { id: String(record._id), reference: record.reference, name: record.data.name, email: record.data.email, phone: record.data.phone,
    enquiryType: record.data.enquiryType, status: record.status, createdAt: record.createdAt.toISOString(), updatedAt: record.updatedAt.toISOString(), revision: record.revision,
    notification: { state, attempts, failure, deliveryStatus, updatedAt: updatedAt.toISOString() } };
}
export function canRetryEmail(record: EnquiryRecord) {
  const n = record.notification;
  if (n.state === 'sending' && n.leaseUntil && n.leaseUntil > new Date()) return false;
  if (n.deliveryStatus === 'failed') return true;
  if (n.deliveryStatus && ['delivered','sent','delayed','bounced','complained','suppressed'].includes(n.deliveryStatus)) return false;
  return ['pending','failed','not-configured','unknown'].includes(n.state) || (n.state === 'sending' && (!n.leaseUntil || n.leaseUntil <= new Date()));
}
export function enquiryDetail(record: EnquiryRecord): EnquiryDetail {
  return { ...enquirySummary(record), data: record.data, note: record.note, history: record.history.map(entry => ({ ...entry, at: entry.at.toISOString() })),
    emailRetryAllowed: canRetryEmail(record), customerAcceptanceEmail: customerEmailDetails(record) };
}
export async function listEnquiries(params: URLSearchParams) {
  const query: Filter<EnquiryRecord> = { kind };
  const status = params.get('status'), email = params.get('emailStatus'), search = (params.get('search') || '').trim();
  if (status && status !== 'all') { if (!enquiryStatuses.includes(status as EnquiryStatus)) throw new HttpError(400, 'Invalid enquiry status.'); query.status = status as EnquiryStatus; }
  if (email && email !== 'all') {
    if (email === 'needs-attention') query.$or = [{ 'notification.state': { $in: ['pending','sending','failed','not-configured','unknown'] } }, { 'notification.deliveryStatus': { $in: ['failed','bounced','suppressed'] } }];
    else if (['accepted','delivered'].includes(email)) { if (email === 'accepted') query['notification.state'] = 'accepted'; else query['notification.deliveryStatus'] = 'delivered'; }
    else throw new HttpError(400, 'Invalid email status.');
  }
  if (search) {
    if (search.length > 100) throw new HttpError(400, 'Search must be at most 100 characters.');
    const regex = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
    query.$and = [{ $or: ['reference','data.name','data.email','data.phone','data.message','data.interest','data.selectedFabric.name'].map(field => ({ [field]: regex })) }];
  }
  for (const [parameter, operator] of [['from','$gte'],['to','$lt']] as const) {
    const value = params.get(parameter); if (!value) continue;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10) !== value) throw new HttpError(400, 'Choose a valid date.');
    query.createdAt ||= {}; Object.assign(query.createdAt, { [operator]: new Date(Date.parse(value) + (parameter === 'to' ? 86400000 : 0)) });
  }
  const page = Number(params.get('page') || 1);
  if (!Number.isInteger(page) || page < 1 || page > 10000) throw new HttpError(400, 'Invalid page.');
  const collection = await enquiriesCollection();
  const escapedSearch = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const recordsQuery = search
    ? collection.aggregate<EnquiryRecord>([
        { $match: query },
        { $addFields: { _nameMatchRank: { $switch: { branches: [
          { case: { $regexMatch: { input: { $ifNull: ['$data.name', ''] }, regex: { $literal: `^${escapedSearch}$` }, options: 'i' } }, then: 0 },
          { case: { $regexMatch: { input: { $ifNull: ['$data.name', ''] }, regex: { $literal: escapedSearch }, options: 'i' } }, then: 1 },
        ], default: 2 } } } },
        { $sort: { _nameMatchRank: 1, createdAt: -1, _id: -1 } },
        { $skip: (page - 1) * 25 }, { $limit: 25 },
      ]).toArray()
    : collection.find(query).sort({ createdAt: -1, _id: -1 }).skip((page - 1) * 25).limit(25).toArray();
  const [records, total] = await Promise.all([recordsQuery, collection.countDocuments(query)]);
  return { enquiries: records.map(enquirySummary), total, page, pages: Math.max(1, Math.ceil(total / 25)) };
}
export async function updateEnquiry(id: unknown, status: unknown, note: unknown, revision: unknown, actor: string) {
  if (!enquiryStatuses.includes(status as EnquiryStatus) || typeof note !== 'string' || note.length > 3000 || !Number.isInteger(revision)) throw new HttpError(400, 'Choose a valid status and a note up to 3000 characters.');
  const record = await findEnquiry(id), at = new Date();
  const firstAcceptance = status === 'accepted' && record.status !== 'accepted' && !record.customerAcceptance &&
    !record.history.some(entry => entry.from === 'accepted' || entry.to === 'accepted');
  const queued = firstAcceptance ? initialCustomerEmail(record.data.email) : undefined;
  const history: History[] = [{ action: 'updated', actor, at, from: record.status, to: status as EnquiryStatus, note }];
  if (queued) history.push({ action: `customer-acceptance-email-${queued.state}`, actor, at });
  const collection = await enquiriesCollection();
  const result = await collection.findOneAndUpdate({ kind, _id: record._id, revision: Number(revision) }, {
    $set: { status: status as EnquiryStatus, note, updatedAt: at, ...(queued ? { customerAcceptance: queued } : {}) }, $inc: { revision: 1 },
    $push: { history: { $each: history } },
  }, { returnDocument: 'after', ...(queued ? { writeConcern: { w: 'majority' } } : {}) });
  if (!result) throw new HttpError(409, 'This enquiry was changed by another administrator. Reload before saving.');
  if (queued?.state === 'pending') {
    try { return enquiryDetail(await sendCustomerAcceptance(collection, result, actor)); }
    catch (error) { logDatabaseFailure('customer_acceptance_email', error); }
  }
  return enquiryDetail(result);
}

export async function retryCustomerAcceptance(id: string, actor: string) {
  const record = await findEnquiry(id);
  const collection = await enquiriesCollection();
  if (!canQueueUntrackedCustomerEmail(record)) return sendCustomerAcceptance(collection, record, actor);

  // Recovery for accepted records saved before a customer send was tracked. Only an explicit retry can queue these.
  const queued = await collection.findOneAndUpdate({ kind, _id: record._id, status: 'accepted', customerAcceptance: { $exists: false } }, {
    $set: { customerAcceptance: initialCustomerEmail(record.data.email) },
    $push: { history: { action: 'customer-acceptance-email-pending', actor, at: new Date() } },
  }, { returnDocument: 'after', writeConcern: { w: 'majority' } });
  return sendCustomerAcceptance(collection, queued || await findEnquiry(id), actor);
}

// The notification is an outbox entry on the saved enquiry. Lease ownership prevents concurrent sends.
export async function notifyEnquiry(id: string, actor = 'system') {
  const collection = await enquiriesCollection(), record = await findEnquiry(id), n = record.notification, now = new Date();
  if (!canRetryEmail(record)) {
    if (n.state === 'sending') throw new HttpError(409, 'An email attempt is already in progress. Refresh shortly.');
    return record;
  }
  const uncertain = n.state === 'unknown' || n.state === 'sending';
  if (uncertain && n.startedAt && now.getTime() - n.startedAt.getTime() >= 23 * 3600000) throw new HttpError(409, 'Previous email delivery is uncertain and its safe retry window has expired. Check Resend before taking further action. The enquiry is safely stored.');
  const settings = enquiryEmailConfiguration(), leaseToken = randomUUID();
  const key = uncertain && n.key ? n.key : `dcorhome-enquiry-${record.id}-${randomUUID()}`;
  const body = uncertain && n.body ? n.body : JSON.stringify({ from: settings.from.includes('<') ? settings.from : `Dcorhome <${settings.from}>`, to: [settings.recipient],
    ...(record.data.email ? { reply_to: record.data.email } : {}), ...buildEnquiryEmail(record.reference, record.data), tags: [{ name: 'enquiry_id', value: record.id }, { name: 'enquiry_key', value: key }] });
  const claimed = await collection.findOneAndUpdate({ kind, _id: record._id, 'notification.state': n.state, 'notification.attempts': n.attempts }, {
    $set: { 'notification.state': 'sending', 'notification.leaseToken': leaseToken, 'notification.leaseUntil': new Date(now.getTime() + 90000),
      'notification.key': key, 'notification.body': body, 'notification.startedAt': uncertain && n.startedAt ? n.startedAt : now, 'notification.updatedAt': now },
    $inc: { 'notification.attempts': 1 }, $push: { history: { action: 'email-attempt', actor, at: now } },
    $unset: { 'notification.failure': '', ...(!uncertain ? { 'notification.providerId': '' as const, 'notification.deliveryStatus': '' as const, 'notification.deliveryAt': '' as const, 'notification.deliveryEvent': '' as const } : {}) },
  }, { returnDocument: 'after' });
  if (!claimed) throw new HttpError(409, 'An email attempt is already in progress. Refresh shortly.');
  let state: EmailState = 'not-configured', failure: string | undefined, providerId: string | undefined;
  if (settings.issues.length) { state = uncertain ? 'unknown' : 'not-configured'; failure = 'configuration'; console.error(JSON.stringify({ event: 'enquiry_email_configuration', settings: settings.issues })); }
  else try {
    const response = await sendEnquiryEmail(settings.apiKey, key, body);
    if (!response.ok) {
      const safe = resendFailure(response.status, response.result); failure = safe.category; state = response.status >= 500 || response.status === 409 ? 'unknown' : 'failed';
      console.error(JSON.stringify({ event: 'enquiry_email_failure', ...safe }));
    } else if (response.providerId) { state = 'accepted'; providerId = response.providerId; }
    else { state = 'unknown'; failure = 'missing_provider_confirmation'; }
  } catch { state = 'unknown'; failure = 'transport_failure'; }
  const at = new Date();
  const updated = await collection.findOneAndUpdate({ kind, _id: record._id, 'notification.leaseToken': leaseToken }, {
    $set: { 'notification.state': state, 'notification.updatedAt': at, ...(providerId ? { 'notification.providerId': providerId } : {}), ...(failure ? { 'notification.failure': failure } : {}) },
    $unset: { 'notification.leaseToken': '', 'notification.leaseUntil': '', ...(!failure ? { 'notification.failure': '' as const } : {}) },
    $push: { history: { action: `email-${state}`, actor, at } },
  }, { returnDocument: 'after' });
  return updated || await findEnquiry(id);
}

export async function recordDelivery(event: { type: string; created_at: string; data: { email_id: string; tags?: Record<string, string> } }, eventId: string) {
  const statuses: Record<string, DeliveryState> = { 'email.sent': 'sent', 'email.delivered': 'delivered', 'email.delivery_delayed': 'delayed', 'email.bounced': 'bounced', 'email.complained': 'complained', 'email.failed': 'failed', 'email.suppressed': 'suppressed' };
  const deliveryStatus = statuses[event.type]; if (!deliveryStatus) return;
  const at = new Date(event.created_at); if (!Number.isFinite(at.getTime()) || typeof event.data.email_id !== 'string' || !event.data.email_id || event.data.email_id.length > 100) throw new HttpError(400, 'Invalid email event.');
  const collection = await enquiriesCollection();
  await recordCustomerDelivery(collection, event.data, deliveryStatus, at, eventId);
  const tag = event.data.tags?.enquiry_id, key = event.data.tags?.enquiry_key;
  const rank: DeliveryState[] = ['sent','delayed','failed','delivered','bounced','complained','suppressed'];
  const query: Filter<EnquiryRecord> = { kind, $or: [{ 'notification.providerId': event.data.email_id }, ...(tag && /^[a-f0-9]{24}$/i.test(tag) && key ? [{ _id: new ObjectId(tag), 'notification.key': key }] : [])],
    $and: [{ $or: [{ 'notification.deliveryAt': { $lt: at } }, { 'notification.deliveryAt': { $exists: false } }, { 'notification.deliveryAt': at, 'notification.deliveryStatus': { $in: rank.slice(0, rank.indexOf(deliveryStatus)) } }] }] };
  await collection.updateOne(query, { $set: { 'notification.providerId': event.data.email_id, 'notification.deliveryStatus': deliveryStatus, 'notification.deliveryAt': at, 'notification.deliveryEvent': eventId },
    $push: { history: { action: `email-${deliveryStatus}`, actor: 'resend', at } } });
}
