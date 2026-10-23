const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),sharp=require('sharp'),ts=require('typescript');
const source=ts.transpileModule(fs.readFileSync('lib/hero-comparisons.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const compiled={exports:{}};new Function('exports','module',source)(compiled.exports,compiled);
(async()=>{
 const slides=compiled.exports.heroComparisonSlides,ids=new Set(),hashes=new Set(),sources=new Set();
 assert.equal(slides.length,10,'Publish all ten reviewed transformations');
 for(const pair of slides){
  assert.ok(pair.id&&!ids.has(pair.id),'Every pair needs a unique ID');ids.add(pair.id);assert.ok(pair.alt&&pair.beforeSrc!==pair.afterSrc,'Use distinct before/after views and descriptive alt text');
  const files=[pair.beforeSrc,pair.afterSrc].map(src=>{assert.ok(/^\/images\/[a-zA-Z0-9_./-]+\.(png|jpe?g|webp|avif)$/.test(src),'Use local /images/ assets');const file=path.resolve('public','.'+src);assert.ok(file.startsWith(path.resolve('public/images')+path.sep)&&fs.existsSync(file),'Missing comparison asset: '+src);return file;});
  assert.ok(pair.roomName&&pair.curtainCombination&&pair.provenance==='ai-edited','Describe the room, fabric and concept provenance');assert.ok(!sources.has(pair.sourceImage),'Repeated source scene');sources.add(pair.sourceImage);assert.ok(fs.existsSync(path.join('public',pair.sourceImage)),'Original source missing');
  const [before,after]=await Promise.all(files.map(file=>sharp(file).metadata()));assert.equal(before.width,1448);assert.equal(before.height,1086);assert.equal(before.width,after.width,'Pair width must match');assert.equal(before.height,after.height,'Pair height must match');assert.ok(!fs.readFileSync(files[0]).equals(fs.readFileSync(files[1])),'Identical images are not a comparison');
  for(const file of files){const hash=require('node:crypto').createHash('sha256').update(fs.readFileSync(file)).digest('hex');assert.ok(!hashes.has(hash),'Repeated image');hashes.add(hash);for(const width of [640,1280]){const responsive=file.replace(/\.webp$/,'-'+width+'.webp'),meta=await sharp(responsive).metadata();assert.equal(meta.width,width);assert.equal(meta.height,width*3/4);}}
 }
 console.log(`${slides.length} pairs, 20 unique base images, 40 responsive derivatives and ten source scenes validated. Content/coverage reviewed separately in docs/hero-transformations.md.`);
})().catch(error=>{console.error(error.message);process.exit(1)});
