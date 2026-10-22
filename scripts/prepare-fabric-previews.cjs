const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp'),crypto=require('node:crypto'),ts=require('typescript');
const sources=require('./fabric-preview-sources.json');
const old=require.extensions['.ts'];require.extensions['.ts']=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,file);
const {demoFabrics}=require('../lib/curtains/demo-catalogue.ts');if(old)require.extensions['.ts']=old;else delete require.extensions['.ts'];
const linear=v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);};
const srgb=v=>Math.round(255*(v<=.0031308?12.92*v:1.055*Math.pow(v,1/2.4)-.055));
(async()=>{const manifest={method:'Fabric-only crop, linear-light luminance transfer with preserved high-frequency texture and neutral specular highlights. No room pixels or CSS color overlay.',license:'https://www.pexels.com/license/',licenseStatus:'Pexels permits commercial website use and modification; source pages verified 2026-10-22. No supplier endorsement or inventory claim.',assets:[]};
 manifest.sources=Object.entries(sources).map(([fabricId,source])=>({...source,fabricId,mode:'licensed-stock-reference-photograph',referenceImage:`/images/fabrics/${fabricId}/texture-reference.webp`,permission:'Commercial website use and modification under the Pexels license; not a supplier-approved shade photograph.'}));
 for(const fabric of demoFabrics){const spec=sources[fabric.id];if(!spec)throw Error('Missing source '+fabric.id);const root=path.join('public','images','fabrics',fabric.id);fs.mkdirSync(root,{recursive:true});let input=sharp(path.join('public',spec.source));if(spec.crop)input=input.extract(spec.crop);const base=await input.resize({width:1600,height:2000,fit:'cover'}).removeAlpha().raw().toBuffer({resolveWithObject:true});
 await sharp(base.data,{raw:base.info}).webp({quality:91}).toFile(path.join(root,'texture-reference.webp'));
 const luminance=new Float32Array(base.info.width*base.info.height);let sum=0;for(let i=0;i<luminance.length;i++){const y=.2126*linear(base.data[i*3])+.7152*linear(base.data[i*3+1])+.0722*linear(base.data[i*3+2]);luminance[i]=y;sum+=y;}const mean=sum/luminance.length;
 for(const variant of fabric.colors){const rgb=[1,3,5].map(i=>linear(parseInt(variant.hexPreview.slice(i,i+2),16))),output=Buffer.alloc(base.data.length);for(let i=0;i<luminance.length;i++){const ratio=luminance[i]/Math.max(.01,mean),shade=Math.max(.05,Math.pow(ratio,.82)),highlight=Math.max(0,ratio-1.22)*.13;for(let c=0;c<3;c++)output[i*3+c]=srgb(Math.min(1,rgb[c]*shade+highlight));}
 const encode=()=>sharp(output,{raw:base.info});const file=variant.digitalPreviewImage;
 await encode().webp({quality:88}).toFile(path.join('public',file));
 await encode().extract({left:320,top:450,width:960,height:1200}).webp({quality:94}).toFile(path.join('public',variant.digitalPreviewImages[0]));
 await encode().resize(160,160,{fit:'cover'}).webp({quality:85}).toFile(path.join('public',variant.digitalSwatchImage));
 manifest.assets.push({fabricId:fabric.id,variantId:variant.id,hex:variant.hexPreview,mode:'digital-approximation',source:spec.source,sourceUrl:spec.sourceUrl,photographer:spec.photographer||'See source page',crop:spec.crop||'Full frame, fabric only',mainImage:file,textureImage:variant.digitalPreviewImages[0],swatchImage:variant.digitalSwatchImage,sha256:crypto.createHash('sha256').update(fs.readFileSync(path.join('public',file))).digest('hex')});}
 console.log(fabric.id+': '+fabric.colors.length+' photographic shade previews encoded');}
 fs.writeFileSync('public/images/fabrics/asset-manifest.json',JSON.stringify(manifest,null,2)+'\n');
})().catch(error=>{console.error(error);process.exitCode=1;});
