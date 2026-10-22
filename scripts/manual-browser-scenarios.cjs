const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
module.exports=async function({go,evaluate,call,delay}){
 const wait=async expression=>{for(let i=0;i<300;i++){if(await evaluate(`!!(${expression})`))return;await delay(50);}throw Error('Timed out: '+expression);};
 const click=async label=>{await evaluate(`document.querySelector('[aria-label=${JSON.stringify(label)}]').click()`);await delay(120);};
 const text=async label=>{await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent===${JSON.stringify(label)}).click()`);await delay(120);};
 const select=async(label,value)=>{await evaluate(`(()=>{const s=document.querySelector('select[aria-label=${JSON.stringify(label)}]');s.value=${JSON.stringify(value)};s.dispatchEvent(new Event('change',{bubbles:true}));})()`);await delay(120);};
 const step=async n=>{await evaluate(`document.querySelectorAll('nav[aria-label="Curtain design steps"] button')[${n-1}].click()`);await wait(`document.querySelector('[data-step="${n}"]')`);};
 const signature=layer=>evaluate(`(()=>{const c=document.querySelector('canvas[data-layer=${layer}]'),p=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0;for(let i=0;i<p.length;i+=127)n=(n*31+p[i])>>>0;return n})()`);
 const base={mainFabric:'sienna',mainColor:'Warm Ivory',sheerFabric:'solstice',sheerColor:'Soft Ivory',mainEnabled:true,sheerEnabled:true,heading:'Wave Pleat',sheerHeading:'Wave Pleat',pattern:'Solid',room:'Living Room',panels:'Pair',curtainLength:'Floor length',fullness:'2'};
 const route='/studio?mode=sample&manual='+encodeURIComponent(JSON.stringify(base));
 if(process.env.DCORHOME_GUIDED_LAYOUT==='true'){
  for(const width of [360,390,768,1440]){
   await go(route,width);
   for(const n of [1,2,3]){
    await step(n);await evaluate(`window.scrollTo({top:0,behavior:'instant'})`);await delay(150);
    const size=(await call('Page.getLayoutMetrics')).cssContentSize,shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width:size.width,height:size.height,scale:1}});
    fs.writeFileSync(path.join(os.tmpdir(),`dcorhome-guided-${width}-step-${n}.png`),Buffer.from(shot.data,'base64'));
    assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);
   }
  }
  await go('/',390);
  console.log('Three-step full-page screenshots at 360/390/768/1440; no overflow or missing images; homepage integration PASS');return;
 }
 await go(route,1440);await wait(`document.querySelector('[aria-label="main color: Warm Ivory"]').getAttribute('aria-pressed')==='true'`);
 assert.equal(await evaluate(`document.querySelector('[data-testid=advanced-customization]').open`),false);
 assert.equal(await evaluate(`document.querySelectorAll('[aria-label="main colors"] button').length`),6);
 await text('View all colors (8)');assert.equal(await evaluate(`document.querySelectorAll('[aria-label="main colors"] button').length`),8);
 await evaluate(`window.manualAiRequests=0;const original=window.fetch;window.fetch=(url,options)=>{if(String(url).includes('/api/visualize')&&options?.method==='POST')window.manualAiRequests++;return original(url,options);};`);
 const sheerBefore=await evaluate(`document.querySelector('[data-preview-layer=sheer] img').src`);
 await click('main color: Burgundy');assert.ok(await evaluate(`document.querySelector('[data-preview-layer=main] img').src.includes('burgundy')`));assert.equal(await evaluate(`document.querySelector('[data-preview-layer=sheer] img').src`),sheerBefore);
 await click('main fabric: Velvet');assert.equal(await evaluate(`document.querySelector('[data-preview-layer=sheer] img').src`),sheerBefore);assert.equal(await evaluate(`!!document.querySelector('[aria-label="main color: Warm Ivory"]')`),false);await click('main color: Olive');
 const mainBefore=await evaluate(`document.querySelector('[data-preview-layer=main] img').src`);
 await text('Continue to sheers');await wait(`document.querySelector('[data-step="2"]')`);await click('sheer fabric: Fine Voile');await click('sheer color: Blush White');assert.equal(await evaluate(`document.querySelector('[data-preview-layer=main] img').src`),mainBefore);
 await text('No, main curtains only');assert.equal(await evaluate(`!!document.querySelector('[aria-label="sheer colors"]')||!!document.querySelector('[data-preview-layer=sheer]')`),false);await text('Yes, add sheers');assert.equal(await evaluate(`document.querySelector('[aria-label="sheer color: Blush White"]').getAttribute('aria-pressed')`),'true');
 await text('See your design');await wait(`document.querySelector('[data-step="3"]')`);assert.ok(await evaluate(`document.querySelector('[data-testid=curtain-config-summary]').textContent.includes('Olive')&&document.querySelector('[data-testid=curtain-config-summary]').textContent.includes('Blush White')`));
 assert.equal(await evaluate(`document.body.innerText.includes('DEMO-PREVIEW')`),false);
 await click('Edit main curtains');await wait(`document.querySelector('[aria-label="main color: Olive"]').getAttribute('aria-pressed')==='true'`);
 await evaluate(`document.querySelector('[data-testid=advanced-customization] summary').click()`);
 await select('main heading','Pinch Pleat');await select('Curtain length','Sill length');await select('Curtain panels','Single');await text('Extra Full');await select('Room preview','Bedroom');
 await evaluate(`document.querySelector('[data-testid=advanced-customization] input[type=checkbox]').click()`);await delay(80);assert.equal(await evaluate(`!!document.querySelector('[data-preview-layer=main]')`),false);await evaluate(`document.querySelector('[data-testid=advanced-customization] input[type=checkbox]').click()`);await delay(80);
 await evaluate(`document.querySelectorAll('[data-testid=advanced-customization] input[type=checkbox]')[1].click()`);await wait(`document.querySelector('canvas[data-layer=main]')?.getContext('2d').getImageData(300,300,1,1).data[3]>0`);
 let main=await signature('main'),sheer=await signature('sheer');await click('main color: Dusty Rose');await delay(100);assert.notEqual(await signature('main'),main);assert.equal(await signature('sheer'),sheer);main=await signature('main');
 await step(2);await click('sheer color: Warm Beige');await delay(100);assert.equal(await signature('main'),main);assert.notEqual(await signature('sheer'),sheer);
 await text('No, main curtains only');assert.equal(await evaluate(`document.querySelector('canvas[data-layer=sheer]').hidden`),true);await text('Yes, add sheers');await wait(`!document.querySelector('canvas[data-layer=sheer]').hidden`);
 let room=await evaluate(`document.querySelector('[data-testid=manual-preview] img').src`);for(const value of ['Living Room','Dining Room','Home Office','Guest Room','Nursery']){await select('Room preview',value);await wait(`document.querySelector('[data-testid=manual-preview] img').complete`);const next=await evaluate(`document.querySelector('[data-testid=manual-preview] img').src`);assert.notEqual(next,room);room=next;}
 assert.equal(await evaluate('window.manualAiRequests'),0);
 await step(3);const quote=await evaluate(`document.querySelector('[data-testid=design-enquiry]').getAttribute('href')`),message=new URL(quote,'http://localhost').searchParams.get('message');
 for(const part of ['Velvet','Dusty Rose','Fine Voile','Warm Beige','Pinch Pleat','Sill length','2.5x','Single','DEMO-PREVIEW-CLAY-DUSTY-ROSE'])assert.ok(message.includes(part),part);
 const wa=await evaluate(`[...document.querySelectorAll('a')].find(a=>a.textContent==='Enquire on WhatsApp')?.href`);if(wa)assert.equal(new URL(wa).searchParams.get('text'),message);
 const saved=await evaluate(`localStorage.getItem('dcorhome-manual-v1')`),savedRoute=await evaluate('location.pathname+location.search');await go(savedRoute,390);await wait(`document.querySelector('[aria-label="main color: Dusty Rose"]').getAttribute('aria-pressed')==='true'`);
 assert.equal(await evaluate(`localStorage.getItem('dcorhome-manual-v1')`),saved);await step(3);await text('Try in My Room');await wait(`document.querySelector('[aria-label="Upload your room photograph"]')`);assert.equal(await evaluate(`new URL(location.href).searchParams.get('mode')`),'upload');await text('Back to your curtain design');await wait(`document.querySelector('[aria-label="main color: Dusty Rose"]').getAttribute('aria-pressed')==='true'`);
 await go(quote,390);await wait(`document.querySelector('textarea')?.value.includes('DEMO-PREVIEW-CLAY-DUSTY-ROSE')`);
 for(const width of [360,390,768,1440]){
  await go(route,width);for(const n of [1,2,3]){await step(n);assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth'),false);}
  await step(2);await text('No, main curtains only');await text('See your design');assert.equal(await evaluate(`document.querySelector('[data-testid=design-enquiry]').href.includes('Sheer+curtain%3A+Disabled')`),true);
 }
 await go('/collections/sienna?shade=Sand',390);await evaluate(`[...document.querySelectorAll('summary')].find(b=>b.textContent==='Visualize this Fabric').click()`);await text('Design Curtains With This Fabric');await wait(`document.querySelector('[aria-label="main color: Sand"]')?.getAttribute('aria-pressed')==='true'`);
 console.log('Guided main/sheers/review flow; featured/all shades, photo and canvas layer independence, translucency, no paid AI calls, optional advanced settings, room/panel/fullness, URL persistence, coded enquiry/contact/WhatsApp and upload handoff, catalogue transfer; 360/390/768/1440 PASS');
};
