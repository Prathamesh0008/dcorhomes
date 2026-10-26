// Copy decoded, usable library inputs only. Never mutate the supplied package.
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require('sharp');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'assets/dcorhome-manual-visualizer');
const output = path.join(root, 'public/images/manual-visualizer/library-v1');
const url = '/images/manual-visualizer/library-v1';
const title = id => id.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
const rooms = [], fabrics = [], files = [];
async function copy(relative) {
  const input = path.join(source, relative), destination = path.join(output, relative);
  const buffer = await fs.readFile(input);
  const metadata = await sharp(buffer).metadata();
  await sharp(buffer).stats(); // Force actual pixel decoding before publishing an input.
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, buffer);
  files.push({path: relative, sha256: crypto.createHash('sha256').update(buffer).digest('hex'), width: metadata.width, height: metadata.height});
  return url + '/' + relative;
}
(async () => {
  for (let i = 1; i <= 10; i++) {
    const id = `room-${String(i).padStart(2, '0')}`;
    const geometry = JSON.parse(await fs.readFile(path.join(source, 'rooms', id, 'geometry.json'), 'utf8'));
    const extension = i === 1 || i === 9 ? 'png' : 'webp';
    const base = await copy(`rooms/${id}/base.${extension}`);
    const thumbnail = `rooms/${id}/thumbnail.webp`;
    await sharp(path.join(source, 'rooms', id, `base.${extension}`)).resize(480).webp({quality: 82}).toFile(path.join(output, thumbnail));
    rooms.push({id, name: geometry.name, base, thumbnail: url + '/' + thumbnail, width: geometry.canvas.width,
      height: geometry.canvas.height, window: geometry.window.normalized_bounds,
      provisional: i !== 1 && i !== 9,
      notice: i === 1 || i === 9
        ? 'Room view only. Curtain placement and furniture edges need refinement before this room can show your selection.'
        : 'Room inspiration only. This concept may already contain curtains; your selected fabrics are not shown here.'});
  }
  for (const [group, layer] of [['sheers', 'sheer'], ['main-curtains', 'main']]) {
    const varieties = (await fs.readdir(path.join(source, 'fabrics', group))).sort();
    for (const variety of varieties) {
      const directory = `fabrics/${group}/${variety}`;
      const master = await copy(`${directory}/master.png`);
      const opacityMap = layer === 'sheer' ? await copy(`${directory}/opacity-mask.png`) : undefined;
      const colors = [];
      for (const file of (await fs.readdir(path.join(source, directory))).sort()) {
        if (!file.endsWith('.png') || ['master.png', 'opacity-mask.png'].includes(file)) continue;
        const id = file.slice(0, -4), texture = await copy(`${directory}/${file}`);
        const stats = await sharp(path.join(source, directory, file)).removeAlpha().toColourspace('srgb').stats();
        const hex = '#' + stats.channels.slice(0, 3).map(c => Math.round(c.mean).toString(16).padStart(2, '0')).join('');
        colors.push({id, name: title(id), texture, hex});
      }
      if (colors.length !== 10) throw Error(`Expected ten shades for ${variety}`);
      fabrics.push({id: `library-${layer}-${variety}`, name: title(variety), layer, master, opacityMap, colors});
    }
  }
  await fs.writeFile(path.join(root, 'lib/manual-visualizer/library-assets.json'), JSON.stringify({version:'library-v1', rooms, fabrics, files}, null, 2) + '\n');
  console.log(`Prepared ${rooms.length} room bases, ${fabrics.length} material studies, ${files.length} decoded originals and 10 thumbnail derivatives. Unvalidated scene layers were excluded.`);
})().catch(error => {console.error(error); process.exitCode = 1;});
