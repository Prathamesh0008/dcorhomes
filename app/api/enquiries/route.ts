import { NextRequest, NextResponse } from "next/server";
import { business } from "@/lib/business";
import { fabricRecords } from "@/lib/server/fabric-records";
import { fabricEnquiry } from "@/lib/curtains/enquiry";
import { siteUrl } from "@/lib/seo";
import { failure, HttpError, jsonInput, privateHeaders } from "@/lib/server/http";
import { throttlePublic } from '@/lib/server/public-rate-limit';
import { validateDesign, type VisualizerDesign } from '@/lib/manual-visualizer/model';
import { designEnquiryDetails } from '@/lib/manual-visualizer/enquiry';
import { enquiryRequestKey, storeEnquiry, notifyEnquiry } from '@/lib/server/enquiry-store';
import type { EnquiryData } from '@/lib/enquiries';
import { logDatabaseFailure } from '@/lib/server/database-diagnostics';
export const runtime = "nodejs";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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
            (!email && !phone) || (email && !EMAIL_PATTERN.test(email)) ||
            (phone && (!/^[+()\d\s-]{7,40}$/.test(phone) || phone.replace(/\D/g, '').length < 7)) ||
            input.consent !== true ||
            text("website", 200)) {
            throw new HttpError(400, "Enter your full name, a valid email or phone number, and privacy consent.");
        }
        if (enquiryType && ![...business.enquiryTypes, 'Design Enquiry'].includes(enquiryType)) {
            throw new HttpError(400, "Choose a valid enquiry type.");
        }
        const designId = text('designId', 60);
        if(designId) throw new HttpError(400, 'Earlier cloud designs must be exported first. Include your design configuration or contact sales@dcorhome.com.');
        let designSelection: VisualizerDesign | undefined;
        const records = await fabricRecords();
        if(input.visualizer){
            try { designSelection = validateDesign(typeof input.visualizer==='string'?JSON.parse(input.visualizer):input.visualizer,records); }
            catch { throw new HttpError(400,'The design configuration could not be verified. Reopen your design and try again.'); }
        }
        const requestKey = enquiryRequestKey(request.headers.get('idempotency-key'));
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
        const enquiry: EnquiryData = {
            designDetails: designSelection ? designEnquiryDetails(designSelection, records) : undefined,
            selectedFabric,
            requestPurpose,
            name,
            email,
            enquiryType: designSelection ? 'Design Enquiry' : enquiryType,
            color: text("color", 100),
            phone,
            city: text("city", 100),
            room: text("room", 60),
            interest: text("interest", 100),
            message: text("message", 3000),
            measurements: text("measurements", 1500),
            method: text("method", 60),
            designId,
            visualizer: designSelection || null,
            consentAt: new Date().toISOString(),
        };
        if (!request.headers.get('content-type')?.startsWith('application/json')) throw new HttpError(415,'Use a JSON enquiry request.');
        await throttlePublic(request, 'enquiry', 5);
        const saved = await storeEnquiry(requestKey, enquiry);
        let record = saved.record;
        if (!saved.duplicate) {
            try { record = await notifyEnquiry(record.id); }
            catch (error) { logDatabaseFailure('enquiry_notification', error); }
        }
        const notified = record.notification.state === 'accepted';
        return NextResponse.json({ ok: true, id: record.id, reference: record.reference, accepted: true, stored: true,
            notified, emailStatus: record.notification.deliveryStatus || record.notification.state, duplicate: saved.duplicate },
            { status: saved.duplicate ? 200 : 201, headers: privateHeaders });
    }
    catch (error) {
        if (error instanceof HttpError) return failure(error);
        logDatabaseFailure('enquiry_storage', error);
        return failure(new HttpError(503, 'Your enquiry could not be saved. Your details remain in the form. Please try again or contact sales@dcorhome.com.'));
    }
}
