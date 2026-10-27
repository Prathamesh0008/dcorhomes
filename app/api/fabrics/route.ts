import { NextRequest,NextResponse } from 'next/server';
import { searchSwatches } from '@/lib/server/swatch-search';
import { parseSwatchQuery } from '@/lib/curtains/swatch-query';
import { failure } from '@/lib/server/http';
export async function GET(request:NextRequest){try{const raw:Record<string,string[]>={};request.nextUrl.searchParams.forEach((value,key)=>(raw[key]||=[]).push(value));return NextResponse.json(await searchSwatches(parseSwatchQuery(raw)),{headers:{'Cache-Control':'no-store'}});}catch(error){return failure(error);}}
