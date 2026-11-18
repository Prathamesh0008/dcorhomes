// Client retries and configuration diagnostics; no external requests or database calls.
const assert=require('node:assert/strict');
require('./auth-loader.cjs');
const {enquiryAttempt,enquiryReceipt}=require('../lib/enquiry-submission.ts');
const {enquiryEmailConfiguration,resendFailure}=require('../lib/server/enquiry-email-configuration.ts');
const first=enquiryAttempt(null,{name:'Fixture',message:'Initial requirements'});
assert.strictEqual(enquiryAttempt(first,{name:'Fixture',message:'Initial requirements'}),first);
const changed=enquiryAttempt(first,{name:'Fixture',message:'Edited after failure'});
assert.notEqual(first.id,changed.id);assert.notEqual(first.body,changed.body);
assert.notEqual(enquiryAttempt(null,{name:'Fixture',message:'Initial requirements'}).id,first.id);
assert.throws(()=>enquiryReceipt({accepted:true,notified:true}));
assert.throws(()=>enquiryReceipt({accepted:true,stored:false,reference:'fixture'}));
assert.ok(enquiryReceipt({accepted:true,stored:true,reference:'fixture',notified:false}).includes('email notification is delayed'));
assert.ok(enquiryReceipt({accepted:true,stored:true,reference:'fixture',notified:true}).includes('accepted for delivery'));
Object.assign(process.env,{RESEND_API_KEY:'YOUR_RESEND_API_KEY',RESEND_FROM_EMAIL:'sales@dcorhome.com',ENQUIRY_FROM_EMAIL:'',EMAIL_FROM:''});
assert.deepEqual(enquiryEmailConfiguration().issues,['RESEND_API_KEY']);
process.env.RESEND_API_KEY='re_fixture_not_a_credential';assert.deepEqual(enquiryEmailConfiguration().issues,[]);
process.env.RESEND_FROM_EMAIL='\u200b  ';process.env.ENQUIRY_FROM_EMAIL='Dcorhome <fixture@example.invalid>';
assert.equal(enquiryEmailConfiguration().senderVariable,'ENQUIRY_FROM_EMAIL');
assert.equal(enquiryEmailConfiguration().from,'Dcorhome <fixture@example.invalid>');
process.env.RESEND_FROM_EMAIL='Invalid\r\nBcc:other@example.invalid <fixture@example.invalid>';
assert.ok(enquiryEmailConfiguration().issues.includes('RESEND_FROM_EMAIL'));
assert.equal(enquiryEmailConfiguration().recipient,'sales@dcorhome.com');
for(const [status,name,message,category] of [
 [401,'validation_error','API key is invalid','invalid_api_key'],
 [403,'validation_error','The private.example domain is not verified','sender_domain_unverified'],
 [403,'validation_error','You can only send testing emails to someone@example.invalid. Please verify a domain.','testing_recipient_restriction'],
 [401,'restricted_api_key','This API key is restricted to only send emails','key_permission'],
 [409,'invalid_idempotent_request','same key with different payload','idempotency_conflict'],
 [429,'rate_limit_exceeded','Too many requests','provider_rate_limit'],
 [500,'internal_server_error','Private provider message','provider_unavailable'],
 [400,'secret-name-must-not-leak','Private provider message','provider_rejected'],
]){
 const safe=resendFailure(status,{name,message});assert.equal(safe.category,category);
 assert.ok(!JSON.stringify(safe).includes(message));assert.ok(!JSON.stringify(safe).includes('secret-name'));
}
console.log('PASS: stable retry IDs, new IDs after edits/success, sender aliases and whitespace, placeholder/injection rejection, fixed recipient and safe provider error classification.');
