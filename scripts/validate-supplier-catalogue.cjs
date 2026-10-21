const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const data=require('../lib/curtains/supplier-catalogue.json'),schema=require('../lib/curtains/supplier-catalogue.schema.json');
function validate(value,rule,location='catalogue'){
 if(value===undefined)return;
 if(rule.type){const types=[rule.type].flat();assert.ok(types.some(t=>t==='array'?Array.isArray(value):t==='null'?value===null:t==='object'?value&&typeof value==='object'&&!Array.isArray(value):typeof value===t),location+' invalid type');}
 if(rule.const!==undefined)assert.equal(value,rule.const,location);
 if(rule.enum)assert.ok(rule.enum.includes(value),location+' invalid value');
 if(typeof value==='string'){if(rule.minLength)assert.ok(value.length>=rule.minLength,location);if(rule.pattern)assert.match(value,new RegExp(rule.pattern),location);}
 if(typeof value==='number'){assert.ok(Number.isFinite(value),location);if(rule.minimum!=null)assert.ok(value>=rule.minimum,location);if(rule.exclusiveMinimum!=null)assert.ok(value>rule.exclusiveMinimum,location);if(rule.maximum!=null)assert.ok(value<=rule.maximum,location);}
 if(Array.isArray(value)){if(rule.minItems)assert.ok(value.length>=rule.minItems,location);value.forEach((v,i)=>validate(v,rule.items,location+'['+i+']'));}
 else if(value&&typeof value==='object'){for(const key of rule.required||[])assert.ok(value[key]!==undefined,location+'.'+key+' required');for(const [key,sub]of Object.entries(rule.properties||{}))validate(value[key],sub,location+'.'+key);}
}
validate(data,schema);const ids=new Set();for(const fabric of data){assert.ok(!ids.has(fabric.id),'Duplicate fabric ID');ids.add(fabric.id);assert.equal(fabric.slug,fabric.id,'Use the stable collection ID as slug');assert.ok(fabric.colors.some(c=>c.available!==false),'At least one selectable variant required');assert.equal(new Set(fabric.colors.map(c=>c.id)).size,fabric.colors.length,'Duplicate color IDs');if(fabric.pricePerMetre!=null)assert.ok(fabric.currency,'Currency required for price');for(const image of [...fabric.images,...fabric.colors.map(c=>c.swatchImage).filter(Boolean)]){const resolved=path.resolve('public','.'+image);assert.ok(resolved.startsWith(path.resolve('public','images')+path.sep));assert.ok(fs.existsSync(resolved),'Missing local supplier image');}}
if(data.length)for(const layer of ['main','sheer'])assert.ok(data.some(f=>f.usage.includes(layer)),'Import both main and sheer records for the layered configurator');
console.log(data.length?`${data.length} supplier records validated`:'Supplier catalogue empty: demo fixtures are explicitly labelled; no technical data invented');
