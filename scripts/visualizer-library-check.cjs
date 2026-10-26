const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const ts = require('typescript');
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.CommonJS, esModuleInterop: true},
}).outputText, file);
const {libraryRecords} = require('../lib/manual-visualizer/library.ts');
const {scenes, materials} = require('../lib/manual-visualizer/manifest.ts');
const {resolveLayer, validateDesign, defaultDesign, designSummary} = require('../lib/manual-visualizer/model.ts');
const {composeDesign} = require('../lib/manual-visualizer/renderer.ts');
const library = require('../lib/manual-visualizer/library-assets.json');
const {configurationReducer}=require('../lib/manual-visualizer/configuration.ts');
const {mirroredCoordinate,textileLuminance,clothLighting}=require('../lib/manual-visualizer/sampling.ts');
const root = path.resolve(__dirname, '..');
const digest = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
(async () => {
  assert.equal(libraryRecords.length, 20);
  let shades = 0;
  for (const fabric of libraryRecords) {
    assert.equal(fabric.source, 'demo');
    assert.equal(fabric.sku, undefined);
    assert.equal(fabric.colors.length, 10);
    for (const variant of fabric.colors) {
      assert.equal(variant.available, null);
      const resolved = resolveLayer({enabled:true, materialId:fabric.id, fabricId:fabric.id, variantId:variant.id}, []);
      assert.equal(resolved.commercial, false);
      assert.equal(resolved.variant.textureImage, variant.textureImage);
      assert.ok(fs.existsSync(path.join(root, 'public', variant.textureImage)));
      shades++;
    }
  }
  assert.deepEqual(validateDesign(defaultDesign, []), defaultDesign);
  assert.throws(() => validateDesign({...defaultDesign,main:defaultDesign.sheer}, []), /does not match/);
  assert.throws(() => resolveLayer({...defaultDesign.main,variantId:'missing'}, []), /shade/);
  for (const scene of scenes.filter(s => s.previewSupport === 'base-only')) {
    assert.ok(fs.existsSync(path.join(root, 'public', scene.base)));
    assert.ok(fs.existsSync(path.join(root, 'public', scene.thumbnail)));
    const design = {...defaultDesign, sceneId:scene.id};
    assert.equal(validateDesign(design, []).sceneId, scene.id); // Saving selections is allowed.
    assert.match(designSummary(design, []), /NOT been rendered/);
    await assert.rejects(composeDesign(design, []), /Room view only|Room inspiration only/);
  }
  assert.equal(scenes.filter(s => s.previewSupport === 'base-only').length, 10);
  for (const file of library.files) {
    const input = path.join(root, 'assets/dcorhome-manual-visualizer', file.path);
    const runtime = path.join(root, 'public/images/manual-visualizer/library-v1', file.path);
    assert.equal(digest(input), file.sha256);
    assert.equal(digest(runtime), file.sha256);
  }
  // Earlier supported catalogue selections remain valid against original records.
  const records = require('../lib/curtains/manual-config.ts').fabrics;
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
  console.log(`PASS: ${shades} optimized shade textures, 10 room-view gates, independent reducer, seamless sampling, neutral cloth lighting, saved-version migration and ${library.files.length} byte-identical source copies.`);
})().catch(error => {console.error(error); process.exitCode = 1;});
