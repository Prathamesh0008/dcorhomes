import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { business } from "@/lib/business";
import { fabricRecords } from "@/lib/server/fabric-records";
import { fabricEnquiry } from "@/lib/curtains/enquiry";
import { siteUrl } from "@/lib/seo";
import { buildEnquiryEmail } from "@/lib/server/enquiry-email-template";
import { failure, HttpError, jsonInput, privateHeaders } from "@/lib/server/http";
import { throttlePublic } from '@/lib/server/public-rate-limit';
import { validateDesign, designSummary } from '@/lib/manual-visualizer/model';
export const runtime = "nodejs";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type NotificationStatus = "not-configured" | "sent" | "failed";
type Enquiry = {
    designSelection: unknown;
    selectedFabric: Record<string, unknown> | undefined;
    requestPurpose: string;
    name: string;
    email: string;
    enquiryType: string;
    color: string;
    phone: string;
    city: string;
    room: string;
    interest: string;
    message: string;
    measurements: string;
    method: string;
    designId: string;
    status: "new";
    notification: NotificationStatus;
    consentAt: string;
};
/**
 * Sends the admin notification through Resend's REST API.
 * A "sent" status means Resend accepted the email; inbox delivery is not guaranteed.
 */
function envValue(value: string | undefined): string {
    // Zero-width marks sometimes appear when an address is copied from formatted text.
    return (value ?? "").replace(/[\u200B-\u200D\u2060\uFEFF]/g, "").trim();
}
async function sendEnquiryNotification(id: string, enquiry: Enquiry): Promise<NotificationStatus> {
    const apiKey = envValue(process.env.RESEND_API_KEY);
    const fromEmail = envValue(process.env.RESEND_FROM_EMAIL ||
        process.env.ENQUIRY_FROM_EMAIL ||
        process.env.EMAIL_FROM);
    const toEmail = 'sales@dcorhome.com';
    if (!apiKey || !fromEmail || !toEmail) {
        console.error("Resend notification not configured: missing API key, sender, or recipient.");
        return "not-configured";
    }
    // Accept either an address or the optional "Name <email@domain>" sender format.
    const senderAddress = fromEmail.match(/<([^<>]+)>$/)?.[1] ?? fromEmail;
    if (!EMAIL_PATTERN.test(senderAddress) || !EMAIL_PATTERN.test(toEmail)) {
        console.error("Resend notification not configured: invalid sender or recipient email.");
        return "not-configured";
    }
    try {
        // Branded HTML message plus an accessible plain-text fallback.
        const { html, text } = buildEnquiryEmail(id, enquiry);
        const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
                "Idempotency-Key": `dcorhome-enquiry-${id}`,
            },
            body: JSON.stringify({
                from: fromEmail.includes("<") ? fromEmail : `Dcorhome <${fromEmail}>`,
                to: [toEmail],
                ...(enquiry.email ? { reply_to: enquiry.email } : {}),
                subject: `Dcorhome enquiry: ${enquiry.name.replace(/[\r\n]/g, " ")}`,
                html,
                text,
            }),
            signal: AbortSignal.timeout(15000),
        });
        if (!response.ok) {
            // Log only the status and provider's error code, never credentials or enquiry details.
            console.error(JSON.stringify({event:'enquiry_email_failure',status:response.status}));
            return "failed";
        }
        const result: unknown = await response.json().catch(() => null);
        if (!result || typeof result !== "object" || !("id" in result) || typeof result.id !== "string") {
            console.error("Resend did not confirm an email ID.");
            return "failed";
        }
        return "sent";
    }
    catch {
        console.error("Resend enquiry notification could not be submitted.");
        return "failed";
    }
}
export async function POST(request: NextRequest) {
    try {
        const input = await jsonInput(request, 12000);
        const text = (key: string, max: number) => typeof input[key] === "string"
            ? String(input[key]).trim().slice(0, max)
            : "";
        const name = text("name", 100);
        const email = text("email", 200);
        const phone = text("phone", 40);
        const enquiryType = text("enquiryType", 80);
        const requestPurpose = text("requestPurpose", 20);
        if (requestPurpose && !["quote", "swatch"].includes(requestPurpose)) {
            throw new HttpError(400, "Choose a valid fabric enquiry purpose.");
        }
        if (name.length < 2 ||
            (email
                ? !EMAIL_PATTERN.test(email)
                : !/^[+()\d\s-]{7,40}$/.test(phone)) ||
            input.consent !== true ||
            text("website", 200)) {
            throw new HttpError(400, "Enter your full name, a valid email or phone number, and privacy consent.");
        }
        if (enquiryType && !business.enquiryTypes.includes(enquiryType)) {
            throw new HttpError(400, "Choose a valid enquiry type.");
        }
        const designId = text('designId', 60);
        if(designId) throw new HttpError(400, 'Earlier cloud designs must be exported first. Include your design configuration or contact sales@dcorhome.com.');
        let designSelection: unknown;
        const records = await fabricRecords();
        if(input.visualizer){
            try { designSelection = validateDesign(typeof input.visualizer==='string'?JSON.parse(input.visualizer):input.visualizer,records); }
            catch { throw new HttpError(400,'The design configuration could not be verified. Reopen your design and try again.'); }
        }
        const requestId = request.headers.get('idempotency-key');
        const id = requestId && /^[a-f0-9-]{36}$/i.test(requestId) ? requestId : randomUUID();
        const fabricId = text("catalogueFabricId", 60);
        const variantId = text("variantId", 100);
        const quantity = text("quantityMetres", 30);
        let selectedFabric: Record<string, unknown> | undefined;
        if (fabricId) {
            const fabric = records.find((f) => f.id === fabricId);
            const variant = fabric?.colors.find((v) => v.id === variantId && v.active !== false);
            if (!fabric || !variant) {
                throw new HttpError(400, "The selected fabric or shade is no longer available.");
            }
            if (quantity &&
                (!Number.isFinite(Number(quantity)) ||
                    Number(quantity) <= 0 ||
                    Number(quantity) > 100000)) {
                throw new HttpError(400, "Enter a valid approximate quantity in metres.");
            }
            const productUrl = `${siteUrl}/collections/${fabric.slug}?shade=${encodeURIComponent(variant.id)}`;
            selectedFabric = {
                fabricId: fabric.id,
                slug: fabric.slug,
                name: fabric.name,
                collection: fabric.collection || fabric.brand || fabric.category,
                fabricSku: fabric.sku || null,
                variantId: variant.id,
                color: variant.name,
                shadeCode: variant.colorCode,
                variantSku: variant.variantSku || null,
                quantityMetres: quantity ? Number(quantity) : null,
                source: fabric.source,
                productUrl,
                summary: fabricEnquiry(fabric, variant, productUrl),
            };
        }
        const enquiry: Enquiry = {
            designSelection,
            selectedFabric,
            requestPurpose,
            name,
            email,
            enquiryType,
            color: text("color", 100),
            phone,
            city: text("city", 100),
            room: text("room", 60),
            interest: text("interest", 100),
            message: text("message", 3000) + (designSelection ? '\n\nVerified configuration:\n' + designSummary(designSelection as Parameters<typeof designSummary>[0], records) : ''),
            measurements: text("measurements", 1500),
            method: text("method", 60),
            designId,
            status: "new",
            notification: "not-configured",
            consentAt: new Date().toISOString(),
        };
        if (!request.headers.get('content-type')?.startsWith('application/json')) throw new HttpError(415,'Use a JSON enquiry request.');
        await throttlePublic(request, 'enquiry', 5);
        enquiry.notification = await sendEnquiryNotification(id, enquiry);
        if(enquiry.notification !== 'sent') throw new HttpError(503, 'Email delivery was not accepted. Keep a copy of your details and email sales@dcorhome.com directly.');
        return NextResponse.json({ok:true,id,accepted:true,notified:true,stored:false}, {headers:privateHeaders});
    }
    catch (error) {
        return failure(error);
    }
}
