// One focused desktop interaction check; no full-site browser suite.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const output=path.resolve('.test-data/architecture-visualizer');fs.mkdirSync(output,{recursive:true});
const profile=fs.mkdtempSync(path.join(output,'profile-')),port=23000+Math.floor(Math.random()*7000);
const chrome=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--no-sandbox','--disable-gpu','--disable-extensions','--disable-background-networking','--no-first-run','--remote-debugging-port='+port,'--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));let ws,sequence=0,stage='browser initialization';const pending=new Map(),requests=[],errors=[];
const deadline=setTimeout(()=>{console.error('FAIL: visualizer smoke deadline');chrome.kill();process.exit(1);},180000);
function call(method,params={}){return new Promise((resolve,reject)=>{const id=++sequence;const timer=setTimeout(()=>{pending.delete(id);reject(Error('Browser command timeout: '+method));},20000);pending.set(id,{resolve:value=>{clearTimeout(timer);resolve(value);},reject});ws.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const result=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw Error('Browser evaluation failed');return result.result.value;}
async function until(expression){for(let i=0;i<300;i++){if(await evaluate(expression))return;await delay(100);}throw Error('Interaction did not become ready');}
const ready=()=>until(`document.querySelector('[data-testid="manual-window-preview"]')?.dataset.renderState==='ready'`);
const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
const hash=()=>evaluate(`(()=>{const c=document.querySelector('[data-testid="composed-curtains"]'),p=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let hash=2166136261;for(let i=0;i<p.length;i+=4)hash=Math.imul(hash^p[i]^p[i+1]^p[i+2],16777619);return hash>>>0;})()`);
const base=process.env.DCORHOME_TEST_BASE_URL||'http://localhost:3351';
(async()=>{
 chrome.on('error',()=>{console.error('FAIL: Chrome unavailable for focused visualizer check.');process.exitCode=1;});
 let target;
 for(let i=0;i<80;i++){try{target=await fetch('http://127.0.0.1:'+port+'/json/new?about:blank',{method:'PUT'}).then(r=>r.json());break;}catch{await delay(200);}}
 assert.ok(target?.webSocketDebuggerUrl,'Chrome debugging unavailable');
 ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
 ws.onmessage=event=>{const data=JSON.parse(event.data);if(data.id){const action=pending.get(data.id);if(action){pending.delete(data.id);data.error?action.reject(Error(data.error.message)):action.resolve(data.result);}}else if(data.method==='Network.requestWillBeSent')requests.push(data.params.request.url);else if(data.method==='Runtime.exceptionThrown')errors.push(data.params.exceptionDetails.text);else if(data.method==='Page.javascriptDialogOpening')void call('Page.handleJavaScriptDialog',{accept:true});};
 await call('Page.enable');await call('Runtime.enable');await call('Network.enable');
 await call('Network.setBlockedURLs',{urls:['https://fonts.googleapis.com/*','https://fonts.gstatic.com/*']});
 await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1050,deviceScaleFactor:1,mobile:false});
 stage='initial render';await call('Page.navigate',{url:base+'/studio'});await ready();const original=await hash();
 assert.equal(await evaluate(`document.querySelectorAll('[data-room-id]').length>0||document.querySelectorAll('#studio-room-panel button').length>0`),true);
 stage='shade change';await evaluate(`document.querySelector('[data-studio-step="main"]').click()`);await evaluate(`(()=>{if(!document.querySelector('[aria-label="main colour: Burgundy"]'))[...document.querySelectorAll('#studio-main-panel button')].find(b=>b.textContent.startsWith('View all colours')).click();})()`);await click('[aria-label="main colour: Burgundy"]');await ready();assert.notEqual(await hash(),original);
 stage='room gate';await evaluate(`document.querySelector('[data-studio-step="room"]').click()`);await click('[data-scene-id="room-01"]');await until(`document.querySelector('[data-testid="manual-window-preview"]').dataset.renderState==='room-only'`);assert.equal(await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Download Design').disabled`),true);await click('[data-scene-id="garden-living"]');await ready();
 stage='comparison';await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Before').click()`);assert.equal(await evaluate(`document.querySelector('[data-testid="composed-curtains"]').style.opacity`),'0');await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='After').click()`);assert.equal(await evaluate(`document.querySelector('[data-testid="composed-curtains"]').style.opacity`),'1');
 stage='download';await call('Browser.setDownloadBehavior',{behavior:'allow',downloadPath:output});await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Download Design').click()`);await until(`document.body.textContent.includes('Your curtain design has been downloaded.')`);
 const download=path.join(output,'dcorhome-curtains-garden-living.png');for(let i=0;i<100&&!fs.existsSync(download);i++)await delay(100);assert.ok(fs.existsSync(download));const info=await require('sharp')(download).metadata();assert.equal(info.format,'png');assert.equal(info.width,1600);
 stage='browser save';await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Save Design').click()`);await until(`document.body.textContent.includes('Your design is saved on this device.')`);
 const saved=await evaluate(`JSON.parse(localStorage.getItem('dcorhome-saved-manual-designs-v1'))`);assert.equal(saved.length,1);assert.equal(saved[0].visualizer.main.variantId,'burgundy');assert.ok(!saved[0].original&&!saved[0].result);
 stage='restore';await call('Page.navigate',{url:base+'/designs'});await until(`document.querySelector('a[href*="local=${saved[0].id}"]')!==null`);await call('Page.navigate',{url:base+'/studio?local='+saved[0].id});await ready();assert.equal(await evaluate(`JSON.parse(localStorage.getItem('dcorhome-visualizer-v1')).main.variantId`),'burgundy');
 stage='delete';await call('Page.navigate',{url:base+'/designs'});await until(`document.querySelector('section[aria-label="Saved manual curtain designs"] button')!==null`);await evaluate(`[...document.querySelectorAll('section[aria-label="Saved manual curtain designs"] button')].find(b=>b.textContent==='Delete').click()`);await until(`JSON.parse(localStorage.getItem('dcorhome-saved-manual-designs-v1')).length===0`);
 assert.deepEqual(requests.filter(url=>/\/api\/(?:auth|manual-designs|designs|session|visualiz|fabrics\/saved)/.test(url)||/api\.openai\.com/.test(url)),[],'Manual journey must not call auth/cloud storage/AI');
 assert.deepEqual(errors,[]);
 console.log('PASS: Offline studio canvas, shade update, before/after, actual PNG download, localStorage save, restore and delete; no auth/storage/AI requests.');
})().catch(error=>{console.error('FAIL: visualizer '+stage+': '+error.message);process.exitCode=1;}).finally(async()=>{clearTimeout(deadline);if(ws)ws.close();chrome.kill();});
