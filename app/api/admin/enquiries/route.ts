import { NextRequest, NextResponse } from 'next/server';
import { memberJson, requireMemberAdmin } from '@/lib/server/members';
import { enquiryDetail, findEnquiry, listEnquiries, updateEnquiry, notifyEnquiry, retryCustomerAcceptance } from '@/lib/server/enquiry-store';
import { failure, HttpError, privateHeaders } from '@/lib/server/http';
import { logDatabaseFailure } from '@/lib/server/database-diagnostics';
export const runtime = 'nodejs';
function failed(error: unknown) {
  if (error instanceof HttpError) return failure(error);
  logDatabaseFailure('admin_enquiries', error);
  return failure(new HttpError(503, 'Enquiry management is temporarily unavailable. Please try again.'));
}
export async function GET(request: NextRequest) {
  try {
    await requireMemberAdmin();
    const id = request.nextUrl.searchParams.get('id');
    return NextResponse.json(id ? enquiryDetail(await findEnquiry(id)) : await listEnquiries(request.nextUrl.searchParams), { headers: privateHeaders });
  } catch (error) { return failed(error); }
}
export async function PATCH(request: NextRequest) {
  try {
    const actor = await requireMemberAdmin(), input = await memberJson(request, 6000);
    return NextResponse.json(await updateEnquiry(input.id, input.status, input.note, input.revision, actor.id), { headers: privateHeaders });
  } catch (error) { return failed(error); }
}
export async function POST(request: NextRequest) {
  try {
    const actor = await requireMemberAdmin(), input = await memberJson(request, 2048);
    if (typeof input.id !== 'string' || (input.action !== 'retry-email' && input.action !== 'retry-customer-email')) throw new HttpError(400, 'Choose a valid enquiry action.');
    const record = await (input.action === 'retry-email' ? notifyEnquiry(input.id, actor.id) : retryCustomerAcceptance(input.id, actor.id));
    return NextResponse.json(enquiryDetail(record), { headers: privateHeaders });
  } catch (error) { return failed(error); }
}
