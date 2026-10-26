// Versioned delivery derivatives only; original package and prior runtime stay intact.
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),sharp=require('sharp');
const root=path.resolve(__dirname,'..'),source=path.join(root,'assets/dcorhome-manual-visualizer');
const destination=path.join(root,'public/images/manual-visualizer/atelier-v2');
const library=require('../lib/manual-visualizer/library-assets.json');
(async()=>{
 let sourceBytes=0,runtimeBytes=0;
 for(const file of library.files){
  const buffer=await fs.readFile(path.join(source,file.path));
  if(crypto.createHash('sha256').update(buffer).digest('hex')!==file.sha256)throw Error('Source changed: '+file.path);
  sourceBytes+=buffer.length;
  const relative=file.path.replace(/\.(png|webp)$/,'.webp'),output=path.join(destination,relative);
  await fs.mkdir(path.dirname(output),{recursive:true});
  const room=file.path.startsWith('rooms/');
  const image=sharp(buffer).resize({width:room?1280:256,withoutEnlargement:true});
  const delivered=await(room?image.webp({quality:90}):image.webp({lossless:true})).toBuffer();
  await fs.writeFile(output,delivered);runtimeBytes+=delivered.length;
 }
 for(const room of library.rooms){
  const relative=room.base.replace('/images/manual-visualizer/library-v1/','');
  const thumbnail=await sharp(path.join(source,relative)).resize(480).webp({quality:82}).toBuffer();
  await fs.writeFile(path.join(destination,'rooms',room.id,'thumbnail.webp'),thumbnail);runtimeBytes+=thumbnail.length;
 }
 const result={version:'atelier-v2',images:library.files.length+library.rooms.length,sourceBytes,runtimeBytes};
 await fs.mkdir(path.join(root,'docs/studio-rebuild'),{recursive:true});
 await fs.writeFile(path.join(root,'docs/studio-rebuild/runtime-assets.json'),JSON.stringify(result,null,2));
 console.log(JSON.stringify(result));
})().catch(error=>{console.error(error);process.exitCode=1;});
