const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
module.exports=async({go,evaluate,call,delay})=>{
 const wait=async expression=>{for(let i=0;i<200;i++){if(await evaluate(expression))return;await delay(100);}throw Error('Timed out: '+expression);};
 const output=path.resolve('.data/ai-window');fs.mkdirSync(output,{recursive:true});
 for(const width of [390,1440]){
  await go('/studio?mode=upload',width);
  await evaluate(`window.aiPosts=0;const f=window.fetch;window.fetch=(url,options)=>{if(String(url).includes('/api/visualizer/generate')&&options?.method==='POST'){window.aiPosts++;window.lastArea=JSON.parse(options.body).windowArea;window.lastManual=JSON.parse(options.body).manual;}return f(url,options);};`);
  await evaluate(`(async()=>{const blob=await fetch('/images/hero-room-before.webp').then(r=>r.blob());const files=new DataTransfer();files.items.add(new File([blob],'window-test.webp',{type:'image/webp'}));const input=document.querySelector('input[type=file]');input.files=files.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()`);
  await wait(`!!document.querySelector('[data-testid="window-area-surface"] img')`);
  await wait(`document.querySelector('[data-testid="window-area-surface"] img').naturalWidth>0`);
  assert.equal(await evaluate(`window.aiPosts`),0);
  assert.equal(await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Generate My Room Preview')).disabled`),true);
  await evaluate(`document.querySelector('[data-testid="window-area-surface"]').scrollIntoView({block:'center',behavior:'instant'})`);
  const rect=await evaluate(`(()=>{const r=document.querySelector('[data-testid="window-area-surface"]').getBoundingClientRect();return{x:r.left,y:r.top,w:r.width,h:r.height};})()`);
  await call('Input.dispatchMouseEvent',{type:'mousePressed',x:rect.x+rect.w*.2,y:rect.y+rect.h*.2,button:'left',clickCount:1});
  await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:rect.x+rect.w*.8,y:rect.y+rect.h*.8,button:'left',buttons:1});
  await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:rect.x+rect.w*.8,y:rect.y+rect.h*.8,button:'left',clickCount:1});
  await wait(`!!document.querySelector('[data-testid="window-area-box"]')`);
  assert.equal(await evaluate(`window.aiPosts`),0);
  assert.equal(await evaluate(`document.documentElement.scrollWidth>innerWidth`),false);
  const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync(path.join(output,`selected-${width}.png`),Buffer.from(shot.data,'base64'));
  console.log('Room upload and drawn area',width,'PASS');
 }
 await wait(`![...document.querySelectorAll('button')].find(b=>b.textContent.includes('Generate My Room Preview')).disabled`);
 await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Generate My Room Preview')).click()`);
 await wait(`!!document.querySelector('[data-testid="curtain-comparison"]')`);
 assert.equal(await evaluate('window.aiPosts'),1);
 const area=await evaluate('window.lastArea');assert.ok(area.width>.55&&area.width<.65);
 assert.ok(await evaluate('window.lastManual.mainFabric&&window.lastManual.sheerFabric'));
 await evaluate(`document.querySelector('[role="slider"]').focus()`);await call('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowLeft',code:'ArrowLeft'});
 assert.ok(Number(await evaluate(`document.querySelector('[role="slider"]').getAttribute('aria-valuenow')`))<50);
 assert.ok(await evaluate(`[...document.querySelectorAll('a')].some(a=>a.download==='dcorhome-ai-design.webp')`));
 const enquiry=await evaluate(`[...document.querySelectorAll('a')].find(a=>a.textContent==='Enquire about this design').href`);assert.ok(new URL(enquiry).searchParams.get('message').includes('mainFabric'));
 await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Save design').click()`);
 await wait(`document.body.innerText.includes('Saved privately in this browser session.')`);
 const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync(path.join(output,'result-desktop.png'),Buffer.from(shot.data,'base64'));
 console.log('Explicit generation, area/configuration payload, real response display, before/after keyboard, download, enquiry and private save PASS (isolated provider)');
};
