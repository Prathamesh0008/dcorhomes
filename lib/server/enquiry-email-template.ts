
/**
 * Dcorhome enquiry notification: responsive HTML and plain-text fallback.
 * Edit THIS file to change the look of the email; don't edit the contact page.
 * The hosted brand mark is loaded from the site's public assets.
 */
import { siteUrl } from "@/lib/seo";

export type EnquiryEmailData = {
  name: string;
  email: string;
  phone: string;
  enquiryType: string;
  requestPurpose: string;
  room: string;
  interest: string;
  color: string;
  city: string;
  method: string;
  measurements: string;
  message: string;
  designId: string;
  consentAt: string;
  selectedFabric: Record<string, unknown> | undefined;
  designSelection: unknown;
};

const display = (value: string | undefined, fallback = "Not provided"): string =>
  value?.trim() || fallback;

// Escape customer-supplied text before placing it inside HTML.
const escapeHtml = (value: string): string =>
  value.replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const multiline = (value: string): string =>
  escapeHtml(value).replace(/\r\n|\r|\n/g, "<br />");

const jsonBlock = (value: unknown): string =>
  multiline(JSON.stringify(value, null, 2) ?? "Not available");

const field = (label: string, value: string, last = false): string => `
  <tr>
    <td class="label" style="width:39%;padding:14px 16px 14px 0;border-bottom:${last ? 'none' : '1px solid #e6e5df'};font:12px Arial,Helvetica,sans-serif;letter-spacing:.3px;color:#7c857d;vertical-align:top;">
      ${escapeHtml(label)}
    </td>
    <td class="value" style="padding:14px 0;border-bottom:${last ? 'none' : '1px solid #e6e5df'};font:600 14px/1.55 Arial,Helvetica,sans-serif;color:#26392e;vertical-align:top;word-break:break-word;">
      ${multiline(value)}
    </td>
  </tr>`;

