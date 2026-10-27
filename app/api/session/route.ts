import { NextResponse } from 'next/server';
export async function GET(){return NextResponse.json({persistence:false,assets:false,storage:'browser'},{headers:{'Cache-Control':'no-store'}});}
