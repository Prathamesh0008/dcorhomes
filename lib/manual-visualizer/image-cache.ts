const cache=new Map<string,{promise:Promise<HTMLImageElement>;bytes:number}>();
const budget=32*1024*1024;
function trim(){
 let bytes=[...cache.values()].reduce((sum,item)=>sum+item.bytes,0);
 for(const [key,item] of cache){
  if(bytes<=budget&&cache.size<=16)break;
  cache.delete(key);bytes-=item.bytes;
 }
}
export function loadImage(src:string):Promise<HTMLImageElement>{
 if(!src.startsWith('/')||src.startsWith('//'))return Promise.reject(Error('Preview images must be hosted on this site.'));
 const existing=cache.get(src);
 if(existing){cache.delete(src);cache.set(src,existing);return existing.promise;}
 const entry={promise:null as unknown as Promise<HTMLImageElement>,bytes:0};
 entry.promise=new Promise<HTMLImageElement>((resolve,reject)=>{
  const image=new Image();image.decoding='async';
  const fail=()=>{if(cache.get(src)===entry)cache.delete(src);reject(Error('This image is temporarily unavailable. Please try another selection.'));};
  image.onerror=fail;
  image.onload=()=>image.decode().then(()=>{entry.bytes=image.naturalWidth*image.naturalHeight*4;trim();resolve(image);}).catch(fail);
  image.src=src;
 });
 cache.set(src,entry);trim();return entry.promise;
}
