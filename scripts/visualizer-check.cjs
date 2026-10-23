const assert = require('node:assert/strict'), fs = require('node:fs'), ts = require('typescript');
const previous = require.extensions['.ts'];
require.extensions['.ts'] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText, file);
try {
  const { fabrics, manualDefault, normalizeManual, manualSelection, readManual, patternsFor } = require('../lib/curtains/manual-config.ts');
  const { studioHref, designOptions } = require('../lib/design-options.ts');
  const { visualizerStyles } = require('../lib/visualizer.ts');
  const base = normalizeManual(manualDefault);
  const floral = { ...fabrics.find(f => f.usage.includes('main')), id: 'synthetic-floral', name: 'Synthetic test only', source: 'supplier', pattern: 'Floral' };
  const records = [...fabrics, floral];
  const selected = normalizeManual({ ...base, mainFabric: floral.id, pattern: 'Floral' }, records);
  assert.equal(selected.pattern, 'Floral');
  assert.deepEqual(patternsFor(floral), ['Floral']);
  assert.equal(selected.sheerColor, base.sheerColor);
  const incompatible = normalizeManual({ ...selected, mainFabric: base.mainFabric }, records);
  assert.equal(incompatible.pattern, patternsFor(fabrics.find(f => f.id === base.mainFabric))[0]);
  const transfer = { ...manualSelection(selected, records), style: 'Classic' };
  const params = Object.fromEntries(new URL(studioHref(transfer), 'https://example.test').searchParams);
  assert.equal(params.style, 'Classic');
  assert.equal(params.heading, selected.heading);
  assert.deepEqual(readManual(params, records), selected);
  for (const style of visualizerStyles) {
    assert.ok(designOptions.styles.includes(style.value));
    assert.ok(fs.existsSync('public' + style.image), style.image);
  }
  console.log('Supported Floral fixture, incompatible pattern reset, independent sheer, style/heading separation, URL round-trip and licensed-reference paths PASS');
} finally { if (previous) require.extensions['.ts'] = previous; else delete require.extensions['.ts']; }
