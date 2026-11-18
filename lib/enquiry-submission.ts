// Keep retries of the same payload together; edited details are a new request.
// Memory only: contact information is not persisted in browser storage.
export type EnquiryAttempt = { id: string; body: string };
export function enquiryAttempt(previous: EnquiryAttempt | null, payload: Record<string, unknown>): EnquiryAttempt {
  const body = JSON.stringify(payload);
  return previous?.body === body ? previous : { id: crypto.randomUUID(), body };
}
export function enquiryReceipt(result: { stored?: boolean; accepted?: boolean; reference?: string; notified?: boolean }) {
  if (result.stored !== true || result.accepted !== true || typeof result.reference !== 'string' || !result.reference.trim()) throw Error('We could not confirm that your enquiry was saved. Your details remain in the form. Please try again.');
  return `Your enquiry ${result.reference} has been saved. ${result.notified === true ? 'A notification has been accepted for delivery to our team.' : 'Our team can view your request. The email notification is delayed and can be retried by our team.'}`;
}
