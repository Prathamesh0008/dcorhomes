import { NextRequest, NextResponse } from 'next/server';
import { memberJson, requireMemberAdmin } from '@/lib/server/members';
import { emailId, sentEnquiries, sentEnquiry } from '@/lib/server/admin-enquiries';
import { mongoDatabase } from '@/lib/server/mongodb';
import { failure, HttpError, privateHeaders } from '@/lib/server/http';
export const runtime = 'nodejs';
export async function GET(request: NextRequest) {
  try {
    await requireMemberAdmin();
    const id = request.nextUrl.searchParams.get('id');
    const db = await mongoDatabase();
    if (id) {
      const email = await sentEnquiry(emailId(id));
      const state = await db.collection('admin_enquiry_state').findOne({ emailId: id }, { projection: { _id: 0, status: 1, note: 1 } });
      return NextResponse.json({ ...email, status: state?.status || 'new', note: state?.note || '' }, { headers: privateHeaders });
    }
    const result = await sentEnquiries(request.nextUrl.searchParams.get('after') || undefined);
    const states = await db.collection('admin_enquiry_state').find({ emailId: { $in: result.emails.map(e => e.id) } }, { projection: { _id: 0, emailId: 1, status: 1 } }).toArray();
    return NextResponse.json({ ...result, emails: result.emails.map(email => ({ ...email, status: states.find(s => s.emailId === email.id)?.status || 'new' })) }, { headers: privateHeaders });
  } catch (error) { return failure(error); }
}
export async function PATCH(request: NextRequest) {
  try {
    const actor = await requireMemberAdmin(), input = await memberJson(request, 6000), id = emailId(input.id);
    if (!['new', 'in-progress', 'closed'].includes(String(input.status)) || typeof input.note !== 'string' || input.note.length > 3000) throw new HttpError(400, 'Choose a valid status and a note up to 3000 characters.');
    await sentEnquiry(id);
    // Metadata lives only in the administrator path; public submissions stay database-independent.
    await (await mongoDatabase()).collection<{ _id: string; emailId: string; status: string; note: string; updatedAt: Date; updatedBy: string }>('admin_enquiry_state').updateOne({ _id: id }, { $set: { emailId: id, status: String(input.status), note: input.note, updatedAt: new Date(), updatedBy: actor.id } }, { upsert: true });
    return NextResponse.json({ success: true }, { headers: privateHeaders });
  } catch (error) { return failure(error); }
}
