const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, esModuleInterop: true},
}).outputText, file);
const {libraryRecords} = require('../lib/manual-visualizer/library.ts');
const {scenes, materials, studioPhotoScenes, constructions, demoColors} = require('../lib/manual-visualizer/manifest.ts');
const {resolveLayer, validateDesign, defaultDesign, designSummary, designPreviewKey, materialShades, matchingMaterialShade, availableMaterial, photoSheerSelection} = require('../lib/manual-visualizer/model.ts');
const {composeDesign} = require('../lib/manual-visualizer/renderer.ts');
const {renderCapability} = require('../lib/manual-visualizer/types.ts');
const library = require('../lib/manual-visualizer/library-assets.json');
const {configurationReducer,restoreStudioVisit}=require('../lib/manual-visualizer/configuration.ts');
const {recommendedSheerColors}=require('../lib/manual-visualizer/sheer-shades.ts');
const {sheerPatterns}=require('../lib/manual-visualizer/sheer-patterns.ts');
const {mirroredCoordinate,textileLuminance,clothLighting}=require('../lib/manual-visualizer/sampling.ts');
const records = require('../lib/curtains/manual-config.ts').fabrics;
const root = path.resolve(__dirname, '..');
const digest = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
(async () => {
  assert.equal(libraryRecords.length, library.fabrics.length+sheerPatterns.length);
  let shades = 0;
  for (const fabric of libraryRecords) {
    assert.equal(fabric.source, 'demo');
    assert.equal(fabric.sku, undefined);
    assert.equal(fabric.colors.length, fabric.usage.includes('sheer')?11:10);
    const material = materials.find(entry => entry.fabricId === fabric.id);
    const options = materialShades(material, fabric);
    if(material.patternTexture){
      const tile=await require('sharp')(path.join(root,'public',material.patternTexture)).stats();
      assert.equal(tile.channels[3].min,0,material.name+' has transparent gaps');
      assert.equal(tile.channels[3].max,255,material.name+' has defined stitches');
      assert.ok(tile.channels[3].mean>8&&tile.channels[3].mean<125,material.name+' remains an open weave');
      assert.deepEqual(options.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(color=>color.name),[
        'Blush Pink','Champagne Gold','Cream','Golden Beige','Lavender','Light Sand','Pure White','Sage Green','Sky Blue','Soft Ivory','Warm Grey',
      ]);
    }
    for (const variant of fabric.colors) {
      assert.equal(variant.available, null);
      const resolved = resolveLayer({enabled:true, materialId:fabric.id, fabricId:fabric.id, variantId:variant.id}, []);
      assert.equal(resolved.commercial, false);
      assert.equal(resolved.variant.textureImage, variant.textureImage);
      assert.equal(matchingMaterialShade(options, variant.id, variant.name)?.textureImage, variant.textureImage);
      assert.equal(matchingMaterialShade(options, 'legacy-id', variant.name.toUpperCase())?.textureImage, variant.textureImage);
      assert.ok(fs.existsSync(path.join(root, 'public', variant.textureImage)));
      shades++;
    }
  }
  const sheerAssets=new Set([constructions.sheer.fold,constructions.sheer.mask]);
  const {visualizerFabric}=require('../lib/manual-visualizer/library.ts');
  const sheerMaterials=materials.filter(material=>material.layer==='sheer'&&availableMaterial(material,records));
  assert.equal(sheerMaterials.length,19);
  for(const material of sheerMaterials){
    const fabric=visualizerFabric(material.fabricId,records);
    const selection={enabled:true,materialId:material.id,fabricId:fabric.id};
    for(const asset of [material.texture,material.thumbnail,material.opacityMap,material.patternTexture])if(asset)sheerAssets.add(asset);
    for(const shade of materialShades(material,fabric).filter(shade=>shade.available!==false)){
      const resolved=resolveLayer({...selection,variantId:shade.id},records);
      if(resolved.variant.textureImage)sheerAssets.add(resolved.variant.textureImage);
    }
    if(material.colorMode==='tint'){
      for(const colour of demoColors)assert.equal(resolveLayer({...selection,previewColorId:colour.id},records).hex,colour.hex);
    }
  }
  for(const asset of sheerAssets){
    const decoded=await require('sharp')(path.join(root,'public',asset)).raw().toBuffer({resolveWithObject:true});
    assert.ok(decoded.data.length>0&&decoded.info.width>0,asset+' must decode');
  }
  const fabric = libraryRecords[0], material = materials.find(entry => entry.fabricId === fabric.id);
  const [unavailable, inactive, missingTexture] = fabric.colors;
  const restricted = materialShades(material, {...fabric, colors: [
    {...unavailable, available: false}, {...inactive, active: false}, {...missingTexture, textureImage: undefined},
  ]});
  assert.deepEqual(restricted.map(variant => variant.id), [unavailable.id]);
  assert.equal(matchingMaterialShade(restricted, unavailable.id, unavailable.name), undefined);
  assert.deepEqual(validateDesign(defaultDesign, []), defaultDesign);
  assert.equal(photoSheerSelection(defaultDesign),null);
  const explicitSheer=configurationReducer(defaultDesign,{type:'layer',layer:'sheer',value:defaultDesign.sheer});
  assert.equal(photoSheerSelection(explicitSheer),defaultDesign.sheer);
  assert.throws(() => validateDesign({...defaultDesign,main:defaultDesign.sheer}, []), /does not match/);
  const silk = {enabled:true,materialId:'library-main-silk',fabricId:'library-main-silk',variantId:null};
  const silkDraft = {...defaultDesign, main:silk};
  assert.deepEqual(validateDesign(silkDraft, []), silkDraft);
  assert.equal(designPreviewKey(silkDraft, true), designPreviewKey(defaultDesign, true));
  const silkPreview = {...silkDraft, main:{...silk,variantId:'burgundy'}};
  assert.notEqual(designPreviewKey(silkPreview, true), designPreviewKey(silkDraft, true));
  const blueSheer={...defaultDesign.sheer,variantId:'pale-blue'};
  assert.equal(designPreviewKey({...silkDraft,sheer:blueSheer},true),designPreviewKey(silkDraft,true));
  assert.notEqual(designPreviewKey({...silkDraft,sheer:blueSheer,sheerColorMode:'manual'},true),designPreviewKey(silkDraft,true));
  assert.notEqual(designPreviewKey({...silkPreview,sheer:blueSheer},true),designPreviewKey(silkPreview,true));
  assert.notEqual(designPreviewKey({...silkPreview,sheer:{...blueSheer,enabled:false}},true),designPreviewKey(silkPreview,true));
  const voile=libraryRecords.find(record=>record.id==='library-sheer-plain-voile').colors;
  for(const [main,names] of Object.entries({
    Burgundy:['Golden Beige','Champagne Gold','Soft Ivory'],
    'Navy Blue':['Pure White','Soft Ivory','Warm Grey'],
    'Olive Green':['Cream','Light Sand','Champagne Gold'],
    Mocha:['Golden Beige','Soft Ivory','Cream'],
    Ivory:['Soft Ivory','Champagne Gold','Pure White'],
  }))assert.deepEqual(recommendedSheerColors(voile,main).map(color=>color.name),names);
  assert.deepEqual(recommendedSheerColors(voile.map(color=>({...color,disabled:color.name==='Soft Ivory'})),'Burgundy').map(color=>color.name),['Golden Beige','Champagne Gold']);
  const navy={type:'layer',layer:'main',value:{...silk,variantId:'navy-blue'}};
  const automatic=configurationReducer(silkPreview,navy);
  assert.equal(automatic.sheer.variantId,'pure-white','A different main shade updates the automatic sheer');
  const mainOff=configurationReducer(automatic,{...navy,value:{...navy.value,enabled:false}});
  assert.notEqual(designPreviewKey(mainOff,true),designPreviewKey(defaultDesign,true),'Disabling main curtains retains the customized sheer');
  const manual=configurationReducer(automatic,{type:'layer',layer:'sheer',value:blueSheer,sheerColorMode:'manual'});
  assert.equal(configurationReducer(manual,{...navy,value:silkPreview.main}).sheer.variantId,'pale-blue');
  assert.equal(configurationReducer(manual,{type:'layer',layer:'sheer',value:manual.sheer,sheerColorMode:'auto'}).sheer.variantId,'pure-white');
  const {sheerColorMode,...legacySelection}={...silkPreview,sheer:blueSheer};
  assert.deepEqual(validateDesign(legacySelection,[]),legacySelection);
  assert.equal(configurationReducer(legacySelection,navy).sheer.variantId,'pale-blue');
  const legacyDraft={...legacySelection,sheer:{...defaultDesign.sheer,enabled:false,variantId:'soft-ivory'}};
  const restoredDraft=restoreStudioVisit(legacyDraft);
  assert.equal(restoredDraft.sheerColorMode,'auto');
  assert.equal(restoredDraft.sheer.enabled,true);
  const burgundy={type:'layer',layer:'main',value:silkPreview.main};
  const configured=configurationReducer(restoredDraft,burgundy);
  assert.equal(configured.sheer.variantId,'light-beige');
  const optedOut=configurationReducer(configured,{type:'layer',layer:'sheer',value:{...configured.sheer,enabled:false}});
  const reopened=restoreStudioVisit(validateDesign(optedOut,[]));
  assert.equal(configurationReducer(reopened,navy).sheer.enabled,false,'An explicit opt-out survives reload and main changes');
  const optedIn=configurationReducer(configurationReducer(reopened,navy),{type:'layer',layer:'sheer',value:{...reopened.sheer,enabled:true}});
  assert.equal(optedIn.sheerOptOut,undefined);
  assert.equal(optedIn.sheer.variantId,'pure-white');
  const restoredManual=restoreStudioVisit({...legacySelection,sheer:{...blueSheer,enabled:false}});
  assert.equal(configurationReducer(restoredManual,burgundy).sheer.variantId,'pale-blue','Restoring defaults retains legacy hand-picked shades');
  assert.throws(() => resolveLayer({...silk,variantId:'missing'}, []), /shade/);
  for (const scene of scenes.filter(s => s.previewSupport === 'base-only')) {
    assert.ok(fs.existsSync(path.join(root, 'public', scene.base)));
    assert.ok(fs.existsSync(path.join(root, 'public', scene.thumbnail)));
    const design = {...defaultDesign, sceneId:scene.id};
    assert.equal(validateDesign(design, []).sceneId, scene.id); // Saving selections is allowed.
    assert.match(designSummary(design, []), /NOT been rendered/);
    await assert.rejects(composeDesign(design, []), /Room view only|Room inspiration only/);
  }
  assert.equal(scenes.filter(s => renderCapability(s).mode === 'room-only').length, 8);
  assert.equal(scenes.filter(s => renderCapability(s).mode === 'unavailable').length, 9);
  const live = scenes.filter(s => !s.photo && renderCapability(s).comparison);
  assert.deepEqual(live.map(scene => scene.id), ['room-01', 'room-09', 'garden-living']);
  for (const scene of live) {
    const sharp = require('sharp');
    const {x, y, width, height} = scene.window;
    assert.ok(x >= 0 && y >= 0 && width > 0 && height > 0 && x + width <= 1 && y + height <= 1);
    for (const {fold, mask, foldCrop} of Object.values(scene.construction)) {
      const image = await sharp(path.join(root, 'public', fold)).metadata();
      const alpha = await sharp(path.join(root, 'public', mask)).metadata();
      assert.deepEqual([alpha.width, alpha.height], [image.width, image.height]);
      assert.ok(foldCrop.x + foldCrop.width <= image.width && foldCrop.y + foldCrop.height <= image.height);
    }
    if (scene.id !== 'garden-living') assert.ok(scene.foreground.outline);
    const image = await sharp(path.join(root, 'public', scene.base)).metadata();
    assert.deepEqual([image.width, image.height], [scene.width, scene.height]);
  }
  const {heroComparisonSlides} = require('../lib/hero-comparisons.ts');
  assert.deepEqual(studioPhotoScenes.map(s=>s.id),heroComparisonSlides.map(s=>s.id));
  for (const [i,scene] of studioPhotoScenes.entries()) {
    const slide=heroComparisonSlides[i],sharp=require('sharp');
    if(scene.id==='hero-03'){
      for(const [view,original,edited] of [['before',slide.beforeSrc,scene.base],['after',slide.afterSrc,scene.photo.after]]){
        assert.equal(edited,'/images/manual-visualizer/atelier-v2/rooms/hero-03/'+view+'.webp');
        const [source,retouched]=await Promise.all([original,edited].map(src=>sharp(path.join(root,'public',src)).raw().toBuffer({resolveWithObject:true})));
        assert.deepEqual(retouched.info,source.info);
        const {width,height,channels}=source.info;
        const stride=width*channels;
        for(let y=0;y<height;y++){
          const start=y*stride,end=start+stride;
          if(y<468||y>=864){
            assert.ok(source.data.subarray(start,end).equals(retouched.data.subarray(start,end)));
          }else{
            assert.ok(source.data.subarray(start,start+600*channels).equals(retouched.data.subarray(start,start+600*channels)));
            assert.ok(source.data.subarray(start+905*channels,end).equals(retouched.data.subarray(start+905*channels,end)));
          }
        }
        const vase=(Math.round(310*height/450)*width+Math.round(315*width/600))*channels;
        assert.notDeepEqual(retouched.data.subarray(vase,vase+channels),source.data.subarray(vase,vase+channels));
      }
    }else{
      assert.equal(scene.base,slide.beforeSrc);
      assert.equal(scene.photo.after,slide.afterSrc);
    }
    assert.ok(scene.photo.mainMask.panels.length>=2,scene.id+' needs an aligned main-curtain mask');
    for (const src of [scene.base,scene.photo.after]) {
      const image=await sharp(path.join(root,'public',src)).metadata();
      assert.deepEqual([image.width,image.height],[1448,1086]);
    }
    const thumbnail=await sharp(path.join(root,'public',scene.thumbnail)).metadata();
    assert.deepEqual([thumbnail.width,thumbnail.height],[640,480]);
  }
  for (const file of library.files) {
    const input = path.join(root, 'assets/dcorhome-manual-visualizer', file.path);
    const runtime = path.join(root, 'public/images/manual-visualizer/library-v1', file.path);
    assert.equal(digest(input), file.sha256);
    assert.equal(digest(runtime), file.sha256);
  }
  // Earlier supported catalogue selections remain valid against original records.
  const legacy = {...defaultDesign, main:{enabled:true,materialId:'linen',fabricId:'sienna',previewColorId:'preview-ivory'},
    sheer:{enabled:true,materialId:'plain-voile',fabricId:'solstice',previewColorId:'preview-white'}};
  assert.deepEqual(validateDesign(legacy, records), legacy);
  const {rendererVersion: previousRenderer,...unversioned}=legacy;
  assert.equal(validateDesign(unversioned, records).rendererVersion,'atelier-2');
  assert.throws(()=>validateDesign({...legacy,rendererVersion:'future-renderer'},records),/unavailable/);
  const sheer=configurationReducer(defaultDesign,{type:'layer',layer:'sheer',value:{...defaultDesign.sheer,enabled:false}});
  assert.equal(sheer.main,defaultDesign.main);
  assert.equal(defaultDesign.sheer.enabled,true,'selection reducer must not mutate saved configurations');
  const moved=configurationReducer(sheer,{type:'scene',id:'room-09'});
  assert.equal(moved.main,sheer.main);assert.equal(moved.sheer,sheer.sheer);
  assert.equal(mirroredCoordinate(255),mirroredCoordinate(256));
  assert.equal(mirroredCoordinate(511),mirroredCoordinate(512));
  assert.equal(mirroredCoordinate(-1),0);
  const flat=new Uint8ClampedArray(16*16*4).fill(128),detail=textileLuminance(flat,16);
  assert.ok(detail.every(value=>Math.abs(value-1)<.00001),'neutral cloth must not invent weave or swatch lighting');
  assert.ok(clothLighting(.2,.18)<clothLighting(.8,.18),'real fold map must control the lighting');
  assert.ok(materials.some(m => m.id === 'linen'));
  console.log(`PASS: ten native homepage pairs and thumbnail derivatives, ${shades} optimized shade textures, legacy room capabilities, independent reducer, seamless sampling, neutral cloth lighting, saved-version migration and ${library.files.length} byte-identical source copies.`);
})().catch(error => {console.error(error); process.exitCode = 1;});
