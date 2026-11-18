import 'server-only';
export const enquiryRecipient = 'sales@dcorhome.com';
export function cleanEmailSetting(value: string | undefined) {
  return (value || '').replace(/[\u200B-\u200D\u2060\uFEFF]/g, '').trim();
}
export function enquiryEmailConfiguration() {
  const apiKey = cleanEmailSetting(process.env.RESEND_API_KEY);
  const senderVariable = (['RESEND_FROM_EMAIL', 'ENQUIRY_FROM_EMAIL', 'EMAIL_FROM'] as const).find(name => cleanEmailSetting(process.env[name]));
  const from = senderVariable ? cleanEmailSetting(process.env[senderVariable]) : '';
  const address = from.match(/<([^<>]+)>$/)?.[1] || from;
  const issues: string[] = [];
  if (!/^re_[A-Za-z0-9_-]+$/.test(apiKey) || /YOUR[_ -]|REPLACE[_ -]|placeholder/i.test(apiKey)) issues.push('RESEND_API_KEY');
  if (!address || !/^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/.test(address) || /[\r\n]/.test(from) || (from.includes('<') && !/^[^<>]+<[^<>]+>$/.test(from))) issues.push('RESEND_FROM_EMAIL');
  return { apiKey, from, address, senderVariable, issues, recipient: enquiryRecipient };
}

export async function sendEnquiryEmail(apiKey: string, key: string, body: string) {
  const response = await fetch('https://api.resend.com/emails', { method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': key },
    body, signal: AbortSignal.timeout(15000) });
  const result: unknown = await response.json().catch(() => null);
  const providerId = response.ok && result && typeof result === 'object' && 'id' in result &&
    typeof result.id === 'string' && result.id.trim() ? result.id : undefined;
  return { ok: response.ok, status: response.status, result, providerId };
}

// Resend messages may contain addresses. Reduce them to fixed categories before logging.
export function resendFailure(status: number, body: unknown) {
  const value = body && typeof body === 'object' ? body as Record<string, unknown> : {};
  const message = typeof value.message === 'string' ? value.message.toLowerCase() : '';
  const names = ['validation_error', 'missing_api_key', 'restricted_api_key', 'suspended_api_key', 'invalid_permission', 'invalid_idempotency_key', 'invalid_idempotent_request', 'concurrent_idempotent_requests', 'rate_limit_exceeded', 'daily_quota_exceeded', 'monthly_quota_exceeded', 'application_error', 'internal_server_error'];
  const providerError = names.includes(String(value.name)) ? String(value.name) : 'unknown';
  const category = /api key is invalid|invalid api key/.test(message) || value.name === 'missing_api_key' ? 'invalid_api_key'
    : /only send testing/.test(message) ? 'testing_recipient_restriction'
    : /domain.*not verified|verify.*domain/.test(message) ? 'sender_domain_unverified'
    : value.name === 'restricted_api_key' || value.name === 'invalid_permission' ? 'key_permission'
    : value.name === 'suspended_api_key' ? 'key_suspended'
    : /idempotent|idempotency/.test(providerError) ? 'idempotency_conflict'
    : status === 429 ? 'provider_rate_limit'
    : /quota/.test(providerError) ? 'provider_quota'
    : status >= 500 ? 'provider_unavailable' : 'provider_rejected';
  return { status, providerError, category };
}
