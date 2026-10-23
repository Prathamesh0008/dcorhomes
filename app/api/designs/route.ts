import { designExpired } from '@/lib/server/visualizer-retention';
import { NextRequest, NextResponse } from "next/server";
import { row, rows, put } from "@/lib/server/db";
import { failure, HttpError, jsonInput, session, privateHeaders } from "@/lib/server/security";
export async function GET() { try { const owner = await session(); if (!owner) throw new HttpError(401,"Your private session is unavailable."); return NextResponse.json({ designs: (await rows("design", owner)).filter(r=>!designExpired(r)&&JSON.parse(r.data).saved).map(r=>({id:r.id, created:r.created,...JSON.parse(r.data)})) }, {headers:privateHeaders}); } catch(e) { return failure(e); } }
export async function POST(request: NextRequest) { try { const input = await jsonInput(request); const owner = await session(); const item = (await row("design",String(input.id))); if (!owner || !item || designExpired(item) || item.owner!==owner) throw new HttpError(404,"Design not found in your session."); (await put("design",item.id,owner,{...JSON.parse(item.data),saved:true})); return NextResponse.json({id:item.id},{headers:privateHeaders}); } catch(e) { return failure(e); } }
