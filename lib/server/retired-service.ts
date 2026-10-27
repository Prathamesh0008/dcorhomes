import { NextResponse } from 'next/server';
export function retiredService() {
 return NextResponse.json({error:'Cloud design storage, uploads and AI generation are retired. Use the manual studio and browser saves. Existing records have not been deleted; contact sales@dcorhome.com for a private export.'}, {status:410, headers:{'Cache-Control':'private, no-store'}});
}
