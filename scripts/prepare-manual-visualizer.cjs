// Offline registration only. Never called by the Studio or a paid provider.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),sharp=require('sharp');
const root='public/images/manual-visualizer/v1';
const sources={linen:'sienna',velvet:'clay',silk:'silk-satin-study','textured-weave':'olive','plain-voile':'solstice','fine-voile':'pearl'};
const digest=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
function keepLargest(alpha,w,h){
 const seen=new Uint8Array(w*h),queue=new Int32Array(w*h);let largest=[];
 for(let i=0;i<alpha.length;i++){if(seen[i]||alpha[i]<24)continue;let head=0,tail=1;queue[0]=i;seen[i]=1;while(head<tail){const j=queue[head++],x=j%w;for(const k of [x?j-1:-1,x<w-1?j+1:-1,j-w,j+w])if(k>=0&&k<w*h&&!seen[k]&&alpha[k]>=24){seen[k]=1;queue[tail++]=k;}}if(tail>largest.length)largest=Array.from(queue.subarray(0,tail));}
 const keep=new Uint8Array(w*h);for(const i of largest)keep[i]=1;for(let i=0;i<alpha.length;i++)if(!keep[i])alpha[i]=0;
 return alpha;
}
(async()=>{
 for(const directory of ['rooms/garden-living','constructions','materials'])fs.mkdirSync(path.join(root,directory),{recursive:true});
 const room='public/images/curtains/manual/room.webp';
 fs.copyFileSync(room,path.join(root,'rooms/garden-living/base.webp'));
 await sharp(room).resize(360).webp({quality:80}).toFile(path.join(root,'rooms/garden-living/thumbnail.webp'));
 for(const layer of ['main','sheer']){
  const crop=layer==='main'?{left:70,top:22,width:450,height:918}:{left:180,top:90,width:920,height:790};
  const {data,info}=await sharp('public/images/curtains/manual/'+layer+'.webp').extract(crop).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const alpha=keepLargest(Uint8Array.from({length:info.width*info.height},(_,i)=>layer==='main'&&data[i*4+3]>180?255:data[i*4+3]),info.width,info.height);
  const fold=Buffer.from(Array.from({length:alpha.length},(_,i)=>Math.round(data[i*4]*.2126+data[i*4+1]*.7152+data[i*4+2]*.0722)));
  await sharp(Buffer.from(alpha),{raw:{width:info.width,height:info.height,channels:1}}).png().toFile(path.join(root,'constructions/'+layer+'-mask.png'));
  await sharp(fold,{raw:{width:info.width,height:info.height,channels:1}}).webp({quality:95}).toFile(path.join(root,'constructions/'+layer+'-fold.webp'));
 }
 for(const [id,fabric]of Object.entries(sources)){
  const source=sharp('public/images/fabrics/'+fabric+'/texture-reference.webp').resize(256,256,{fit:'cover'}).grayscale();
  const detail=await source.clone().raw().toBuffer(),low=await source.clone().blur(8).raw().toBuffer();
  // Remove the source photograph's broad folds/light falloff. Fold lighting comes
  // from the prepared drape, while this map contributes only textile detail.
  const weave=Buffer.from(detail.map((value,i)=>Math.max(32,Math.min(223,Math.round(127+(value-low[i])*.9)))));
  const original=await sharp(weave,{raw:{width:256,height:256,channels:1}}).png().toBuffer();
  const horizontal=await sharp(original).flop().png().toBuffer(),vertical=await sharp(original).flip().png().toBuffer(),both=await sharp(original).flip().flop().png().toBuffer();
  await sharp({create:{width:512,height:512,channels:3,background:'#808080'}}).composite([{input:original,left:0,top:0},{input:horizontal,left:256,top:0},{input:vertical,left:0,top:256},{input:both,left:256,top:256}]).webp({quality:94}).toFile(path.join(root,'materials/'+id+'.webp'));
 }
 const assets=[];function visit(dir){for(const item of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,item.name);if(item.isDirectory())visit(file);else if(item.name!=='sources.json')assets.push({path:'/'+file.replaceAll('\\','/').replace(/^public\//,''),sha256:digest(file)});}}visit(root);
 fs.writeFileSync(path.join(root,'sources.json'),JSON.stringify({version:'manual-v1',room:{source:room,status:'Existing generated illustrative room, not a real photographed interior',provenance:'scripts/manual-base-sources.json'},construction:{source:'public/images/curtains/manual/{main,sheer}.webp',status:'Existing generated fold/alpha assets, largest connected component retained; no new generation'},textures:{sources,provenance:'public/images/fabrics/asset-manifest.json',license:'Existing Pexels reference imagery with recorded modification permission; not supplier stock'},assets},null,2)+'\n');
 console.log('Registered one illustrative window, main/sheer alpha + fold maps and six reference textures. No new images generated.');
})().catch(error=>{console.error(error);process.exitCode=1;});
