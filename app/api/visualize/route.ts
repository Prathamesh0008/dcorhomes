import { NextRequest } from 'next/server';
import { getReadiness,generatePreview } from '@/lib/server/visualizer-generation';
export const runtime='nodejs';
export const maxDuration=180;
export const GET=getReadiness;
export function POST(request:NextRequest){return generatePreview(request);}
