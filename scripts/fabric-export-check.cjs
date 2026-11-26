const assert = require('node:assert/strict');
require('./auth-loader.cjs');
const { prepareFabricExport } = require('../lib/server/fabric-export.ts');
const records = require('../data/catalogue/fabrics.json');
(async () => {
  assert.ok(records.length >= 2);
  const merged = new Map(records.map(record => [record.id, { record, status: 'published' }]));
  const partial = await prepareFabricExport(merged, [records[0].id]);
  assert.equal(partial.complete, false); assert.equal(partial.data.type, 'partial-fabric-export');
  assert.deepEqual(partial.data.records, [records[0]]); assert.ok(!Array.isArray(partial.data));
  const complete = await prepareFabricExport(merged, records.map(record => record.id));
  assert.equal(complete.complete, true); assert.deepEqual(complete.data, records);
  await assert.rejects(() => prepareFabricExport(merged, []));
  await assert.rejects(() => prepareFabricExport(merged, [records[0].id, records[0].id]));
  await assert.rejects(() => prepareFabricExport(merged, ['missing']));
  const invalid = new Map([['broken', { record: { id: 'broken' }, status: 'draft' }]]);
  await assert.rejects(() => prepareFabricExport(invalid, ['broken']));
  console.log('PASS: complete catalogue and partial package preserve records; empty, duplicate, missing and invalid selections rejected.');
})().catch(error => { console.error('FAIL:', error.message); process.exitCode = 1; });
