const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
module.exports=async({go,evaluate,call,delay})=>{
 const ensure=(value,message)=>{if(!value)throw Error(message);};
 const fixture=process.env.DCORHOME_COMPARISON_FIXTURE==='true';
 const active=()=>evaluate(`Number(document.querySelector('[data-testid="hero-comparison-slider"]').dataset.activePair)`);
 const value=()=>evaluate(`Number(document.querySelector('[data-comparison-pair][aria-hidden="false"] [role="slider"]').getAttribute('aria-valuenow'))`);
 const wait=async(expected)=>{for(let i=0;i<70;i++){if(await active()===expected)return;await delay(100);}throw Error('Pair did not change to '+expected);};
 if(!fixture){
  for(const width of [360,390,768,1024,1440]){
   await go('/',width);
   const state=await evaluate(`(()=>{const media=document.querySelector('[data-testid="hero-comparison-slider"]').getBoundingClientRect(),text=document.querySelector('h1').getBoundingClientRect();return {media:{left:media.left,bottom:media.bottom},text:{left:text.left,top:text.top},illustration:document.querySelector('[data-testid="hero-comparison-slider"]').dataset.illustration,count:document.querySelectorAll('[data-comparison-pair]').length}})()`);
   ensure(state.illustration==='true'&&state.count===1,'Unverified pairs published');
   ensure(await evaluate(`(()=>{const labels=[...document.querySelectorAll('[data-comparison-pair][aria-hidden="false"]>span')].slice(0,2).map(el=>el.getBoundingClientRect());return labels[0].right<=labels[1].left})()`),'Comparison labels overlap');
   ensure(width<1024?state.media.bottom<=state.text.top:state.text.left<state.media.left,'Responsive order failed');
   ensure(await evaluate(`document.querySelector('[data-testid="hero-comparison-slider"]').textContent.includes('not a photographed installation')`),'Illustration attribution missing');
   if(width===390||width===1440){const shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(os.tmpdir(),`dcorhome-hero-comparison-${width}.png`),Buffer.from(shot.data,'base64'));}
   if(width===390){
    await call('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
    const box=await evaluate(`(()=>{const r=document.querySelector('[data-comparison-pair][aria-hidden="false"]').getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height}})()`);
    await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.w*.5,y:box.y+box.h*.5}]});
    await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+box.w*.75,y:box.y+box.h*.5}]});
    await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    ensure(await value()>70,'Mobile touch drag failed');
   }
   console.log('PASS production layout/images and honest single illustration at',width);
  }
  await evaluate(`document.querySelector('[data-comparison-pair][aria-hidden="false"] [role="slider"]').focus()`);
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'End',code:'End',windowsVirtualKeyCode:35});ensure(await value()===100,'End failed');
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Home',code:'Home',windowsVirtualKeyCode:36});ensure(await value()===0,'Home failed');
 } else {
  await go('/',1024);await call('Page.bringToFront');
  ensure(await evaluate(`document.querySelector('[data-testid="hero-comparison-slider"]').dataset.pairCount==='3'`),'Fixture did not mount');
  await delay(5700);await wait(1);ensure(await value()===50,'New slide did not start at 50');
  const rect=await evaluate(`(()=>{const r=document.querySelector('[data-comparison-pair][aria-hidden="false"]').getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height}})()`);
  await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:rect.x+rect.w*.5,y:rect.y+rect.h*.5});
  await call('Input.dispatchMouseEvent',{type:'mousePressed',x:rect.x+rect.w*.5,y:rect.y+rect.h*.5,button:'left',clickCount:1});
  await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:rect.x+rect.w*.75,y:rect.y+rect.h*.5,button:'left',buttons:1});
  ensure(Math.abs(await value()-75)<=1,'Drag did not reveal image');
  await delay(5800);ensure(await active()===1,'Pair changed during drag');
  await call('Input.dispatchMouseEvent',{type:'mouseReleased',x:rect.x+rect.w*.75,y:rect.y+rect.h*.5,button:'left',clickCount:1});
  await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});await evaluate(`document.activeElement.blur()`);
  await delay(6200);await wait(2);ensure(await value()===50,'Resume/reset failed');
  await evaluate(`document.querySelector('[aria-label="Previous curtain comparison"]').click()`);await wait(1);ensure(await value()===50,'Revisited pair retained stale divider');
  await evaluate(`document.querySelector('[aria-label="Next curtain comparison"]').click()`);await wait(2);
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await delay(100);
  ensure(await evaluate(`document.querySelector('[aria-label="Autoplay disabled for reduced motion"]').disabled`),'Motion preference ignored');
  await delay(5800);ensure(await active()===2,'Reduced-motion autoplay advanced');
  await evaluate(`document.querySelector('[aria-label="Next curtain comparison"]').click()`);await wait(0);ensure(await value()===50,'Reduced-motion manual navigation failed');
  console.log('PASS isolated repeated-pair fixtures: auto rotation, drag, drag hold, delayed resume, next/previous, reset to 50, wraparound, reduced motion and manual navigation. Fixture data is not published.');
 }
};
