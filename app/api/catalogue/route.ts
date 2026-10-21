import { NextResponse } from "next/server";
import { catalogue } from "@/lib/server/catalogue";
export async function GET() { return NextResponse.json({ fabrics: catalogue(), illustrative: true }, { headers: { "Cache-Control": "no-store" } }); }
