// Real synthetic administrator login plus controlled enquiry responses for UI failure/retry checks.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process');
require('./auth-loader.cjs');
const base=process.env.DCORHOME_TEST_BASE_URL;
assert.ok(base&&/^http:\/\/localhost:\d+$/.test(base),'A local isolated fixture server is required.');
assert.ok(process.env.DCORHOME_FIXTURE_USER&&process.env.DCORHOME_FIXTURE_PASSWORD,'Synthetic administrator fixture required.');
const output=path.resolve('.test-data/navigation-enquiry');fs.mkdirSync(output,{recursive:true});
const profile=fs.mkdtempSync(path.join(output,'profile-')),port=23000+Math.floor(Math.random()*7000);
const executable=[process.env.DCORHOME_TEST_BROWSER,'C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(file=>file&&fs.existsSync(file));
assert.ok(executable,'Chrome or Edge is required.');
const browser=spawn(executable,['--headless=new','--disable-gpu','--disable-extensions','--disable-background-networking','--no-first-run','--remote-debugging-port='+port,'--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));let ws,sequence=0,stage='startup',responseMode='failure';const pending=new Map(),requests=[],errors=[];
const deadline=setTimeout(()=>{console.error('FAIL: browser test deadline');browser.kill();process.exit(1);},180000);
function call(method,params={}){return new Promise((resolve,reject)=>{const id=++sequence,timer=setTimeout(()=>{pending.delete(id);reject(Error('Browser command timeout'));},15000);pending.set(id,{resolve:value=>{clearTimeout(timer);resolve(value);},reject});ws.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const result=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw Error('Browser evaluation failed');return result.result.value;}
async function until(expression){for(let i=0;i<200;i++){if(await evaluate(expression))return;await delay(100);}throw Error('Expected UI state timed out');}
async function go(route,width=1440){await call('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:width<640});await call('Page.navigate',{url:base+route});await until(`document.readyState==='complete'&&!!document.querySelector('header')`);await delay(200);}
async function click(selector){await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);}
async function fill(selector,value){await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event('input',{bubbles:true}));})()`);}
(async()=>{
 browser.on('error',()=>{throw Error('Headless browser could not start');});
 let target;for(let i=0;i<80;i++){try{target=await fetch('http://127.0.0.1:'+port+'/json/new?about:blank',{method:'PUT'}).then(r=>r.json());break;}catch{await delay(150);}}
 assert.ok(target?.webSocketDebuggerUrl);ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
 ws.onmessage=event=>{const data=JSON.parse(event.data);if(data.id){const action=pending.get(data.id);if(action){pending.delete(data.id);data.error?action.reject(Error('Browser protocol error')):action.resolve(data.result);}}else if(data.method==='Runtime.exceptionThrown')errors.push(data.params.exceptionDetails.text);else if(data.method==='Fetch.requestPaused'){
  const request=data.params;requests.push({body:request.request.postData,key:request.request.headers['Idempotency-Key']||request.request.headers['idempotency-key']});
  const mode=responseMode;setTimeout(()=>{void call('Fetch.fulfillRequest',{requestId:request.requestId,responseCode:mode==='failure'?503:200,responseHeaders:[{name:'Content-Type',value:'application/json'}],body:Buffer.from(JSON.stringify(mode==='failure'?{error:'Fixture database rejected storage'}:mode==='unconfirmed'?{accepted:true}:{accepted:true,stored:true,reference:'DCOR-FIXTURE-RECEIPT',notified:false})).toString('base64')});},250);
 }};
 await call('Page.enable');await call('Runtime.enable');await call('Network.enable');
 await call('Network.setBlockedURLs',{urls:['https://fonts.googleapis.com/*','https://fonts.gstatic.com/*']});
 stage='anonymous saved receipt';await go('/contact',390);
 await fill('input[placeholder="Your full name"]','Browser Enquiry Fixture');await fill('input[type="email"]','browser-enquiry@example.invalid');await fill('textarea[placeholder]','Preserve these curtain requirements');await click('input[type="checkbox"]');
 await evaluate("document.querySelector('form').requestSubmit();document.querySelector('form').requestSubmit()");
 await until("!!document.querySelector('[data-status=success]')");
 const receipt=await evaluate("document.querySelector('[data-status=success]').textContent");assert.ok(receipt.includes('has been saved'));assert.ok(receipt.includes('email notification is delayed'));
 const reference=receipt.match(/DCOR-\d{8}-[A-F0-9]{24}/)?.[0];assert.ok(reference);assert.equal(await evaluate("document.querySelector('input[placeholder=\"Your full name\"]').value"),'');
 stage='administrator login';await go('/admin/login');await fill('input[name="userId"]',process.env.DCORHOME_FIXTURE_USER);await fill('input[name="password"]',process.env.DCORHOME_FIXTURE_PASSWORD);await click('form button[type="submit"],form button:not([type])');await until("location.pathname==='/admin'");
 stage='dashboard search and details';await go('/admin/enquiries');await until("!!document.querySelector('input[name=search]')");await fill('input[name="search"]',reference);await evaluate("document.querySelector('form').requestSubmit()");
 await until("document.querySelector('[aria-label=\"Enquiry list\"]').textContent.includes("+JSON.stringify(reference)+")");
 await evaluate("[...document.querySelectorAll('[aria-label=\"Enquiry list\"] button')].find(button=>button.textContent.includes("+JSON.stringify(reference)+")).click()");
 await until("!!document.querySelector('[aria-label=\"Enquiry details\"]')");assert.ok((await evaluate("document.querySelector('[aria-label=\"Enquiry details\"]').textContent")).includes('Preserve these curtain requirements'));
 for(const status of ['accepted','contacted','completed','rejected','pending']){
  stage='status '+status;await evaluate("(()=>{const el=document.querySelector('[aria-label=\"Enquiry details\"] form select');el.value="+JSON.stringify(status)+";el.dispatchEvent(new Event('change',{bubbles:true}));})()");
  const note='Browser audit '+status;await fill('[aria-label="Enquiry details"] textarea',note);await evaluate("document.querySelector('[aria-label=\"Enquiry details\"] form').requestSubmit()");
  await until("document.querySelector('[aria-label=\"Enquiry activity\"]').textContent.includes("+JSON.stringify(note)+")");
 }
 stage='email retry history';const before=await evaluate("document.querySelectorAll('[aria-label=\"Enquiry activity\"] li').length");await evaluate("[...document.querySelectorAll('button')].find(button=>button.textContent==='Retry email notification').click()");await until("document.querySelectorAll('[aria-label=\"Enquiry activity\"] li').length>"+before);
 stage='filter and mobile layout';await evaluate("(()=>{const el=document.querySelector('select[name=status]');el.value='completed';el.dispatchEvent(new Event('change',{bubbles:true}));document.querySelector('form').requestSubmit();})()");await until("document.querySelector('[aria-label=\"Enquiry list\"]').textContent.includes('No enquiries match')");
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:900,deviceScaleFactor:1,mobile:true});assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);
 assert.deepEqual(errors,[]);console.log('PASS: anonymous form saves despite email failure and shows a reference; real admin login, persisted search/detail, all five statuses, private notes/audit, email retry history, filters and mobile layout.');
})().catch(error=>{console.error('FAIL: '+stage+': '+error.message);process.exitCode=1;}).finally(()=>{clearTimeout(deadline);if(ws)ws.close();browser.kill();});
