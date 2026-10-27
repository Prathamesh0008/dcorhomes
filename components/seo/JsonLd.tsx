import { serializeJsonLd } from '@/lib/structured-data';
export default function JsonLd({ data }: { data: unknown }) { return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}/>; }
