// Execute the supplied demo script against a small DOM stub, without changing it.
// This verifies event wiring and file references, not browser CSS/rendering support.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../assets/dcorhome-manual-visualizer');
const html = fs.readFileSync(path.join(root, 'interactive-demo/index.html'), 'utf8');
const nodes = new Map();
const choices = {};
for (const [, id, body] of html.matchAll(/<select id="([^"]+)">([\s\S]*?)<\/select>/g)) {
  choices[id] = [...body.matchAll(/<option value="([^"]+)"/g)].map(match => match[1]);
}
const get = id => {
  if (!nodes.has(id)) nodes.set(id, {value: choices[id]?.[0] || '', style: {}, listeners: {},
    addEventListener(event, handler) {this.listeners[event] = handler;}, click() {this.onclick?.();}});
  return nodes.get(id);
};
vm.runInNewContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], {document: {getElementById: get}});
const snapshot = () => Object.fromEntries([...nodes].map(([id, el]) => [id, {value: el.value, src: el.src, style: {...el.style}}]));
const a = snapshot(); get('presetB').click(); const b = snapshot();
const references = new Set();
function capture() {
  for (const el of nodes.values()) {
    if (el.src) references.add(el.src);
    for (const prop of ['backgroundImage', 'maskImage']) {
      const match = el.style[prop]?.match(/url\("([^"]+)"\)/); if (match) references.add(match[1]);
    }
  }
}
for (const [id, values] of Object.entries(choices)) for (const value of values) {
  get(id).value = value; get(id).listeners.change(); capture();
}
for (const [varietyId, colorId] of [['sf', 'sc'], ['mf', 'mc']]) {
  for (const variety of choices[varietyId]) for (const color of choices[colorId]) {
    get(varietyId).value = variety; get(colorId).value = color;
    get(colorId).listeners.change(); capture();
  }
}
const missing = [...references].filter(ref => !fs.existsSync(path.resolve(root, 'interactive-demo', ref)));
const evidence = {method: 'Node VM DOM stub; NOT a browser rendering test', choices,
  initialPreset: a, presetB: b, references: [...references], missingReferences: missing,
  pngAlternativesPresent: missing.every(ref => fs.existsSync(path.resolve(root, 'interactive-demo', ref.replace(/\.webp$/, '.png'))))};
fs.writeFileSync(path.resolve(__dirname, '../docs/manual-visualizer-audit/demo-evidence.json'), JSON.stringify(evidence, null, 2));
console.log(JSON.stringify({choices: Object.fromEntries(Object.entries(choices).map(([k,v]) => [k,v.length])),
  checkedReferences: references.size, missingReferences: missing.length, pngAlternativesPresent: evidence.pngAlternativesPresent}));
