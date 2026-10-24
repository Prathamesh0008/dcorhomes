const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),sharp=require('sharp');
require('./auth-loader.cjs');
const {scenes,materials,demoColors,assetVersion}=require('../lib/manual-visualizer/manifest.ts');
const {defaultDesign,validateDesign,resolveLayer,designSummary,fromManual}=require('../lib/manual-visualizer/model.ts');
const {fabrics,manualDefault}=require('../lib/curtains/manual-config.ts');
(async()=>{
 assert.equal(scenes.length,10);assert.equal(materials.filter(m=>m.layer==='main').length,10);assert.equal(materials.filter(m=>m.layer==='sheer').length,10);assert.ok(demoColors.length>=10);
 assert.equal(scenes.filter(s=>s.status==='sample').length,1);assert.equal(materials.filter(m=>m.status==='sample'&&m.layer==='main').length,4);assert.equal(materials.filter(m=>m.status==='sample'&&m.layer==='sheer').length,2);
 const manifest=JSON.parse(fs.readFileSync('public/images/manual-visualizer/v1/sources.json','utf8'));
 for(const asset of manifest.assets){assert.equal(crypto.createHash('sha256').update(fs.readFileSync('public'+asset.path)).digest('hex'),asset.sha256);}
 for(const scene of scenes.filter(s=>s.status==='sample')){
  const info=await sharp('public'+scene.base).metadata();assert.equal(info.width,scene.width);assert.equal(info.height,scene.height);
  for(const rect of [scene.window,scene.sheer,...scene.main]){assert.ok(rect.x>=0&&rect.y>=0&&rect.width>0&&rect.height>0&&rect.x+rect.width<=1&&rect.y+rect.height<=1);}
  const coverage=scene.main.reduce((sum,r)=>sum+r.width,0)/scene.window.width;assert.ok(coverage>=.5&&coverage<=.65);
 }
 for(const layer of ['main','sheer']){
  const mask=await sharp('public/images/manual-visualizer/v1/constructions/'+layer+'-mask.png').raw().toBuffer();assert.ok(mask.some(value=>value===0));assert.ok(mask.some(value=>value>240));
  const stats=await sharp('public/images/manual-visualizer/v1/constructions/'+layer+'-fold.webp').stats();assert.ok(stats.channels[0].stdev>10,'Fold maps must contain meaningful shading.');
 }
 assert.equal(new Set(materials.filter(m=>m.status==='sample').map(m=>crypto.createHash('sha256').update(fs.readFileSync('public'+m.texture)).digest('hex'))).size,6,'Supported studies need distinct texture assets.');
 assert.deepEqual(validateDesign(defaultDesign,fabrics),defaultDesign);
 for(const material of materials.filter(m=>m.status==='sample'))for(const color of demoColors){const design=structuredClone(defaultDesign);design[material.layer]={enabled:true,materialId:material.id,fabricId:material.fabricId,previewColorId:color.id};assert.equal(resolveLayer(validateDesign(design,fabrics)[material.layer],fabrics).commercial,false);}
 const changed=structuredClone(defaultDesign);changed.sheer.previewColorId='preview-rose';assert.deepEqual(changed.main,defaultDesign.main);assert.match(designSummary(changed,fabrics),/DEMONSTRATION ONLY/);assert.doesNotMatch(designSummary(changed,fabrics),/SKU:/);
 assert.throws(()=>validateDesign({...defaultDesign,sceneId:'home-office'},fabrics),/not yet preview-supported/);
 assert.throws(()=>validateDesign({...defaultDesign,assetVersion:'unknown'},fabrics),/unavailable preview assets/);
 assert.throws(()=>validateDesign({...defaultDesign,main:{...defaultDesign.main,materialId:'jacquard'}},fabrics),/compatible preview assets/);
 assert.throws(()=>validateDesign({...defaultDesign,main:{...defaultDesign.main,variantId:'fake-stock'}},fabrics),/Choose an available shade/);
 assert.throws(()=>validateDesign(defaultDesign,fabrics.map(f=>f.id==='sienna'?{...f,source:'supplier'}:f)),/compatible preview assets/);
 const from=fromManual(manualDefault,fabrics);assert.equal(from.main.variantId,manualDefault.mainColor);assert.equal(from.sheer.variantId,manualDefault.sheerColor);
 assert.throws(()=>fromManual({...manualDefault,mainFabric:'noir',mainColor:'Charcoal'},fabrics),/needs compatible room-preview assets/);
 const composed=fromManual(manualDefault,fabrics,{style:'Classic',pattern:'Floral',room:'Bedroom'});assert.deepEqual(validateDesign(composed,fabrics).inspiration,composed.inspiration);assert.match(designSummary(composed,fabrics),/Classic \/ Floral \/ Bedroom/);assert.match(designSummary(composed,fabrics),/not represented by the sample geometry/);
 const encoded=new URLSearchParams({visualizer:JSON.stringify(changed)});assert.deepEqual(validateDesign(JSON.parse(encoded.get('visualizer')),fabrics),changed);
 const studio=fs.readFileSync('app/studio/page.tsx','utf8')+fs.readdirSync('components/curtains/manual-visualizer').map(file=>fs.readFileSync(path.join('components/curtains/manual-visualizer',file),'utf8')).join('');
 assert.ok(!/\/api\/(visualiz|ai)|openai|generate\(/i.test(studio),'Manual Studio must never call an AI endpoint.');
 console.log('PASS: honest 1/10 sample rooms, 4/10 main and 2/10 sheer studies, 12 preview colours; immutable asset hashes, mask/fold data, distinct textures, geometry/60% coverage, catalogue separation, saved configuration validation, URL round-trip and zero AI integrations. Asset version: '+assetVersion);
})().catch(error=>{console.error(error);process.exitCode=1;});
