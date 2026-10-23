const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
module.exports=async({go,evaluate,call,delay})=>{
 for(const [route,width] of [['/fabrics/swatch-search/',1440],['/fabrics/swatch-search/',390],['/abella/',1440],['/woburn/',1440],['/zyra/',390]]){
  // Reference pictures are inspected only; never copied into project assets.
  try{await go(route,width);}catch(error){console.log('Reference load observation:',error.message);}
  await delay(1800);
  const name=route.replaceAll('/','')+'-'+width;
  console.log(JSON.stringify({route,width,inspection:await evaluate(`({title:document.title,text:document.body.innerText.slice(-26000),controls:[...document.querySelectorAll('main select,main input,main button,main [role=button]')].map(e=>({tag:e.tagName,label:e.getAttribute('aria-label')||e.textContent?.trim().slice(0,100),name:e.name,value:e.value})),layout:[...document.querySelectorAll('main,.sidebar,.column.main,.products-grid,.product-info-main,.product.media')].map(e=>({class:e.className,x:e.getBoundingClientRect().x,width:e.getBoundingClientRect().width}))})`)}));
  const shot=await call('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(os.tmpdir(),'dcorhome-reference-'+name+'.png'),Buffer.from(shot.data,'base64'));
 }
};
