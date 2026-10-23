const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
module.exports=async({go,evaluate,call,delay})=>{
 const ensure=(value,message)=>{if(!value)throw Error(message);};
 const active=()=>evaluate(`Number(document.querySelector('[data-testid="hero-curtain-showcase"]').dataset.activeSlide)`);
 const waitSlide=async(index)=>{for(let i=0;i<50;i++){if(await active()===index)return;await delay(100);}throw Error('Slide did not load: '+index);};
 for(const width of [360,390,768,1024,1440,1920]){
  await go('/',width);
  const layout=await evaluate(`(()=>{const root=document.querySelector('[data-testid="hero-curtain-showcase"]'),text=document.querySelector('h1').parentElement,media=root.getBoundingClientRect(),copy=text.getBoundingClientRect();return {media:{x:media.x,y:media.y,width:media.width,height:media.height,bottom:media.bottom},copy:{x:copy.x,y:copy.y,bottom:copy.bottom},header:document.querySelector('header').getBoundingClientRect().bottom,options:root.querySelectorAll('select option').length}})()`);
  ensure(layout.options===10,'Missing supplied images');
  if(width<1024)ensure(layout.media.bottom<=layout.copy.y+1,'Image is not above text at '+width);else ensure(layout.copy.x<layout.media.x,'Desktop columns reversed');
  ensure(layout.media.y>=layout.header,'Header overlaps hero');
  if(width===390||width===1440){const shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(os.tmpdir(),`dcorhome-hero-showcase-${width}.png`),Buffer.from(shot.data,'base64'));}
  console.log('PASS: responsive order, ten slides, header separation and assets at',width);
 }
 await go('/',1440);await call('Page.bringToFront');
 const loaded=await evaluate(`[...new Set(performance.getEntriesByType('resource').filter(r=>r.name.includes('/images/hero/hero-curtain')).map(r=>r.name.match(/hero-curtain-\\d+/)[0]))].length`);
 ensure(loaded<=2,'All slides loaded eagerly');
 await evaluate('document.fonts.ready');
 await evaluate(`window.heroCLS=0;window.heroObserver=new PerformanceObserver(list=>{for(const entry of list.getEntries())if(!entry.hadRecentInput)window.heroCLS+=entry.value});window.heroObserver.observe({type:'layout-shift',buffered:false})`);
 const frame=await evaluate(`document.querySelector('[aria-roledescription="carousel"]').getBoundingClientRect().height`);
 const initial=await active();await delay(5400);ensure(await active()!==initial,'Autoplay did not advance');
 ensure(await evaluate(`document.querySelector('[aria-roledescription="carousel"]').getBoundingClientRect().height`)===frame,'Slide caused frame shift');
 ensure(await evaluate('window.heroCLS')===0,'Autoplay caused layout shift');
 const rect=await evaluate(`(()=>{const r=document.querySelector('[data-testid="hero-curtain-showcase"]').getBoundingClientRect();return {x:r.x+50,y:r.y+50}})()`);
 await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:rect.x,y:rect.y});const hovered=await active();await delay(5400);ensure(await active()===hovered,'Hover pause failed');
 await evaluate(`document.querySelector('[aria-label="Next curtain image"]').click()`);await waitSlide((hovered+1)%10);
 await evaluate(`document.querySelector('[aria-label="Previous curtain image"]').click()`);await waitSlide(hovered);
 await evaluate(`(()=>{const selector=document.querySelector('[aria-label="Choose curtain image"]');selector.value='9';selector.dispatchEvent(new Event('change',{bubbles:true}))})()`);await waitSlide(9);
 await evaluate(`document.querySelector('[aria-label="Next curtain image"]').click()`);await waitSlide(0);
 await evaluate(`document.querySelector('[aria-label="Pause curtain slideshow"]').click()`);await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:1,y:1});await delay(5400);ensure(await active()===0,'Explicit pause failed');
 for(let i=1;i<10;i++){await evaluate(`(()=>{const selector=document.querySelector('[aria-label="Choose curtain image"]');selector.value='${i}';selector.dispatchEvent(new Event('change',{bubbles:true}))})()`);await waitSlide(i);ensure(await evaluate(`(()=>{const image=document.querySelector('[data-testid="hero-curtain-showcase"] [aria-hidden="false"] img');return image.complete&&image.naturalWidth>0})()`),'Broken image '+i);}
 await evaluate(`document.querySelector('[aria-label="Next curtain image"]').focus()`);
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});await waitSlide(0);
 await evaluate(`document.querySelector('[aria-pressed="false"].underline').click()`);await delay(150);
 ensure(await evaluate(`document.querySelector('[data-testid="hero-curtain-showcase"]').dataset.mode==='comparison'`),'Comparison example did not open');
 const slider=await evaluate(`(()=>{const el=document.querySelector('[data-testid="hero-curtain-showcase"] [role="slider"]');el.focus();return Number(el.getAttribute('aria-valuenow'))})()`);
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowRight',code:'ArrowRight',windowsVirtualKeyCode:39});
 ensure(await evaluate(`Number(document.querySelector('[data-testid="hero-curtain-showcase"] [role="slider"]').getAttribute('aria-valuenow'))`)>slider,'Existing comparison keyboard interaction failed');
 ensure(await evaluate(`document.querySelector('[data-testid="hero-curtain-showcase"]').textContent.includes('AI-created room illustration')`),'Illustration provenance missing');
 await evaluate(`document.querySelector('[data-testid="hero-curtain-showcase"]>button').click()`);await delay(100);
 await go('/',390);
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});await delay(100);
 ensure(await evaluate(`document.querySelector('[aria-label="Autoplay disabled for reduced motion"]').disabled`),'Reduced-motion autoplay not disabled');
 await delay(5400);ensure(await active()===0,'Reduced-motion autoplay advanced');
 await evaluate(`document.querySelector('[aria-label="Next curtain image"]').click()`);await waitSlide(1);
 console.log('PASS: five-second autoplay; hover/pause controls; all ten supplied images; selector, next/previous, wrap and keyboard; two initial image requests; zero measured autoplay CLS; honest interactive illustration; reduced motion/manual navigation.');
};
