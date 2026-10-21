const fs=require('node:fs'),sharp=require('sharp');
const root='C:/Users/AMD/.codex/generated_images/01a15d9c-2307-7460-ac6a-12fb29c95cd8/';
const files={room:'exec-6231a8f1-b2a4-4e7c-8092-606e41072c35.png',main:'exec-33e962d4-2938-4526-81a9-640c6532e4c2.png',sheer:'exec-e792962f-5183-4b3e-a0c9-f3d1fcb403eb.png'};
fs.mkdirSync('public/images/curtains/manual',{recursive:true});
const entries=[...Object.entries(files).map(([id,file])=>({id,path:root+file})),...require('./manual-room-sources.json')];
Promise.all(entries.map(async({id,path})=>{await sharp(path).resize(1280,960,{fit:'fill'}).webp({quality:90,alphaQuality:100}).toFile(`public/images/curtains/manual/${id}.webp`);console.log(id,'encoded');})).catch(e=>{console.error(e);process.exitCode=1;});
