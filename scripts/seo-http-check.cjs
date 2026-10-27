// Small production HTTP crawl. No login, database writes, email or browser suite.
const assert=require('node:assert/strict'),fs=require('node:fs'),{spawn}=require('node:child_process');
require('@next/env').loadEnvConfig(process.cwd(),false,{info(){},error(){}});
require('./auth-loader.cjs');
const {seoInventory}=require('../lib/server/seo-inventory.ts'),{siteUrl}=require('../lib/seo.ts');
const records=require('../data/catalogue/fabrics.json');
let server,logs='',stage='startup';const base='http://localhost:3356';
const get=path=>fetch(base+path,{redirect:'manual',headers:{'User-Agent':'Googlebot'},signal:AbortSignal.timeout(20000)});
const attrs=tag=>Object.fromEntries([...tag.matchAll(/([\w:-]+)="([^"]*)"/g)].map(m=>[m[1],m[2].replace(/&amp;/g,'&')]));
const metadata=html=>({canonical:[...html.matchAll(/<link\b[^>]*>/g)].map(m=>attrs(m[0])).find(a=>a.rel==='canonical')?.href,robots:[...html.matchAll(/<meta\b[^>]*>/g)].map(m=>attrs(m[0])).find(a=>a.name==='robots')?.content,title:html.match(/<title>([^<]+)<\/title>/)?.[1],description:[...html.matchAll(/<meta\b[^>]*>/g)].map(m=>attrs(m[0])).find(a=>a.name==='description')?.content});
(async()=>{
 require('./next-output-lock.cjs').acquireNextOutput('.next');
 server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','-p','3356'],{env:{...process.env,VERCEL:'1',VERCEL_ENV:'production',NODE_ENV:'production',NODE_OPTIONS:'--require=./scripts/seo-no-auth-preload.cjs',DCORHOME_TEST_FORBID_MONGO:'true'},windowsHide:true,stdio:['ignore','pipe','pipe']});
 for(const stream of [server.stdout,server.stderr])stream.on('data',b=>logs+=b.toString());
 for(let i=0;i<120&&!logs.includes('Ready in');i++){assert.equal(server.exitCode,null);await new Promise(r=>setTimeout(r,250));}assert.ok(logs.includes('Ready in'));
 const inventory=await seoInventory(),titles=new Set(),descriptions=new Set(),links=new Set(),results=[];
 for(const {path}of [...inventory,...records.map(f=>({path:'/collections/'+f.slug})),...['/designs','/collections/saved','/privacy','/terms'].map(path=>({path}))]){
  stage=path;const start=performance.now(),response=await get(path),html=await response.text(),meta=metadata(html);assert.equal(response.status,200,path);
  assert.equal((html.match(/<h1(?:\s|>)/g)||[]).length,1,'Expected one crawlable H1: '+path);
  const eligible=inventory.some(p=>p.path===path);assert.ok(meta.robots?.includes(eligible?'index,':'noindex'),'Incorrect indexing: '+path);
  if(eligible){assert.equal(meta.canonical?new URL(meta.canonical).href:undefined,new URL(siteUrl+(path==='/'?'/':path)).href,'Incorrect canonical: '+path);assert.ok(meta.title&&meta.description);assert.ok(!titles.has(meta.title),'Duplicate HTTP title');assert.ok(!descriptions.has(meta.description),'Duplicate HTTP description');titles.add(meta.title);descriptions.add(meta.description);}
  for(const script of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)){
   const schema=JSON.parse(script[1]);
   for(const node of schema['@graph']||[schema]){
    const types=[node['@type']].flat();
    if(types.includes('Article'))assert.ok(node.headline&&node.description&&node.mainEntityOfPage&&node.image?.length&&node.publisher,'Incomplete Article schema');
    if(types.includes('BreadcrumbList'))assert.ok(node.itemListElement?.length>=2&&node.itemListElement.every((item,i)=>item.position===i+1&&item.name&&item.item),'Invalid breadcrumbs');
    if(types.includes('LocalBusiness'))assert.ok(node.name&&node.email&&node.address?.postalCode,'Incomplete business schema');
    if(types.includes('Product'))assert.ok(!node.offers&&!node.aggregateRating&&!node.review,'Unsupported merchant schema');
   }
  }
  for(const anchor of html.matchAll(/<a\b[^>]*>/g)){const href=attrs(anchor[0]).href;if(href?.startsWith('/')&&!href.startsWith('//')){const url=new URL(href,base);if(!/^\/(?:login|account|admin|api|signup|forgot-password|reset-password)(?:\/|$)/.test(url.pathname))links.add(url.pathname);}}
  results.push({path,status:response.status,indexable:eligible,elapsedMs:Math.round(performance.now()-start)});
 }
 for(const query of ['?q=linen','?category=linen','?sort=name','?page=2']){stage='/collections'+query;const r=await get(stage),html=await r.text(),meta=metadata(html);assert.equal(r.status,200);assert.ok(meta.robots.includes('noindex'));assert.equal(meta.canonical,siteUrl+'/collections'+(query==='?page=2'?query:''));}
 const demo=records[0],selected=demo.colors[1]||demo.colors[0];const shade=await get('/collections/'+demo.slug+'?shade='+encodeURIComponent(selected.id)),shadeHtml=await shade.text(),shadeMeta=metadata(shadeHtml);assert.equal(shadeMeta.canonical,siteUrl+'/collections/'+demo.slug);assert.ok(shadeMeta.robots.includes('noindex'));const selectedAt=shadeHtml.indexOf('data-testid="selected-shade"');assert.ok(selectedAt>=0&&shadeHtml.slice(selectedAt,selectedAt+1500).includes(selected.name),'Selected shade must survive SEO canonicalization');
 const {searchSwatches}=require('../lib/server/swatch-search.ts'),{parseSwatchQuery}=require('../lib/curtains/swatch-query.ts');
 const lastPage=(await searchSwatches(parseSwatchQuery({page:'999999'}))).page;
 const outOfRange=metadata(await(await get('/collections?page=999999')).text());assert.equal(outOfRange.canonical,siteUrl+'/collections'+(lastPage>1?'?page='+lastPage:''));assert.ok(outOfRange.robots.includes('noindex'));
 for(const route of ['/collections/not-a-real-fabric','/collections/category/linen','/inspiration/not-a-real-guide']){stage=route;const r=await get(route);await r.text();assert.equal(r.status,404,'Invalid/unpublished route needs 404');}
 stage='sitemap';const sitemap=await(await get('/sitemap.xml')).text(),urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);assert.equal(urls.length,inventory.length);for(const url of urls){assert.ok(inventory.some(p=>new URL(siteUrl+(p.path==='/'?'/':p.path)).href===new URL(url).href),'Sitemap mismatch');assert.equal(new URL(url).search,'','Query URL in sitemap');}
 const robots=await(await get('/robots.txt')).text();assert.ok(robots.includes('Allow: /'));assert.ok(!/^Disallow: \/\s*$/m.test(robots));assert.ok(robots.includes(siteUrl+'/sitemap.xml'));
 for(const path of links){stage='link '+path;const r=await get(path);await r.text();assert.ok(r.status>=200&&r.status<400,'Broken public internal link');}
 assert.ok(!logs.includes('FORBIDDEN_MONGODB_CONNECT'));assert.ok(!logs.includes('SEO_FORBIDDEN_AUTH_LOOKUP'));
 fs.mkdirSync('.test-data',{recursive:true});fs.writeFileSync('.test-data/seo-http-results.json',JSON.stringify({results,internalTargets:links.size,indexableUrls:inventory.length,localTimingsOnly:true},null,2));
 console.log(`PASS: ${results.length} public pages, ${links.size} public link targets, filter/shade canonicals, noindex/404 rules, JSON-LD, ${urls.length} sitemap URLs and Production robots; zero database/auth backend calls. Local timings saved privately, not field CWV.`);
})().catch(error=>{console.error('FAIL SEO HTTP at '+stage+': '+(error.code==='ERR_ASSERTION'?error.message.split('\n')[0]:'check_error')+'. No response bodies or environment secrets printed.');process.exitCode=1;}).finally(async()=>{if(server&&server.exitCode===null){const done=new Promise(r=>server.once('exit',r));server.kill('SIGINT');await done;}});
