// Excel: save the template as UTF-8 CSV. One row per shade, parent columns repeated.
// Converts to existing protected, create-only admin import; never writes a database.
const fs=require('node:fs');
const {csv,convert}=require('./import-supplier-csv.cjs');
const parent={'Fabric ID':'id','Fabric Name':'name','Collection':'collection','Category':'category','Category ID':'categoryId','Composition':'composition','Width CM':'fabricWidthCm','Weight GSM':'weightGsm','Pattern':'pattern','Usage':'usage','Care Instructions':'careInstructions','Fabric SKU':'sku','Brand':'brand','Country of Origin':'countryOfOrigin','Linear Weight GM':'linearWeightGm','Rub Count':'abrasionRubCount','Published At':'publishedAt','Technical Sheet':'technicalSheet','Lead Time':'leadTime','Stock Metres':'stockQuantityMetres','Price Per Metre':'pricePerMetre','Currency':'currency','Light Filtering':'lightFiltering','Supplier Reference':'supplierReference','Shrinkage':'shrinkage','Applications':'applications','Active':'active'};
const shade={'Shade ID':'id','Shade Name':'name','Shade Code':'colorCode','Variant SKU':'variantSku','Shade Image':'mainImage','Additional Images':'images','Availability':'availability','Available':'available','Colour Family':'family','Shade Active':'active'};
const required=['Fabric ID','Fabric Name','Collection','Category','Composition','Width CM','Weight GSM','Pattern','Vertical Repeat','Horizontal Repeat','Usage','Care Instructions','Shade ID','Shade Name','Shade Code','Variant SKU','Shade Image','Additional Images','Availability'];
function convertFlat(rows){
 const errors=[],parents=new Map(),shades=[],keys=new Set(),skus=new Set();
 rows.forEach((row,index)=>{const at='CSV row '+(index+2);try{
  for(const key of Object.keys(row))if(!parent[key]&&!shade[key]&&!['Vertical Repeat','Horizontal Repeat','Description','Heading Styles','Images','Image Rights Confirmed'].includes(key))throw Error('Unsupported column '+key);
  for(const key of ['Fabric ID','Fabric Name','Category','Category ID','Fabric SKU','Usage','Shade ID','Shade Name','Shade Code','Variant SKU','Colour Family'])if(!row[key])throw Error(key+' is required');
  if(row['Image Rights Confirmed']!=='true')throw Error('Confirm authorization for every imported image (Image Rights Confirmed=true)');
  const combined=JSON.stringify([row['Fabric ID'],row['Shade ID']]);if(keys.has(combined))throw Error('Duplicate shade ID within fabric');keys.add(combined);
  const sku=row['Variant SKU'].toLowerCase();if(skus.has(sku))throw Error('Duplicate variant SKU');skus.add(sku);
  const p={source:'supplier',slug:row['Fabric ID'],description:row.Description||'',images:row.Images||'',compatibleHeadingStyles:row['Heading Styles']||''};for(const [from,to]of Object.entries(parent))if(row[from])p[to]=row[from];
  if(Boolean(row['Vertical Repeat'])!==Boolean(row['Horizontal Repeat']))throw Error('Supply both repeat dimensions, or leave both blank');
  if(row['Vertical Repeat'])p.patternRepeatCm=JSON.stringify({vertical:Number(row['Vertical Repeat']),horizontal:Number(row['Horizontal Repeat'])});
  const prior=parents.get(p.id);if(prior&&JSON.stringify(prior)!==JSON.stringify(p))throw Error('Conflicting repeated parent fields for '+p.id);parents.set(p.id,p);
  const v={fabricId:p.id};for(const [from,to]of Object.entries(shade))if(row[from])v[to]=row[from];shades.push(v);
 }catch(error){errors.push(at+': '+error.message);}});
 if(errors.length)throw Error(errors.join('\n'));
 // Run full structural validation separately per parent so errors identify rows/fabric.
 const records=[];for(const p of parents.values())try{records.push(...convert([p],shades.filter(s=>s.fabricId===p.id)));}catch(error){errors.push('Fabric '+p.id+' (CSV rows '+rows.map((r,i)=>r['Fabric ID']===p.id?i+2:null).filter(Boolean).join(', ')+'): '+error.message);}
 const allSkus=new Set();for(const f of records)for(const sku of [f.sku,...f.colors.map(v=>v.variantSku)]){const normalized=sku.toLowerCase();if(allSkus.has(normalized))errors.push('Duplicate product/variant SKU: '+sku);allSkus.add(normalized);}
 if(errors.length)throw Error(errors.join('\n'));return records;
}
module.exports={convertFlat,required};
if(require.main===module){try{const [input,output]=process.argv.slice(2);if(!input||!output)throw Error('Usage: node scripts/import-swatch-csv.cjs supplier.csv new-import.json');const text=fs.readFileSync(input,'utf8');
 const rows=csv(text);if(!rows.length)throw Error('No shade rows provided. Fill the template with authorized supplier data.');for(const key of required)if(!(key in rows[0]))throw Error('Missing required column: '+key);
 const records=convertFlat(rows);fs.writeFileSync(output,JSON.stringify({kind:'fabric-import',records},null,2)+'\n',{flag:'wx'});console.log(records.length+' parent fabrics converted. No existing file or catalogue record overwritten. Submit through authenticated admin for asset/category/existing-SKU validation.');
 }catch(error){console.error(error.message);process.exitCode=1;}}
