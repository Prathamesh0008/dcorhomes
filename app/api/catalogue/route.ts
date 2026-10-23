import { NextRequest,NextResponse } from 'next/server';
import { catalogue } from '@/lib/server/catalogue';
import { fabricRecords,categories } from '@/lib/server/fabric-records';
import { queryFabrics } from '@/lib/curtains/catalogue-query';
export async function GET(request:NextRequest) {const records=(await fabricRecords()),query=Object.fromEntries(request.nextUrl.searchParams);return NextResponse.json({fabrics:(await catalogue()),records:queryFabrics(records,query),categories:(await categories()).filter(c=>c.active!==false),illustrative:records.some(f=>f.source==='demo')},{headers:{'Cache-Control':'no-store'}});}
