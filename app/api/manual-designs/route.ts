import { randomUUID } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { customerSession } from '@/lib/server/customer-auth';
import { allRecords, databaseReady, put, remove, row, transaction } from '@/lib/server/db';
import { fabricRecords } from '@/lib/server/fabric-records';
import { failure, HttpError, jsonInput, privateHeaders, throttle } from '@/lib/server/security';
import { validateDesign } from '@/lib/manual-visualizer/model';

export async function GET(){try{
 const account=await customerSession();if(!account)return NextResponse.json({account:false,designs:[]},{headers:privateHeaders});
 if(!databaseReady())throw new HttpError(503,'Account design storage is unavailable.');
 return NextResponse.json({account:true,designs:(await allRecords('manual-design',account.user.id)).map(record=>({id:record.id,created:record.created,...JSON.parse(record.data)}))},{headers:privateHeaders});
}catch(error){return failure(error);}}
export async function POST(request:NextRequest){try{
 const input=await jsonInput(request,5000),account=await customerSession();if(!account)throw new HttpError(401,'Sign in to save a design to your account.');
 await throttle(request,'manual-design-save',60);
 let design;try{design=validateDesign(input.design,await fabricRecords());}catch(error){throw new HttpError(400,error instanceof Error?error.message:'Invalid curtain design.');}
 const id=randomUUID();await transaction(async()=>{if((await allRecords('manual-design',account.user.id)).length>=50)throw new HttpError(409,'You can save up to 50 curtain designs. Remove one first.');await put('manual-design',id,account.user.id,{design});});
 return NextResponse.json({id},{status:201,headers:privateHeaders});
}catch(error){return failure(error);}}
export async function DELETE(request:NextRequest){try{
 const input=await jsonInput(request,2000),account=await customerSession();if(!account)throw new HttpError(401,'Sign in to manage your saved designs.');
 const record=await row('manual-design',String(input.id));if(!record||record.owner!==account.user.id)throw new HttpError(404,'Design not found in your account.');
 await remove('manual-design',record.id);return NextResponse.json({deleted:true},{headers:privateHeaders});
}catch(error){return failure(error);}}
