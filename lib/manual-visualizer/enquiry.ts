import type { FabricRecord } from '@/lib/curtains/catalogue';
import { validateDesign, resolveLayer, type VisualizerDesign } from './model';
import { scenes } from './manifest';

export type DesignEnquiryDetails = { rows: { label: string; value: string }[]; disclaimer: string };
// Only names and verified commercial references leave the configuration boundary.
export function designEnquiryDetails(input: unknown, records: FabricRecord[]): DesignEnquiryDetails {
  const design = validateDesign(input, records);
  const rows = [{ label: 'Room', value: scenes.find(scene => scene.id === design.sceneId)!.name }];
  let demonstration = false;
  for (const key of ['main', 'sheer'] as const) {
    const label = key === 'main' ? 'Main Curtain' : 'Sheer Curtain';
    if (!design[key].enabled) { rows.push({ label, value: 'None' }); continue; }
    const layer = resolveLayer(design[key], records);
    demonstration ||= !layer.commercial;
    rows.push({ label, value: layer.fabric.name }, { label: label + ' Color', value: layer.shadeName });
    const sku = layer.commercial && layer.variant?.variantSku;
    if (sku) rows.push({ label: label + ' SKU', value: sku });
  }
  return { rows, disclaimer: demonstration ? 'Illustrative fabric selections. Availability and the final shade must be confirmed with Dcorhome.' : 'Please confirm the final shade with a physical fabric sample.' };
}

const prefix = 'dcorhome-enquiry-design:';
const validReference = /^[a-f0-9-]{36}$/i;
export function saveEnquiryDesign(input: VisualizerDesign, records: FabricRecord[]) {
  const design = validateDesign(input, records), reference = crypto.randomUUID();
  // Immutable snapshots preserve separate tabs, changed shades and browser history.
  localStorage.setItem(prefix + reference, JSON.stringify(design));
  return '/contact?designRef=' + reference;
}
export function recoverEnquiryDesign(query: URLSearchParams, records: FabricRecord[]): VisualizerDesign | null {
  const reference = query.get('designRef'), legacy = query.get('visualizer');
  if (!query.has('designRef') && !query.has('visualizer')) return null;
  if (query.has('designRef') && !reference) throw Error('Invalid design reference.');
  let serialized: string | null;
  if (reference) {
    if (!validReference.test(reference)) throw Error('Invalid design reference.');
    serialized = localStorage.getItem(prefix + reference);
  } else serialized = legacy;
  if (!serialized || serialized.length > 10000) throw Error('Design unavailable in this browser.');
  return validateDesign(JSON.parse(serialized), records);
}
