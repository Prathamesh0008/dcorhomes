import type { EnquiryEmailData } from './server/enquiry-email-template';
import type { VisualizerDesign } from './manual-visualizer/model';

export const enquiryStatuses = ['pending', 'accepted', 'contacted', 'completed', 'rejected'] as const;
export type EnquiryStatus = typeof enquiryStatuses[number];
export const enquiryStatusLabels: Record<EnquiryStatus, string> = { pending: 'Pending', accepted: 'Accepted', contacted: 'Contacted', completed: 'Completed', rejected: 'Rejected' };
export type EnquiryData = EnquiryEmailData & { visualizer: VisualizerDesign | null };
export type EmailState = 'pending' | 'sending' | 'accepted' | 'failed' | 'not-configured' | 'unknown';
export type DeliveryState = 'sent' | 'delivered' | 'delayed' | 'bounced' | 'complained' | 'failed' | 'suppressed';
export type EnquiryAction = { action: string; actor: string; at: string; from?: EnquiryStatus; to?: EnquiryStatus; note?: string };
export type CustomerEmailState = 'not-sent' | 'pending' | 'accepted' | 'delivered' | 'failed' | 'not-configured' | 'no-email';
export type CustomerAcceptanceEmail = { state: CustomerEmailState; lastAttemptAt?: string; reason?: string; retryAllowed: boolean };
export type EnquirySummary = { id: string; reference: string; name: string; email: string; phone: string; enquiryType: string; status: EnquiryStatus; createdAt: string; updatedAt: string; revision: number; notification: { state: EmailState; attempts: number; failure?: string; deliveryStatus?: DeliveryState; updatedAt?: string } };
export type EnquiryDetail = EnquirySummary & { data: EnquiryData; note: string; history: EnquiryAction[]; emailRetryAllowed: boolean; customerAcceptanceEmail: CustomerAcceptanceEmail };
