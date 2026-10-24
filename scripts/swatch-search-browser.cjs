// One focused catalogue journey, not a full-site E2E suite.
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
module.exports=async({go,evaluate,call,delay})=>{
 const wait=async e=>{for(let i=0;i<80;i++){if(await evaluate(e))return;await delay(100);}throw Error('Browser wait: '+e);};
 const cards=()=>evaluate(`document.querySelectorAll('[data-testid=swatch-card]').length`);
 const changeSelect=async(label,value)=>{await evaluate(`(()=>{const e=document.querySelector('select[aria-label="${label}"]');e.value='${value}';e.dispatchEvent(new Event('change',{bubbles:true}));})()`);};
 await go('/collections?collection=Synthetic%20collection&size=12',1440);assert.equal(await cards(),12);
 assert.equal(await evaluate(`getComputedStyle(document.querySelector('[data-testid=swatch-grid]')).gridTemplateColumns.split(' ').length`),6);
 assert.equal(await evaluate(`Math.round(document.querySelector('[data-testid=swatch-card] a > div').getBoundingClientRect().width)===Math.round(document.querySelector('[data-testid=swatch-card] a > div').getBoundingClientRect().height)`),true);
 assert.equal(await evaluate(`document.querySelector('h1').textContent`),'Fabric Swatch Search');
 const shot=async name=>{const r=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(os.tmpdir(),'dcorhome-swatches-'+name+'.png'),Buffer.from(r.data,'base64'));};await shot('desktop');
 // Multi-select OR within colour; other groups AND. Counts exclude the group's own selections.
 await evaluate(`(()=>{const e=[...document.querySelectorAll('aside label')].find(e=>e.textContent.trim().startsWith('Blue'));e.querySelector('input').click();})()`);
 await wait(`new URL(location.href).searchParams.get('color')==='Blue'&&document.querySelector('[role=status]').textContent.includes('15')`);
 await evaluate(`(()=>{const e=[...document.querySelectorAll('aside label')].find(e=>e.textContent.trim().startsWith('Cream'));e.querySelector('input').click();})()`);
 await wait(`new URL(location.href).searchParams.getAll('color').length===2&&document.querySelector('[role=status]').textContent.includes('30')`);
 await changeSelect('Sort fabrics','code');await wait(`new URL(location.href).searchParams.get('sort')==='code'`);
 await evaluate(`document.querySelector('button[aria-label="Set descending direction"]').click()`);await wait(`new URL(location.href).searchParams.get('direction')==='desc'`);
 await evaluate(`document.querySelector('a[aria-label="Next page"]').click()`);await wait(`new URL(location.href).searchParams.get('page')==='2'`);assert.equal(await cards(),12);
 await changeSelect('Items per page','24');await wait(`new URL(location.href).searchParams.get('size')==='24'&&document.querySelectorAll('[data-testid=swatch-card]').length===24`);
 await evaluate(`history.back()`);await wait(`new URL(location.href).searchParams.get('size')==='12'&&document.querySelectorAll('[data-testid=swatch-card]').length===12`);
 await evaluate(`history.forward()`);await wait(`new URL(location.href).searchParams.get('size')==='24'&&document.querySelectorAll('[data-testid=swatch-card]').length===24`);
 await evaluate(`document.querySelector('button[aria-label="Remove Colour: Blue"]').click()`);await wait(`new URL(location.href).searchParams.getAll('color').length===1&&document.querySelector('[role=status]').textContent.includes('15')`);
 await evaluate(`(()=>{const e=[...document.querySelectorAll('button')].find(e=>e.textContent==='Clear All');e.click();})()`);await wait(`!new URL(location.href).searchParams.has('color')&&!new URL(location.href).searchParams.has('collection')`);
 await evaluate(`(()=>{const e=document.querySelector('form[role=search] input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'TEST-SKU-17');e.dispatchEvent(new Event('input',{bubbles:true}));})()`);await wait(`document.querySelectorAll('[data-testid=swatch-card]').length===1&&document.querySelector('[data-testid=swatch-card] a').title.includes('TEST-SKU-17')`);
 assert.equal(await evaluate(`document.querySelector('[data-testid=swatch-card] a').getAttribute('href')`),'/collections/swatch-check?shade=shade-17');
 console.log('Shade search, multi-colour OR, group counts, chips/clear, direction, paging/size and URL back/forward PASS');
 await go('/collections?collection=Synthetic%20collection',390);await evaluate(`(()=>{const b=[...document.querySelectorAll('button')].find(e=>e.textContent.startsWith('Filters'));b.click();})()`);assert.ok(await evaluate(`document.querySelector('dialog').open`));
 await evaluate(`(()=>{const e=[...document.querySelectorAll('dialog label')].find(e=>e.textContent.trim().startsWith('Blue'));e.querySelector('input').click();})()`);await wait(`new URL(location.href).searchParams.get('color')==='Blue'`);assert.ok(await evaluate(`document.querySelector('dialog').open`));await shot('mobile-filters');
 await evaluate(`document.querySelector('button[aria-label="Close filters"]').click()`);await shot('mobile');assert.equal(await evaluate(`document.documentElement.scrollWidth>innerWidth`),false);
 await go('/collections/swatch-check?shade=shade-0',390);await wait(`document.querySelector('[data-testid=fabric-viewer] img')?.naturalWidth>0`);
 const before=await evaluate(`document.querySelector('[data-testid=fabric-viewer] img').src`);
 await evaluate(`document.querySelector('button[aria-label="Fabric color: Blue check 01"]').click()`);await wait(`document.querySelector('[data-testid=selected-shade]').textContent.includes('TEST-SKU-1')&&document.querySelector('[data-testid=fabric-viewer] img').src!==${JSON.stringify(before)}`);
 assert.equal(await evaluate(`new URL(location.href).searchParams.get('shade')`),'shade-1');await shot('detail-mobile');
 await wait(`!document.querySelector('button[aria-label="Save fabric shade"]').disabled`);await evaluate(`document.querySelector('button[aria-label="Save fabric shade"]').click()`);await wait(`!!document.querySelector('button[aria-label="Remove saved shade"]')`);
 await evaluate(`document.querySelector('[data-testid=fabric-viewer] button').click()`);assert.ok(await evaluate(`[...document.querySelectorAll('dialog')].some(e=>e.open&&e.getAttribute('aria-label')?.includes('enlarged'))`));await evaluate(`(()=>{const e=[...document.querySelectorAll('button')].find(e=>e.textContent==='Close zoom');e.click();})()`);
 // Real submissions go only to isolated local storage; email is disabled by runner.
 for(const purpose of ['swatch','quote']){
  await evaluate(`(()=>{const e=[...document.querySelectorAll('button')].find(e=>e.textContent==='${purpose==='swatch'?'Request a Swatch':'Request a Quote'}');e.click();})()`);
  assert.ok(await evaluate(`document.querySelector('dialog[open] textarea').value.includes('TEST-SKU-1')`));
  await evaluate(`(async()=>{const f=document.querySelector('dialog[open] form');for(const [name,value]of [['name','Synthetic browser check'],['email','swatch-browser@example.com']]){const e=f.querySelector('[name='+name+']');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,value);e.dispatchEvent(new Event('input',{bubbles:true}));}f.querySelector('[name=consent]').click();f.requestSubmit();})()`);
  await wait(`document.querySelector('dialog[open] [role=status]')?.textContent.includes('saved')`);await evaluate(`document.querySelector('dialog[open]').close()`);
 }
 await go('/collections/saved',390);await wait(`document.body.textContent.includes('Blue check 01')`);assert.ok(await evaluate(`document.querySelector('a[href*="shade=shade-1"]')!==null`));
 console.log('Mobile drawer, shade image/SKU/URL changes, zoom, guest saves and real variant-specific swatch/quote submission PASS');
};
