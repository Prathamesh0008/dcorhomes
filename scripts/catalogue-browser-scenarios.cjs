const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
module.exports=async function({go,evaluate,call,delay}){
 const wait=async expression=>{for(let i=0;i<300;i++){if(await evaluate(`!!(${expression})`))return;await delay(50);}throw Error('Timed out: '+expression);};
 await go('/collections',1440);
 await evaluate(`[...document.querySelectorAll('nav[aria-label="Fabric categories"] a')].find(a=>a.textContent.startsWith('Silk')).click()`);
 await wait(`location.search.includes('category=silk')&&document.querySelector('article a[href^="/collections/verification-silk?"]')`);
 await evaluate(`document.querySelector('article a[href^="/collections/verification-silk?"]').click()`);
 await wait(`!!document.querySelector('[data-testid=selected-shade]')`);
 assert.ok(await evaluate(`document.body.innerText.includes('280')&&document.body.innerText.includes('180')&&document.body.innerText.includes('Synthetic integration test only')`));
 const before=await evaluate(`document.querySelector('[aria-label="Fabric photograph gallery"] img').getAttribute('src')`);
 await evaluate(`document.querySelector('[aria-label="Fabric color: Test Navy"]').click()`);
 await wait(`document.querySelector('[data-testid=selected-shade]').textContent.includes('TEST-SHADE-NAVY')`);
 assert.notEqual(await evaluate(`document.querySelector('[aria-label="Fabric photograph gallery"] img').getAttribute('src')`),before);
 assert.equal(await evaluate(`new URL(location.href).searchParams.get('shade')`),'test-navy');
 const href=await evaluate(`[...document.querySelectorAll('a')].find(a=>a.textContent==='Enquire on WhatsApp').href`),message=new URL(href).searchParams.get('text');
 for(const value of ['Synthetic verification silk','Test Navy','TEST-NAVY','TEST-SHADE-NAVY','/collections/verification-silk?shade=test-navy'])assert.ok(message.includes(value),value);
 await evaluate(`document.querySelector('[aria-label="Fabric photograph gallery"] button').click()`);await wait(`document.querySelector('dialog[aria-label*="enlarged"]').open`);await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});
 await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Request a Quote').click()`);await wait(`document.querySelector('dialog[aria-labelledby=quote-title]').open`);
 await evaluate(`(()=>{const d=document.querySelector('dialog[aria-labelledby=quote-title]');for(const [name,value]of Object.entries({name:'Synthetic browser verification',email:'browser-test@example.com',phone:'',quantityMetres:'12',message:'Isolated automated test; no notification service.'})){const el=d.querySelector('[name='+name+']');el.value=value;}d.querySelector('[name=consent]').checked=true;window.quotePosts=0;const original=window.fetch;window.fetch=(url,options)=>{if(String(url)==='/api/enquiries'&&options?.method==='POST')window.quotePosts++;return original(url,options);};d.querySelector('form').requestSubmit();d.querySelector('form').requestSubmit();})()`);
 await wait(`document.querySelector('dialog[aria-labelledby=quote-title]').textContent.includes('has been saved')`);assert.equal(await evaluate('window.quotePosts'),1);
 await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Close quote').click()`);
 await evaluate(`[...document.querySelectorAll('summary')].find(b=>b.textContent==='Visualize this Fabric').click()`);await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Design Curtains With This Fabric').click()`);
 await wait(`location.pathname==='/studio'&&document.querySelector('[data-fabric-id=verification-silk]')?.getAttribute('aria-pressed')==='true'`);
 assert.equal(await evaluate(`document.querySelector('[aria-label="main color: Test Navy"]').getAttribute('aria-pressed')`),'true');
 const studioUrl=await evaluate('location.pathname+location.search');await go(studioUrl,1440);await wait(`document.querySelector('[data-fabric-id=verification-silk]')?.getAttribute('aria-pressed')==='true'`);assert.equal(await evaluate(`document.querySelector('[aria-label="main color: Test Navy"]').getAttribute('aria-pressed')`),'true');
 for(const width of [390,768,1440]){
  await go('/collections?category=silk',width);await go('/collections/verification-silk?shade=test-navy',width);
  await wait(`document.querySelector('[data-testid=selected-shade]').textContent.includes('TEST-SHADE-NAVY')`);
  const shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(os.tmpdir(),`dcorhome-catalogue-${width}.png`),Buffer.from(shot.data,'base64'));
 }
 await go('/collections/sienna',390);assert.ok(await evaluate(`document.body.innerText.includes('Approximate digital color visualization')`));
 await go('/collections',390);await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Filter fabrics').click()`);await wait(`document.querySelector('dialog[aria-labelledby=fabric-filters-title]').open`);
 await evaluate(`document.querySelector('dialog input[name=usage][value=sheer]').click()`);await wait(`location.search.includes('usage=sheer')`);
 assert.equal(await evaluate(`document.querySelectorAll('article').length`),2);
 await go('/collections?q=NONEXISTENT-VERIFY',390);assert.ok(await evaluate(`document.body.innerText.includes('No fabrics match')`));
 console.log('Catalogue category/variety/shade flow, matched photos/SKUs, WhatsApp message, real isolated quote + duplicate guard, zoom, Studio transfer, responsive filters and empty states PASS');
};
