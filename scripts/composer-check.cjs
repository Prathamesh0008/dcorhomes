const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript'),Module=require('node:module');
const previous=require.extensions['.ts'],resolve=Module._resolveFilename;
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,file);
Module._resolveFilename=function(request,...args){return resolve.call(this,request.startsWith('@/')?path.join(process.cwd(),request.slice(2)):request,...args);};
try {
  const composer=require('../lib/curtains/composer.ts'),manual=require('../lib/curtains/manual-config.ts');
  const base=manual.normalizeManual({...manual.manualDefault,mainFabric:'clay',mainColor:'Soft Beige'});
  assert.equal(composer.composerStyles.length,8);assert.equal(composer.composerPatterns.length,8);assert.equal(composer.composerRooms.length,6);
  const newSources=JSON.parse(fs.readFileSync('public/images/composer/sources.json','utf8'));
  const homeSources=JSON.parse(fs.readFileSync('public/images/home/sources.json','utf8'));
  const baseSources=require('../lib/assets.ts').assetManifest;
  const manifest=[];
  for(const [group,items]of [['Style',composer.composerStyles],['Pattern',composer.composerPatterns],['Room',composer.composerRooms]])for(const item of items){
    assert.ok(fs.existsSync('public'+item.image),item.image);
    const stem=path.basename(item.image).replace(/-640\.webp$/, '').replace(/\.webp$/,'');
    const source=newSources.find(s=>s.file===item.image)||homeSources.find(s=>s.file===stem)||baseSources.find(s=>s.file===stem);
    assert.ok(source?.source&&source?.license,item.image+' has no verified source/license');
    manifest.push({group,name:item.value,file:item.image,source:source.source,license:source.license,usage:group==='Pattern'?'Pattern inspiration, not verified inventory':group==='Room'?'Curtain preview context only':'Editorial aesthetic direction, not a manufacturing specification'});
  }
  for(const style of composer.composerStyles)for(const pattern of composer.composerPatterns)for(const room of composer.composerRooms){
    const chosen={style:style.value,pattern:pattern.value,room:room.value};
    const transfer=composer.composerTransfer(chosen,base,manual.fabrics);
    for(const key of Object.keys(base).filter(k=>!['room','pattern'].includes(k)))assert.equal(transfer.manual[key],base[key],key);
    assert.equal(transfer.manual.room,room.value);
    assert.equal(transfer.manual.pattern,transfer.compatible?pattern.value:base.pattern);
    const url=new URL(composer.composerHref(chosen),'https://example.test');
    assert.equal(url.searchParams.get('style'),style.value);assert.equal(url.searchParams.get('inspirationPattern'),pattern.value);
    assert.equal(url.searchParams.has('manual'),false,'Intent URL must not freeze an old fabric selection');
  }
  const floral={...manual.fabrics.find(f=>f.usage.includes('main')),id:'synthetic-floral',pattern:'Floral'};
  const records=[...manual.fabrics,floral],current=manual.normalizeManual({...base,mainFabric:floral.id},records);
  assert.equal(composer.composerTransfer({style:'Modern',pattern:'Floral',room:'Nursery'},current,records).compatible,true);
  assert.deepEqual(composer.validateComposer({style:'<invalid>',pattern:'not-real',room:'Garage'}),composer.composerDefault);
  fs.writeFileSync('public/images/composer/manifest.json',JSON.stringify(manifest,null,2)+'\n');
  const original=require('node:child_process').execFileSync('git',['show','HEAD:app/page.tsx'],{encoding:'utf8'}).replace(/\r\n/g,'\n');
  const changed=fs.readFileSync('app/page.tsx','utf8').replace(/\r\n/g,'\n');
  const hero=text=>text.slice(text.indexOf('      <section className="bg-[#f3efe6]">'),text.indexOf('      </section>')+'      </section>'.length);
  assert.equal(hero(changed),hero(original),'Hero markup changed');
  console.log('All 384 inspiration combinations, fresh-state URL transfer, preserved fabric/shades, supported Floral fixture, source/license manifest and unchanged hero PASS');
} finally {Module._resolveFilename=resolve;if(previous)require.extensions['.ts']=previous;else delete require.extensions['.ts'];}
