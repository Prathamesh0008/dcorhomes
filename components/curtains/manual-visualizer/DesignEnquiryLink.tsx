"use client";
import { useRef, type ReactNode } from 'react';
import type { FabricRecord } from '@/lib/curtains/catalogue';
import type { VisualizerDesign } from '@/lib/manual-visualizer/model';
import { saveEnquiryDesign } from '@/lib/manual-visualizer/enquiry';
import { useFabricRecords } from '../FabricCatalogueProvider';

export default function DesignEnquiryLink({ design, records, className, children }: { design?: VisualizerDesign; records?: FabricRecord[]; className?: string; children: ReactNode }) {
  const catalogue = useFabricRecords();
  const snapshot = useRef<{ value: string; href: string } | null>(null);
  function prepare(anchor: HTMLAnchorElement) {
    try { const selected = design || JSON.parse(localStorage.getItem('dcorhome-visualizer-v1') || 'null'); const value = JSON.stringify(selected); if (snapshot.current?.value !== value) snapshot.current = { value, href: saveEnquiryDesign(selected, records || catalogue) }; anchor.href = snapshot.current.href; }
    catch { anchor.href = '/contact?designUnavailable=1'; }
  }
  return <a href="/contact?designUnavailable=1" className={className} onPointerEnter={e => prepare(e.currentTarget)} onFocus={e => prepare(e.currentTarget)} onClick={e => prepare(e.currentTarget)} onAuxClick={e => prepare(e.currentTarget)} onContextMenu={e => prepare(e.currentTarget)}>{children}</a>;
}
