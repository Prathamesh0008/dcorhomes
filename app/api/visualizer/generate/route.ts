import { NextRequest } from "next/server";
import { GET as status, POST as generate } from "@/app/api/visualize/route";
export const runtime = "nodejs";
export const maxDuration = 180;
export const GET = status;
// Share the established private-session, validation, quota and storage pipeline.
export function POST(request: NextRequest) { return generate(request); }

