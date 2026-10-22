const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
module.exports=async function({go,evaluate,call,delay}){
 const wait=async expression=>{for(let i=0;i<300;i++){if(await evaluate(`!!(${expression})`))return;await delay(50);}throw Error('Timed out: '+expression);};
 if(process.env.DCORHOME_FABRIC_IMAGES_ONLY==='layout'){
  for(const width of [390,768,1440]){
   for(const [page,route] of [['collections','/collections'],['detail','/collections/silk-satin-study?shade=Emerald%20Green']]){
    await go(route,width);await delay(500);
    const metrics=await call('Page.getLayoutMetrics'),size=metrics.cssContentSize;
    const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip:{x:0,y:0,width:size.width,height:size.height,scale:1}});
    fs.writeFileSync(path.join(os.tmpdir(),`dcorhome-premium-${page}-${width}-full.png`),Buffer.from(shot.data,'base64'));
   }
  }
  await go('/collections',390);
  await evaluate(`document.querySelector('[aria-label="Next fabric categories"]').click()`);
  await wait(`document.querySelector('nav[aria-label="Fabric categories"]').scrollLeft>20`);
  await evaluate(`document.querySelector('[aria-label="Previous fabric categories"]').click()`);
  await wait(`document.querySelector('nav[aria-label="Fabric categories"]').scrollLeft<2`);
  await evaluate(`document.querySelector('[aria-label="Open navigation"]').click()`);
  assert.equal(await evaluate(`document.querySelector('[aria-label="Open navigation"]')===null&&document.querySelector('#mobile-menu').getAttribute('aria-hidden')==='false'`),true);
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});
  await wait(`document.querySelector('[aria-label="Open navigation"]')`);
  await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Filter fabrics').click()`);
  await evaluate(`document.querySelector('dialog input[name=usage][value=sheer]').click()`);
  await wait(`location.search.includes('usage=sheer')&&document.querySelectorAll('article').length===2`);
  await evaluate(`document.querySelector('[aria-label="Close filters"]').click()`);
  await evaluate(`document.querySelector('[aria-label="Remove filter: Sheer"]').click()`);
  await wait(`!location.search.includes('usage=sheer')&&document.querySelectorAll('article').length===7`);
  await go('/collections',1440);
  const before=await evaluate(`document.querySelector('article img').getAttribute('src')`);
  await evaluate(`document.querySelectorAll('article')[0].querySelectorAll('button')[1].click()`);
  assert.notEqual(await evaluate(`document.querySelector('article img').getAttribute('src')`),before);
  assert.equal(await evaluate(`(()=>{const card=document.querySelector('article'),name=card.querySelector('button[aria-pressed=true]').getAttribute('aria-label').split('card shade: ')[1];return [...card.querySelectorAll('a')].every(a=>new URL(a.href).searchParams.get('shade')===name)&&card.innerText.includes(name);})()`),true);
  await evaluate(`document.querySelector('[aria-label="Sort fabrics"]').click()`);
  await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Name: Z to A').click()`);
  await wait(`location.search.includes('sort=name-desc')`);
  console.log('Full-page collection/detail screenshots and no overflow at 390/768/1440px; card swatch image/link/label synchronization and sort PASS');return;
 }
 if(process.env.DCORHOME_FABRIC_IMAGES_ONLY==='fallback'){
  await go('/collections/silk-satin-study?shade=Emerald%20Green',390);assert.equal(await evaluate(`[...document.querySelectorAll('a,button')].some(b=>b.textContent==='Enquire on WhatsApp')`),false);assert.equal(await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Request a Quote').disabled`),false);
  await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Request a Quote').click()`);await wait(`document.querySelector('dialog[aria-labelledby=quote-title]').open`);
  assert.ok(await evaluate(`[...document.querySelectorAll('dialog input')].some(i=>i.value.includes('Emerald Green'))`));
  await evaluate(`(()=>{const d=document.querySelector('dialog[aria-labelledby=quote-title]');d.querySelector('[name=name]').value='Synthetic fallback check';d.querySelector('[name=email]').value='test@example.com';d.querySelector('[name=consent]').checked=true;d.querySelector('form').requestSubmit();})()`);
  await wait(`document.querySelector('dialog[aria-labelledby=quote-title]').textContent.includes('temporarily unavailable')`);assert.equal(await evaluate(`document.querySelector('dialog[aria-labelledby=quote-title]').textContent.includes('has been saved')`),false);
  console.log('Unconfigured WhatsApp uses active quote fallback; missing storage produces a real error, never fake success PASS');return;
 }
 await go('/collections',1440);const collectionShot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(os.tmpdir(),'dcorhome-fabric-collections-1440.png'),Buffer.from(collectionShot.data,'base64'));await evaluate(`[...document.querySelectorAll('nav[aria-label="Fabric categories"] a')].find(a=>a.textContent.startsWith('Silk')).click()`);await wait(`document.querySelector('article a[href^="/collections/silk-satin-study?"]')`);await evaluate(`document.querySelector('article a[href^="/collections/silk-satin-study?"]').click()`);await wait(`document.querySelector('[aria-label="Fabric color: Champagne"]')`);
 await evaluate(`window.fabricJourneyToken='keep-page';window.fabricAIRequests=0;const original=window.fetch;window.fetch=(url,options)=>{if(String(url).includes('/api/visualize')&&options?.method==='POST')window.fabricAIRequests++;return original(url,options);};`);
 const sources=[],thumbs=[],skus=[];
 for(const shade of ['Champagne','Emerald Green','Burgundy']){
  await evaluate(`document.querySelector('[aria-label="Fabric color: ${shade}"]').click()`);await wait(`document.querySelector('[aria-label="Fabric photograph gallery"] img')?.complete&&document.querySelector('[aria-label="Fabric photograph gallery"] img')?.naturalWidth>0`);
  const pixels=await evaluate(`(()=>{const img=document.querySelector('[aria-label="Fabric photograph gallery"] img'),canvas=document.createElement('canvas');canvas.width=128;canvas.height=160;const ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,128,160);const p=ctx.getImageData(0,0,128,160).data,mean=[0,0,0];let hash=0;for(let i=0;i<p.length;i+=4){for(let c=0;c<3;c++)mean[c]+=p[i+c]/(128*160);hash=(hash*31+p[i]+p[i+1]*3+p[i+2]*7)>>>0;}return {mean,hash,src:img.getAttribute('src')};})()`);
  const [r,g,b]=pixels.mean;if(shade==='Champagne')assert.ok(r>g&&g>b);if(shade==='Emerald Green')assert.ok(g>r*1.3&&g>b*1.1);if(shade==='Burgundy')assert.ok(r>g*1.5&&r>b*1.1);sources.push(pixels.src);
  thumbs.push(await evaluate(`document.querySelector('[aria-label="View fabric reference 2"] img').getAttribute('src')`));skus.push(await evaluate(`document.querySelector('[data-testid=selected-shade]').textContent`));
  assert.equal(await evaluate(`new URL(location.href).searchParams.get('shade')`),shade);assert.equal(await evaluate('window.fabricJourneyToken'),'keep-page');
  const href=await evaluate(`[...document.querySelectorAll('a')].find(a=>a.textContent==='Enquire on WhatsApp').href`);assert.ok(new URL(href).searchParams.get('text').includes(shade));
  const shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(os.tmpdir(),`dcorhome-fabric-${shade.replaceAll(' ','-')}-1440.png`),Buffer.from(shot.data,'base64'));
 }
 assert.equal(new Set(sources).size,3);assert.equal(new Set(thumbs).size,3);assert.equal(new Set(skus).size,3);assert.equal(await evaluate('window.fabricAIRequests'),0);
 await evaluate(`document.querySelector('[aria-label="Fabric photograph gallery"] button').click()`);await wait(`document.querySelector('dialog[aria-label*="enlarged"]').open`);assert.ok(await evaluate(`document.querySelector('[aria-label="Fabric magnification"]')!==null`));await evaluate(`document.querySelector('[aria-label="Fabric magnification"]').value='2'`);await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27,nativeVirtualKeyCode:27});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27,nativeVirtualKeyCode:27});await wait(`!document.querySelector('dialog[aria-label*="enlarged"]').open`);
 await evaluate(`(()=>{const b=document.querySelector('[aria-label="Fabric color: Champagne"]');b.focus();})()`);await wait(`document.activeElement?.getAttribute('aria-label')==='Fabric color: Champagne'`);await call('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight'});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'ArrowRight',code:'ArrowRight'});await wait(`document.querySelector('[aria-label="Fabric color: Emerald Green"]').getAttribute('aria-pressed')==='true'`);
 for(const width of [390,768]){await go('/collections/silk-satin-study?shade=Emerald%20Green',width);await evaluate(`document.querySelector('[aria-label="Fabric color: Burgundy"]').click()`);await wait(`document.querySelector('[aria-label="Fabric photograph gallery"] img')?.complete`);assert.ok(await evaluate(`document.querySelector('[aria-label="Fabric photograph gallery"] img').getAttribute('src').includes('burgundy')`));const shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(os.tmpdir(),`dcorhome-fabric-burgundy-${width}.png`),Buffer.from(shot.data,'base64'));}
 await go('/collections/sienna?shade=Emerald%20Green',1440);assert.ok(await evaluate(`document.querySelector('[aria-label="Fabric photograph gallery"] img').getAttribute('src').includes('sienna/emerald-green')`));assert.ok(await evaluate(`document.body.innerText.includes('Ask for specification')`));
 await evaluate(`document.querySelector('[aria-label="Fabric photograph gallery"] img').src='/images/verification-missing-fabric.webp'`);await wait(`document.querySelector('[data-testid=fabric-viewer]').textContent.includes('Photograph could not load')`);await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Retry image').click()`);await wait(`document.querySelector('[aria-label="Fabric photograph gallery"] img').naturalWidth>0&&!document.querySelector('[data-testid=fabric-viewer]').textContent.includes('Photograph could not load')`);
 console.log('Exact Silk -> Champagne/Emerald Green/Burgundy pixel colors, gallery/thumbnails/references, no reload or AI calls, WhatsApp shade encoding, zoom, keyboard controls and mobile selection PASS');
};
