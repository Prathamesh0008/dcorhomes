// Operator-only read-only migration. Never creates indexes, updates records, or exports credentials.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
if(!process.argv.includes('--env-only'))require('@next/env').loadEnvConfig(process.cwd(),false,{info(){},error(){}});
require('./auth-loader.cjs');
const {EJSON}=require('bson');
const {mongoClient,mongoDatabase}=require('../lib/server/mongodb.ts');
const {databaseFailure}=require('../lib/server/database-diagnostics.ts');
const {recordCollections}=require('../lib/server/record-schema.ts');
const {getAsset}=require('../lib/server/assets.ts');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const canonical=value=>EJSON.stringify(value,{relaxed:false});
const args=process.argv.slice(2),outIndex=args.indexOf('--out');
let client,stage='configuration';
const deadline=setTimeout(()=>{console.error(JSON.stringify({event:'legacy_export',status:'failed',stage,category:'network_timeout'}));process.exit(1);},120000);
async function main(){
 if(outIndex<0||!args[outIndex+1])throw Error('Output argument required.');
 const root=path.resolve('.data'),out=path.resolve(args[outIndex+1]);
 if(!out.startsWith(root+path.sep)||fs.existsSync(out))throw Error('Use a new directory inside ignored .data.');
 stage='connect';client=await mongoClient();const db=await mongoDatabase();
 await db.command({ping:1},{maxTimeMS:5000});
 const snapshot=async()=>{
  const session=client.startSession();const records={};
  try{await session.withTransaction(async()=>{
   for(const name of [...new Set([...Object.values(recordCollections),'application_records','application_limits','application_control'])].sort()){
    const kinds=Object.keys(recordCollections).filter(kind=>recordCollections[kind]===name);
    records[name]=await db.collection(name).find({},{session}).sort({kind:1,id:1,_id:1}).toArray();
   }
  },{readConcern:{level:'snapshot'}});return records;}finally{await session.endSession();}
 };
 stage='read_snapshot';const source=await snapshot();
 fs.mkdirSync(root,{recursive:true});fs.mkdirSync(out);
 const files={};
 const write=(name,bytes)=>{const target=path.join(out,name);fs.mkdirSync(path.dirname(target),{recursive:true});const value=Buffer.isBuffer(bytes)?bytes:Buffer.from(bytes);fs.writeFileSync(target,value,{flag:'wx'});files[name]=hash(value);};
 write('PRIVATE-records.ejson',canonical(source));
 const all=Object.values(source).flat();
 const products=new Map(require('../data/catalogue/fabrics.json').map(item=>[item.id,item]));
 // Preserve the former repository's legacy overlay behavior as well as every modern record.
 for(const record of all.filter(r=>r.kind==='fabric')){
  const old=record.payload,prior=products.get(record.id);
  products.set(record.id,prior?{...prior,name:old.name,description:old.description,category:old.category,images:[old.image],active:!old.archived}:{id:record.id,slug:record.id,name:old.name,category:old.category,description:old.description,images:[old.image],source:'demo',usage:old.category==='Sheer'?['sheer']:['main'],colors:[],compatibleHeadingStyles:[],active:!old.archived});
 }
 for(const record of all.filter(r=>r.kind==='fabric-record'))products.set(record.id,record.payload);
 const categories=new Map(require('../data/catalogue/collections.json').map(item=>[item.id,item]));
 for(const record of all.filter(r=>r.kind==='fabric-category'))categories.set(record.id,record.payload);
 const images=new Map();
 async function publicAssets(value){
  if(typeof value==='string'&&/^\/api\/catalogue\/images\/[a-f0-9-]{36}$/.test(value)){
   const id=value.split('/').pop();if(!images.has(id)){stage='public_asset_export';const bytes=await getAsset(id+'/result.webp');write('public/images/catalogue/'+id+'.webp',bytes);images.set(id,'/images/catalogue/'+id+'.webp');}return images.get(id);
  }
  if(Array.isArray(value))return Promise.all(value.map(publicAssets));
  if(value&&typeof value==='object'){const entries=[];for(const [key,item]of Object.entries(value))entries.push([key,await publicAssets(item)]);return Object.fromEntries(entries);}
  return value;
 }
 const fabrics=await publicAssets([...products.values()]);
 write('candidate/catalogue/fabrics.json',JSON.stringify(fabrics,null,2)+'\n');
 write('candidate/catalogue/collections.json',JSON.stringify([...categories.values()],null,2)+'\n');
 const editorial=structuredClone(require('../data/site/editorial.json'));
 const faqs=new Map(editorial.faqs.map(q=>[q.id,q])),articles=new Map(editorial.articles.map(a=>[a.slug,a]));
 for(const record of all.filter(r=>r.kind==='content')){const item=record.payload;if(item.type==='faq'){if(item.archived)faqs.delete(record.id);else faqs.set(record.id,{id:record.id,title:item.title,body:item.body});}else if(item.type==='article'){if(item.archived)articles.delete(record.id);else articles.set(record.id,{slug:record.id,title:item.title,description:item.body.slice(0,150),image:'/images/curtain-room.jpg',body:item.body.split(/\n\s*\n/)});}}
 write('candidate/site/editorial.json',JSON.stringify({faqs:[...faqs.values()],articles:[...articles.values()]},null,2)+'\n');
 const options=all.find(r=>r.kind==='settings'&&r.id==='design-options')?.payload||require('../data/site/design-options.json');
 write('candidate/site/design-options.json',JSON.stringify(options,null,2)+'\n');
 const owners=new Map();for(const record of all.filter(r=>r.kind==='manual-design')){const id=hash(record.owner).slice(0,24);if(!owners.has(id))owners.set(id,[]);owners.get(id).push({id:record.id,created:record.created,design:record.payload.design});}
 for(const [owner,designs]of owners)write('PRIVATE-owners/'+owner+'/manual-designs.json',JSON.stringify({version:1,designs},null,2)+'\n');
 const privateAssetInventory=[],seenAssets=new Set();
 for(const record of all.filter(r=>['design','upload'].includes(r.kind))){
  if(!/^[a-f0-9-]{36}$/.test(record.id))continue;
  for(const type of record.kind==='upload'?['original']:['original','result']){
   const key=record.id+'/'+type+'.webp';if(seenAssets.has(key))continue;seenAssets.add(key);const item={key,downloaded:false};
   if(args.includes('--include-private-assets')){stage='private_asset_export';try{write('PRIVATE-assets/'+key,await getAsset(key));item.downloaded=true;}catch{item.unavailable=true;}}
   privateAssetInventory.push(item);
  }
 }
 write('PRIVATE-assets-inventory.json',JSON.stringify(privateAssetInventory,null,2)+'\n');
 stage='verify_source_unchanged';const after=await snapshot();
 const unchanged=hash(canonical(after))===hash(canonical(source));
 const manifest={version:1,readOnly:true,sourceUnchanged:unchanged,exportedAt:new Date().toISOString(),counts:Object.fromEntries(Object.entries(source).map(([name,items])=>[name,items.length])),fabricCount:fabrics.length,shadeCount:fabrics.reduce((sum,f)=>sum+f.colors.length,0),publicImages:images.size,privateAssetsRequested:args.includes('--include-private-assets'),privateAssetInventory,files,productionMigrationVerified:false};
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n',{flag:'wx'});
 if(!unchanged)throw Error('Source changed during export.');
 console.log(JSON.stringify({event:'legacy_export',status:'snapshot_exported',reviewRequired:true}));
}
main().catch(error=>{console.error(JSON.stringify({event:'legacy_export',status:'failed',stage,category:databaseFailure(error)}));process.exitCode=1;}).finally(async()=>{if(client)await client.close();clearTimeout(deadline);});
