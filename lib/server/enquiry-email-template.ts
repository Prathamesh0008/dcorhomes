/** Readable, escaped enquiry notifications; configuration objects never enter email markup. */
import { siteUrl } from '@/lib/seo';
import type { DesignEnquiryDetails } from '@/lib/manual-visualizer/enquiry';
export type EnquiryEmailData = {
  name: string; email: string; phone: string; enquiryType: string; requestPurpose: string;
  room: string; interest: string; color: string; city: string; method: string; measurements: string;
  message: string; designId: string; consentAt: string;
  selectedFabric: Record<string, unknown> | undefined;
  designDetails: DesignEnquiryDetails | undefined;
};
const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
const multiline = (value: string) => escapeHtml(value).replace(/\r\n|\r|\n/g, '<br />');
type Row = { label: string; value: string };
const field = ({ label, value }: Row) => `<tr><td width="38%" style="padding:11px 12px 11px 0;border-bottom:1px solid #e6e7df;vertical-align:top;font:12px/1.6 Arial,sans-serif;color:#778174;">${escapeHtml(label)}</td><td style="padding:11px 0;border-bottom:1px solid #e6e7df;vertical-align:top;font:500 14px/1.6 Arial,sans-serif;color:#26392e;word-break:break-word;">${multiline(value)}</td></tr>`;
const rowsHtml = (rows: Row[]) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows.map(field).join('')}</table>`;
const heading = (title: string) => `<h2 style="margin:0 0 14px;font:600 11px/1.5 Arial,sans-serif;letter-spacing:1.8px;color:#8b765f;">${title}</h2>`;
const section = (title: string, content: string) => `<tr><td class="padding" style="padding:0 36px 28px;">${heading(title)}${content}</td></tr>`;
const rowsText = (rows: Row[]) => rows.map(row => row.label + ': ' + row.value).join('\n');

export function buildEnquiryEmail(_id: string, enquiry: EnquiryEmailData): { subject: string; html: string; text: string } {
  const design = enquiry.designDetails;
  const type = design ? 'Curtain Design Enquiry' : enquiry.enquiryType || 'General Enquiry';
  const subject = `New ${type} | ${enquiry.name.replace(/[\r\n\u0000-\u001f\u007f]/g, ' ')} | Dcorhome`;
  const customer: Row[] = [{ label: 'Name', value: enquiry.name }, { label: 'Phone', value: enquiry.phone || 'Not provided' }, { label: 'Email', value: enquiry.email || 'Not provided' }];
  const project: Row[] = [];
  const add = (label: string, value: string) => { if (value) project.push({ label, value }); };
  add('Enquiry type', design ? 'Design Enquiry' : type);
  if (!design && !enquiry.selectedFabric) { add('Room', enquiry.room); add('Fabric / interest', enquiry.interest); add('Color', enquiry.color); }
  add('Request', enquiry.requestPurpose === 'swatch' ? 'Fabric swatch' : enquiry.requestPurpose === 'quote' ? 'Quotation' : '');
  add('City', enquiry.city); add('Preferred contact', enquiry.method); add('Measurements', enquiry.measurements);
  const fabric: Row[] = [];
  const selected = enquiry.selectedFabric;
  if (selected) {
    const read = (key: string) => typeof selected[key] === 'string' ? String(selected[key]) : '';
    for (const [key, label] of [['name', 'Fabric'], ['collection', 'Collection'], ['color', 'Color']] as const) if (read(key)) fabric.push({ label, value: read(key) });
    if (selected.source === 'supplier') for (const [key, label] of [['fabricSku', 'Fabric SKU'], ['variantSku', 'Shade SKU'], ['shadeCode', 'Shade code']] as const) if (read(key)) fabric.push({ label, value: read(key) });
    if (typeof selected.quantityMetres === 'number') fabric.push({ label: 'Approximate quantity', value: selected.quantityMetres + ' metres' });
  }
  const disclaimer = design?.disclaimer || (selected && selected.source !== 'supplier' ? 'Illustrative fabric selection. Availability and the final shade must be confirmed with Dcorhome.' : '');
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(enquiry.email);
  const phoneValid = /^[+()\d\s-]{7,40}$/.test(enquiry.phone) && enquiry.phone.replace(/\D/g, '').length >= 7;
  const emailLink = emailValid ? 'mailto:' + encodeURIComponent(enquiry.email) : '';
  const phoneLink = phoneValid ? 'tel:' + enquiry.phone.replace(/[^+\d]/g, '') : '';
  const action = (href: string, label: string, primary = false) => `<a href="${escapeHtml(href)}" style="display:inline-block;margin:0 10px 10px 0;padding:13px 18px;border:1px solid #253a30;background:${primary ? '#253a30' : '#fffdf9'};color:${primary ? '#ffffff' : '#253a30'};text-decoration:none;font:600 13px Arial,sans-serif;border-radius:4px;">${label}</a>`;
  const message = enquiry.message || 'No additional message provided.';
  const logoUrl = `${siteUrl.replace(/\/+$/, '')}/branding/green.png`;
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${escapeHtml(subject)}</title><style>@media only screen and (max-width:620px){.shell{width:100%!important}.padding{padding-left:22px!important;padding-right:22px!important}}</style></head>
<body style="margin:0;padding:0;background:#f3f2eb;color:#26392e;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:24px 12px;"><table role="presentation" class="shell" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background:#fffdf9;border:1px solid #e1e3d9;">
<tr><td class="padding" style="padding:28px 36px;border-bottom:1px solid #e1e3d9;"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding-right:12px;vertical-align:middle;"><img src="${escapeHtml(logoUrl)}" alt="" width="36" height="36" style="display:block;width:36px;height:36px;border:0;"/></td><td style="vertical-align:middle;font:600 25px/1.2 Arial,sans-serif;letter-spacing:-.5px;color:#26392e;white-space:nowrap;">DCOR <span style="font-weight:400;">HOME</span></td></tr></table><p style="margin:12px 0 0;font:10px Arial,sans-serif;letter-spacing:2px;color:#8a8e7f;">CURTAIN ATELIER</p></td></tr>
<tr><td class="padding" style="padding:30px 36px 26px;"><p style="margin:0 0 10px;font:600 10px Arial,sans-serif;letter-spacing:2px;color:#8b765f;">${design ? 'NEW DESIGN ENQUIRY' : 'NEW WEBSITE ENQUIRY'}</p><h1 style="margin:0;font:normal 29px/1.3 Georgia,serif;color:#26392e;">A new conversation starts here.</h1><p style="margin:12px 0 0;font:14px/1.7 Arial,sans-serif;color:#717e73;">${escapeHtml(type)} from ${escapeHtml(enquiry.name)}.</p></td></tr>
${section('CUSTOMER DETAILS', rowsHtml(customer))}
${design ? section('SELECTED DESIGN', rowsHtml(design.rows) + `<p style="margin:14px 0 0;font:12px/1.7 Arial,sans-serif;color:#778174;">${escapeHtml(disclaimer)}</p>`) : ''}
${!design && fabric.length ? section('SELECTED FABRIC', rowsHtml(fabric) + (disclaimer ? `<p style="font:12px/1.7 Arial,sans-serif;color:#778174;">${escapeHtml(disclaimer)}</p>` : '')) : ''}
${section('PROJECT DETAILS', rowsHtml(project))}
${section('CUSTOMER MESSAGE', `<div style="padding:18px;background:#f4f4ed;border-left:3px solid #ad987f;font:14px/1.8 Arial,sans-serif;color:#435448;word-break:break-word;">${multiline(message)}</div>`)}
${section('ACTION', (emailLink ? action(emailLink, 'Reply to Customer', true) : '') + (phoneLink ? action(phoneLink, 'Call Customer') : ''))}
</table></td></tr></table></body></html>`;
  const text = ['DCOR HOME', design ? 'NEW DESIGN ENQUIRY' : 'NEW WEBSITE ENQUIRY', '', 'CUSTOMER DETAILS', rowsText(customer), ...(design ? ['', 'SELECTED DESIGN', rowsText(design.rows), disclaimer] : fabric.length ? ['', 'SELECTED FABRIC', rowsText(fabric), disclaimer] : []), '', 'PROJECT DETAILS', rowsText(project), '', 'CUSTOMER MESSAGE', message, '', 'ACTION', ...(emailLink ? ['Reply to Customer: ' + emailLink] : []), ...(phoneLink ? ['Call Customer: ' + phoneLink] : [])].join('\n');
  return { subject, html, text };
}
