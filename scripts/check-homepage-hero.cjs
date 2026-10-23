const fs=require('node:fs'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const baseline=JSON.parse(fs.readFileSync('scripts/homepage-hero-protection.json','utf8')),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const page=fs.readFileSync('app/page.tsx','utf8'),start=page.indexOf('      <section className="bg-[#f3efe6]">');
assert.equal(hash(page.slice(start,start+baseline.hero.length)),baseline.heroHash,'Protected hero markup changed');
for(const [file,expected] of Object.entries(baseline.files))assert.equal(hash(fs.readFileSync(file)),expected,'Protected hero dependency changed: '+file);
console.log(`Hero markup, image assets and all ${Object.keys(baseline.files).length} protected dependencies unchanged PASS`);
