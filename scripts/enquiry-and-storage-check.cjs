// No external calls: all email responses are mocked; browser storage is in memory.
const assert=require('node:assert/strict');
Object.assign(process.env,{MONGODB_URI:'mongodb://127.0.0.1:1/must_not_connect',MONGODB_DB:'must_not_connect',SITE_URL:'http://localhost:3351',TRUST_PROXY:'false',RESEND_API_KEY:'fixture-key-not-a-credential',RESEND_FROM_EMAIL:'fixture@example.invalid'});
require('./auth-loader.cjs');
const {MongoClient}=require('mongodb');let attempts=0;MongoClient.prototype.connect=async()=>{attempts++;throw Error('No DB permitted.');};
const {NextRequest}=require('next/server'),{POST}=require('../app/api/enquiries/route.ts');
const records=require('../data/catalogue/fabrics.json'),{defaultDesign,validateDesign}=require('../lib/manual-visualizer/model.ts');
const originalFetch=global.fetch;let sent=[],mode='ok';
global.fetch=async(url,options)=>{assert.equal(url,'https://api.resend.com/emails');sent.push(JSON.parse(options.body));if(mode==='throw')throw Error('Fixture transport failure');return new Response(JSON.stringify(mode==='ok'?{id:'fixture-provider-id'}:{}),{status:mode==='reject'?503:200,headers:{'Content-Type':'application/json'}});};
const input={name:'Enquiry fixture',email:'fixture@example.invalid',consent:true,message:'Fixture only',visualizer:defaultDesign,catalogueFabricId:records[0].id,variantId:records[0].colors[0].id};
const request=(body=input,origin='http://localhost:3351')=>POST(new NextRequest('http://localhost:3351/api/enquiries',{method:'POST',headers:{origin,'content-type':'application/json'},body:JSON.stringify(body)}));
const reset=()=>{global.dcorPublicLimits=new Map();};
(async()=>{
 reset();let response=await request();assert.equal(response.status,200);const accepted=await response.json();assert.equal(accepted.accepted,true);assert.equal(accepted.stored,false);assert.deepEqual(sent[0].to,['sales@dcorhome.com']);assert.ok(sent[0].text.includes(records[0].id));assert.ok(sent[0].text.includes(defaultDesign.main.fabricId));
 const key=process.env.RESEND_API_KEY;process.env.RESEND_API_KEY='';assert.equal((await request()).status,503);process.env.RESEND_API_KEY=key;
 for(const failure of ['reject','missing-id','throw']){reset();mode=failure;assert.equal((await request()).status,503);}mode='ok';
 assert.equal((await request({...input,website:'bot'})).status,400);assert.equal((await request({...input,consent:false})).status,400);assert.equal((await request({...input,catalogueFabricId:'unknown'})).status,400);assert.equal((await request({...input,visualizer:{...defaultDesign,assetVersion:'unknown'}})).status,400);assert.equal((await request(input,'https://cross-site.invalid')).status,403);
 assert.equal((await request({...input,message:'x'.repeat(13000)})).status,413);
 reset();for(let i=0;i<5;i++)assert.equal((await request()).status,200);assert.equal((await request()).status,429);
 assert.equal(attempts,0);console.log('PASS: Email acceptance/rejection/missing configuration/transport handling, verified identifiers, consent/honeypot/origin/payload validation and bounded per-instance throttling; no MongoDB calls.');
 const memory=new Map();global.localStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value),removeItem:key=>memory.delete(key)};
 const {localDesigns,saveLocalDesign,deleteLocalDesign}=require('../lib/local-designs.ts');const {defaultSelection}=require('../lib/design-options.ts');
 const design={id:'fixture-manual-design',created:1000,selection:defaultSelection,status:'manual',visualizer:validateDesign(defaultDesign,records),original:new Blob(['private photo fixture'])};
 await saveLocalDesign(design);const saved=await localDesigns();assert.equal(saved.length,1);assert.deepEqual(saved[0].visualizer,design.visualizer);assert.equal(saved[0].original,undefined);assert.ok([...memory.values()][0].length<30000);
 await assert.rejects(()=>saveLocalDesign({...design,selection:{...defaultSelection,manual:'data:image/png;base64,fixture'}}));
 await deleteLocalDesign(design.id);assert.equal((await localDesigns()).length,0);
 global.localStorage.setItem=()=>{throw Error('Quota exceeded');};await assert.rejects(()=>saveLocalDesign(design),/disabled or full/);
 console.log('PASS: Local manual configuration round trip/delete, schema version retention, no photograph in localStorage, inline-image rejection and storage-failure reporting.');
})().catch(error=>{console.error('FAIL: '+error.message);process.exitCode=1;}).finally(()=>{global.fetch=originalFetch;});
