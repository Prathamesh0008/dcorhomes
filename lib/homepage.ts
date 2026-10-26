import type { FabricRecord } from '@/lib/curtains/catalogue';
import { categoryId, type FabricCategory } from '@/lib/curtains/categories';
export type HomeCategory={id:string;name:string;description:string;image:string;href:string;count:number};
export type CategoryFabric=Pick<FabricRecord,'id'|'category'|'categoryId'|'blackoutPercentage'|'active'|'images'> & {colors:{active?:boolean}[]};
// Editorial scene choices are not claims about the composition of photographed cloth.
const art:Record<string,{image:string;description:string}>={
 sheer:{image:'/images/home/window-greenery.jpg',description:'A softer way to welcome the daylight.'},
 silk:{image:'/images/home/sunlit-sheers.jpg',description:'Explore a lustrous material direction.'},
 velvet:{image:'/images/home/bedroom-drapes.jpg',description:'Depth, texture and a richer palette.'},
 linen:{image:'/images/atelier-interior.jpg',description:'A relaxed rhythm of texture and light.'},
 blackout:{image:'/images/dark-textile.jpg',description:'Explore a more sheltered atmosphere.'},
 textured:{image:'/images/home/green-drapes.jpg',description:'Let the surface tell its own story.'},
};
export function homeCategories(records:CategoryFabric[],categories:FabricCategory[]):HomeCategory[]{
 const result:HomeCategory[]=[];
 for(const id of ['sheer','silk','velvet','linen','blackout','textured',...categories.map(c=>c.id)]){
  if(result.some(c=>c.id===id))continue;
  const category=categories.find(c=>c.id===id);if(id!=='blackout'&&(!category||category.active===false))continue;
  const matches=records.filter(f=>f.active!==false&&f.colors.some(c=>c.active!==false)&&(id==='blackout'?(f.category==='Blackout'||(f.blackoutPercentage||0)>0):categoryId(f)===id&&f.category!=='Blackout'));
  if(!matches.length)continue;
  const scene=art[id];result.push({id,name:id==='blackout'?'Blackout':category!.name,description:scene?.description||'Explore the texture, discover your palette.',image:scene?.image||matches[0].images[0]||'',href:id==='blackout'?'/collections?blackout=1':`/collections?category=${encodeURIComponent(id)}`,count:matches.length});
 }
 return result;
}
export function homeFeaturedFabrics(records:FabricRecord[]){
 const candidates=records.filter(f=>f.active!==false&&f.colors.some(c=>c.active!==false));
 const selected:FabricRecord[]=[];
 for(const id of ['silk','velvet','textured','linen','sheer']){const match=candidates.find(f=>categoryId(f)===id&&!selected.includes(f));if(match)selected.push(match);if(selected.length===3)break;}
 return [...selected,...candidates.filter(f=>!selected.includes(f))].slice(0,3);
}
