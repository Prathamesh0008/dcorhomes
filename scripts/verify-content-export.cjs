// Offline integrity gate. Never connects to a database and never copies private exports to public files.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
const {productionEvidence}=require('./preservation-policy.cjs');
try{
 const input=process.argv[process.argv.indexOf('--snapshot')+1];
 assert.ok(process.argv.includes('--snapshot')&&input,'Provide --snapshot .data/export-directory');
 const root=path.resolve('.data'),snapshot=path.resolve(input);
 assert.ok(snapshot.startsWith(root+path.sep),'Snapshot must be private inside .data');
 const manifest=JSON.parse(fs.readFileSync(path.join(snapshot,'manifest.json'),'utf8'));
 if(process.argv.includes('--confirm-production-source'))productionEvidence({evidenceVersion:manifest.version,sourceIdentity:manifest.sourceIdentity,snapshotManifestSha256:hash(fs.readFileSync(path.join(snapshot,'manifest.json')))});
 assert.equal(manifest.sourceUnchanged,true,'Source changed during export; take a fresh snapshot');
 assert.equal(manifest.readOnly,true,'Snapshot must record a read-only export.');
 for(const name of ['PRIVATE-records.ejson','candidate/catalogue/fabrics.json','candidate/catalogue/collections.json','candidate/site/editorial.json','candidate/site/design-options.json','PRIVATE-assets-inventory.json'])assert.match(manifest.files?.[name]||'',/^[a-f0-9]{64}$/,'Required snapshot artifact/checksum missing.');
 for(const [name,digest]of Object.entries(manifest.files)){
  const target=path.resolve(snapshot,name);assert.ok(target.startsWith(snapshot+path.sep),'Invalid snapshot path');
  assert.equal(hash(fs.readFileSync(target)),digest,'Snapshot integrity failed');
 }
 for(const [name,target]of [
  ['candidate/catalogue/fabrics.json','data/catalogue/fabrics.json'],
  ['candidate/catalogue/collections.json','data/catalogue/collections.json'],
  ['candidate/site/editorial.json','data/site/editorial.json'],
  ['candidate/site/design-options.json','data/site/design-options.json'],
 ])assert.deepEqual(JSON.parse(fs.readFileSync(target,'utf8')),JSON.parse(fs.readFileSync(path.join(snapshot,name),'utf8')),'Repository differs from exported candidate: '+target);
 for(const [name,digest]of Object.entries(manifest.files))if(name.startsWith('public/')){assert.match(name,/^public\/images\/catalogue\/[a-f0-9-]{36}\.webp$/,'Only exported public catalogue images may be published.');assert.equal(hash(fs.readFileSync(name)),digest,'Exported public image missing or changed');}
 const records=require('../data/catalogue/fabrics.json');
 assert.equal(records.length,manifest.fabricCount);assert.equal(records.reduce((n,f)=>n+f.colors.length,0),manifest.shadeCount);
 const report={verifiedAt:new Date().toISOString(),snapshotManifestSha256:hash(fs.readFileSync(path.join(snapshot,'manifest.json'))),cataloguePreserved:true,privateExportFilesVerified:true,privateImagesFullyExported:manifest.privateAssetsRequested&&manifest.privateAssetInventory.every(item=>item.downloaded),productionConnectionVerified:false};
 fs.writeFileSync(path.join(snapshot,'verification.json'),JSON.stringify(report,null,2)+'\n');
 if(process.argv.includes('--confirm-production-source')){
  // Operator attestation: this snapshot came from the intended existing production database.
  // This does not attest to Vercel connectivity or inbox delivery.
  assert.ok(report.privateImagesFullyExported||manifest.privateAssetInventory.length===0,'Export available private images (or resolve missing images) before confirming production preservation');
  fs.writeFileSync('data/catalogue/migration.json',JSON.stringify({status:'production-preserved',productionSourceConfirmed:true,evidenceVersion:2,sourceIdentity:manifest.sourceIdentity,verifiedAt:report.verifiedAt,snapshotManifestSha256:report.snapshotManifestSha256,initialRepositoryHashes:Object.fromEntries(['data/catalogue/fabrics.json','data/catalogue/collections.json','data/site/editorial.json','data/site/design-options.json'].map(name=>[name,hash(fs.readFileSync(name))]))},null,2)+'\n');
 }
 console.log('PASS: Snapshot integrity, exact candidate preservation and public image checks. Private exports remain outside repository content.');
}catch(error){console.error('FAIL: Content export verification. No production migration can be claimed. '+(error.code==='ENOENT'?'Required file missing.':error instanceof assert.AssertionError?error.message.split('\n')[0]:'Review the private export and arguments.'));process.exitCode=1;}
