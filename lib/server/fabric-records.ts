import { existsSync } from 'node:fs';
import path from 'node:path';
import { fabrics as seed } from '@/lib/curtains/manual-config';
import { fabricCategories, type FabricCategory } from '@/lib/curtains/categories';
import type { FabricRecord } from '@/lib/curtains/catalogue';
import schema from '@/lib/curtains/supplier-catalogue.schema.json';
import { databaseReady, rows, row, db, type RecordRow } from './db';
import { HttpError } from './security';

export function allFabricRecords(): FabricRecord[] {
 const records=new Map(seed.map(f=>[f.id,f]));
 if(databaseReady()){
  for(const item of rows('fabric')){const old=JSON.parse(item.data);if(records.has(old.id)){records.set(old.id,{...records.get(old.id)!,name:old.name,description:old.description,category:old.category,images:[old.image],active:!old.archived});}else records.set(old.id,{id:old.id,slug:old.id,name:old.name,category:old.category,description:old.description,source:'demo',usage:old.category==='Sheer'?['sheer']:['main'],images:[old.image],colors:[],compatibleHeadingStyles:[],active:!old.archived});}
  for(const item of db().prepare('SELECT * FROM records WHERE kind=? ORDER BY id').all('fabric-record') as RecordRow[])records.set(item.id,JSON.parse(item.data));
 }
 return [...records.values()];
}
export function fabricRecords() { return allFabricRecords().filter(f=>f.active!==false); }
export function categories(): FabricCategory[] {
 const records=new Map(fabricCategories.map(c=>[c.id,c]));
 if(databaseReady())for(const item of db().prepare('SELECT * FROM records WHERE kind=? ORDER BY id').all('fabric-category') as RecordRow[])records.set(item.id,JSON.parse(item.data));
 return [...records.values()];
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
function imageExists(src:string) {
 if(/^\/api\/catalogue\/images\/[a-f0-9-]{36}$/.test(src))return databaseReady()&&Boolean(row('catalogue-image',src.split('/').pop()!));
 if(!/^\/images\/[a-zA-Z0-9_./-]+\.(jpg|jpeg|png|webp|avif)$/.test(src))return false;
 const resolved=path.resolve('public','.'+src),root=path.resolve('public','images')+path.sep;
 return resolved.startsWith(root)&&existsSync(resolved);
}
export function validateFabricRecord(input:unknown): FabricRecord {
 // Null supplier fields mean unknown; availability intentionally keeps null.
 const cleaned=JSON.parse(JSON.stringify(input, (key,value)=>value===null&&key!=='available'?undefined:value));
 validate(cleaned,schema.items as Rule,'fabric');
 const f=cleaned as FabricRecord;
 if(f.slug!==f.id)throw new HttpError(400,'Use the stable fabric ID as the slug.');
 if(f.source==='supplier'&&!f.categoryId)throw new HttpError(400,'Choose a material category; use unclassified if not confirmed.');
 if(f.categoryId&&!categories().some(c=>c.id===f.categoryId))throw new HttpError(400,'Create the category first.');
 if(new Set(f.colors.map(c=>c.variantSku).filter(Boolean)).size!==f.colors.filter(c=>c.variantSku).length)throw new HttpError(400,'Variant SKUs must be unique within a fabric.');
 if(new Set(f.colors.map(c=>c.id)).size!==f.colors.length||new Set(f.colors.map(c=>c.colorCode)).size!==f.colors.length)throw new HttpError(400,'Variant IDs and shade codes must be unique within a fabric.');
 if(f.source==='supplier'&&(!f.sku||f.colors.some(c=>!c.variantSku)))throw new HttpError(400,'Supplier fabric and every shade need actual SKUs.');
 if(f.active!==false&&!f.colors.some(c=>c.active!==false&&c.available!==false))throw new HttpError(400,'Keep at least one selectable shade, or deactivate the fabric.');
 if(f.colors.some(c=>c.active!==false&&c.available===true&&![c.mainImage,c.textureImage,c.drapedImage,c.swatchImage,c.digitalPreviewImage,...(c.images||[])].some(Boolean)))throw new HttpError(400,'Add a shade photograph or digital preview before marking a shade available.');
 if(f.pricePerMetre!=null&&!f.currency)throw new HttpError(400,'Price needs a currency.');
 const images=[...f.images,...f.colors.flatMap(c=>[c.swatchImage,c.mainImage,c.textureImage,c.drapedImage,c.digitalPreviewImage,c.digitalSwatchImage,...(c.images||[]),...(c.digitalPreviewImages||[])])].filter((x):x is string=>Boolean(x));
 if(images.some(src=>!imageExists(src)))throw new HttpError(400,'Every image must be an existing local or authenticated-admin-uploaded public catalogue asset.');
 return f;
}
export function validateCategory(value:unknown): FabricCategory {
 const c=value as FabricCategory;
 if(!c||!/^[a-z0-9-]{2,60}$/.test(c.id)||typeof c.name!=='string'||!c.name.trim()||c.name.length>80||typeof c.description!=='string'||c.description.length>500||(c.active!==undefined&&typeof c.active!=='boolean'))throw new HttpError(400,'Use a category ID, name, description and optional active boolean.');
 return {id:c.id,name:c.name.trim(),description:c.description,active:c.active!==false};
}
