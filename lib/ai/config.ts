import { databaseReady } from "@/lib/server/db";
import { assetStorageReady } from "@/lib/server/assets";
import { HttpError } from "@/lib/server/security";
export function integerSetting(name:string,fallback:number,max:number){const value=Number(process.env[name]??fallback);return Number.isInteger(value)&&value>0&&value<=max?value:fallback;}
export function aiConfig(){
 const model=process.env.DCORHOME_IMAGE_MODEL||process.env.OPENAI_IMAGE_MODEL||'gpt-image-2.5-sunburst';
 const quality=process.env.DCORHOME_IMAGE_QUALITY||'medium';
 const supported=['gpt-image-2.5-sunburst','gpt-image-2.5-flare'].includes(model)&&['low','medium','high','xhigh','max'].includes(quality);
 return {model,quality:quality as 'low'|'medium'|'high'|'xhigh'|'max',enabled:false,supported,guestLimit:integerSetting('DCORHOME_MAX_GENERATIONS_PER_GUEST',3,20),concurrency:integerSetting('DCORHOME_MAX_CONCURRENT_GENERATIONS',1,5),dailyLimit:integerSetting('AI_DAILY_LIMIT',5,100),timeout:90000};
}
export function readiness(){const c=aiConfig();const storage=databaseReady()&&assetStorageReady();return {configured:c.enabled&&Boolean(process.env.OPENAI_API_KEY)&&storage&&c.supported,uploadConfigured:storage,reason:!storage?'Private photo storage is not configured.':!c.enabled?'AI preview generation is currently switched off.':!process.env.OPENAI_API_KEY?'AI preview generation is awaiting provider configuration.':!c.supported?'The image model configuration needs attention.':null,retentionDays:integerSetting('RETENTION_DAYS',30,365)};}
export function requireAI(){if(!readiness().configured)throw new HttpError(503,readiness().reason||'AI previews are temporarily unavailable.');}
