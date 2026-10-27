const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
require('@next/env').loadEnvConfig(process.cwd(),false,{info(){},error(){}});
const files=root=>fs.readdirSync(root,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(path.join(root,entry.name)):[path.join(root,entry.name)]);
try{
 const traces=files('.next/server').filter(name=>name.endsWith('.nft.json'));
 for(const file of traces)for(const dependency of JSON.parse(fs.readFileSync(file,'utf8')).files||[])assert.ok(!/\.sqlite(?:$|-)|better-sqlite3|DCORHOME_DATA_DIR/i.test(dependency),'Build trace depends on obsolete persistence');
 const bundles=files('.next/static').filter(name=>/\.(js|json|map)$/.test(name));
 const keys=['CLERK_SECRET_KEY','MONGODB_URI','BETTER_AUTH_SECRET','SESSION_SECRET','RESEND_API_KEY','S3_ACCESS_KEY_ID','S3_SECRET_ACCESS_KEY','OPENAI_API_KEY'];
 const secrets=keys.map(key=>({key,value:process.env[key]})).filter(item=>item.value&&item.value.length>=12);
 for(const file of bundles){const bytes=fs.readFileSync(file,'utf8');for(const item of secrets)assert.ok(!bytes.includes(item.value),'Server credential found in a public build artifact: '+item.key);}
 console.log(`PASS: ${traces.length} server traces without SQLite/data-directory dependencies; ${bundles.length} public artifacts without configured server credentials.`);
}catch(error){console.error('FAIL: '+error.message);process.exitCode=1;}
