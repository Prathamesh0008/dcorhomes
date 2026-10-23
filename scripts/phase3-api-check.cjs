const assert = require('node:assert/strict');
const base = 'http://localhost:3199';
let cookie = '';
async function request(route, body, extra = {}) {
  const response = await fetch(base + route, { method: body ? 'POST' : 'GET', redirect: 'manual', headers: { 'Content-Type': 'application/json', Origin: base, cookie, ...extra }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const additions = response.headers.getSetCookie().map(c => c.split(';')[0]);
  if (additions.length) cookie = [cookie, ...additions].filter(Boolean).join('; ');
  return response;
}
(async () => {
  assert.equal((await request('/account')).status, 307);
  assert.equal((await request('/api/auth/request-password-reset', { email: 'fixture@example.com' })).status, 503);
  assert.equal((await request('/api/enquiries', {name:'F',email:'bad',consent:true})).status, 400);
  const email = `fixture-${Date.now()}@example.com`, password = 'fixture-account-password-123';
  assert.equal((await request('/api/auth/sign-up/email', {name:'Account Fixture',email,password})).status, 200);
  let account = await request('/account'); assert.equal(account.status, 200); assert.ok((await account.text()).includes('Account Fixture'));
  const id = require('node:crypto').randomUUID(), body = {name:'Account Fixture',phone:'+91 9000000000',email:'',interest:'Linen fixture',enquiryType:'Request a Quotation',message:'Only this account enquiry',consent:true};
  let result = await request('/api/enquiries', body, {'Idempotency-Key':id}); assert.equal(result.status,200); const stored=await result.json(); assert.equal(stored.stored,true); assert.equal(stored.notified,false);
  assert.equal((await request('/api/enquiries',body,{'Idempotency-Key':id})).status,200);
  const html=await (await request('/account')).text(); assert.ok(html.includes('Only this account enquiry'));
  assert.equal((await request('/api/auth/sign-out',{})).status,200);
  cookie=''; assert.equal((await request('/account')).status,307);
  assert.equal((await request('/api/auth/sign-in/email',{email,password})).status,200);
  assert.equal((await request('/account')).status,200);
  assert.equal((await request('/api/auth/update-user',{name:'Updated Fixture'})).status,200);
  assert.ok((await (await request('/account')).text()).includes('Updated Fixture'));
  cookie='';
  assert.equal((await request('/api/auth/sign-up/email',{name:'Other Fixture',email:`other-${Date.now()}@example.com`,password})).status,200);
  assert.ok(!(await (await request('/account')).text()).includes('Only this account enquiry'));
  cookie=''; assert.equal((await request('/collections')).status,200);
  const ready=await (await request('/api/visualize')).json(); assert.equal(ready.configured ?? ready.available ?? ready.ready, false);
  console.log('PASS: real HTTP signup/login/logout, private account redirect, account enquiry ownership, phone-only contact persistence/idempotency, honest missing email/reset status, public catalogue, AI disabled. Isolated database only.');
})().catch(error=>{console.error(error);process.exit(1);});
