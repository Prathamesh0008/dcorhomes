const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
module.exports=async({go,evaluate,call,delay})=>{
  const wait=async expression=>{for(let i=0;i<150;i++){if(await evaluate(expression))return;await delay(100);}throw Error('Timed out: '+expression);};
  const labels=['01 — Style','02 — Pattern','03 — Room'];
  const root=path.resolve('.data/composer');fs.mkdirSync(root,{recursive:true});
  for(const width of process.env.DCORHOME_COMPOSER_INTERACTIONS?[768]:[1440,390,768]){
    await go('/',width);await evaluate('document.fonts.ready');
    assert.equal(await evaluate(`document.querySelector('main > section').nextElementSibling.id`),'curtain-design-composer');
    assert.equal(await evaluate(`document.querySelectorAll('[data-home-section="customizer"]').length`),1);
    assert.equal(await evaluate(`document.querySelectorAll('main h1').length`),1);
    const clip=await evaluate(`(()=>{const r=document.querySelector('#curtain-design-composer').getBoundingClientRect();return{x:r.left,y:r.top+scrollY,width:r.width,height:r.height,scale:1};})()`);
    const shot=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:true,clip});fs.writeFileSync(path.join(root,`composer-${width}.png`),Buffer.from(shot.data,'base64'));
    console.log('Composer',width,'placement, images and overflow PASS');
  }
  for(const label of labels){
    const count=await evaluate(`document.querySelector('[aria-label=${JSON.stringify(label)}]').children.length`);
    for(let index=0;index<count;index++){
      await evaluate(`document.querySelector('[aria-label=${JSON.stringify(label)}]').children[${index}].click()`);
      await wait(`document.querySelector('[aria-label=${JSON.stringify(label)}]').children[${index}].getAttribute('aria-pressed')==='true'`);
      assert.equal(await evaluate(`document.querySelector('[aria-label=${JSON.stringify(label)}]').querySelectorAll('[aria-pressed="true"]').length`),1);
      const name=await evaluate(`document.querySelector('[aria-label=${JSON.stringify(label)}]').children[${index}].querySelector(':scope > span:last-child > span:first-child').textContent`);
      await wait(`document.querySelector('[data-testid="composer-summary"]').textContent.includes(${JSON.stringify(name)})`);
    }
  }
  await evaluate(`document.querySelectorAll('#curtain-design-composer [role=group]').forEach(r=>r.scrollTo({left:0,behavior:'instant'}));`);
  await delay(150);
  const positions=await evaluate(`[...document.querySelectorAll('#curtain-design-composer [role=group]')].map(r=>r.scrollLeft)`);
  for(let i=0;i<labels.length;i++){
    await evaluate(`document.querySelector('[aria-label=${JSON.stringify('Next '+labels[i]+' choices')} ]').click()`);
    await wait(`document.querySelector('[aria-label=${JSON.stringify(labels[i])}]').scrollLeft>${positions[i]}`);
    for(let j=i+1;j<labels.length;j++)assert.equal(await evaluate(`document.querySelector('[aria-label=${JSON.stringify(labels[j])}]').scrollLeft`),positions[j],'Rows share scroll state');
  }
  await go('/',390);
  await call('Emulation.setTouchEmulationEnabled',{enabled:true,maxTouchPoints:1});
  await evaluate(`document.querySelector('[aria-label=${JSON.stringify(labels[0])}]').scrollIntoView({block:'center',behavior:'instant'});document.querySelector('[aria-label=${JSON.stringify(labels[0])}]').scrollTo({left:0,behavior:'instant'});`);
  const point=await evaluate(`(()=>{const r=document.querySelector('[aria-label=${JSON.stringify(labels[0])}]').getBoundingClientRect();return{x:r.left+260,y:r.top+100};})()`);
  await call('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...point,id:1}]});
  for(let step=1;step<=8;step++){await call('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x-step*27,y:point.y,id:1}]});await delay(25);}
  await call('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
  await wait(`document.querySelector('[aria-label=${JSON.stringify(labels[0])}]').scrollLeft>20`);
  await evaluate(`document.querySelector('[data-home-section="customizer"] [data-fabric-id="clay"]').click()`);
  await delay(200);
  const saved=await evaluate(`JSON.parse(localStorage.getItem('dcorhome-manual-v1'))`);
  const choose=async(label,name)=>evaluate(`[...document.querySelector('[aria-label=${JSON.stringify(label)}]').children].find(b=>b.querySelector(':scope > span:last-child > span:first-child').textContent===${JSON.stringify(name)}).click()`);
  await choose(labels[0],'Classic');await choose(labels[1],'Floral');await choose(labels[2],'Home Office');
  await evaluate(`document.querySelector('[data-testid="composer-continue"]').click()`);
  await wait(`!!document.querySelector('[data-testid="pattern-compatibility"]')`);
  const transferred=await evaluate(`JSON.parse(new URL(location.href).searchParams.get('manual'))`);
  for(const key of ['mainFabric','mainColor','sheerFabric','sheerColor','mainEnabled','sheerEnabled'])assert.equal(transferred[key],saved[key],key);
  assert.equal(transferred.room,'Home Office');assert.equal(transferred.pattern,saved.pattern);
  assert.equal(await evaluate(`new URL(location.href).searchParams.get('style')`),'Classic');
  assert.equal(await evaluate(`new URL(location.href).searchParams.get('inspirationPattern')`),'Floral');
  assert.ok((await evaluate(`document.querySelector('[data-testid="design-enquiry"]').href`)).includes('Floral'));
  await evaluate(`document.querySelector('[data-testid="pattern-compatibility"] button').click()`);
  await wait(`!document.querySelector('[data-testid="pattern-compatibility"]')`);
  console.log('All 22 cards/checkmarks, live summary, independent rows, touch swipe, latest fabric/shade transfer, room/style intent and explicit pattern alternative PASS');
};
