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
const pixels=(x,y=.4,width=8,height=width)=>evaluate(`(()=>{const canvas=document.querySelector('[data-testid="composed-curtains"]');return Array.from(canvas.getContext('2d').getImageData(canvas.width*${x},canvas.height*${y},${width},${height}).data);})()`);
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
 stage='legacy Without sheers draft';
 await evaluate(`(()=>{const key='dcorhome-visualizer-v1';const draft=JSON.parse(localStorage.getItem(key));draft.sheer.enabled=false;draft.sheer.variantId='soft-ivory';delete draft.sheerColorMode;localStorage.setItem(key,JSON.stringify(draft));})()`);
 const firstVisit=await evaluate('performance.timeOrigin');
 await call('Page.reload');await until('performance.timeOrigin!=='+firstVisit);await ready();await finished();
 assert.equal((await savedSelection()).sheer.enabled,true,'Restore the default when an old draft supplied no explicit opt-out');
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
 const roomBefore=id=>id==='hero-03'?'/images/manual-visualizer/atelier-v2/rooms/hero-03/before.webp':'/images/hero/'+id+'-before.webp';
 const imageDiff=(id,points)=>evaluate('(async()=>{'+
  'const shown=document.querySelector("[data-testid=composed-curtains]");'+
  'const ref=new Image();ref.src='+JSON.stringify(roomBefore(id))+';await ref.decode();'+
  'const canvas=document.createElement("canvas");canvas.width=shown.width;canvas.height=shown.height;'+
  'const reference=canvas.getContext("2d",{willReadFrequently:true});reference.drawImage(ref,0,0);'+
  'const output=shown.getContext("2d");'+
  'const read=(ctx,x,y)=>Array.from(ctx.getImageData(x,y,3,3).data);'+
  'const samples='+JSON.stringify(points)+'.map(([x,y])=>{const X=Math.round(x*shown.width/600),Y=Math.round(y*shown.height/450);const a=read(reference,X,Y),b=read(output,X,Y);return a.reduce((sum,v,i)=>sum+Math.abs(v-b[i]),0)/a.length;});'+
  'return {samples,resolution:[shown.width,shown.height],before:document.querySelector("[data-testid=manual-window-preview] img").getAttribute("src")};})()');
 stage='explicit sheer-only preview';
 const originalDraft=await savedSelection();
 const untouchedWindow=await hash();
 await click('[data-studio-step="sheer"]');
 await click('[data-material-id="library-sheer-plain-voile"]');await ready();
 assert.notEqual(await hash(),untouchedWindow,'Selecting the default fabric displays the sheer without a main selection');
 assert.ok((await imageDiff('hero-01',fixtures[0])).samples[2]>2);
 await click('[data-layer-toggle="sheer-off"]');await ready();
 assert.equal(await hash(),untouchedWindow);
 await click('[data-layer-toggle="sheer-on"]');await ready();
 assert.notEqual(await hash(),untouchedWindow,'Choosing Yes immediately restores the sheer-only preview');
 await evaluate(`localStorage.setItem('dcorhome-visualizer-v1',${JSON.stringify(JSON.stringify(originalDraft))})`);
 const sheerVisit=await evaluate('performance.timeOrigin');
 await call('Page.reload');await until('performance.timeOrigin!=='+sheerVisit);await ready();
 stage='homepage room cards and exact photographs';
 for(const [i,id] of roomIds.entries()){
  await click('[data-scene-id="'+id+'"]');await ready();
  assert.equal(await sliderVisible(),false,id+' hides the slider before a customization');
  const info=await imageDiff(id,fixtures[i]);
  assert.deepEqual(info.resolution,[1448,1086]);
  assert.equal(info.before,roomBefore(id));
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
 stage='Ivory in Sunlit bedroom';
 await click('[data-scene-id="hero-02"]');await ready();
 await click('[aria-label="main colour: Ivory"]');await ready();await finished();
 assert.equal((await savedSelection()).sheer.variantId,'soft-ivory');
 assert.ok((await imageDiff('hero-02',fixtures[1])).samples[2]>5,'Ivory main curtains visibly render Soft Ivory over Sunlit bedroom glass');
 await click('[data-scene-id="hero-01"]');await ready();await finished();
 const ivorySheer=await pixels(.45,.29);
 stage='Burgundy with Golden Beige';
 await click('[aria-label="main colour: Burgundy"]');await ready();
 assert.equal((await savedSelection()).sheer.variantId,'light-beige');
 assert.ok(averageDifference(await pixels(.45,.29),ivorySheer)>3,'Golden Beige changes the centre glass from Soft Ivory');
 const fadeDuration=()=>evaluate('document.querySelector("[data-testid=composed-curtains]").getAnimations()[0]?.effect.getTiming().duration');
 assert.equal(await fadeDuration(),600);
 await midReveal();await finished();
 assert.equal(await reveal(),100,'First customisation automatically ends at the right edge');
 const voile=await measureVoile();
 assert.ok(voile.lift>60,'Golden voile diffuses visible daylight over the tree line: '+voile.lift);
 assert.ok(voile.outdoorContrast>.23&&voile.outdoorContrast<.55,'The outdoor view remains readable through the fabric: '+voile.outdoorContrast);
 assert.ok(voile.foldContrast>12,'Adjacent folds remain distinct across the glass: '+voile.foldContrast);
 assert.ok(voile.warmth>20,'The visible Golden Beige voile has a warm tint: '+voile.warmth);
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
 const sheerOnly=(await imageDiff('hero-01',fixtures[0])).samples;
 assert.ok(sheerOnly[0]<=1&&sheerOnly[1]<=1&&sheerOnly[2]>2,'Disabling main curtains leaves the enabled sheer in place');
 assert.equal(await sliderVisible(),false,'Removing main curtains hides the slider');
 assert.equal(await evaluate(`document.querySelectorAll('${comparison} button:not(:disabled)').length`),3);
 await click('[data-layer-toggle="main-on"]');await ready();
 assert.equal(await hash(),velvet,'Yes restores the explicitly selected fabric and colour');
 assert.equal(await sliderVisible(),true,'Re-enabling main curtains restores the slider');
 stage='automatic sheer matching and independent fabric';
 const burgundySheer=await pixels(.45,.29);
 await click('[aria-label="main colour: Navy Blue"]');await ready();await finished();
 assert.equal((await savedSelection()).sheer.variantId,'pure-white');
 assert.ok(averageDifference(await pixels(.45,.29),burgundySheer)>2,'Automatic matching changes the middle window');
 await click('[aria-label="main colour: Burgundy"]');await ready();await finished();
 assert.equal((await savedSelection()).sheer.variantId,'light-beige');
 await click('[data-studio-step="sheer"]');
 const recommended=()=>evaluate('Array.from(document.querySelectorAll(\'[aria-label="sheer colours"] button\')).slice(0,3).map(b=>b.title.split(" · ")[0])');
 assert.deepEqual(await recommended(),['Golden Beige','Champagne Gold','Soft Ivory']);
 const plainVoile=await pixels(.45,.29);
 await click('[data-material-id="library-sheer-fine-voile"]');await ready();
 assert.equal((await savedSelection()).sheer.variantId,'light-beige','A different sheer fabric retains its available shade');
 assert.deepEqual(await pixels(.18,.15),oldMain);
 assert.notDeepEqual(await pixels(.45,.29),plainVoile,'A different sheer fabric changes the center texture');
 await click('[data-layer-toggle="sheer-off"]');await ready();
 assert.equal((await savedSelection()).sheerOptOut,true,'No sheers records the explicit opt-out');
 assert.ok((await imageDiff('hero-01',fixtures[0])).samples[2]<=1,'Turning off the sheer restores the original center window');
 assert.deepEqual(await pixels(.18,.15),oldMain);
 await click('[data-layer-toggle="sheer-on"]');await ready();
 assert.equal((await savedSelection()).sheerOptOut,undefined,'Re-enabling sheers clears the opt-out');
 await click('[aria-label="sheer colour: Soft Ivory"]');await ready();
 const initialSheer=await pixels(.45,.29),withIvory=await hash();
 assert.deepEqual((await savedSelection()).main,{enabled:true,materialId:'library-main-velvet',fabricId:'library-main-velvet',variantId:'burgundy'});
 await click('[data-studio-step="main"]');
 stage='slow texture and rapid selection';
 const scroll=await evaluate('window.scrollY');
 await call('Fetch.enable',{patterns:[{urlPattern:'*/main-curtains/velvet/taupe.webp'}]});
 await clickText('main','View all colours');await click('[aria-label="main colour: Taupe"]');
 for(let i=0;i<80&&!paused.length;i++)await delay(50);
 assert.ok(paused.length,'The fixture must delay the requested texture');
 assert.equal((await savedSelection()).main.variantId,'taupe');
 assert.equal(await sliderVisible(),false,'The slider waits for the newly selected shade to render');
 assert.equal(await hash(),withIvory,'Keep the original completed frame while loading');
 assert.equal(await evaluate('getComputedStyle(document.querySelector("[data-testid=composed-curtains]")).visibility'),'visible');
 assert.equal(await evaluate('window.scrollY'),scroll);
 await click('[aria-label="main colour: Navy Blue"]');await ready();
 assert.equal(await sliderVisible(),true,'The slider works after changing shades');
 const navy=await pixels(.18,.15),mainContrast=averageDifference(oldMain,navy);
 assert.ok(mainContrast>10);
 assert.deepEqual(await pixels(.45,.29),initialSheer);
 assert.equal(await fadeDuration(),600);
 assert.equal(await hash('previous-curtain-composition'),withIvory);
 assert.equal(await evaluate('document.querySelector("[data-testid=previous-curtain-composition]").hidden'),true,'The reveal starts over the original room');
 await midReveal();
 await Promise.all(paused.map(requestId=>call('Fetch.continueRequest',{requestId})));await call('Fetch.disable');
 await finished();
 assert.equal(await reveal(),100,'Changing colour automatically ends at the right edge');
 assert.deepEqual(await pixels(.18,.15),navy,'Late texture must not overwrite the chosen shade');
 stage='sheer shade preview and independence';
 await click('[data-studio-step="sheer"]');
 assert.deepEqual(await recommended(),['Pure White','Soft Ivory','Warm Grey']);
 assert.equal((await savedSelection()).sheer.variantId,'soft-ivory','New main recommendations retain the chosen sheer');
 await click('[aria-label="sheer colour: Sky Blue"]');await ready();
 const blueSheer=await pixels(.45,.29);
 assert.notDeepEqual(blueSheer,initialSheer,'A chosen sheer shade changes the center window');
 assert.deepEqual(await pixels(.18,.15),navy,'Selecting a sheer shade preserves the main curtain');
 assert.equal((await savedSelection()).main.variantId,'navy-blue');
 assert.equal((await savedSelection()).sheer.variantId,'pale-blue');
 stage='all sheer swatches in all three arched windows';
 await click('[data-scene-id="hero-03"]');await ready();
 const planterArea=(await imageDiff('hero-03',[[345,241],[315,310],[500,294]])).samples;
 assert.ok(planterArea[0]>8,'The main curtain covers the former plant cutout');
 assert.ok(planterArea[1]<=1&&planterArea[2]<=1,'The retouched wall and remaining planter keep their foreground pixels');
 const arches=[[145/600,132/450],[392/600,130/450],[512/600,160/450]];
 const archPixels=()=>Promise.all(arches.map(([x,y])=>pixels(x,y)));
 const mainPanel=await pixels(209/600,145/450);
 await click('[data-layer-toggle="sheer-off"]');await ready();
 const bareArches=await archPixels();
 await click('[data-layer-toggle="sheer-on"]');await ready();
 const swatches=['Pure White','Soft Ivory','Champagne Gold','Golden Beige','Blush Pink','Sage Green','Sky Blue','Warm Grey','Cream','Light Sand','Lavender'];
 const samples=[];
 for(const shade of swatches){
  await click('[aria-label="sheer colour: '+shade+'"]');await ready();
  const sample=await archPixels();
  assert.deepEqual(await pixels(209/600,145/450),mainPanel,shade+' preserves the main curtain');
  for(const [index,window] of sample.entries()){
   assert.ok(averageDifference(window,bareArches[index])>3,shade+' shows in arch '+(index+1));
   for(const previous of samples){
    const delta=averageDifference(window,previous.sample[index]);
    assert.ok(delta>1.5,shade+' differs from '+previous.shade+' in arch '+(index+1)+': '+delta);
   }
  }
  samples.push({shade,sample});
 }
 stage='all seven patterned sheers';
 const patternPixels=()=>pixels(110/600,78/450,105,345);
 const plainLavender=await patternPixels();
 const patternSamples=[];
 const patterns=['Floral Lace','Embroidered Flowers','Leaf Pattern','Diamond Net','Geometric Lace','Vertical Stripes','Decorative Net'];
 for(const name of patterns){
  await click('[aria-label="'+name+'"]');await ready();
  const sample=await patternPixels();
  assert.equal((await savedSelection()).sheer.variantId,'lavender',name+' retains the manual shade');
  assert.deepEqual(await pixels(209/600,145/450),mainPanel,name+' leaves the main curtain intact');
  const patternDifference=averageDifference(sample,plainLavender);
  assert.ok(patternDifference>2,name+' changes the actual middle window pixels: '+patternDifference);
  for(const previous of patternSamples){
   const difference=averageDifference(sample,previous.sample);
   assert.ok(difference>2,name+' differs from '+previous.name+' in the actual room: '+difference);
  }
  patternSamples.push({name,sample});
 }
 await click('[aria-label="sheer colour: Blush Pink"]');await ready();
 assert.ok(averageDifference(await patternPixels(),patternSamples.at(-1).sample)>3,'The same pattern visibly changes colour');
 assert.equal((await savedSelection()).sheer.materialId,'library-sheer-decorative-net');
 await click('[aria-label="sheer colour: Lavender"]');await ready();
 await click('[data-studio-step="main"]');
 await click('[aria-label="main colour: Burgundy"]');await ready();await finished();
 assert.equal((await savedSelection()).sheer.variantId,'lavender');
 assert.equal((await savedSelection()).sheer.materialId,'library-sheer-decorative-net');
 assert.deepEqual(await patternPixels(),patternSamples.at(-1).sample,'A different main curtain shade preserves the chosen pattern and shade');
 await click('[aria-label="main colour: Navy Blue"]');await ready();await finished();
 await click('[data-studio-step="sheer"]');
 const screenshotSamples=async(file)=>{
  const clip=await evaluate(`(()=>{const {x,y,width,height}=document.querySelector('[data-testid=composed-curtains]').getBoundingClientRect();return {x:x+scrollX,y:y+scrollY,width,height,scale:1};})()`);
  const shot=await call('Page.captureScreenshot',{format:'png',clip,captureBeyondViewport:true});
  const image=Buffer.from(shot.data,'base64');
  if(file)fs.writeFileSync(path.join(profile,file),image);
  const {info,data}=await require('sharp')(image).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  return [arches[0],arches[1],[209/600,145/450]].map(([x,y])=>{
   const i=(Math.round(y*info.height)*info.width+Math.round(x*info.width))*4;
   return data.subarray(i,i+4);
  });
 };
 await compare('Before');
 const beforeReveal=await screenshotSamples();
 await compare('After');
 const afterReveal=await screenshotSamples('arched-decorative-net.png');
 for(let i=0;i<afterReveal.length;i++)assert.ok(averageDifference(afterReveal[i],beforeReveal[i])>3,'The coloured curtains appear only on the After side');
 await evaluate(`(()=>{const handle=document.querySelector('${slider}');for(let i=0;i<5;i++)handle.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowLeft',shiftKey:true,bubbles:true,cancelable:true}));})()`);
 assert.equal(await reveal(),50);
 const halfReveal=await screenshotSamples();
 assert.deepEqual(halfReveal,[afterReveal[0],beforeReveal[1],afterReveal[2]],'The same reveal edge clips the main curtains and sheers');
 stage='patterned sheer in all ten photo rooms';
 for(const [i,id] of roomIds.entries()){
  await click('[data-scene-id="'+id+'"]');await ready();
  const {samples}=await imageDiff(id,fixtures[i]);
  assert.ok(samples[2]>2&&samples[3]<=1,id+' renders the patterned sheer and preserves the foreground');
  assert.equal((await savedSelection()).sheer.materialId,'library-sheer-decorative-net');
 }
 stage='fabric and colour changes across three rooms';
 for(const i of [0,1,2]){
  const id=roomIds[i];
  await click('[data-scene-id="'+id+'"]');await ready();
  const [mainPoint,,glass]=fixtures[i];
  const mainPixels=()=>pixels(mainPoint[0]/600,mainPoint[1]/450);
  const clothPixels=()=>pixels((glass[0]-18)/600,(glass[1]-20)/450,88,100);
  const mainBefore=await mainPixels();
  await click('[aria-label="Floral Lace"]');await ready();
  await click('[aria-label="sheer colour: Lavender"]');await ready();
  const lavender=await clothPixels();
  await click('[aria-label="sheer colour: Sky Blue"]');await ready();
  const sky=await clothPixels();
  assert.ok(averageDifference(lavender,sky)>2,id+' changes the rendered fabric colour');
  await click('[aria-label="Diamond Net"]');await ready();
  assert.equal((await savedSelection()).sheer.variantId,'pale-blue');
  assert.ok(averageDifference(sky,await clothPixels())>2,id+' changes the rendered pattern while retaining Sky Blue');
  assert.deepEqual(await mainPixels(),mainBefore,id+' retains the rendered main curtain');
 }

 stage='available fabrics and legacy shade assets';
 await click('[data-scene-id="hero-01"]');await ready();
 const fabricIds=await evaluate(`Array.from(document.querySelectorAll('[aria-label="sheer fabric varieties"] [data-material-id]'),button=>button.dataset.materialId)`);
 assert.equal(fabricIds.length,19,'Show all 17 library fabrics plus both prepared voile references');
 const textures=new Set();
 for(const fabricId of fabricIds){
  await click('[data-material-id="'+fabricId+'"]');await ready();
  await click('[aria-label="sheer colour: Soft Ivory"]');await ready();
  const frame=await hash();
  assert.ok(!textures.has(frame),fabricId+' renders a distinct texture at the same shade');
  textures.add(frame);
  if(fabricId==='plain-voile'||fabricId==='fine-voile'){
   const shades=await evaluate(`Array.from(document.querySelectorAll('[aria-label="sheer colours"] button'),button=>button.getAttribute('aria-label'))`);
   for(const shade of shades){await click('[aria-label="'+shade+'"]');await ready();}
  }
 }
 stage='automatic matching mode';
 await click('[data-material-id="library-sheer-fine-voile"]');await ready();
 await clickText('sheer','Match main curtain');await ready();
 assert.equal((await savedSelection()).sheer.variantId,'pure-white');
 await clickText('sheer','Match main curtain');await ready();
 assert.equal((await savedSelection()).sheerColorMode,'manual');
 await click('[data-studio-step="main"]');
 await click('[aria-label="main colour: Burgundy"]');await ready();await finished();
 assert.equal((await savedSelection()).sheer.variantId,'pure-white','Turning matching off preserves the rendered shade');
 await click('[data-studio-step="sheer"]');
 assert.match(await evaluate('document.querySelector(\'[aria-label="sheer colour: Golden Beige"]\').title'),/Suggested for Burgundy/);
 await click('[aria-label="sheer colour: Sky Blue"]');await ready();
 assert.deepEqual(await pixels(.45,.29),blueSheer);
 await click('[data-studio-step="main"]');
 await click('[aria-label="main colour: Navy Blue"]');await ready();await finished();
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
 assert.deepEqual(await pixels(.18,.15),mobileMain);assert.deepEqual(await pixels(.45,.29),blueSheer);
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
 assert.deepEqual(await pixels(.45,.29),blueSheer,'A manual shade previews without main curtains');
 assert.equal(await sliderVisible(),false);
 assert.ok((await imageDiff('hero-01',fixtures[0])).samples[0]<=1,'A sheer-only preview preserves the original main panel area');
 stage='explicit No sheers across visits';
 await click('[data-studio-step="sheer"]');
 await click('[data-layer-toggle="sheer-off"]');await ready();
 const previousVisit=await evaluate('performance.timeOrigin');
 await call('Page.reload');await until('performance.timeOrigin!=='+previousVisit);await ready();
 await click('[data-studio-step="main"]');
 await click('[data-material-id="library-main-silk"]');
 await click('[aria-label="main colour: Ivory"]');await ready();
 assert.equal((await savedSelection()).sheer.enabled,false);
 assert.equal((await savedSelection()).sheerOptOut,true);
 assert.ok((await imageDiff('hero-01',fixtures[0])).samples[2]<=1,'Selecting a new main colour leaves the opted-out middle window clear');
 await click('[data-studio-step="sheer"]');
 await click('[data-layer-toggle="sheer-on"]');await ready();
 assert.equal((await savedSelection()).sheer.variantId,'pale-blue','Opting back in restores the manual shade');
 stage='legacy fitted room previews';
 const fittedDesign=await savedSelection();
 for(const sceneId of ['room-01','room-09','garden-living']){
  const visit=await evaluate('performance.timeOrigin');
  await call('Page.navigate',{url:base+'/studio?visualizer='+encodeURIComponent(JSON.stringify({...fittedDesign,sceneId}))});
  await until('performance.timeOrigin!=='+visit);await ready();await finished();
  await click('[data-studio-step="sheer"]');
  const before=await hash();
  await click('[aria-label="Floral Lace"]');await ready();await finished();
  assert.notEqual(await hash(),before,sceneId+' renders the selected sheer texture');
  const floral=await hash();
  await click('[aria-label="sheer colour: Lavender"]');await ready();await finished();
  assert.notEqual(await hash(),floral,sceneId+' renders the selected sheer colour');
 }
 stage='delete';await call('Page.navigate',{url:base+'/designs'});await until(`document.querySelector('section[aria-label="Saved manual curtain designs"] button')!==null`);await evaluate(`[...document.querySelectorAll('section[aria-label="Saved manual curtain designs"] button')].find(b=>b.textContent==='Delete').click()`);await until(`JSON.parse(localStorage.getItem('dcorhome-saved-manual-designs-v1')).length===0`);
 assert.deepEqual(requests.filter(url=>/\/api\/(?:auth\/(?!get-session(?:\?|$))|manual-designs|designs|session|visualiz|fabrics\/saved)/.test(url)||/api\.openai\.com/.test(url)),[],'Manual journey must not call auth/cloud storage/AI');
 assert.deepEqual(errors,[]);
 console.log('PASS: eleven rendered sheer shades, seven rendered patterns, patterned sheers across all ten rooms, outdoor contrast and foreground pixels, native-resolution download, slider and Replay, and local selections.');
})().catch(error=>{console.error('FAIL: visualizer '+stage+': '+error.message);process.exitCode=1;}).finally(async()=>{clearTimeout(deadline);if(ws)ws.close();chrome.kill();});
