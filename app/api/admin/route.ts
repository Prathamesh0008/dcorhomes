import { NextResponse } from 'next/server';
import { requireAdmin, failure, HttpError, privateHeaders } from '@/lib/server/security';
export async function GET(){try{await requireAdmin();return NextResponse.json({contentEditing:false,workflow:'Update data/catalogue, data/site and public assets in the repository, validate, review and redeploy. Enquiries are delivered by email; designs are saved in the browser. Existing cloud records are retained for private export.'},{headers:privateHeaders});}catch(error){return failure(error);}}
export async function PATCH(){try{await requireAdmin();throw new HttpError(405,'Runtime catalogue, SEO and content edits are disabled. Update repository data and redeploy.');}catch(error){return failure(error);}}
