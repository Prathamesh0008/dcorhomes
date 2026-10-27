const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
require('./auth-loader.cjs');
const {validateFabricRecord,validateCategory}=require('../lib/server/fabric-records.ts');
const records=require('../data/catalogue/fabrics.json'),categories=require('../data/catalogue/collections.json');
(async()=>{
 if(process.env.VERCEL_ENV==='production'){
  const migration=require('../data/catalogue/migration.json');
  assert.ok(migration.status==='production-preserved'&&migration.productionSourceConfirmed===true&&/^[a-f0-9]{64}$/.test(migration.snapshotManifestSha256||''),'Production cutover blocked: export and verify the existing production content first. See docs/auth-only-mongodb-architecture.md.');
 }
 assert.equal(new Set(records.map(f=>f.id)).size,records.length,'Duplicate fabric IDs');
 assert.equal(new Set(records.map(f=>f.slug)).size,records.length,'Duplicate fabric slugs');
 assert.equal(new Set(categories.map(c=>c.id)).size,categories.length,'Duplicate categories');
 for(const category of categories)validateCategory(category);
 const skus=new Set();
 for(const fabric of records){await validateFabricRecord(fabric);if(fabric.source==='supplier')for(const sku of [fabric.sku,...fabric.colors.map(v=>v.variantSku)]){assert.ok(sku,'Missing supplier SKU');const normalized=sku.trim().toLowerCase();assert.ok(!skus.has(normalized),'Duplicate supplier SKU');skus.add(normalized);}}
 const walk=value=>{if(typeof value==='string'){assert.ok(!/^(data:|[A-Z]:\\|\/api\/catalogue\/images\/)/i.test(value),'Public content must not contain inline photographs, machine paths or retired image URLs');}else if(value&&typeof value==='object')for(const child of Object.values(value))walk(child);};
 walk(records);walk(categories);
 for(const name of ['editorial','design-options','seo'])walk(require('../data/site/'+name+'.json'));
 const {scenes,materials}=require('../lib/manual-visualizer/manifest.ts');
 const checkPaths=value=>{if(typeof value==='string'&&value.startsWith('/images/'))assert.ok(fs.existsSync(path.join('public','.'+value)),'Missing visualizer asset');else if(value&&typeof value==='object')for(const child of Object.values(value))checkPaths(child);};
 for(const scene of scenes.filter(s=>s.status==='sample'))checkPaths(scene);
 for(const material of materials.filter(m=>m.status==='sample'))checkPaths(material);
 console.log(`PASS: Repository catalogue (${records.length} records; ${records.filter(f=>f.source==='supplier').length} supplier), categories and prepared visualizer assets.`);
})().catch(error=>{console.error('FAIL: '+error.message);process.exitCode=1;});
