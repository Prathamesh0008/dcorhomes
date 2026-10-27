// No production connections or migration-state writes. All identities below are explicit fixtures.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{spawnSync}=require('node:child_process');
const {sourceIdentity,assertProductionSource}=require('./content-source-identity.cjs');
const {productionEvidence}=require('./preservation-policy.cjs');
const hash=value=>crypto.createHash('sha256').update(value).digest('hex');
const migrationFile='data/catalogue/migration.json',before=fs.readFileSync(migrationFile);
const env={MONGODB_URI:'mongodb://127.0.0.1:27017/isolated_fixture',VERCEL_ENV:'production'};
const local=sourceIdentity(env);assert.equal(local.isLocal,true);
assert.throws(()=>assertProductionSource(local,local.sha256),/nonlocal/);
assert.equal(sourceIdentity({...env,MONGODB_URI:'mongodb://[::1]:27017/isolated_fixture'}).isLocal,true);
assert.notEqual(sourceIdentity({...env,MONGODB_DB:'different_fixture'}).sha256,local.sha256);
const remote=sourceIdentity({MONGODB_URI:'mongodb+srv://fixture-user:fixture-password@fixture.example.invalid/fixture',VERCEL_ENV:'production'});
assert.throws(()=>assertProductionSource(remote,local.sha256),/does not match/);
assert.throws(()=>assertProductionSource({...remote,productionScopeInjected:false},remote.sha256),/Production-scoped/);
assert.throws(()=>productionEvidence({snapshotManifestSha256:hash('fixture-only')}),/source-bound/);
assert.throws(()=>productionEvidence({evidenceVersion:2,sourceIdentity:{...local,productionSourceConfirmed:true},snapshotManifestSha256:hash('fixture-only')}),/Local\/isolated/);
// A deliberately malformed private snapshot must fail before it can change migration.json.
const root=path.resolve('.data');fs.mkdirSync(root,{recursive:true});const snapshot=fs.mkdtempSync(path.join(root,'preservation-policy-fixture-'));
fs.writeFileSync(path.join(snapshot,'manifest.json'),JSON.stringify({version:1,sourceUnchanged:true,files:{}}));
const result=spawnSync(process.execPath,['scripts/verify-content-export.cjs','--snapshot',snapshot,'--confirm-production-source'],{encoding:'utf8',windowsHide:true});
assert.equal(result.status,1);assert.deepEqual(fs.readFileSync(migrationFile),before);
const incomplete=spawnSync(process.execPath,['scripts/verify-content-export.cjs','--snapshot',snapshot],{encoding:'utf8',windowsHide:true});assert.equal(incomplete.status,1);
const exported=spawnSync(process.execPath,['scripts/export-legacy-content.cjs','--env-only','--production-source','--expected-source-sha256',local.sha256,'--out',path.join(root,'must-not-export-'+crypto.randomBytes(6).toString('hex'))],{env:{...process.env,...env},encoding:'utf8',windowsHide:true});
assert.equal(exported.status,1);assert.ok(exported.stderr.includes('"stage":"configuration"'),'Production identity refusal must occur before connecting.');
console.log('PASS: Source fingerprint isolation, localhost refusal, Production scope checks, incomplete/fixture export refusal and unchanged migration gate; no production connection.');
