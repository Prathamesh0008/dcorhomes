const assert=require('node:assert/strict');
function productionEvidence(evidence){
 assert.equal(evidence.evidenceVersion,2,'A source-bound production export is required; historical/fixture exports cannot approve cutover.');
 assert.equal(evidence.sourceIdentity?.productionSourceConfirmed,true,'Production source has not been confirmed.');
 assert.equal(evidence.sourceIdentity?.isLocal,false,'Local/isolated exports cannot approve production.');
 assert.equal(evidence.sourceIdentity?.productionScopeInjected,true,'Production-scoped source configuration has not been recorded.');
 for(const key of ['sha256','hostSha256','databaseSha256'])assert.match(evidence.sourceIdentity?.[key]||'',/^[a-f0-9]{64}$/,'Source identity fingerprint missing.');
 assert.match(evidence.snapshotManifestSha256||'',/^[a-f0-9]{64}$/,'Snapshot checksum is missing.');
}
module.exports={productionEvidence};
