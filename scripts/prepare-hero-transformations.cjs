// Offline export only: photorealistic edits were prepared with built-in imagegen.
// Source PNGs are retained in .data/hero-transformations/sources for review.
const fs = require('node:fs'), path = require('node:path'), sharp = require('sharp');
const rooms = ['Lakeside living room', 'Sunlit bedroom', 'Arched window hall', 'Family reading room', 'Master bedroom', 'Bright lakeside living room', 'Sunset dining and living room', 'City apartment sitting room', 'Arched window residence', 'City-view bedroom'];
const combinations = ['White sheer + Warm Beige Linen', 'Ivory sheer + Champagne Silk', 'Soft White sheer + Charcoal Velvet', 'Cream sheer + Olive Green Linen', 'Ivory sheer + Taupe Blackout Curtains', 'White sheer + Mocha Textured Curtains', 'Warm Ivory sheer + Deep Brown Velvet', 'Cream sheer + Sage Green Curtains', 'Pale Grey sheer + Navy Blue Main Curtains', 'White sheer + Burgundy Velvet'];
(async () => {
  const destination = 'public/images/hero'; fs.mkdirSync(destination, { recursive: true });
  const manifest = [];
  for (let i = 1; i <= 10; i++) {
    const id = String(i).padStart(2, '0');
    for (const state of ['before', 'after']) {
      const version = state === 'after' && [2, 3, 4].includes(i) ? '-v2' : '';
      const source = `.data/hero-transformations/sources/hero-${id}-${state}${version}.png`;
      if (!fs.existsSync(source)) throw Error('Missing reviewed source: ' + source);
      const metadata = await sharp(source).metadata();
      if (metadata.width !== 1448 || metadata.height !== 1086) throw Error('Unexpected dimensions: ' + source);
      for (const width of [640, 1280, 1448]) {
        const suffix = width === 1448 ? '' : '-' + width;
        await sharp(source).resize(width).webp({ quality: 86, effort: 6 }).toFile(path.join(destination, `hero-${id}-${state}${suffix}.webp`));
      }
    }
    manifest.push({ id: `hero-${id}`, beforeSrc: `/images/hero/hero-${id}-before.webp`, afterSrc: `/images/hero/hero-${id}-after.webp`, roomName: rooms[i - 1], label: rooms[i - 1], curtainCombination: combinations[i - 1], sourceImage: `/hero/${i}.png`, provenance: 'ai-edited', alt: `${rooms[i - 1]} with ${combinations[i - 1].toLowerCase()}` });
  }
  const target = 'lib/hero-comparisons.ts', previous = fs.readFileSync(target, 'utf8');
  fs.writeFileSync(target, previous.slice(0, previous.indexOf('// Only publish')) + '// Ten reviewed, offline AI-edited concepts derived from public/hero/1.png … 10.png.\n// Room names describe the supplied photographs; fabrics are design concepts.\nexport const heroComparisonSlides: HeroComparisonSlide[] = ' + JSON.stringify(manifest, null, 2) + ';\n');
  console.log('Exported 20 matched 1448×1086 WebPs, 40 responsive derivatives and ten-scene manifest.');
})().catch(error => { console.error(error); process.exit(1); });
