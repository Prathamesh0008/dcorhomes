// Test-process preload only. Never imported by application code.
if(process.env.DCORHOME_TEST_PROVIDER!=='enabled')throw Error('Test provider preload requires the explicit test flag.');
const realFetch=global.fetch,fs=require('node:fs'),path=require('node:path');
global.fetch=async(input,options)=>{if(String(input)==='https://api.openai.com/v1/images/edits'){
 if(options.headers.Authorization!=='Bearer test-only-not-a-real-key')throw Error('Unexpected live provider key in test.');
 const prompt=String(options.body.get('prompt'));
 if(!prompt.includes('"sheerFabric":"solstice"')||!prompt.includes('"sheerMaterial":"Sheer Weave"'))throw Error('Independent sheer material missing from prompt');
 if(prompt.includes('"configuratorFabric":"Velvet"')&&(!prompt.includes('"sheerColor":"#eee3c9"')||!prompt.includes('"configuratorStyle":"Pinch Pleat"')||!prompt.includes('"material":"Velvet"')))throw Error('Selected main/sheer/material/style missing from provider prompt');
 if(prompt.includes('"pattern":"Floral"'))return new Response(JSON.stringify({error:{message:'Controlled provider rate limit'}}),{status:429});
 return new Response(JSON.stringify({data:[{b64_json:fs.readFileSync(path.join(process.cwd(),'public/images/hero-room-after.webp')).toString('base64')}]}),{headers:{'Content-Type':'application/json'}});
}if(String(input).startsWith('https://api.resend.com/'))throw Error('Email is forbidden in this test.');return realFetch(input,options);};
