import { NextRequest } from 'next/server';
import { generationStatus } from '@/lib/server/visualizer-generation';
export async function GET(_request:NextRequest,{params}:{params:Promise<{id:string}>}){return generationStatus((await params).id);}
