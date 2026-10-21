import { NextResponse } from "next/server";
import { databaseReady } from "@/lib/server/db";
import { assetStorageReady } from "@/lib/server/assets";
import { failure, session, privateHeaders } from "@/lib/server/security";
export async function GET() { try { if (!databaseReady()) return NextResponse.json({ persistence: false, assets: false }, { headers: privateHeaders }); await session("guest", true); return NextResponse.json({ persistence: true, assets: assetStorageReady() }, { headers: privateHeaders }); } catch(e) { return failure(e); } }
