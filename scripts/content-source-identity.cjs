// Configuration inspection only: constructing a driver client parses settings but never connects.
const {MongoClient}=require('mongodb'),{createHash}=require('node:crypto');
const hash=value=>createHash('sha256').update(value).digest('hex');
function sourceIdentity(env=process.env){
 const uri=env.MONGODB_URI?.trim();if(!uri)throw Error('MongoDB source configuration is missing.');
 const parsed=new MongoClient(uri);
 const hosts=(parsed.options.srvHost?[parsed.options.srvHost]:parsed.options.hosts.map(host=>host.toString())).map(host=>host.toLowerCase()).sort();
 const database=env.MONGODB_DB?.trim()||decodeURIComponent(uri.match(/^mongodb(?:\+srv)?:\/\/[^/]+\/([^?]*)/)?.[1]||'');
 if(!database)throw Error('An explicit existing database must be selected.');
 const isLocal=hosts.some(host=>/^(localhost(?::|$)|127\.|0\.0\.0\.0(?::|$)|\[?::1\]?(?::|$))|\.localhost(?::|$)/.test(host));
 return {sha256:hash(hosts.join(',')+'\n'+database),hostSha256:hash(hosts.join(',')),databaseSha256:hash(database),isLocal,productionScopeInjected:env.VERCEL_ENV==='production'};
}
function assertProductionSource(identity,expected){
 if(!/^[a-f0-9]{64}$/.test(expected||'')||identity.sha256!==expected)throw Error('Production source identity is missing or does not match the trusted fingerprint.');
 if(identity.isLocal||!identity.productionScopeInjected)throw Error('Production preservation requires a nonlocal source and trusted injected Production-scoped configuration.');
}
module.exports={sourceIdentity,assertProductionSource};
if(require.main===module){
 const injected=Boolean(process.env.MONGODB_URI);
 if(!process.argv.includes('--env-only'))require('@next/env').loadEnvConfig(process.cwd(),false,{info(){},error(){}});
 try{console.log(JSON.stringify({event:'content_source_identity',...sourceIdentity(),configurationSource:injected?'injected_environment':'local_env_files',connected:false,productionIdentityVerified:false}));}
 catch{console.error('FAIL: Source identity could not be inspected. No database connection was attempted.');process.exitCode=1;}
}
