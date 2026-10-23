import Link from 'next/link';
import { specificationRows, type FabricVariant, type FabricRecord } from '@/lib/curtains/catalogue';
export default function FabricSpecifications({ fabric, variant }: {
    fabric: FabricRecord;
    variant?: FabricVariant;
}) {
    const known = (rows: [
        string,
        string
    ][]) => rows.filter(([, value]) => value && !['Specification pending', 'Ask for specification'].includes(value));
    const primary = known([['Composition', fabric.composition || ''], ['Roll width', fabric.fabricWidthCm == null ? '' : `${fabric.fabricWidthCm} cm`], ['Fabric weight', fabric.weightGsm == null ? '' : `${fabric.weightGsm} GSM`], ['Weave / texture', fabric.weave || fabric.texture || ''], ['Transparency', fabric.lightFiltering || fabric.opacity || ''], ['Pattern', fabric.pattern || ''], ['Care', fabric.careInstructions || fabric.washing || fabric.dryCleaning || '']]);
    const table = (rows: [
        string,
        string
    ][]) => <dl className="my-4 divide-y divide-[#dedbd2] text-[15px]">{rows.map(([label, value]) => <div key={label} className="grid grid-cols-[.9fr_1.1fr] gap-5 border-b border-solid border-[#dedbd2] py-4"><dt className="text-muted">{label}</dt><dd className="m-0 break-words font-medium">{value}</dd></div>)}</dl>;
    const extra = known([...specificationRows(fabric), ...(variant ? ([['Color name', variant.name], ['Shade code', variant.colorCode], ['Variant SKU', variant.variantSku || '']] as [
            string,
            string
        ][]) : [])]).filter(([label]) => !['Composition', 'Weave / texture', 'Pattern', 'Care instructions', 'Fabric width (cm)', 'Fabric weight (GSM)', 'Light filtering', 'Transparency / light filtering'].includes(label));
    return <div>{primary.length > 0 ? table(primary) : <p className="text-[15px] leading-7 text-muted">Our team can help confirm the construction and care of your chosen cloth.</p>}<p className="text-[13px] leading-6 text-muted">Roll width is cloth width, not finished curtain width. Confirm the final shade with a physical sample.</p><Link href={`/contact?${new URLSearchParams({ interest: `Specifications for ${fabric.name}`, message: `Please send complete specifications for ${fabric.name}${variant ? `, ${variant.name} (${variant.colorCode})` : ''}.` })}`} className="inline-flex min-h-12 items-center border-b border-solid border-ink text-[14px]">Request complete specifications &rarr;</Link>{extra.length > 0 && <details className="mt-5 border-b border-solid border-[#dedbd2] py-2"><summary className="min-h-12 cursor-pointer py-3 text-[15px]">Details & identification</summary>{table(extra)}</details>}</div>;
}
