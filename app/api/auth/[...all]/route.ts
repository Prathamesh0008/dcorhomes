import { NextRequest, NextResponse } from "next/server";
import { customerAuth, customerAuthReady } from "@/lib/server/customer-auth";
import { emailReady } from "@/lib/server/email";
export const runtime = "nodejs";
async function handler(request: NextRequest) {
  const unavailable = (message: string) => NextResponse.json({ message }, { status: 503, headers: { "Cache-Control": "no-store" } });
  if (!customerAuthReady()) return unavailable("Customer accounts are awaiting configuration. Please contact sales@dcorhome.com.");
  if (request.nextUrl.pathname.endsWith("/request-password-reset") && !emailReady()) return unavailable("Password reset email is unavailable. Contact sales@dcorhome.com for assistance.");
  try {
    const response = await customerAuth().handler(request);
    if (!response.ok && /\/(sign-in\/email|sign-up\/email)$/.test(request.nextUrl.pathname)) {
      return NextResponse.json({ message: "Unable to complete authentication. Check your details or try again later." }, { status: response.status, headers: { "Cache-Control": "no-store" } });
    }
    response.headers.set("Cache-Control", "no-store"); return response;
  }
  catch { return unavailable("We could not complete your request. Please try again later."); }
}
export { handler as GET, handler as POST };
