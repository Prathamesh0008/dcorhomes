// Editorial references only. Never import these images as supplier inventory.
const fs = require('node:fs'), path = require('node:path'), sharp = require('sharp');
const directory = 'public/images/composer';
const museum = [['floral',78206],['geometric',69810],['damask',236194],['paisley',157155],['botanical',74595]];
const rooms = [
  ['dining',8092433,'elegant-dining-area'],
  ['office',8004011,'minimalist-design-of-a-home-office'],
  ['nursery',4682141,'white-crib-in-the-room'],
  ['guest',17495859,'bed-in-hotel-room'],
];
async function image(url,file) {
  const response = await fetch(url); if (!response.ok) throw Error(`${file}: ${response.status}`);
  let photograph = sharp(Buffer.from(await response.arrayBuffer())).rotate();
  if (file === 'floral.webp') {
    const size = await photograph.metadata();
    photograph = photograph.extract({left:Math.round(size.width*.05),top:Math.round(size.height*.23),width:Math.round(size.width*.90),height:Math.round(size.height*.25)});
  }
  await photograph.resize({width:720,withoutEnlargement:true}).webp({quality:85}).toFile(path.join(directory,file));
}
(async()=>{
  fs.mkdirSync(directory,{recursive:true}); const manifest=[];
  for(const [name,id] of museum){
    const response=await fetch(`https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`);
    if(!response.ok)throw Error('Museum metadata unavailable: '+id);
    const item=await response.json();
    if(!item.isPublicDomain||!item.primaryImageSmall)throw Error('No verified public-domain image: '+id);
    const download=item.primaryImage || item.primaryImageSmall;
    await image(download,name+'.webp');
    manifest.push({file:`/images/composer/${name}.webp`,title:item.title,medium:item.medium,source:item.objectURL,download,license:'https://www.metmuseum.org/policies/image-resources',publicDomain:true,transformation:name==='floral'?'Cropped to upper floral textile register, excluding museum background and scale':'Resized photographic reference',usage:'Photograph of historical textile; pattern inspiration only, not stocked Dcorhome fabric'});
    console.log(name+' verified public-domain photograph');
  }
  for(const [name,id,slug] of rooms){
    const url=`https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=1000`;
    await image(url,name+'.webp');manifest.push({file:`/images/composer/${name}.webp`,source:`https://www.pexels.com/photo/${slug}-${id}/`,download:url,license:'https://www.pexels.com/license/',usage:'Editorial room context only; no furniture or interior-design service is offered'});
    console.log(name+' editorial photograph');
  }
  fs.writeFileSync(path.join(directory,'sources.json'),JSON.stringify(manifest,null,2)+'\n');
})().catch(error=>{console.error(error);process.exitCode=1;});
