const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
module.exports=async({go,evaluate,call,delay})=>{
 const root='[data-testid="hero-comparison-slider"]',active=root+' [data-comparison-pair][aria-hidden="false"]';
 const value=()=>evaluate(`Number(document.querySelector('${active} [role=slider]').getAttribute('aria-valuenow'))`),scene=()=>evaluate(`Number(document.querySelector('${root}').dataset.activePair)`);
 const wait=async expression=>{for(let i=0;i<100;i++){if(await evaluate(expression))return;await delay(100);}throw Error('Timed out: '+expression);};
 for(const width of [390,1440]){
  await go('/',width);assert.equal(await evaluate(`document.querySelector('${root}').dataset.pairCount`),'10');
  assert.equal(await evaluate(`document.querySelectorAll('${root} button,${root} select').length`),0);
  assert.equal(await evaluate(`document.querySelectorAll('${root} p:not(.sr-only)').length`),0);
  assert.ok(await value()<25,'Scene must begin predominantly before');
  const layout=await evaluate(`(()=>{const r=document.querySelector('${root}').getBoundingClientRect(),h=document.querySelector('h1').getBoundingClientRect();return {imageFirst:r.top<h.top,imageRight:r.left>h.left};})()`);assert.ok(width<1024?layout.imageFirst:layout.imageRight);
  const shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(os.tmpdir(),'dcorhome-clean-hero-'+width+'.png'),Buffer.from(shot.data,'base64'));
 }
 // Hover must not suspend playback. Observe all real scenes and wraparound, without fake clocks.
 const rect=await evaluate(`(()=>{const r=document.querySelector('${active}').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};})()`);
 await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:rect.x+rect.w*.5,y:rect.y+rect.h*.5});
 await wait(`document.querySelector('${root}').dataset.autoplay==='true'`);
 for(let n=0;n<10;n++){
  assert.equal(await scene(),n);
  await wait(`Number(document.querySelector('${active} [role=slider]').getAttribute('aria-valuenow'))>=94`);assert.equal(await scene(),n);
  await delay(500);assert.ok(await value()>=94,'After view should hold');
  await wait(`document.querySelector('${root}').dataset.activePair==='${(n+1)%10}'`);
  assert.ok(await value()<=10,'Incoming room must reset predominantly before');
  assert.ok(await evaluate(`[...document.querySelectorAll('${active} img')].every(i=>i.complete&&i.naturalWidth)`));
  console.log('Automatic scene',n+1,'reveal/hold/ready transition PASS');
 }
 assert.equal(await scene(),0);console.log('All ten scenes and wraparound while hovered PASS');
 // Mouse interaction, hold and smooth resume without a reset.
 await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,x:rect.x+rect.w*.5,y:rect.y+rect.h*.5});
 await call('Input.dispatchMouseEvent',{type:'mouseMoved',button:'left',buttons:1,x:rect.x+rect.w*.3,y:rect.y+rect.h*.5});
 await delay(1200);assert.ok(Math.abs(await value()-30)<=2);assert.equal(await evaluate(`document.querySelector('${root}').dataset.autoplay`),'false');
 await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,x:rect.x+rect.w*.3,y:rect.y+rect.h*.5});
 const dragged=await value();await delay(1800);assert.equal(await value(),dragged);await wait(`document.querySelector('${root}').dataset.autoplay==='true'`);assert.ok(Math.abs(await value()-dragged)<=2);await delay(1700);assert.ok(await value()>dragged+5);
 // Real keyboard focus pauses; Escape resumes after the idle delay.
 await evaluate(`document.querySelector('${active} [role=slider]').focus()`);
 await evaluate(`document.querySelector('${active} [role=slider]').dispatchEvent(new KeyboardEvent('keydown',{key:'Home',bubbles:true}))`);assert.equal(await value(),0);await delay(5500);assert.equal(await value(),0);
 await evaluate(`document.querySelector('${active} [role=slider]').dispatchEvent(new KeyboardEvent('keydown',{key:'End',bubbles:true}))`);assert.equal(await value(),100);
 await evaluate(`document.querySelector('${active} [role=slider]').dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`);await wait(`document.querySelector('${root}').dataset.autoplay==='true'`);
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await delay(100);const frozen=await value(),frozenScene=await scene();await delay(1000);assert.equal(await value(),frozen);assert.equal(await scene(),frozenScene);
 console.log('Mouse drag, five-second resume, keyboard endpoints/Escape and reduced motion PASS');
 await go('/',390);await call('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
 const r=await evaluate(`(()=>{const r=document.querySelector('${active}').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})()`);
 await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.w*.5,y:r.y+r.h*.5}]});await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:r.x+r.w*.25,y:r.y+r.h*.5}]});await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await delay(100);assert.ok(Math.abs(await value()-25)<=2);
 assert.equal(await evaluate(`document.documentElement.scrollWidth>innerWidth`),false);console.log('Mobile touch and no overflow PASS');
};
