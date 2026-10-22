const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict'),path=require('node:path');
const previous=require.extensions['.ts'];require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,file);
const data=require('../lib/curtains/manual-config.ts'),{technicalMatch,emptyTechnicalFilters}=require('../lib/curtains/catalogue-filters.ts');
const base=data.normalizeManual(data.manualDefault),mainKeys=['mainFabric','mainColor','heading','mainEnabled','pattern'];
for(const sheer of data.fabrics.filter(f=>f.usage.includes('sheer')))for(const color of sheer.colors){const next=data.normalizeManual({...base,sheerFabric:sheer.id,sheerColor:color.id});for(const key of mainKeys)assert.equal(next[key],base[key]);}
for(const panels of ['Single','Pair'])for(const curtainLength of ['Floor length','Sill length','Below sill'])for(const fullness of ['1.5','2','2.5']){const next=data.normalizeManual({...base,panels,curtainLength,fullness});assert.equal(next.panels,panels);assert.equal(data.manualSelection(next).curtainLength,curtainLength);assert.equal(data.manualSelection(next).fullness,fullness);assert.deepEqual(data.readManual(data.manualSelection(next)),next);}
assert.equal(data.normalizeManual({...base,panels:'invalid',curtainLength:'invalid',fullness:'100'}).fullness,'2');
const changed=data.normalizeManual({...base,mainFabric:'clay'});assert.equal(changed.sheerFabric,base.sheerFabric);assert.equal(changed.sheerColor,base.sheerColor);assert.equal(changed.mainColor,'Soft Beige');
assert.equal(data.normalizeManual({...base,mainFabric:'clay',pattern:'Striped'}).pattern,'Solid');
for(const record of data.fabrics){assert.ok(record.colors.length);for(const image of record.images)assert.ok(fs.existsSync(path.join('public',image)));if(record.source==='demo'){for(const key of ['sku','fabricWidthCm','weightGsm','composition','pricePerMetre','availability'])assert.equal(record[key],undefined);}}
const synthetic={fabricWidthCm:280,weightGsm:220,composition:'synthetic test record',opacity:'test filtering',pattern:'test pattern'};
assert.equal(technicalMatch(synthetic,{...emptyTechnicalFilters,widthMin:'250',gsmMax:'230'}),true);assert.equal(technicalMatch(synthetic,{...emptyTechnicalFilters,widthMax:'150'}),false);assert.equal(technicalMatch(undefined,{...emptyTechnicalFilters,gsmMin:'1'}),false);assert.equal(technicalMatch(synthetic,{...emptyTechnicalFilters,composition:'other'}),false);
for(const file of ['room','main','sheer','bedroom','dining','office','guest','nursery'])assert.ok(fs.existsSync(`public/images/curtains/manual/${file}.webp`),'Missing manual asset '+file);
if(previous)require.extensions['.ts']=previous;else delete require.extensions['.ts'];
console.log('Manual palette independence, compatible defaults, demo-data separation, technical filters and layered assets PASS');