export function buildEnquiryEmail(_id: string, enquiry: EnquiryEmailData): {
  html: string;
  text: string;
} {
  const logoUrl = `${siteUrl.replace(/\/+$/, "")}/branding/green.png`;
  const type = display(enquiry.enquiryType, "General Enquiry");
  const name = display(enquiry.name);
  const email = display(enquiry.email);
  const phone = display(enquiry.phone);
  const subjectInfo = display(enquiry.interest, "Curtain consultation");
  const table = [
    field("Enquiry type", type),
    field("Request purpose", display(enquiry.requestPurpose, "Not specified")),
    field("Room / space", display(enquiry.room, "Not specified")),
    field("Fabric / interest", subjectInfo),
    field("Preferred colour", display(enquiry.color, "Not specified")),
    field("City", display(enquiry.city, "Not specified")),
    field("Preferred contact", display(enquiry.method, "Not specified")),
    field("Measurements", display(enquiry.measurements)),
    field("Design reference", display(enquiry.designId, "None"), true),
  ].join("");

  const emailAction = enquiry.email
    ? `<td style="padding:0 9px 10px 0;vertical-align:top;"><a href="mailto:${escapeHtml(enquiry.email)}" style="display:inline-block;padding:12px 20px;background:#253a30;color:#ffffff;text-decoration:none;font:600 13px Arial,Helvetica,sans-serif;border-radius:3px;">Reply to customer &rarr;</a></td>`
    : "";
  const phoneAction = enquiry.phone
    ? `<td style="padding:0 0 10px;vertical-align:top;"><a href="tel:${escapeHtml(enquiry.phone.replace(/[^+\d]/g, ""))}" style="display:inline-block;padding:11px 18px;border:1px solid #c8cbbf;color:#253a30;text-decoration:none;font:600 13px Arial,Helvetica,sans-serif;border-radius:3px;">Call customer</a></td>`
    : "";
  const actionButtons = emailAction || phoneAction
    ? `<table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>${emailAction}${phoneAction}</tr></table>`
    : "";

  const extras = [
    enquiry.selectedFabric
      ? `<div style="margin-top:20px;"><h3 style="margin:0 0 9px;font:600 13px Arial,Helvetica,sans-serif;color:#26392e;">Selected catalogue fabric</h3><div style="background:#f5f5f0;padding:14px;border:1px solid #e6e5df;border-radius:4px;font:12px/1.6 Consolas,monospace;color:#34483d;word-break:break-word;">${jsonBlock(enquiry.selectedFabric)}</div></div>`
      : "",
    enquiry.designSelection
      ? `<div style="margin-top:20px;"><h3 style="margin:0 0 9px;font:600 13px Arial,Helvetica,sans-serif;color:#26392e;">Private design selection</h3><div style="background:#f5f5f0;padding:14px;border:1px solid #e6e5df;border-radius:4px;font:12px/1.6 Consolas,monospace;color:#34483d;word-break:break-word;">${jsonBlock(enquiry.designSelection)}</div></div>`
      : "",
  ].join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>New Dcorhome enquiry</title>
  <style>
    @media only screen and (max-width: 620px) {
      .email-shell { width: 100% !important; }
      .email-padding { padding-left: 22px !important; padding-right: 22px !important; }
      .label { width: 35% !important; }
      .value { width: auto !important; }
      .brand-name { font-size: 30px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#f4f3ee;color:#26392e;">
  <div style="display:none;font-size:1px;color:#f4f3ee;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    New ${escapeHtml(type)} from ${escapeHtml(name)} — Dcorhome website
  </div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f4f3ee;">
    <tr><td align="center" style="padding:38px 12px 48px;">
      <table role="presentation" class="email-shell" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;background:#fffdf9;border:1px solid #e5e6dc;">
        <tr><td class="email-padding" style="background:#fffdf9;padding:28px 42px;border-bottom:1px solid #e5e6dc;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="padding-right:12px;vertical-align:middle;">
                <img src="https://res.cloudinary.com/livzpsfv/image/upload/v1793018530/image_11.webp " alt="Dcorhome" width="36" height="36" style="display:block;width:36px;height:36px;object-fit:contain;border:0;" />
              </td>
              <td style="vertical-align:middle;">
                <div class="brand-name" style="font:600 34px/1 Arial,Helvetica,sans-serif;letter-spacing:-1px;color:#26392e;white-space:nowrap;"><span style="font-size:1.13em;line-height:0;">D</span>COR <span style="font-weight:400;">HOME</span></div>
              </td>
            </tr>
            <tr>
              <td colspan="2" style="padding-top:8px;font:500 10px/1.5 Arial,Helvetica,sans-serif;letter-spacing:2.7px;text-transform:uppercase;color:#8a8e7f;">CURTAIN ATELIER</td>
            </tr>
          </table>
        </td></tr>
        <tr><td class="email-padding" style="padding:37px 42px 28px;">
          <div style="font:700 10px/1.5 Arial,Helvetica,sans-serif;letter-spacing:2px;color:#9a856c;text-transform:uppercase;">NEW WEBSITE ENQUIRY</div>
          <h1 style="margin:13px 0 7px;font:normal 32px/1.18 Georgia,'Times New Roman',serif;color:#26392e;">A new conversation<br />starts here.</h1>
          <p style="margin:14px 0 20px;font:14px/1.75 Arial,Helvetica,sans-serif;color:#717e73;">Someone reached out through your Dcorhome contact form. Here are the details to help your team respond.</p>
          <div style="display:inline-block;background:#eef1e9;border:1px solid #dbe2d5;padding:7px 12px;font:600 11px/1.5 Arial,Helvetica,sans-serif;color:#365443;letter-spacing:.5px;">${escapeHtml(type)}</div>
        </td></tr>
        <tr><td class="email-padding" style="padding:0 42px 28px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f5f4ef;border:1px solid #e8e7df;">
            <tr><td style="padding:24px 24px 20px;">
              <p style="margin:0 0 5px;font:700 10px Arial,Helvetica,sans-serif;letter-spacing:1.7px;color:#99836c;">CUSTOMER DETAILS</p>
              <p style="margin:7px 0 8px;font:normal 25px/1.25 Georgia,serif;color:#24372d;">${escapeHtml(name)}</p>
              <p style="margin:0 0 5px;font:14px/1.6 Arial,Helvetica,sans-serif;color:#3b4a40;word-break:break-word;">${escapeHtml(email)}</p>
              <p style="margin:0 0 19px;font:14px/1.6 Arial,Helvetica,sans-serif;color:#3b4a40;">${escapeHtml(phone)}</p>
              ${actionButtons}
            </td></tr>
          </table>
        </td></tr>
        <tr><td class="email-padding" style="padding:2px 42px 26px;">
          <h2 style="margin:0 0 10px;font:normal 23px Georgia,serif;color:#26392e;">Project details</h2>
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">${table}</table>
        </td></tr>
        <tr><td class="email-padding" style="padding:0 42px 35px;">
          <h2 style="margin:0 0 13px;font:normal 23px Georgia,serif;color:#26392e;">Customer's message</h2>
          <div style="background:#f5f4ef;border-left:3px solid #ae9980;padding:20px 22px;font:14px/1.85 Arial,Helvetica,sans-serif;color:#435448;word-break:break-word;">${multiline(display(enquiry.message, "No additional message provided."))}</div>
          ${extras}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const lines = [
    "New Dcorhome website enquiry",
    "",
    `Name: ${enquiry.name}`,
    `Email: ${email}`,
    `Phone: ${phone}`,
    `Enquiry type: ${type}`,
    `Request purpose: ${display(enquiry.requestPurpose, "Not specified")}`,
    `Room: ${display(enquiry.room, "Not specified")}`,
    `Interested fabric: ${subjectInfo}`,
    `Colour: ${display(enquiry.color, "Not specified")}`,
    `City: ${display(enquiry.city, "Not specified")}`,
    `Preferred contact method: ${display(enquiry.method, "Not specified")}`,
    `Measurements: ${display(enquiry.measurements)}`,
    `Design reference: ${display(enquiry.designId, "None")}`,
    "",
    "Customer message:",
    display(enquiry.message, "No additional message provided."),
  ];
  if (enquiry.selectedFabric) lines.push("", "Selected catalogue fabric:", JSON.stringify(enquiry.selectedFabric, null, 2));
  if (enquiry.designSelection) lines.push("", "Private design selection:", JSON.stringify(enquiry.designSelection, null, 2));

  return { html, text: lines.join("\n") };
}
