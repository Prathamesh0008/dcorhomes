// One focused desktop interaction check; no full-site browser suite.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{spawn}=require('node:child_process');
const output=path.resolve('.test-data/architecture-visualizer');fs.mkdirSync(output,{recursive:true});
const profile=fs.mkdtempSync(path.join(output,'profile-')),port=23000+Math.floor(Math.random()*7000);
const browserPath=[process.env.DCORHOME_TEST_BROWSER,'C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe','C:/Program Files/Microsoft/Edge/Application/msedge.exe'].find(file=>file&&fs.existsSync(file));
assert.ok(browserPath,'Install Chrome or Edge, or set DCORHOME_TEST_BROWSER.');
const chrome=spawn(browserPath,['--headless=new','--no-sandbox','--disable-gpu','--disable-extensions','--disable-background-networking','--no-first-run','--remote-debugging-port='+port,'--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));let ws,sequence=0,stage='browser initialization';const pending=new Map(),requests=[],errors=[];
const deadline=setTimeout(()=>{console.error('FAIL: visualizer smoke deadline');chrome.kill();process.exit(1);},180000);
function call(method,params={}){return new Promise((resolve,reject)=>{const id=++sequence;const timer=setTimeout(()=>{pending.delete(id);reject(Error('Browser command timeout: '+method));},20000);pending.set(id,{resolve:value=>{clearTimeout(timer);resolve(value);},reject});ws.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const result=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(result.exceptionDetails)throw Error('Browser evaluation failed');return result.result.value;}
async function until(expression){for(let i=0;i<300;i++){if(await evaluate(expression))return;await delay(100);}throw Error('Interaction did not become ready');}
const ready=()=>until(`document.querySelector('[data-testid="manual-window-preview"]')?.dataset.renderState==='ready'`);
const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
const clickText=(panel,text)=>evaluate(`[...document.querySelectorAll('#studio-${panel}-panel button')].find(button=>button.textContent.startsWith(${JSON.stringify(text)})).click()`);
const pixels=(x,y=.4)=>evaluate(`(()=>{const canvas=document.querySelector('[data-testid="composed-curtains"]');return Array.from(canvas.getContext('2d').getImageData(canvas.width*${x},canvas.height*${y},8,8).data);})()`);
function averageDifference(a,b){
 let sum=0;
 for(let i=0;i<a.length;i+=4)for(let channel=0;channel<3;channel++)sum+=Math.abs(a[i+channel]-b[i+channel]);
 return sum/(a.length*.75);
}
const hash=(testId='composed-curtains')=>evaluate(`(()=>{const c=document.querySelector('[data-testid="${testId}"]'),p=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let hash=2166136261;for(let i=0;i<p.length;i+=4)hash=Math.imul(hash^p[i]^p[i+1]^p[i+2],16777619);return hash>>>0;})()`);
const comparison='[aria-label="Compare your curtains"]';
const slider='[aria-label="Before and after curtain reveal"]';
const sliderVisible=()=>evaluate(`document.querySelector('${slider}')?.checkVisibility() ?? false`);
const reveal=()=>evaluate(`Number(document.querySelector('${slider}').getAttribute('aria-valuenow'))`);
const midReveal=()=>until(`(() => {const value=Number(document.querySelector('${slider}').getAttribute('aria-valuenow'));return value>20&&value<80;})()`);
const compare=label=>evaluate(`[...document.querySelectorAll('${comparison} button')].find(button=>button.textContent==='${label}').click()`);
const finished=()=>until(`document.querySelector('${comparison} button[aria-pressed="true"]')?.textContent==='After'`);
const savedSelection=()=>evaluate(`JSON.parse(localStorage.getItem('dcorhome-visualizer-v1'))`);
const base=process.env.DCORHOME_TEST_BASE_URL||'http://localhost:3351';
(async()=>{
 chrome.on('error',()=>{console.error('FAIL: Chrome unavailable for focused visualizer check.');process.exitCode=1;});
 let target;
 for(let i=0;i<80;i++){try{target=await fetch('http://127.0.0.1:'+port+'/json/new?about:blank',{method:'PUT'}).then(r=>r.json());break;}catch{await delay(200);}}
 assert.ok(target?.webSocketDebuggerUrl,'Chrome debugging unavailable');
 ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
 const paused=[];
 ws.onmessage=event=>{const data=JSON.parse(event.data);if(data.id){const action=pending.get(data.id);if(action){pending.delete(data.id);data.error?action.reject(Error(data.error.message)):action.resolve(data.result);}}else if(data.method==='Network.requestWillBeSent')requests.push(data.params.request.url);else if(data.method==='Runtime.exceptionThrown')errors.push(data.params.exceptionDetails.text);else if(data.method==='Page.javascriptDialogOpening')void call('Page.handleJavaScriptDialog',{accept:true});else if(data.method==='Fetch.requestPaused')paused.push(data.params.requestId);};
 await call('Page.enable');await call('Runtime.enable');await call('Network.enable');
 await call('Network.setBlockedURLs',{urls:['https://fonts.googleapis.com/*','https://fonts.gstatic.com/*']});
 await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1050,deviceScaleFactor:1,mobile:false});
 stage='homepage room cards and exact photographs';
 await call('Page.navigate',{url:base+'/studio'});await ready();await finished();
 const roomIds=Array.from({length:10},(_,i)=>'hero-'+String(i+1).padStart(2,'0'));
 assert.deepEqual(await evaluate('Array.from(document.querySelectorAll("[data-scene-id]"), button => button.dataset.sceneId)'),roomIds);
 const fixtures=[
  [[108,75],[447,130],[270,130],[74,130]],
  [[120,90],[290,115],[200,120],[350,178]],
  [[85,110],[218,110],[145,130],[303,170]],
  [[200,80],[510,150],[363,115],[130,190]],
  [[330,112],[557,140],[380,159],[460,165]],
  [[273,115],[527,140],[350,100],[429,182]],
  [[186,111],[421,128],[325,125],[108,25]],
  [[38,150],[167,145],[100,140],[374,277]],
  [[140,90],[302,110],[240,80],[161,138]],
  [[122,110],[354,119],[250,205],[404,150]],
 ];
 const imageDiff=(id,points)=>evaluate('(async()=>{'+
  'const shown=document.querySelector("[data-testid=composed-curtains]");'+
  'const ref=new Image();ref.src='+JSON.stringify('/images/hero/'+id+'-before.webp')+';await ref.decode();'+
  'const canvas=document.createElement("canvas");canvas.width=shown.width;canvas.height=shown.height;'+
  'const reference=canvas.getContext("2d",{willReadFrequently:true});reference.drawImage(ref,0,0);'+
  'const output=shown.getContext("2d");'+
  'const read=(ctx,x,y)=>Array.from(ctx.getImageData(x,y,3,3).data);'+
  'const samples='+JSON.stringify(points)+'.map(([x,y])=>{const X=Math.round(x*shown.width/600),Y=Math.round(y*shown.height/450);const a=read(reference,X,Y),b=read(output,X,Y);return a.reduce((sum,v,i)=>sum+Math.abs(v-b[i]),0)/a.length;});'+
  'return {samples,resolution:[shown.width,shown.height],before:document.querySelector("[data-testid=manual-window-preview] img").getAttribute("src")};})()');
 for(const [i,id] of roomIds.entries()){
  await click('[data-scene-id="'+id+'"]');await ready();
  assert.equal(await sliderVisible(),false,id+' hides the slider before a customization');
  const info=await imageDiff(id,fixtures[i]);
  assert.deepEqual(info.resolution,[1448,1086]);
  assert.equal(info.before,'/images/hero/'+id+'-before.webp');
  assert.ok(info.samples.every(n=>n<=1),id+' starts on the original room without curtains');
 }
 await click('[data-scene-id="hero-01"]');await ready();
 const measureVoile=()=>evaluate(`(async()=>{
  const shown=document.querySelector('[data-testid=composed-curtains]');
  const source=new Image();source.src='/images/hero/hero-01-before.webp';await source.decode();
  const reference=document.createElement('canvas');
  reference.width=shown.width;reference.height=shown.height;
  reference.getContext('2d').drawImage(source,0,0);
  function sample(canvas,x,y,w,h,channel){
   const scaleX=canvas.width/600,scaleY=canvas.height/450;
   const pixels=canvas.getContext('2d').getImageData(Math.round(x*scaleX),Math.round(y*scaleY),Math.round(w*scaleX),Math.round(h*scaleY)).data;
   let total=0;
   for(let i=0;i<pixels.length;i+=4)total+=channel(pixels[i],pixels[i+1],pixels[i+2]);
   return total/(pixels.length/4);
  }
  const brightness=(canvas,x,y,w,h)=>sample(canvas,x,y,w,h,(r,g,b)=>.2126*r+.7152*g+.0722*b);
  const beforeSky=brightness(reference,267,96,7,6),beforeTrees=brightness(reference,267,204,7,6);
  const afterSky=brightness(shown,267,96,7,6),afterTrees=brightness(shown,267,204,7,6);
  const folds=Array.from({length:110},(_,i)=>brightness(shown,258+i,94,1,12)-brightness(reference,258+i,94,1,12));
  return {
   lift:afterTrees-beforeTrees,
   outdoorContrast:(afterSky-afterTrees)/(beforeSky-beforeTrees),
   foldContrast:Math.max(...folds)-Math.min(...folds),
   warmth:sample(shown,267,204,7,6,(r,g,b)=>r-b),
  };
 })()`);
 stage='mask alignment for all ten rooms';
 await click('[data-studio-step="main"]');
 assert.deepEqual((await savedSelection()).main,{enabled:true,materialId:null,fabricId:null,variantId:null});
 const original=await hash();
 await click('[data-material-id="library-main-silk"]');
 assert.equal(await hash(),original,'Fabric selection alone keeps the original room');
 assert.equal(await sliderVisible(),false,'Fabric selection alone keeps the slider hidden');
 assert.equal((await savedSelection()).main.variantId,null);
 assert.equal(await evaluate('document.querySelectorAll(\'[aria-label^="main colour: "][aria-pressed="true"]\').length'),0);
 await click('[aria-label="main colour: Burgundy"]');await ready();
 const fadeDuration=()=>evaluate('document.querySelector("[data-testid=composed-curtains]").getAnimations()[0]?.effect.getTiming().duration');
 assert.equal(await fadeDuration(),600);
 await midReveal();await finished();
 assert.equal(await reveal(),100,'First customisation automatically ends at the right edge');
 const voile=await measureVoile();
 assert.ok(voile.lift>60,'Golden voile diffuses visible daylight over the tree line: '+voile.lift);
 assert.ok(voile.outdoorContrast>.23&&voile.outdoorContrast<.55,'The outdoor view remains readable through the fabric: '+voile.outdoorContrast);
 assert.ok(voile.foldContrast>12,'Adjacent folds remain distinct across the glass: '+voile.foldContrast);
 assert.ok(voile.warmth>22,'The visible voile has a warm golden-beige tint: '+voile.warmth);
 const silk=await hash();
 await click('[data-studio-step="room"]');
 for(const [i,id] of roomIds.entries()){
  await click('[data-scene-id="'+id+'"]');await ready();
  assert.equal(await sliderVisible(),true,id+' shows the slider when the customization is ready');
  const {samples}=await imageDiff(id,fixtures[i]);
  assert.ok(samples[0]>8&&samples[1]>8,id+' both opaque panels change: '+samples.join(', '));
  assert.ok(samples[2]>2&&samples[3]<=1,id+' shows golden voile with unchanged foreground: '+samples.join(', '));
 }
 await click('[data-scene-id="hero-01"]');await ready();
 await click('[data-studio-step="main"]');
 await click('[data-material-id="library-main-velvet"]');await ready();await finished();
 const velvet=await hash(),oldMain=await pixels(.18,.15);
 assert.equal((await savedSelection()).main.variantId,'burgundy');
 assert.notEqual(velvet,silk,'Switching fabric updates texture with the same colour');
 assert.equal(await sliderVisible(),true,'The slider works after switching fabrics');
 await click('[data-layer-toggle="main-off"]');await ready();
 assert.equal(await hash(),original,'No main curtains removes both layers');
 assert.equal(await sliderVisible(),false,'Removing main curtains hides the slider');
 assert.equal(await evaluate(`document.querySelectorAll('${comparison} button:not(:disabled)').length`),3);
 await click('[data-layer-toggle="main-on"]');await ready();
 assert.equal(await hash(),velvet,'Yes restores the explicitly selected fabric and colour');
 assert.equal(await sliderVisible(),true,'Re-enabling main curtains restores the slider');
 const initialSheer=await pixels(.45,.29);
 stage='slow texture and rapid selection';
 const scroll=await evaluate('window.scrollY');
 await call('Fetch.enable',{patterns:[{urlPattern:'*/main-curtains/velvet/taupe.webp'}]});
 await clickText('main','View all colours');await click('[aria-label="main colour: Taupe"]');
 for(let i=0;i<80&&!paused.length;i++)await delay(50);
 assert.ok(paused.length,'The fixture must delay the requested texture');
 assert.equal((await savedSelection()).main.variantId,'taupe');
 assert.equal(await sliderVisible(),false,'The slider waits for the newly selected shade to render');
 assert.equal(await hash(),velvet,'Keep the original completed frame while loading');
 assert.equal(await evaluate('getComputedStyle(document.querySelector("[data-testid=composed-curtains]")).visibility'),'visible');
 assert.equal(await evaluate('window.scrollY'),scroll);
 await click('[aria-label="main colour: Navy Blue"]');await ready();
 assert.equal(await sliderVisible(),true,'The slider works after changing shades');
 const navy=await pixels(.18,.15),mainContrast=averageDifference(oldMain,navy);
 assert.ok(mainContrast>10);
 assert.deepEqual(await pixels(.45,.29),initialSheer);
 assert.equal(await fadeDuration(),600);
 assert.equal(await hash('previous-curtain-composition'),velvet);
 assert.equal(await evaluate('document.querySelector("[data-testid=previous-curtain-composition]").hidden'),true,'The reveal starts over the original room');
 await midReveal();
 await Promise.all(paused.map(requestId=>call('Fetch.continueRequest',{requestId})));await call('Fetch.disable');
 await finished();
 assert.equal(await reveal(),100,'Changing colour automatically ends at the right edge');
 assert.deepEqual(await pixels(.18,.15),navy,'Late texture must not overwrite the chosen shade');
 const completed=await hash();
 await click('[data-studio-step="sheer"]');
 await click('[aria-label="sheer colour: Pale Blue"]');await ready();
 assert.equal(await hash(),completed,'Sheer preferences are saved independently of the original photograph');
 assert.equal((await savedSelection()).sheer.variantId,'pale-blue');
 await click('[data-studio-step="main"]');
 stage='comparison controls';
 const clip=`getComputedStyle(document.querySelector('[data-testid="composed-curtains"]')).clipPath`;
 await compare('Before');
 assert.equal(await reveal(),0);
 assert.equal(await evaluate(clip),'inset(0px 100% 0px 0px)');
 assert.equal(await evaluate('document.querySelector("[data-testid=previous-curtain-composition]").hidden'),true,'Before also hides the previous layered frame');
 await evaluate(`document.querySelector('${slider}').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',shiftKey:true,bubbles:true}))`);
 assert.equal(await reveal(),10);
 assert.equal(await evaluate(clip),'inset(0px 90% 0px 0px)');
 await compare('After');assert.equal(await reveal(),100);
 stage='left-to-right replay duration';
 const playback=await evaluate(`new Promise(resolve=>{
  const handle=document.querySelector('${slider}');
  const host=handle.parentElement.parentElement;
  [...document.querySelectorAll('${comparison} button')].find(button=>button.textContent==='Replay').click();
  const started=performance.now();
  const position=()=>parseFloat(host.style.getPropertyValue('--reveal'));
  const positions=[position()];
  function sample(now){
   positions.push(position());
   if(positions[positions.length-1]===100)resolve({positions,elapsed:now-started});
   else requestAnimationFrame(sample);
  }
  requestAnimationFrame(sample);
 })`);
 assert.equal(playback.positions[0],0,'Replay starts at the left edge');
 assert.ok(playback.positions.some(position=>position>20&&position<80),'Replay passes through intermediate positions');
 assert.ok(playback.positions.every((position,i)=>i===0||position>=playback.positions[i-1]),'Replay moves only left to right');
 assert.equal(await reveal(),100,'Replay ends at the right edge');
 assert.ok(playback.elapsed>=1490&&playback.elapsed<1750,'Replay lasts 1500ms within frame timing tolerance: '+playback.elapsed);
 stage='desktop and mobile dragging';
 const drag=await evaluate(`(()=>{const handle=document.querySelector('${slider}');handle.scrollIntoView({block:'center'});const {x,y,width,height}=handle.parentElement.getBoundingClientRect();return {x,y:y+height/2,width};})()`);
 await call('Input.dispatchMouseEvent',{type:'mousePressed',x:drag.x+drag.width*.35,y:drag.y,button:'left',clickCount:1,buttons:1});
 await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:drag.x+drag.width*.6,y:drag.y,button:'left',buttons:1});
 assert.ok(Math.abs(await reveal()-60)<2,'Mouse drag moves the slider right after Replay');
 await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:drag.x+drag.width*.25,y:drag.y,button:'left',buttons:1});
 await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:drag.x+drag.width*.25,y:drag.y,button:'left',clickCount:1});
 assert.ok(Math.abs(await reveal()-25)<2,'Mouse drag also moves the slider left');
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:2,mobile:true});
 await call('Emulation.setTouchEmulationEnabled',{enabled:true});
 await ready();
 await click('[aria-label="main colour: Champagne"]');await ready();await midReveal();await finished();
 assert.equal(await reveal(),100,'Mobile colour changes autoplay to the right edge');
 const mobileMain=await pixels(.18,.15);
 const touch=await evaluate(`(()=>{const handle=document.querySelector('${slider}');handle.scrollIntoView({block:'center'});const {x,y,width,height}=handle.parentElement.getBoundingClientRect();return {x,y:y+height/2,width};})()`);
 await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:touch.x+touch.width*.6,y:touch.y}]});
 await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:touch.x+touch.width*.3,y:touch.y}]});
 await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 assert.ok(Math.abs(await reveal()-30)<2,'Touch drag changes the reveal');
 assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
 await call('Emulation.setTouchEmulationEnabled',{enabled:false});
 await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1050,deviceScaleFactor:1,mobile:false});
 await until(`document.querySelector('[data-testid=composed-curtains]').width>=800`);await ready();
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
 await compare('Before');await compare('Replay');assert.equal(await reveal(),100);
 assert.deepEqual(await pixels(.18,.15),mobileMain);assert.deepEqual(await pixels(.45,.29),initialSheer);
 await click('[aria-label="main colour: Burgundy"]');await ready();
 assert.equal(await reveal(),100);
 stage='download';const downloadPath=path.join(profile,'downloads');fs.mkdirSync(downloadPath);
 const downloadButton=`[...document.querySelectorAll('button')].find(b=>b.textContent==='Download Design')`;
 const reviewStatus=`document.querySelector('[aria-label="Review your design"] [role="status"]').textContent`;
 await compare('Before');
 await call('Browser.setDownloadBehavior',{behavior:'allow',downloadPath});await until(`!(${downloadButton}).disabled`);await evaluate(`(${downloadButton}).click()`);
 await until(`Boolean(${reviewStatus})`);assert.equal(await evaluate(reviewStatus),'Your curtain design has been downloaded.');
 const download=path.join(downloadPath,'dcorhome-curtains-hero-01.png');for(let i=0;i<100&&!fs.existsSync(download);i++)await delay(100);assert.ok(fs.existsSync(download));
 const sharp=require('sharp'),info=await sharp(download).metadata();assert.equal(info.format,'png');assert.deepEqual([info.width,info.height],[1448,1086]);
 const panel={left:260,top:150,width:8,height:8};
 assert.notDeepEqual(await sharp(download).extract(panel).raw().toBuffer(),await sharp('public/images/hero/hero-01-before.webp').extract(panel).ensureAlpha().raw().toBuffer());
 stage='browser save';await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Save Design').click()`);await until(`document.body.textContent.includes('Your design is saved on this device.')`);
 const saved=await evaluate(`JSON.parse(localStorage.getItem('dcorhome-saved-manual-designs-v1'))`);assert.equal(saved.length,1);assert.equal(saved[0].visualizer.main.variantId,'burgundy');assert.ok(!saved[0].original&&!saved[0].result);
 stage='enquiry configuration';
 const enquiry=await evaluate(`(()=>{const link=[...document.querySelectorAll('a')].find(link=>link.textContent==='Enquire About This Design');document.addEventListener('click',event=>event.preventDefault(),{once:true});link.click();const ref=new URL(link.href).searchParams.get('designRef');return {ref,design:JSON.parse(localStorage.getItem('dcorhome-enquiry-design:'+ref))};})()`);
 assert.ok(enquiry.ref,'The enquiry link must contain a saved design reference.');assert.deepEqual(enquiry.design,saved[0].visualizer);
 stage='saved-design listing';await call('Page.navigate',{url:base+'/designs'});await until(`document.querySelector('a[href*="local=${saved[0].id}"]')!==null`);
 stage='restore';await call('Page.navigate',{url:base+'/studio?local='+saved[0].id});await ready();assert.equal(await evaluate(`JSON.parse(localStorage.getItem('dcorhome-visualizer-v1')).main.variantId`),'burgundy');
 stage='fresh visit after restore';
 await call('Page.navigate',{url:base+'/studio'});await ready();
 assert.equal((await savedSelection()).main.materialId,null,'A new Studio visit clears the previous main selection');
 assert.equal((await savedSelection()).sheer.variantId,'pale-blue','A new Studio visit retains the existing sheer preference');
 assert.equal(await hash(),original);
 stage='delete';await call('Page.navigate',{url:base+'/designs'});await until(`document.querySelector('section[aria-label="Saved manual curtain designs"] button')!==null`);await evaluate(`[...document.querySelectorAll('section[aria-label="Saved manual curtain designs"] button')].find(b=>b.textContent==='Delete').click()`);await until(`JSON.parse(localStorage.getItem('dcorhome-saved-manual-designs-v1')).length===0`);
 assert.deepEqual(requests.filter(url=>/\/api\/(?:auth\/(?!get-session(?:\?|$))|manual-designs|designs|session|visualiz|fabrics\/saved)/.test(url)||/api\.openai\.com/.test(url)),[],'Manual journey must not call auth/cloud storage/AI');
 assert.deepEqual(errors,[]);
 console.log('PASS: original and layered previews across ten rooms, conditional golden voile, stable sheer and foreground pixels, native-resolution download, slider and Replay, and local save/restore/enquiry.');
})().catch(error=>{console.error('FAIL: visualizer '+stage+': '+error.message);process.exitCode=1;}).finally(async()=>{clearTimeout(deadline);if(ws)ws.close();chrome.kill();});
