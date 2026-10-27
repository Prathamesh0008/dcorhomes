import 'server-only';
import { cache } from 'react';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { catalogueRecords, catalogueCategories } from '@/data/catalogue';
import { fabricCategories, type FabricCategory } from '@/lib/curtains/categories';
import type { FabricRecord } from '@/lib/curtains/catalogue';
import schema from '@/lib/curtains/supplier-catalogue.schema.json';
import { HttpError } from './http';

// Public catalogue reads use repository content exclusively; no network or persistence.
export async function allFabricRecords(): Promise<FabricRecord[]> { return structuredClone(catalogueRecords); }
export const fabricRecords = cache(async () => (await allFabricRecords()).filter(f => f.active !== false));
export async function categories(): Promise<FabricCategory[]> { return structuredClone(catalogueCategories); }
export async function saveFabricRecords(_records: FabricRecord[], _operation: 'create' | 'update'): Promise<void> {
 throw new HttpError(405, 'Catalogue edits require a repository content update and redeployment.');
}

type Rule={type?:string|string[];const?:unknown;enum?:unknown[];minLength?:number;minItems?:number;pattern?:string;minimum?:number;maximum?:number;exclusiveMinimum?:number;required?:string[];properties?:Record<string,Rule>;items?:Rule};
function validate(value:unknown,rule:Rule,at:string):void {
 const bad=(message:string):never=>{throw new HttpError(400,`${at}: ${message}`);};
 if(value===undefined)return;
 if(rule.type&&!([rule.type].flat()).some(t=>t==='array'?Array.isArray(value):t==='null'?value===null:t==='object'?value!==null&&typeof value==='object'&&!Array.isArray(value):typeof value===t))bad('invalid type');
 if(rule.const!==undefined&&value!==rule.const)bad('invalid value');
 if(rule.enum&&!rule.enum.includes(value))bad('unsupported value');
 if(typeof value==='string'&&((rule.minLength&&value.length<rule.minLength)||(rule.pattern&&!new RegExp(rule.pattern).test(value))))bad('invalid text');
 if(typeof value==='number'&&(!Number.isFinite(value)||(rule.minimum!=null&&value<rule.minimum)||(rule.maximum!=null&&value>rule.maximum)||(rule.exclusiveMinimum!=null&&value<=rule.exclusiveMinimum)))bad('number outside range');
 if(Array.isArray(value)){if(rule.minItems&&value.length<rule.minItems)bad('at least one entry required');value.forEach((v,i)=>validate(v,rule.items||{},`${at}[${i}]`));}
 else if(value&&typeof value==='object'){const object=value as Record<string,unknown>;for(const key of rule.required||[])if(object[key]===undefined)bad(`${key} is required`);for(const key of Object.keys(object))if(!rule.properties?.[key])bad(`unknown field ${key}`);for(const [key,sub]of Object.entries(rule.properties||{}))validate(object[key],sub,`${at}.${key}`);}
}
async function imageExists(src:string) {
 if(!/^\/images\/[a-zA-Z0-9_./-]+\.(jpg|jpeg|png|webp|avif)$/.test(src))return false;
 const resolved=path.resolve('public','.'+src),root=path.resolve('public','images')+path.sep;
 return resolved.startsWith(root)&&existsSync(resolved);
}
export function validateFabricStructure(input:unknown): FabricRecord {
 // Null supplier fields mean unknown; availability intentionally keeps null.
 const cleaned=JSON.parse(JSON.stringify(input, (key,value)=>value===null&&key!=='available'?undefined:value));
 validate(cleaned,schema.items as Rule,'fabric');
 return cleaned as FabricRecord;
}
export async function validateFabricRecord(input:unknown): Promise<FabricRecord> {
 const f=validateFabricStructure(input);
 if(f.publishedAt&&!Number.isFinite(Date.parse(f.publishedAt)))throw new HttpError(400,'Use a valid ISO publication date.');
 if(f.technicalSheet){const root=path.resolve('public/documents')+path.sep,target=path.resolve('public','.'+f.technicalSheet);if(!target.startsWith(root)||!existsSync(target))throw new HttpError(400,'Technical sheet must be an existing authorized PDF in public/documents.');}
 if(f.slug!==f.id)throw new HttpError(400,'Use the stable fabric ID as the slug.');
 if(f.source==='supplier'&&!f.categoryId)throw new HttpError(400,'Choose a material category; use unclassified if not confirmed.');
 if(f.categoryId&&!(await categories()).some(c=>c.id===f.categoryId))throw new HttpError(400,'Create the category first.');
 if(new Set(f.colors.map(c=>c.variantSku).filter(Boolean)).size!==f.colors.filter(c=>c.variantSku).length)throw new HttpError(400,'Variant SKUs must be unique within a fabric.');
 if(new Set(f.colors.map(c=>c.id)).size!==f.colors.length||new Set(f.colors.map(c=>c.colorCode)).size!==f.colors.length)throw new HttpError(400,'Variant IDs and shade codes must be unique within a fabric.');
 if(f.source==='supplier'&&(!f.sku||f.colors.some(c=>!c.variantSku)))throw new HttpError(400,'Supplier fabric and every shade need actual SKUs.');
 if(f.active!==false&&!f.colors.some(c=>c.active!==false&&c.available!==false))throw new HttpError(400,'Keep at least one selectable shade, or deactivate the fabric.');
 if(f.colors.some(c=>c.active!==false&&c.available===true&&![c.mainImage,c.textureImage,c.drapedImage,c.swatchImage,c.digitalPreviewImage,...(c.images||[])].some(Boolean)))throw new HttpError(400,'Add a shade photograph or digital preview before marking a shade available.');
 if(f.pricePerMetre!=null&&!f.currency)throw new HttpError(400,'Price needs a currency.');
 const images=[...f.images,...f.colors.flatMap(c=>[c.swatchImage,c.mainImage,c.textureImage,c.drapedImage,c.digitalPreviewImage,c.digitalSwatchImage,...(c.images||[]),...(c.digitalPreviewImages||[])])].filter((x):x is string=>Boolean(x));
 for(const src of images)if(!(await imageExists(src)))throw new HttpError(400,'Every image must be an existing local or authenticated-admin-uploaded public catalogue asset.');
 return f;
}
export function validateCategory(value:unknown): FabricCategory {
 const c=value as FabricCategory;
 if(!c||!/^[a-z0-9-]{2,60}$/.test(c.id)||typeof c.name!=='string'||!c.name.trim()||c.name.length>80||typeof c.description!=='string'||c.description.length>500||(c.active!==undefined&&typeof c.active!=='boolean'))throw new HttpError(400,'Use a category ID, name, description and optional active boolean.');
 return {id:c.id,name:c.name.trim(),description:c.description,active:c.active!==false};
}
