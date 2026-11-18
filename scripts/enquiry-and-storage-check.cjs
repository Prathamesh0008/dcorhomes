// Pure email layout and local storage checks. Persistent HTTP flows have their own disposable-database suite.
const assert=require('node:assert/strict'),fs=require('node:fs');
process.env.SITE_URL='http://localhost:3351';require('./auth-loader.cjs');
const records=require('../data/catalogue/fabrics.json'),{defaultDesign,validateDesign}=require('../lib/manual-visualizer/model.ts');
const {designEnquiryDetails,saveEnquiryDesign,recoverEnquiryDesign}=require('../lib/manual-visualizer/enquiry.ts');
const {buildEnquiryEmail}=require('../lib/server/enquiry-email-template.ts');
(async()=>{
 const data={name:'Enquiry fixture',email:'fixture@example.invalid',phone:'+91 98765 43210',enquiryType:'Design Enquiry',requestPurpose:'quote',room:'Living room',interest:'',color:'',city:'Fixture city',method:'Email',measurements:'220 cm by 240 cm',message:'<script>Private requirements</script>',designId:'',consentAt:new Date().toISOString(),selectedFabric:undefined,designDetails:designEnquiryDetails(defaultDesign,records)};
 const email=buildEnquiryEmail('DCOR-FIXTURE-REFERENCE',data);
 for(const row of data.designDetails.rows)assert.ok(email.text.includes(row.label+': '+row.value));
 assert.ok(email.html.includes('&lt;script&gt;'));assert.ok(!email.html.includes('<script>'));
 assert.ok(email.text.includes('Enquiry reference: DCOR-FIXTURE-REFERENCE'));assert.ok(email.html.includes('Reply to Customer'));
 for(const technical of ['assetVersion','materialId','variantId'])assert.ok(!email.text.includes(technical));
 const general=buildEnquiryEmail('DCOR-GENERAL',{...data,designDetails:undefined,enquiryType:'General Enquiry'});assert.ok(!general.text.includes('SELECTED DESIGN'));assert.ok(general.text.includes('CUSTOMER DETAILS'));
 fs.mkdirSync('.test-data/enquiry-email',{recursive:true});fs.writeFileSync('.test-data/enquiry-email/preview.html',email.html);
 console.log('PASS: escaped professional HTML/plain text, selected designs, customer/requirements/reference fields and no raw configuration JSON.');
 const memory=new Map();global.localStorage={getItem:key=>memory.get(key)??null,setItem:(key,value)=>memory.set(key,value),removeItem:key=>memory.delete(key)};
 const href=saveEnquiryDesign(defaultDesign,records);assert.ok(href.length<70);assert.ok(!href.includes('visualizer'));assert.deepEqual(recoverEnquiryDesign(new URLSearchParams(href.split('?')[1]),records),validateDesign(defaultDesign,records));
 const changed=structuredClone(defaultDesign);changed.main={...changed.main,variantId:'burgundy'};const changedHref=saveEnquiryDesign(changed,records);assert.notEqual(href,changedHref);assert.ok(designEnquiryDetails(recoverEnquiryDesign(new URLSearchParams(changedHref.split('?')[1]),records),records).rows.some(row=>row.value==='Burgundy'));assert.deepEqual(recoverEnquiryDesign(new URLSearchParams(href.split('?')[1]),records),validateDesign(defaultDesign,records));
 assert.deepEqual(recoverEnquiryDesign(new URLSearchParams({visualizer:JSON.stringify(defaultDesign),message:'Old technical summary'}),records),validateDesign(defaultDesign,records));assert.throws(()=>recoverEnquiryDesign(new URLSearchParams('designRef=bad'),records));assert.throws(()=>recoverEnquiryDesign(new URLSearchParams('designRef='),records));assert.throws(()=>recoverEnquiryDesign(new URLSearchParams('visualizer='),records));assert.throws(()=>recoverEnquiryDesign(new URLSearchParams('visualizer={broken'),records));assert.equal(recoverEnquiryDesign(new URLSearchParams(),records),null);memory.clear();
 const {localDesigns,saveLocalDesign,deleteLocalDesign}=require('../lib/local-designs.ts');const {defaultSelection}=require('../lib/design-options.ts');
 const design={id:'fixture-manual-design',created:1000,selection:defaultSelection,status:'manual',visualizer:validateDesign(defaultDesign,records),original:new Blob(['private photo fixture'])};
 await saveLocalDesign(design);const saved=await localDesigns();assert.equal(saved.length,1);assert.deepEqual(saved[0].visualizer,design.visualizer);assert.equal(saved[0].original,undefined);assert.ok([...memory.values()][0].length<30000);
 await assert.rejects(()=>saveLocalDesign({...design,selection:{...defaultSelection,manual:'data:image/png;base64,fixture'}}));
 await deleteLocalDesign(design.id);assert.equal((await localDesigns()).length,0);
 global.localStorage.setItem=()=>{throw Error('Quota exceeded');};await assert.rejects(()=>saveLocalDesign(design),/disabled or full/);
 console.log('PASS: Immutable short enquiry references, shade changes/history, legacy recovery, missing/invalid reference handling; local manual configuration round trip/delete, schema version retention, no photograph in localStorage, inline-image rejection and storage-failure reporting.');
})().catch(error=>{console.error('FAIL: '+error.message);process.exitCode=1;});
