// Isolated manual-design ownership checks plus one opt-in focused Studio journey.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const directory=fs.mkdtempSync(path.join(os.tmpdir(),'dcorhome-manual-check-')),base='http://localhost:3231';
Object.assign(process.env,{DCORHOME_DATA_DIR:directory,DCORHOME_DATABASE_URL:'',SESSION_SECRET:crypto.randomBytes(32).toString('hex'),BETTER_AUTH_SECRET:crypto.randomBytes(32).toString('hex'),SITE_URL:base,ALLOW_LOCAL_HTTP:'true',RESEND_API_KEY:'',ENQUIRY_FROM_EMAIL:'',OPENAI_API_KEY:'',TRUST_PROXY:'false'});
require('./auth-loader.cjs');
const {defaultDesign}=require('../lib/manual-visualizer/model.ts');
const req=(route,options={})=>fetch(base+route,{...options,headers:{Origin:base,...options.headers}});
const send=(route,body,cookie='',method='POST')=>req(route,{method,headers:{'Content-Type':'application/json',Cookie:cookie},body:JSON.stringify(body)});
const cookie=response=>response.headers.getSetCookie().map(value=>value.split(';')[0]).join('; '),delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));let server,logs='';
(async()=>{try{
 const {customerAuth}=require('../lib/server/customer-auth.ts'),{getMigrations}=await import('better-auth/db/migration');await(await getMigrations(customerAuth().options)).runMigrations();
 server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p','3231'],{env:process.env,windowsHide:true,stdio:['ignore','pipe','pipe']});server.stdout.on('data',data=>logs+=data);server.stderr.on('data',data=>logs+=data);
 let ready=false;for(let i=0;i<80;i++){try{if((await req('/api/manual-designs')).ok){ready=true;break;}}catch{}await delay(200);}assert.ok(ready,'Local verification server did not start.');
 assert.deepEqual(await(await req('/api/manual-designs')).json(),{account:false,designs:[]});assert.equal((await send('/api/manual-designs',{design:defaultDesign})).status,401);
 const signup=async name=>{const response=await send('/api/auth/sign-up/email',{name,email:name+'@example.com',password:'TestOnly-'+crypto.randomBytes(16).toString('hex')});assert.equal(response.status,200,await response.clone().text());return cookie(response);};
 const first=await signup('manual-check-one'),second=await signup('manual-check-two');
 const created=await send('/api/manual-designs',{design:defaultDesign},first);assert.equal(created.status,201,await created.clone().text());const {id}=await created.json();
 const own=await(await req('/api/manual-designs',{headers:{Cookie:first}})).json();assert.equal(own.account,true);assert.deepEqual(own.designs[0].design,defaultDesign);assert.ok(own.designs[0].created>0);
 assert.equal((await(await req('/api/manual-designs',{headers:{Cookie:second}})).json()).designs.length,0);
 assert.equal((await send('/api/manual-designs',{id},second,'DELETE')).status,404);
 assert.equal((await send('/api/manual-designs',{design:{...defaultDesign,sceneId:'master-bedroom'}},first)).status,400);
 assert.equal((await send('/api/manual-designs',{design:{...defaultDesign,main:{...defaultDesign.main,variantId:'invented-stock'}}},first)).status,400);
 assert.equal((await send('/api/manual-designs',{id},first,'DELETE')).status,200);
 assert.equal((await(await req('/api/manual-designs',{headers:{Cookie:first}})).json()).designs.length,0);
 console.log('PASS: manual-design API guest denial, account-linked metadata-only save, timestamp/restore, account isolation, invalid scene/shade rejection and owner-only deletion. No customer records or mail touched.');
 if(process.env.DCORHOME_MANUAL_BROWSER==='1'){
  const browser=spawn(process.execPath,['scripts/manual-visualizer-browser.cjs'],{env:{...process.env,DCORHOME_TEST_BASE_URL:base},windowsHide:true,stdio:'inherit'});const code=await new Promise(resolve=>browser.on('exit',resolve));assert.equal(code,0,'Focused manual browser verification did not finish.');
 }
}catch(error){console.error(error);if(logs)console.error(logs.slice(-2500));process.exitCode=1;}finally{server?.kill();console.log('Isolated verification directory: '+directory);}})();
