export const emailReady = () => Boolean(process.env.RESEND_API_KEY && process.env.ENQUIRY_FROM_EMAIL);
export async function sendEmail(to: string, subject: string, text: string) {
  if (!emailReady()) throw Error("Transactional email is unavailable.");
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST", headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.ENQUIRY_FROM_EMAIL, to: [to], subject, text }), signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw Error("Email delivery was not accepted.");
}
