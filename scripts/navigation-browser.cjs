const fs = require('node:fs'), os = require('node:os'), path = require('node:path');
module.exports = async ({ go, evaluate, call, delay }) => {
  const ensure = (value, message) => { if (!value) throw Error(message); };
  for (const width of [360, 390, 430, 768, 1024, 1080, 1280, 1440, 1920]) {
    await go('/about', width);
    const geometry = await evaluate(`(()=>{
      const header=document.querySelector('header'), row=header.firstElementChild;
      const bounds=el=>{const r=el.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,text:el.textContent.trim()}};
      const visible=[...row.children].filter(el=>el.getBoundingClientRect().width>0).map(bounds);
      const links=[...header.querySelectorAll('nav[aria-label="Primary navigation"]>a,nav[aria-label="Primary navigation"]>details')].filter(el=>el.getBoundingClientRect().width>0).map(bounds);
      return {height:header.offsetHeight,visible,links,overflow:document.documentElement.scrollWidth>innerWidth};
    })()`);
    ensure(!geometry.overflow && geometry.height <= 88, 'Header height/overflow '+width+' '+JSON.stringify(geometry));
    for (const items of [geometry.visible, geometry.links]) for (let i=1;i<items.length;i++) ensure(items[i].left>=items[i-1].right-1,'Header collision '+width+' '+JSON.stringify(items));
    ensure(geometry.visible.every(r=>r.left>=0 && r.right<=width), 'Header extends outside viewport '+width+' '+JSON.stringify(geometry));
    if (width>=1024) { ensure(geometry.links.length >= 4, 'Desktop nav missing'); const nav=geometry.visible[1]; ensure(geometry.links.every(r=>r.left>=nav.left-1 && r.right<=nav.right+1),'Nav overflows its column '+width+' '+JSON.stringify(geometry)); }
    await evaluate('window.scrollTo(0,200)'); await delay(150);
    const sticky=await evaluate(`({top:document.querySelector('header').getBoundingClientRect().top,scrolled:document.querySelector('header').dataset.scrolled,height:document.querySelector('header').offsetHeight})`);
    ensure(sticky.top===0 && sticky.scrolled==='true' && sticky.height===geometry.height,'Sticky changed layout');
    await evaluate('window.scrollTo(0,0)'); await delay(100);
    const shot=await call('Page.captureScreenshot',{format:'png'});
    fs.writeFileSync(path.join(os.tmpdir(),`dcorhome-navigation-${width}.png`),Buffer.from(shot.data,'base64'));
    console.log('PASS: one row, geometry, sticky, assets at',width);
  }
  await go('/about',1024);
  await evaluate(`document.querySelector('nav[aria-label="Primary navigation"] summary').focus()`);
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowDown',code:'ArrowDown',windowsVirtualKeyCode:40});
  ensure(await evaluate(`document.activeElement.getAttribute('href')==='/measure'`),'Explore keyboard focus');
  ensure(await evaluate(`document.querySelector('nav[aria-label="Primary navigation"] details').innerText.includes('Contact Us')`),'Laptop secondary links missing');
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});
  ensure(await evaluate(`!document.querySelector('nav[aria-label="Primary navigation"] details').open && document.activeElement.tagName==='SUMMARY'`),'Explore Escape');
  await evaluate(`document.querySelector('header>div>div:nth-last-child(2) summary').click()`); await delay(100);
  ensure(await evaluate(`[...document.querySelectorAll('header details[open] a')].some(a=>a.getAttribute('href')==='/signup')`),'Guest Account dropdown missing signup');
  await evaluate(`document.body.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))`);
  ensure(await evaluate(`!document.querySelector('header details[open]')`),'Outside dropdown dismissal');
  for(const width of [390,768]) {
    await go('/about',width);
    await evaluate(`document.querySelector('[aria-label="Open navigation"]').click()`); await delay(150);
    ensure(await evaluate(`!!document.querySelector('dialog[open]') && document.body.style.overflow==='hidden' && document.activeElement.getAttribute('aria-label')==='Close navigation'`),'Drawer initial focus/scroll lock');
    ensure(await evaluate(`['/','/collections','/studio','/about','/contact','/measure','/inspiration','/faq','/login','/signup'].every(href=>!!document.querySelector('dialog a[href="'+href+'"]'))`),'Drawer links missing');
    const shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(os.tmpdir(),`dcorhome-navigation-drawer-${width}.png`),Buffer.from(shot.data,'base64'));
    await evaluate(`document.querySelector('dialog a:last-of-type').focus()`);
    await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
    ensure(await evaluate(`document.querySelector('dialog').contains(document.activeElement)`),'Drawer focus escaped');
    await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27}); await delay(100);
    ensure(await evaluate(`!document.querySelector('dialog[open]') && document.body.style.overflow==='' && document.activeElement.getAttribute('aria-label')==='Open navigation'`),'Drawer Escape/return focus');
    await evaluate(`document.querySelector('[aria-label="Open navigation"]').click()`);await delay(100);
    await evaluate(`document.querySelector('[aria-label="Close navigation backdrop"]').click()`);await delay(100);
    ensure(await evaluate(`!document.querySelector('dialog[open]')`),'Backdrop dismissal');
    await evaluate(`document.querySelector('[aria-label="Open navigation"]').click()`);await delay(100);
    await evaluate(`document.querySelector('dialog a[href="/about"]').click()`);await delay(100);
    ensure(await evaluate(`!document.querySelector('dialog[open]')`),'Same route dismissal');
  }
  // The server is isolated by phase3-server.cjs; no live accounts or emails.
  await go('/about',1440);
  const created=await evaluate(`fetch('/api/auth/sign-up/email',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Navigation Fixture',email:'nav-'+Date.now()+'@example.com',password:'navigation-fixture-password-123'})}).then(r=>r.status)`);
  ensure(created===200,'Isolated account creation failed');
  await go('/about',1440);
  ensure(await evaluate(`[...document.querySelectorAll('header summary')].some(el=>el.textContent.includes('My Account')) && ![...document.querySelectorAll('header a')].some(a=>a.getAttribute('href')==='/login')`),'Signed-in header failed');
  await evaluate(`[...document.querySelectorAll('header summary')].find(el=>el.textContent.includes('My Account')).click()`); await delay(100);
  ensure(await evaluate(`!!document.querySelector('header details[open] a[href="/account#saved-designs"]')`),'Saved designs account link missing');
  await evaluate(`[...document.querySelectorAll('header details[open] button')].find(b=>b.textContent==='Logout').click()`);await delay(800);
  ensure(await evaluate(`location.pathname==='/login' && [...document.querySelectorAll('header a')].some(a=>a.getAttribute('href')==='/signup')`),'Logout header state failed');
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});
  ensure(await evaluate(`getComputedStyle(document.querySelector('header')).transitionDuration==='0s'`),'Reduced motion ignored');
  console.log('PASS: Explore/Account keyboard and outside dismissal; drawer routes/focus/Tab/Escape/backdrop/selection; real account/logout states; reduced motion.');
};
