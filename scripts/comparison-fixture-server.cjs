// Isolated browser harness. Repeated AI illustration pairs are test fixtures,
// never production content or claims about multiple photographed installations.
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const work=path.resolve('.test-data/comparison-fixture');fs.mkdirSync(work,{recursive:true});
fs.writeFileSync(path.join(work,'loader.cjs'),`const ts=require('typescript');module.exports=function(text){return ts.transpileModule(text,{compilerOptions:{jsx:ts.JsxEmit.ReactJSX,module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText};`);
fs.writeFileSync(path.join(work,'image.cjs'),`const React=require('react');module.exports=function Image({fill,priority,sizes,style,...props}){return React.createElement('img',{...props,style:{position:'absolute',inset:0,width:'100%',height:'100%',...style}})};`);
fs.writeFileSync(path.join(work,'entry.cjs'),`const React=require('react'),{createRoot}=require('react-dom/client'),Slider=require('../../components/home/HeroComparisonSlider.tsx').default;const slides=[0,1,2].map(i=>({id:'fixture-only-'+i,beforeSrc:'/images/hero-room-before.webp',afterSrc:'/images/hero-room-after.webp',alt:'TEST FIXTURE: repeated matched AI illustration',label:'Test pair '+(i+1)}));createRoot(document.getElementById('root')).render(React.createElement(Slider,{slides,illustration:slides[0]}));` .replace('../../components/','../../components/'));
const compiled=require('next/dist/compiled/webpack/webpack');compiled.init();
compiled.webpack({mode:'development',devtool:false,context:process.cwd(),entry:path.join(work,'entry.cjs'),output:{path:work,filename:'bundle.js'},resolve:{extensions:['.tsx','.ts','.js','.cjs'],alias:{'@':process.cwd(),'next/image$':path.join(work,'image.cjs')}},module:{rules:[{test:/\.tsx?$/,use:path.join(work,'loader.cjs')}]},performance:{hints:false}},(error,stats)=>{
 if(error||stats.hasErrors()){console.error(error||stats.toString({all:false,errors:true}));process.exit(1);}
 const styles=fs.readdirSync('.next/static/css').filter(f=>f.endsWith('.css')).map(f=>fs.readFileSync(path.join('.next/static/css',f),'utf8')).join('\n');
 http.createServer((request,response)=>{
  const url=new URL(request.url,'http://localhost');
  if(url.pathname==='/'){response.setHeader('Content-Type','text/html');response.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/styles.css"></head><body><p>ISOLATED TEST FIXTURE — repeated AI pair, no production catalogue</p><div id="root" style="max-width:700px;margin:60px auto"></div><script src="/bundle.js"></script></body></html>');return;}
  if(url.pathname==='/styles.css'){response.setHeader('Content-Type','text/css');response.end(styles);return;}
  if(url.pathname==='/bundle.js'){response.setHeader('Content-Type','application/javascript');response.end(fs.readFileSync(path.join(work,'bundle.js')));return;}
  if(/^\/images\/[a-zA-Z0-9/-]+\.webp$/.test(url.pathname)){const file=path.resolve('public','.'+url.pathname);if(file.startsWith(path.resolve('public')+path.sep)&&fs.existsSync(file)){response.setHeader('Content-Type','image/webp');response.end(fs.readFileSync(file));return;}}
  response.writeHead(404);response.end();
 }).listen(3201,'127.0.0.1',()=>console.log('Isolated comparison fixture: http://127.0.0.1:3201'));
});
