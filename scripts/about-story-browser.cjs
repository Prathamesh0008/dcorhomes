const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
module.exports = async ({go, evaluate, call, delay}) => {
  const address='Office no-2, 1st Floor, Wadhwa PBR, Sector 4, Palm Beach Rd, above The Bread Bar, Nerul West, Nerul, Navi Mumbai, Maharashtra 400706.';
  const ensure=(value,message)=>{if(!value)throw Error(message);};
  for(const width of [360,390,768,1024,1440])for(const route of ['/about','/contact']) {
    await go(route,width);
    ensure(await evaluate(`document.querySelectorAll('main h1').length===1`),'Invalid heading '+route);
    const addresses=await evaluate(`[...document.querySelectorAll('address')].map(el=>el.textContent)`);
    ensure(addresses.length===2&&addresses.every(text=>text===address),'Office address mismatch '+route);
    ensure(await evaluate(`!!document.querySelector('main a[href="mailto:sales@dcorhome.com"]')`),'Email missing');
    const maps=await evaluate(`[...document.querySelectorAll('a[href^="https://www.google.com/maps/search/"]')].map(a=>a.href)`);
    ensure(maps.length===2&&maps.every(href=>new URL(href).searchParams.get('query')===address),'Directions address mismatch');
    if(route==='/about') {
      ensure(await evaluate(`document.querySelectorAll('main>section').length===7`),'Expected seven editorial sections');
      ensure(await evaluate(`document.querySelector('h1').textContent==='Two decades of trust.A new way to discover.'`),'Story headline mismatch');
      ensure(await evaluate(`document.title==='About Dcorhome | 20 Years of Curtain Experience'`),'SEO title mismatch');
      ensure(await evaluate(`new URL(document.querySelector('link[rel="canonical"]').href).pathname==='/about'`),'Canonical mismatch');
      ensure(await evaluate(`document.querySelectorAll('[data-about-category]').length===5`),'Fabric edit missing');
      if(width===390||width===1440) {
        const full=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync(path.join(os.tmpdir(),`dcorhome-about-story-full-${width}.png`),Buffer.from(full.data,'base64'));
        const hero=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(os.tmpdir(),`dcorhome-about-story-hero-${width}.png`),Buffer.from(hero.data,'base64'));
      }
    } else ensure(!await evaluate(`document.querySelector('form').checkValidity()`),'Contact validation changed');
    console.log('PASS: layout, images, office/address/maps/email at',route,width);
  }
  await go('/about',1440);
  const hrefs=await evaluate(`[...document.querySelectorAll('[data-about-category]')].map(a=>a.getAttribute('href'))`);
  for(const href of hrefs) {
    const url=new URL(href,'http://localhost');
    const count=await evaluate(`fetch('/api/catalogue?'+${JSON.stringify(url.searchParams.toString())}).then(r=>r.json()).then(data=>data.records.total)`);
    ensure(count>0,'Empty catalogue destination '+href);
  }
  for(const href of ['/collections','/studio','/contact'])ensure(await evaluate(`fetch(${JSON.stringify(href)}).then(r=>r.status===200)`),'Broken route '+href);
  await evaluate(`document.querySelector('#offer-title').scrollIntoView({block:'start',behavior:'instant'})`);await delay(100);
  const fabrics=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(os.tmpdir(),'dcorhome-about-story-fabrics-1440.png'),Buffer.from(fabrics.data,'base64'));
  await go('/about',390);
  await evaluate(`document.querySelector('[aria-label="Open navigation"]').click()`);await delay(100);
  ensure(await evaluate(`!!document.querySelector('dialog[open] a[href="/about"]')`),'About missing in mobile navigation');
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await delay(100);
  ensure(await evaluate(`!document.querySelector('dialog[open]')`),'Mobile close failed');
  console.log('PASS: seven story sections; exact SEO/canonical; five nonempty catalogue destinations; collections/studio/contact routes; mobile About navigation. No forms submitted or external requests made by the checks.');
};
