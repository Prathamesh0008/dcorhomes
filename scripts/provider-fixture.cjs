// Isolated test process only. No application import and no real provider traffic.
if(process.env.DCORHOME_TEST_PROVIDER!=='enabled'||process.env.OPENAI_API_KEY!=='test-only-not-a-real-key')throw Error('Explicit isolated test credentials required.');
let failResult=false;const promises=require('node:fs/promises'),write=promises.writeFile;promises.writeFile=async(file,...args)=>{if(failResult&&String(file).endsWith('result.webp')){failResult=false;throw Error('Private storage failure fixture');}return write(file,...args);};
const realFetch=global.fetch,fs=require('node:fs'),assert=require('node:assert/strict'),sharp=require('sharp');
global.fetch=async(input,options)=>{
 const url=typeof input==='string'?input:input.url||String(input);
 if(url==='https://api.openai.com/v1/images/edits'){
  const request=new Request(input,{...options,duplex:'half'});
  assert.equal(request.headers.get('authorization'),'Bearer test-only-not-a-real-key');
  const body=await request.formData(),prompt=String(body.get('prompt'));
  assert.ok(!prompt.includes('untrustedPrompt')&&!prompt.includes('invented-value'));
  assert.equal(body.get('model'),'gpt-image-2.5-sunburst');assert.equal(body.get('n'),'1');assert.equal(body.get('quality'),'medium');assert.equal(body.get('input_fidelity'),null);
  const imageFile=body.get('image[]')||body.get('image'),maskFile=body.get('mask');assert.ok(imageFile&&maskFile);
  const image=Buffer.from(await imageFile.arrayBuffer()),mask=Buffer.from(await maskFile.arrayBuffer());
  const meta=await sharp(image).metadata(),m=await sharp(mask).raw().toBuffer({resolveWithObject:true});
  assert.equal(m.info.width,meta.width);assert.equal(m.info.height,meta.height);assert.equal(m.info.channels,4);assert.equal(m.data[3],255);assert.equal(m.data[(Math.floor(meta.height/2)*meta.width+Math.floor(meta.width/2))*4+3],0);
  assert.ok(prompt.includes('"variantId"')&&prompt.includes('"shadeCode"')&&prompt.includes('"sheerEnabled":true')&&prompt.includes('Preserve the original camera perspective'));
  fs.appendFileSync(process.env.DCORHOME_TEST_PROVIDER_LOG,'call\n');
  await new Promise(r=>setTimeout(r,500));
  if(prompt.includes('"style":"Classic"'))return Response.json({error:{message:'Private controlled auth error',type:'invalid_request_error'}},{status:401});
  if(prompt.includes('"style":"Luxury"'))return Response.json({error:{message:'Controlled rate error',type:'rate_limit_error'}},{status:429});
  if(prompt.includes('"style":"Minimalist"'))return Response.json({error:{message:'Private provider unavailable'}},{status:503});
  if(prompt.includes('"style":"Romantic"'))failResult=true;
  if(prompt.includes('"style":"Contemporary"'))return Response.json({data:[]});
  const result=await sharp({create:{width:meta.width,height:meta.height,channels:3,background:'#19754d'}}).png().toBuffer();
  return Response.json({data:[{b64_json:result.toString('base64')}],usage:{total_tokens:123}},{headers:{'x-request-id':'isolated-fixture-request'}});
 }
 if(url.startsWith('https://api.openai.com/')||url.startsWith('https://api.resend.com/'))throw Error('External AI/email forbidden in isolated tests.');
 return realFetch(input,options);
};
