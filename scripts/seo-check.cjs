// Repository-only quality gate: no secrets, external calls or ranking assumptions.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
require('./auth-loader.cjs');
const seo=require('../data/site/seo.json');
const {canonicalOrigin,canonicalUrl,pageMetadata,indexingAllowed}=require('../lib/seo.ts');
const {indexableFabric,fabricMetadata,categoryFabrics}=require('../lib/seo-catalogue.ts');
const {seoInventory,coreSeoPaths}=require('../lib/server/seo-inventory.ts');
const {editorialContent}=require('../lib/server/content.ts');
const {productSchema,siteIdentity,serializeJsonLd}=require('../lib/structured-data.ts');
const records=require('../data/catalogue/fabrics.json'),categories=require('../data/catalogue/collections.json');
const guidance=require('../data/site/category-guidance.json');
const source=name=>fs.readFileSync(name,'utf8');
const localImage=image=>assert.ok(image.startsWith('/images/')&&fs.existsSync(path.join('public','.'+image)),'Missing approved SEO image');
(async()=>{
 assert.equal(indexingAllowed({...process.env,VERCEL_ENV:'production'}),true,'Production must not accidentally noindex');
 assert.equal(indexingAllowed({...process.env,VERCEL_ENV:'preview'}),false);
 assert.equal(indexingAllowed({...process.env,VERCEL_ENV:'development'}),false);
 for(const value of ['http://localhost:3000','https://localhost','https://user:password@site.example','https://site.example/path','https://site.example/?x=1'])assert.throws(()=>canonicalOrigin(value));
 assert.throws(()=>canonicalUrl('//other.example'));assert.throws(()=>canonicalUrl('/page#fragment'));
 const origin=canonicalOrigin(),articles=(await editorialContent()).articles,inventory=await seoInventory();
 assert.equal(new Set(articles.map(a=>a.slug)).size,articles.length,'Duplicate editorial slug');
 const titles=new Set(),descriptions=new Set();
 for(const entry of inventory){
  const url=new URL(canonicalUrl(entry.path));assert.equal(url.origin,origin);assert.equal(url.search,'');
  assert.ok(!/^\/(?:login|account|admin|api|designs|share)(?:\/|$)/.test(entry.path),'Private route in sitemap');
  const article=articles.find(a=>entry.path==='/inspiration/'+a.slug),fabric=records.find(f=>entry.path==='/collections/'+f.slug);
  const category=entry.path.startsWith('/collections/category/')?guidance[entry.path.split('/').pop()]:undefined;
  const copy=article||seo.pages[entry.path]||(category?{title:category.title,description:category.intro}:undefined);
  const meta=fabric?fabricMetadata(fabric):pageMetadata(copy?.title||entry.path,copy?.description||'',entry.path);
  const title=meta.title.absolute;assert.ok(title&&meta.description,'Missing metadata');
  assert.ok(!titles.has(title),'Duplicate indexable title');assert.ok(!descriptions.has(meta.description),'Duplicate indexable description');titles.add(title);descriptions.add(meta.description);
  if(entry.lastModified)assert.ok(Number.isFinite(Date.parse(entry.lastModified)),'Invalid content date');
 }
 for(const article of articles){localImage(article.image);assert.ok(article.title&&article.description&&article.body.length,'Incomplete article');for(const slug of article.relatedSlugs||[])assert.ok(articles.some(a=>a.slug===slug),'Broken related article');}
 for(const fabric of records){const meta=fabricMetadata(fabric);assert.equal(meta.alternates.canonical,canonicalUrl('/collections/'+fabric.slug));if(fabric.source==='demo'){assert.equal(meta.robots.index,false);assert.equal(productSchema(fabric),null);assert.ok(!inventory.some(p=>p.path==='/collections/'+fabric.slug),'Demo in sitemap');}const schema=productSchema(fabric);if(schema)assert.ok(!['offers','review','aggregateRating','shippingDetails','price','availability'].some(key=>key in schema),'Unsupported merchant schema');}
 for(const category of categories){const included=inventory.some(p=>p.path==='/collections/category/'+category.id);assert.equal(included,Boolean(category.active!==false&&guidance[category.id]&&categoryFabrics(records,category.id).length),'Category inventory gate mismatch');}
 for(const p of Object.values(seo.pages)){assert.ok(p.title.trim()&&p.description.trim(),'Empty metadata override');}
 localImage(seo.socialImage);
 const identity=siteIdentity(),organization=identity['@graph'][0];assert.equal(organization.address.addressLocality,'Navi Mumbai');assert.equal(organization.address.postalCode,'400706');assert.ok(!('openingHours' in organization||'aggregateRating' in organization||'telephone' in organization));
 const hostile='</script><script>alert(1)</script>\u2028';const encoded=serializeJsonLd({value:hostile});assert.ok(!encoded.includes('<'));assert.equal(JSON.parse(encoded).value,hostile);
 assert.ok(source('app/studio/page.tsx').includes('Explore a curtain direction'),'Studio needs crawlable introduction');
 assert.ok(source('app/collections/page.tsx').includes('generateMetadata'),'Filters need request-specific robots');
 assert.ok(source('app/layout.tsx').includes('indexingAllowed()'),'Root indexing policy missing');
 for(const route of coreSeoPaths)assert.ok(seo.pages[route],'Missing core SEO configuration');
 console.log(`PASS: ${inventory.length} canonical indexable URLs; ${articles.length} articles; ${records.filter(indexableFabric).length} eligible products; preview exclusion, demo/category gates, unique metadata, assets and safe truthful JSON-LD.`);
})().catch(error=>{console.error('FAIL SEO: '+error.message);process.exitCode=1;});
