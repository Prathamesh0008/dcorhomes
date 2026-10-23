import OpenAI, { toFile } from "openai";
import { aiConfig } from "./config";
import { HttpError } from "@/lib/server/security";
export async function editCurtains(image:Buffer,mask:Buffer,prompt:string,references:Buffer[]=[]){
 const config=aiConfig();
 const client=new OpenAI({apiKey:process.env.OPENAI_API_KEY,maxRetries:0,timeout:config.timeout});
 try{
  const images=await Promise.all([image,...references].map((bytes,index)=>toFile(bytes,index?'fabric-reference-'+index+'.png':'room.png',{type:'image/png'})));
  const response=await client.images.edit({model:config.model,image:images,mask:await toFile(mask,'window-mask.png',{type:'image/png'}),prompt,n:1,size:'auto',quality:config.quality,output_format:'png'});
  const encoded=response.data?.[0]?.b64_json;if(!encoded||encoded.length>30*1024*1024)throw new HttpError(502,'The image provider returned no usable preview.');
  return {bytes:Buffer.from(encoded,'base64'),usage:response.usage?{totalTokens:response.usage.total_tokens}:undefined,providerRequestId:response._request_id};
 }catch(error){
  if(error instanceof HttpError)throw error;
  if(error instanceof OpenAI.APIConnectionTimeoutError)throw new HttpError(504,'Generation timed out. Check this preview status before starting another generation.');
  if(error instanceof OpenAI.APIError){if(error.status===401||error.status===403)throw new HttpError(503,'Image generation needs provider configuration. Please contact our team.');if(error.status===429)throw new HttpError(429,'The image provider is busy or its allowance is reached. Please try later.');}
  throw new HttpError(502,'The image provider could not complete this preview. No automatic retry was made.');
 }
}
