// Test-process preload only. No external provider request is permitted by this fixture.
if(process.env.DCORHOME_TEST_ENQUIRY_PROVIDER!=='1')throw Error('Isolated enquiry provider fixture required.');
const fs=require('node:fs'),crypto=require('node:crypto');
const original=global.fetch,receipts=new Map(),lost=new Set();
global.fetch=async(url,options={})=>{
 if(String(url)!=='https://api.resend.com/emails') {
  if(/^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?\//.test(String(url)))return original(url,options);
  throw Error('External network disabled in enquiry fixture.');
 }
 const settings=JSON.parse(fs.readFileSync(process.env.DCORHOME_TEST_ENQUIRY_MODE,'utf8'));
 const key=options.headers['Idempotency-Key'],hash=crypto.createHash('sha256').update(options.body).digest('hex');
 const customer=key.startsWith('dcorhome-customer-acceptance-'),body=JSON.parse(options.body);
 const log=entry=>fs.appendFileSync(process.env.DCORHOME_TEST_ENQUIRY_LOG,JSON.stringify({key,customer,...entry})+'\n');
 if(receipts.has(key)){
  const receipt=receipts.get(key);if(receipt.hash!==hash)return Response.json({name:'invalid_idempotent_request',message:'Different payload'},{status:409});
  log({event:'deduplicated',id:receipt.id});return Response.json({id:receipt.id});
 }
 if(settings.mode==='invalid-key'){log({event:'rejected'});return Response.json({name:'validation_error',message:'API key is invalid'},{status:401});}
 if(settings.mode==='reject'){log({event:'rejected'});return Response.json({name:'validation_error',message:'The fixture.invalid domain is not verified'},{status:403});}
 if(settings.mode==='unavailable'){log({event:'unknown'});return Response.json({name:'application_error'},{status:503});}
 if(settings.mode==='empty'){log({event:'unknown'});return Response.json({id:''});}
 const validRecipient=customer ? body.to?.length===1&&body.to[0].endsWith('@example.invalid') : JSON.stringify(body.to)===JSON.stringify(['sales@dcorhome.com']);
 if(!validRecipient||!body.html?.includes('<!DOCTYPE html>')||!body.text?.includes('Enquiry reference: DCOR-'))throw Error('Malformed enquiry fixture notification.');
 const id=crypto.randomUUID();receipts.set(key,{hash,id});log({event:'accepted',id,...(customer?{body}:{})});
 if(settings.mode==='lost-response'&&!lost.has(key)){lost.add(key);throw Error('Fixture response lost after provider acceptance.');}
 if(settings.mode==='slow')await new Promise(resolve=>setTimeout(resolve,250));
 return Response.json({id});
};
