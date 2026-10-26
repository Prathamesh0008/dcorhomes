// src/lib/send-email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendTestEmail() {
  const { data, error } = await resend.emails.send({
    from: `Website <${process.env.EMAIL_FROM}>`,
    to: ["⁠sales@dcorhome.com ⁠"],
    subject: "Resend Email Test",
    html: "<h2>Email configuration is working!</h2>",
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}