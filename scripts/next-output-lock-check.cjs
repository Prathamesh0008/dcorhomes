const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {fork}=require('node:child_process');
const assert=require('node:assert/strict');
const {acquireNextOutput}=require('./next-output-lock.cjs');

if(process.argv[2]==='owner'||process.argv[2]==='borrow'){
 const [, ,mode,root,distDir]=process.argv;
 try{
  // Reproduce Next's initial environment snapshot before config is evaluated.
  require('@next/env').loadEnvConfig(root);
  acquireNextOutput(distDir,root);acquireNextOutput(distDir,root);
  if(mode==='borrow'){process.send?.({borrowed:true});process.exit(0);}
  process.on('message',async message=>{
   if(message==='stop')process.exit(0);
   if(message==='borrow'){
    const worker=fork(__filename,['borrow',root,distDir],{env:{...require('@next/env').initialEnv},stdio:['ignore','ignore','pipe','ipc'],windowsHide:true});
    worker.once('message',result=>process.send?.(result));
    worker.once('exit',code=>{if(code!==0)process.send?.({error:'Next-style child could not inherit ownership'});});
   }
  });
  process.on('disconnect',()=>process.exit(0));
  process.send?.({owner:process.pid});
 }catch(error){process.send?.({error:error.message});process.exitCode=1;}
}else{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'dcorhome-next-lock-')),children=[];
 function start(distDir){
  const child=fork(__filename,['owner',root,distDir],{stdio:['ignore','ignore','pipe','ipc'],windowsHide:true});children.push(child);
  return new Promise((resolve,reject)=>{child.once('message',result=>resolve({child,result}));child.once('error',reject);});
 }
 async function stop(child,force=false){
  if(child.exitCode!==null||child.signalCode!==null)return;
  const exited=new Promise(resolve=>child.once('exit',resolve));
  if(force)child.kill('SIGKILL');else if(child.connected)child.send('stop');else child.kill();
  await exited;
 }
 (async()=>{try{
  const first=await start('.next-dev');assert.ok(first.result.owner);
  const duplicate=await start('.next-dev');assert.match(duplicate.result.error,/already owns/);
  const build=await start('.next');assert.ok(build.result.owner,'dev and production outputs must be independent');
  const concurrentProd=await start('.next');assert.match(concurrentProd.result.error,/already owns/);
  const borrowed=new Promise(resolve=>first.child.once('message',resolve));first.child.send('borrow');assert.deepEqual(await borrowed,{borrowed:true});
  assert.equal(JSON.parse(fs.readFileSync(path.join(root,'.next-dev.lock'),'utf8')).pid,first.result.owner);
  await stop(first.child);assert.equal(fs.existsSync(path.join(root,'.next-dev.lock')),false);
  const killed=await start('.next-dev');await stop(killed.child,true);assert.ok(fs.existsSync(path.join(root,'.next-dev.lock')));
  const recovered=await start('.next-dev');assert.ok(recovered.result.owner);await stop(recovered.child);
  const contenders=await Promise.all([start('.next-dev'),start('.next-dev')]);
  assert.equal(contenders.filter(item=>item.result.owner).length,1,'exclusive create must allow one simultaneous owner');
  await Promise.all(contenders.map(item=>stop(item.child)));await stop(build.child);
  const invalid=path.join(root,'.next.lock'),contents='{"unexpected":"leave intact"}';fs.writeFileSync(invalid,contents);
  const rejected=await start('.next');assert.match(rejected.result.error,/Invalid/);assert.equal(fs.readFileSync(invalid,'utf8'),contents);fs.unlinkSync(invalid);
  console.log('PASS: duplicate dev/prod rejection, separate outputs, Next child environment inheritance, config reload, graceful release, dead-owner recovery, simultaneous starts and invalid-lock preservation.');
 }finally{
  await Promise.all(children.map(child=>stop(child)));
  // The fixture should be empty; never recursively delete an unexpected tree.
  fs.rmdirSync(root);
 }})().catch(error=>{console.error(error);process.exitCode=1;});
}
