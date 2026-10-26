require('./sqlite-fixture-retired.cjs');
const {spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),sharp=require('sharp');
const base='http://localhost:3220',directory=path.resolve('.test-data/ai-window-'+crypto.randomUUID());fs.mkdirSync(directory,{recursive:true});const providerLog=path.join(directory,'provider.log');
const cronSecret=crypto.randomBytes(32).toString('hex');
const env={...process.env,CRON_SECRET:cronSecret,SITE_URL:base,DCORHOME_DATABASE_URL:'',DCORHOME_DATA_DIR:directory,SESSION_SECRET:crypto.randomBytes(32).toString('hex'),ASSET_STORAGE:'local',ALLOW_LOCAL_HTTP:'true',VERCEL:'',DCORHOME_AI_ENABLED:'true',OPENAI_API_KEY:'test-only-not-a-real-key',DCORHOME_IMAGE_MODEL:'gpt-image-2.5-sunburst',DCORHOME_IMAGE_QUALITY:'medium',DCORHOME_MAX_GENERATIONS_PER_GUEST:'3',DCORHOME_MAX_CONCURRENT_GENERATIONS:'1',AI_DAILY_LIMIT:'20',DCORHOME_TEST_PROVIDER:'enabled',DCORHOME_TEST_PROVIDER_LOG:providerLog,RESEND_API_KEY:'',ENQUIRY_FROM_EMAIL:'',ENQUIRY_TO_EMAIL:'',NODE_OPTIONS:'--require '+JSON.stringify(path.resolve('scripts/provider-fixture.cjs'))};
const server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p','3220'],{env,windowsHide:true,stdio:['ignore','pipe','pipe']});let logs='';server.stdout.on('data',d=>logs+=d);server.stderr.on('data',d=>logs+=d);
const delay=ms=>new Promise(r=>setTimeout(r,ms)),request=(route,options={})=>fetch(base+route,{...options,headers:{Origin:base,...options.headers}}),calls=()=>fs.existsSync(providerLog)?fs.readFileSync(providerLog,'utf8').trim().split('\n').length:0;
(async()=>{try{
 for(let i=0;i<120;i++){try{if((await request('/api/visualizer/generate')).ok)break;}catch{}await delay(250);}
 const guest=async()=>{const r=await request('/api/session');return r.headers.get('set-cookie').split(';')[0];};const cookie=await guest(),other=await guest();
 const area={x:.2,y:.2,width:.6,height:.6},photo=await sharp({create:{width:600,height:400,channels:3,background:'#c7b9a9'}}).jpeg().withMetadata({orientation:6}).toBuffer();
 const upload=async(bytes,type='image/jpeg',owner=cookie)=>{const form=new FormData();form.set('image',new Blob([bytes],{type}),'room.jpg');return request('/api/visualizer/upload',{method:'POST',headers:{Cookie:owner},body:form});};
 assert.equal((await upload(Buffer.from('not an image'))).status,400);assert.equal((await upload(Buffer.alloc(3*1024*1024+1))).status,413);
 assert.equal((await upload(await sharp({create:{width:50,height:50,channels:3,background:'white'}}).png().toBuffer(),'image/png')).status,400);
 const uploaded=await upload(photo),u=await uploaded.json();assert.equal(uploaded.status,201,JSON.stringify(u));assert.equal(u.width,400);assert.equal(u.height,600);assert.ok(!JSON.stringify(u).includes('base64'));
 const normalized=await request(u.image,{headers:{Cookie:cookie}});assert.equal(normalized.status,200);const originalBytes=Buffer.from(await normalized.arrayBuffer()),metadata=await sharp(originalBytes).metadata();assert.equal(metadata.exif,undefined);assert.equal(metadata.orientation,undefined);
 assert.equal((await request(u.image,{headers:{Cookie:other}})).status,404);
 const manual={mainEnabled:true,sheerEnabled:true,mainFabric:'sienna',mainColor:'oat',sheerFabric:'solstice',sheerColor:'ivory',heading:'Wave Pleat',sheerHeading:'Wave Pleat',pattern:'Solid',curtainLength:'Floor length',fullness:'2',panels:'pair',room:'Living room'};
 // Obtain canonical defaults using the same public catalogue selections as Studio.
 const ts=require('typescript'),Module=require('node:module');const old=Module._extensions['.ts'];Module._extensions['.ts']=(m,name)=>m._compile(ts.transpileModule(fs.readFileSync(name,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText,name);
 const config=require('../lib/curtains/manual-config.ts');Object.assign(manual,config.manualDefault);Module._extensions['.ts']=old;
 const body={uploadId:u.id,windowArea:{...area,untrustedPrompt:'Do not accept this arbitrary prompt'},manual:{...manual,untrustedSku:'invented-value'},style:'Modern'};
 const generate=(data=body,key=crypto.randomUUID(),owner=cookie)=>request('/api/visualizer/generate',{method:'POST',headers:{Cookie:owner,'Content-Type':'application/json','Idempotency-Key':key},body:JSON.stringify(data)});
 assert.equal((await generate({...body,windowArea:{...area,x:2}})).status,400);
 assert.equal((await generate({...body,manual:{...manual,mainColor:'invented-shade'}})).status,400);
 assert.equal((await generate(body,crypto.randomUUID(),other)).status,404);assert.equal(calls(),0);
 const key=crypto.randomUUID(),pending=generate(body,key);await delay(250);
 const duplicate=await generate(body,key);assert.ok([200,202].includes(duplicate.status),await duplicate.text());
 const blocked=await generate();assert.equal(blocked.status,429);
 const result=await pending,data=await result.json();assert.equal(result.status,200,JSON.stringify(data));assert.equal(data.status,'completed');assert.equal(calls(),1);assert.ok(!data.image);
 assert.equal((await generate(body,key)).status,200);assert.equal(calls(),1);
 assert.equal((await generate({...body,style:'Classic'},key)).status,409);
 const status=await request('/api/visualizer/generations/'+key,{headers:{Cookie:cookie}});assert.equal((await status.json()).status,'completed');assert.equal((await request('/api/visualizer/generations/'+key,{headers:{Cookie:other}})).status,404);
 const original=await sharp(originalBytes).removeAlpha().raw().toBuffer({resolveWithObject:true});const image=await request(data.result,{headers:{Cookie:cookie}});assert.equal(image.status,200);assert.equal(image.headers.get('cache-control'),'private, no-store');const edited=await sharp(Buffer.from(await image.arrayBuffer())).removeAlpha().raw().toBuffer({resolveWithObject:true});assert.deepEqual(edited.info,original.info);
 const w=original.info.width,h=original.info.height;let changes=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const outside=x<Math.floor(w*.2)||y<Math.floor(h*.2)||x>=Math.floor(w*.2)+Math.round(w*.6)||y>=Math.floor(h*.2)+Math.round(h*.6);for(let c=0;c<3;c++){const i=(y*w+x)*3+c;if(outside)assert.equal(edited.data[i],original.data[i],'Exterior changed');else if(edited.data[i]!==original.data[i])changes++;}}assert.ok(changes>0);assert.equal((await request(data.result,{headers:{Cookie:other}})).status,404);
 const saved=await request('/api/designs',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({id:data.id})});assert.equal(saved.status,200);const designs=await(await request('/api/designs',{headers:{Cookie:cookie}})).json();assert.ok(designs.designs.some(d=>d.id===data.id));
 const reopened=await(await request('/api/designs/'+data.id,{headers:{Cookie:cookie}})).json();assert.deepEqual(JSON.parse(reopened.selection.windowArea),area);assert.equal(JSON.parse(reopened.selection.manual).untrustedSku,undefined);
 const enquiry=await request('/api/enquiries',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({name:'Isolated Test',email:'test@example.invalid',consent:true,designId:data.id})});assert.equal(enquiry.status,200);const enquiryId=(await enquiry.json()).id;
 const {DatabaseSync}=require('node:sqlite');const db=new DatabaseSync(path.join(directory,'dcorhome.sqlite'));const stored=JSON.parse(db.prepare('SELECT data FROM records WHERE kind=? AND id=?').get('enquiry',enquiryId).data);assert.equal(stored.designSelection.manual,reopened.selection.manual);assert.equal(stored.notification,'not-configured');db.close();
 const authError=await generate({...body,style:'Classic'});assert.equal(authError.status,503);assert.ok(!(await authError.text()).includes('Private controlled'));
 const rateError=await generate({...body,style:'Luxury'});assert.equal(rateError.status,429);assert.equal(calls(),3);assert.equal((await generate()).status,429);assert.equal(calls(),3);
 const secondUpload=await(await upload(photo,'image/jpeg',other)).json();
 for(const [style,expected]of [['Contemporary',502],['Minimalist',502],['Romantic',500]]){
  const secondBody={...body,uploadId:secondUpload.id,style},secondKey=crypto.randomUUID(),failed=await generate(secondBody,secondKey,other);assert.equal(failed.status,expected,await failed.text());
  const state=await request('/api/visualizer/generations/'+secondKey,{headers:{Cookie:other}});assert.equal((await state.json()).status,'failed');const count=calls();assert.equal((await generate(secondBody,secondKey,other)).status,expected);assert.equal(calls(),count);
 }
 assert.equal(calls(),6);
 assert.equal((await request('/api/visualizer/retention')).status,401);
 const cleanupDb=new DatabaseSync(path.join(directory,'dcorhome.sqlite'));const uploadRow=cleanupDb.prepare('SELECT data FROM records WHERE kind=? AND id=?').get('upload',secondUpload.id);const oldUpload={...JSON.parse(uploadRow.data),expires:Date.now()-1000};cleanupDb.prepare('UPDATE records SET data=?,created=? WHERE kind=? AND id=?').run(JSON.stringify(oldUpload),Date.now()-2*86400000,'upload',secondUpload.id);cleanupDb.close();
 assert.equal((await request(secondUpload.image,{headers:{Cookie:other}})).status,410);
 const cleanup=await request('/api/visualizer/retention',{headers:{Authorization:'Bearer '+cronSecret}});assert.equal(cleanup.status,200);assert.ok((await cleanup.json()).uploads>=1);assert.equal((await request(secondUpload.image,{headers:{Cookie:other}})).status,404);
 const sharing=await request('/api/designs/'+data.id+'/share',{method:'POST',headers:{Cookie:cookie}});const share=await sharing.json();const token=share.path.split('/').pop();assert.equal((await request('/api/shared/'+token)).status,200);
 assert.equal((await request('/api/designs/'+data.id,{method:'DELETE',headers:{Cookie:other}})).status,404);
 assert.equal((await request('/api/designs/'+data.id,{method:'DELETE',headers:{Cookie:cookie}})).status,200);assert.equal((await request(data.result,{headers:{Cookie:cookie}})).status,404);assert.equal((await request('/api/shared/'+token)).status,404);assert.equal((await generate(body,key)).status,410);assert.equal(calls(),6);
 assert.equal((await request('/api/visualizer/uploads/'+u.id,{method:'DELETE',headers:{Cookie:cookie}})).status,200);assert.equal((await request(u.image,{headers:{Cookie:cookie}})).status,404);
 const configurationServer=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p','3221'],{env:{...env,NODE_OPTIONS:'',OPENAI_API_KEY:'',SITE_URL:'http://localhost:3221',DCORHOME_TEST_PROVIDER:''},windowsHide:true,stdio:'ignore'});
 try{for(let i=0;i<120;i++){try{if((await fetch('http://localhost:3221/api/visualizer/generate')).ok)break;}catch{}await delay(100);}
 const disabled=await(await fetch('http://localhost:3221/api/visualizer/generate')).json();assert.equal(disabled.configured,false);assert.match(disabled.reason,/provider configuration/);
 const unavailable=await fetch('http://localhost:3221/api/visualizer/generate',{method:'POST',headers:{Origin:'http://localhost:3221',Cookie:cookie,'Content-Type':'application/json','Idempotency-Key':crypto.randomUUID()},body:JSON.stringify(body)});assert.equal(unavailable.status,503);assert.equal(calls(),6);
 }finally{configurationServer.kill();}
 console.log('PASS: decoded upload validation, EXIF rotation/stripping, private ownership, aligned alpha mask, canonical configuration/prompt, SDK request contract, idempotency, concurrency, guest quota, safe auth/rate/unavailable/empty-output/storage errors, failed-status replay, authenticated expiry cleanup, exact exterior preservation, private status/result, save/reopen/download, canonical enquiry, missing-key API rejection, share revocation and deletion. Mocked calls only: 6.');
 if(process.env.DCORHOME_AI_BROWSER==='true'){const browser=spawn(process.execPath,['scripts/browser-check.cjs'],{env:{...process.env,DCORHOME_TEST_BASE_URL:base,DCORHOME_AI_WINDOW:'true'},windowsHide:true,stdio:'inherit'});assert.equal(await new Promise(resolve=>browser.on('exit',resolve)),0);}
}catch(error){console.error(error);console.error(logs.slice(-3500));process.exitCode=1;}finally{server.kill();}})();
