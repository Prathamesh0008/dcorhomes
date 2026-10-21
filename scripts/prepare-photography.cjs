const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp"); // Already supplied by Next.js; no additional package installed.
async function prepare() {
  const directory = path.join(process.cwd(), "public", "images");
  for (const name of fs
    .readdirSync(directory)
    .filter((name) => name.endsWith(".jpg"))) {
    for (const width of [640, 1280, 1920]) {
      await sharp(path.join(directory, name))
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 84 })
        .toFile(path.join(directory, name.replace(/\.jpg$/, `-${width}.webp`)));
    }
    console.log(`${name}: responsive WebP sizes ready`);
  }
}
prepare().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
