import { NextResponse } from "next/server";
import { availableOptions } from "@/lib/server/options";
export async function GET(){return NextResponse.json((await availableOptions()),{headers:{'Cache-Control':'no-store'}});}
