// Focused service/error checks; no external network or billable requests.
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript'),Module=require('node:module'),assert=require('node:assert/strict');
const resolve=Module._resolveFilename;Module._resolveFilename=function(id,...args){return resolve.call(this,id.startsWith('@/')?path.resolve(id.slice(2)):id,...args);};
require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,esModuleInterop:true,target:ts.ScriptTarget.ES2022}}).outputText,file);
const actual=require('openai'),SDK=actual.default||actual;let mode='timeout',calls=0;
class Fake extends SDK{constructor(options){super(options);assert.equal(options.maxRetries,0);this.images={edit:async params=>{calls++;assert.equal(params.n,1);assert.equal(params.input_fidelity,undefined);if(mode==='timeout')throw new SDK.APIConnectionTimeoutError();if(mode==='unavailable')throw new SDK.APIError(503,{message:'sensitive detail'},'sensitive detail',new Headers());return {data:[]};}};}}
const load=Module._load;Module._load=function(id,...args){return id==='openai'?{...actual,__esModule:true,default:Fake}:load.call(this,id,...args);};
global.fetch=()=>{throw Error('External network prohibited.');};
Object.assign(process.env,{DCORHOME_AI_ENABLED:'true',OPENAI_API_KEY:'isolated-test',DCORHOME_IMAGE_MODEL:'gpt-image-2.5-sunburst',DCORHOME_IMAGE_QUALITY:'medium',SESSION_SECRET:'x'.repeat(32),DCORHOME_DATA_DIR:path.resolve('.test-data/service-check'),ASSET_STORAGE:'local',VERCEL:''});
const {readiness}=require('../lib/ai/config.ts'),{editCurtains}=require('../lib/ai/provider.ts'),{areaPixels,validWindowArea}=require('../lib/visualizer-area.ts');
(async()=>{
 assert.equal(readiness().configured,true);process.env.OPENAI_API_KEY='';assert.equal(readiness().configured,false);assert.match(readiness().reason,/provider configuration/);process.env.OPENAI_API_KEY='isolated-test';process.env.VERCEL='1';assert.equal(readiness().configured,false);process.env.VERCEL='';
 assert.deepEqual(areaPixels({x:.2,y:.12,width:.6,height:.78},400,600),{left:80,top:72,width:240,height:468});assert.equal(validWindowArea({x:0,y:0,width:NaN,height:.5}),false);
 for(const [scenario,status]of [['timeout',504],['unavailable',502],['empty',502]]){mode=scenario;await assert.rejects(()=>editCurtains(Buffer.from('test'),Buffer.from('test'),'validated test'),e=>e.status===status&&!e.message.includes('sensitive detail'));}
 assert.equal(calls,3);console.log('PASS: missing key readiness, Vercel local-storage rejection, normalized coordinates, timeout/unavailable/missing-output error mapping, one call per request and SDK retries disabled. No network.');
})().catch(e=>{console.error(e);process.exitCode=1;});
