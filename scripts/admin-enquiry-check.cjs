// Read-side provider fixture only; never sends email or connects to a database.
const assert = require('node:assert/strict');
require('./auth-loader.cjs');
Object.assign(process.env,{RESEND_ADMIN_API_KEY:'fixture-read-key',RESEND_FROM_EMAIL:'Dcorhome <fixture@example.invalid>'});
const {sentEnquiries,sentEnquiry,emailId}=require('../lib/server/admin-enquiries.ts');
const id='00000000-0000-4000-8000-000000000001';
const email={id,from:'Dcorhome <fixture@example.invalid>',to:['sales@dcorhome.com'],subject:'New Curtain Design Enquiry | Fixture | Dcorhome',created_at:'2026-01-01',text:'SELECTED DESIGN\nMain Curtain: Fixture'};
const original=global.fetch;let mode='ok';
global.fetch=async(url,options)=>{assert.equal(options.headers.Authorization,'Bearer fixture-read-key');assert.equal(options.cache,'no-store');if(mode==='failure')return new Response('{}',{status:403});return Response.json(url.includes('?')?{data:[email,{...email,subject:'Unrelated email'}],has_more:true}:{...email,...(mode==='unrelated'?{to:['other@example.invalid']}:{} )});};
(async()=>{
 const list=await sentEnquiries();assert.equal(list.emails.length,1);assert.equal(list.next,id);assert.equal(list.emails[0].text,undefined);
 assert.ok((await sentEnquiry(id)).text.includes('Main Curtain'));assert.throws(()=>emailId('../../other'));
 mode='unrelated';await assert.rejects(()=>sentEnquiry(id),e=>e.status===404);
 mode='failure';await assert.rejects(()=>sentEnquiries(),e=>e.status===503);
 console.log('PASS: admin enquiry sender/recipient/subject filtering, pagination, safe text detail, ID validation and provider read-permission failure. No email sent.');
})().catch(error=>{console.error('FAIL: '+error.message);process.exitCode=1;}).finally(()=>global.fetch=original);
