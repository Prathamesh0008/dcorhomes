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
 stage='anonymous navigation';
 for(const width of [360,390,768,1024,1440,1920]){
  await go('/about',width);assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false,'Horizontal overflow at '+width);
  assert.equal(await evaluate(`!!document.querySelector('header a[href="/signup"]')`),false);
  if(width<640){await click('button[aria-label="Open navigation"]');await until(`!!document.querySelector('dialog[open] a[href="/admin/login"]')`);assert.equal(await evaluate(`document.querySelector('dialog[open] a[href="/admin/login"]').textContent`),'Login');await click('button[aria-label="Close navigation"]');}
  else {assert.equal(await evaluate(`(()=>{const a=[...document.querySelectorAll('header a[href="/admin/login"]')].find(el=>el.getBoundingClientRect().width>0),b=[...document.querySelectorAll('header a[href="/studio"]')].find(el=>el.textContent.includes('Design Your Space')&&el.getBoundingClientRect().width>0);return !!a&&!!a.querySelector('svg')&&a.getBoundingClientRect().right<=b.getBoundingClientRect().left;})()`),true,'Login order/visibility at '+width);}
 }
 stage='real administrator login';await go('/admin/login');
 await fill('input[name="userId"]',process.env.DCORHOME_FIXTURE_USER);await fill('input[name="password"]',process.env.DCORHOME_FIXTURE_PASSWORD);await click('form button[type="submit"],form button:not([type])');
 await until(`location.pathname==='/admin'&&[...document.querySelectorAll('header a[href="/admin"]')].some(el=>el.textContent==='My Account')`);
 await go('/about',390);await click('button[aria-label="Open navigation"]');await until(`document.querySelector('dialog[open] a[href="/admin"]')?.textContent==='My Account'`);await click('button[aria-label="Close navigation"]');
 stage='contact failure, retry and success';await call('Fetch.enable',{patterns:[{urlPattern:base+'/api/enquiries',requestStage:'Request'}]});await go('/contact');
 await fill('input[placeholder="Your full name"]','Browser Fixture');await fill('input[type="email"]','browser@example.invalid');await fill('textarea[placeholder]','Preserve these requirements');await click('input[type="checkbox"]');
 const submit=`document.querySelector('form').requestSubmit();document.querySelector('form').requestSubmit()`;
 await evaluate(submit);await until(`document.querySelector('[data-status="error"]')!==null`);assert.equal(requests.length,1);
 assert.equal(await evaluate(`document.querySelector('input[placeholder="Your full name"]').value`),'Browser Fixture');assert.equal(await evaluate(`document.querySelector('textarea[placeholder]').value`),'Preserve these requirements');assert.equal(await evaluate(`document.querySelector('input[type="checkbox"]').checked`),true);
 await evaluate(submit);await until(`!document.querySelector('form fieldset').disabled&&document.querySelector('[data-status="error"]')!==null`);assert.equal(requests.length,2);assert.equal(requests[0].key,requests[1].key);
 await fill('textarea[placeholder]','Edited requirements');await evaluate(submit);await until(`!document.querySelector('form fieldset').disabled&&document.querySelector('[data-status="error"]')!==null`);assert.equal(requests.length,3);assert.notEqual(requests[1].key,requests[2].key);
 responseMode='unconfirmed';await evaluate(submit);await until(`!document.querySelector('form fieldset').disabled&&document.querySelector('[data-status="error"]')!==null`);assert.equal(await evaluate(`document.querySelector('textarea[placeholder]').value`),'Edited requirements');
 responseMode='accepted';await evaluate(submit);await until(`document.querySelector('[data-status="success"]')!==null`);assert.equal(await evaluate(`document.querySelector('input[placeholder="Your full name"]').value`),'');assert.equal(requests[3].key,requests[4].key);
 stage='design enquiry failure';responseMode='failure';
 const records=require('../data/catalogue/fabrics.json'),design=require('../lib/manual-visualizer/model.ts').defaultDesign;
 const details=require('../lib/manual-visualizer/enquiry.ts').designEnquiryDetails(design,records);const query='?visualizer='+encodeURIComponent(JSON.stringify(design));
 await go('/contact'+query,390);await until(`!!document.querySelector('section[aria-label="Your Selected Design"]')`);
 await fill('input[placeholder="Your full name"]','Design Fixture');await fill('input[type="email"]','design@example.invalid');await fill('textarea[placeholder]','Keep this design');await click('input[type="checkbox"]');await evaluate(submit);await until(`document.querySelector('[data-status="error"]')!==null`);
 assert.equal(await evaluate(`!!document.querySelector('section[aria-label="Your Selected Design"]')`),true);assert.equal(JSON.parse(requests.at(-1).body).visualizer.main.fabricId,design.main.fabricId);
 for(const row of details.rows)assert.ok((await evaluate(`document.querySelector('section[aria-label="Your Selected Design"]').textContent`)).includes(row.value));
 stage='fabric quotation failure and retry';await go('/collections/'+records[0].slug);
 await evaluate(`[...document.querySelectorAll('button')].find(button=>button.textContent==='Request a Quote').click()`);await until(`!!document.querySelector('dialog[open] form')`);
 await fill('dialog[open] input[name="name"]','Quote Fixture');await fill('dialog[open] input[name="email"]','quote@example.invalid');await click('dialog[open] input[name="consent"]');
 const quoteSubmit=`document.querySelector('dialog[open] form').requestSubmit();document.querySelector('dialog[open] form').requestSubmit()`,before=requests.length;
 await evaluate(quoteSubmit);await until(`!!document.querySelector('dialog[open] [role="alert"]')`);assert.equal(requests.length,before+1);assert.equal(JSON.parse(requests.at(-1).body).name,'Quote Fixture');
 const quoteKey=requests.at(-1).key;await evaluate(quoteSubmit);await until(`!document.querySelector('dialog[open] fieldset').disabled&&!!document.querySelector('dialog[open] [role="alert"]')`);assert.equal(requests.at(-1).key,quoteKey);
 await fill('dialog[open] textarea[name="message"]','Updated quotation details');await evaluate(quoteSubmit);await until(`!document.querySelector('dialog[open] fieldset').disabled&&!!document.querySelector('dialog[open] [role="alert"]')`);assert.notEqual(requests.at(-1).key,quoteKey);
 assert.equal(await evaluate(`document.querySelector('dialog[open] input[name="email"]').value`),'quote@example.invalid');
 responseMode='accepted';await evaluate(quoteSubmit);await until(`!!document.querySelector('dialog[open] [role="status"]')&&!document.querySelector('dialog[open] form')`);
 assert.deepEqual(errors,[]);console.log('PASS: responsive Login icon/order and mobile drawer, real admin login -> My Account, contact/design/quotation duplicate-click locks and retry/edit IDs, failure retains fields/design/consent, unconfirmed responses fail, and accepted responses complete the forms.');
})().catch(error=>{console.error('FAIL: '+stage+': '+error.message);process.exitCode=1;}).finally(()=>{clearTimeout(deadline);if(ws)ws.close();browser.kill();});
