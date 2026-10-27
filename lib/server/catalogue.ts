import { existsSync } from "node:fs";
import path from "node:path";
import { categoryNames, type CurtainProduct } from "@/lib/catalog";
import { HttpError } from "./http";
import { fabricRecords } from './fabric-records';
export async function catalogue(): Promise<CurtainProduct[]> {
 return (await fabricRecords()).map(f=>({id:f.id,name:f.name,subtitle:f.collection||f.brand||f.category,category:f.category as CurtainProduct['category'],description:f.description,image:f.images[0]||'',imageAlt:f.name,imageNote:f.source==='supplier'?'Supplier catalogue photograph':'Demo fabric reference; not a verified supplier photograph',color:f.colors.find(c=>c.active!==false&&c.available!==false)?.hexPreview||'#baa48e',accent:f.colors[0]?.family||'Unverified',pricePerMeter:f.pricePerMetre??null}));
}
export async function validateFabric(input: Record<string, unknown>) {
  const text = (key: string, max: number) => typeof input[key] === "string" ? String(input[key]).trim().slice(0, max) : "";
  const id = text("id", 60), name = text("name", 100), category = text("category", 40), image = text("image", 200);
  if (!/^[a-z0-9-]+$/.test(id) || name.length < 2 || !categoryNames.includes(category as never) || category === "All fabrics" || !((/^\/images\/[a-z0-9-]+\.(jpg|webp|avif)$/.test(image)&&existsSync(path.join(process.cwd(),"public",image))))) throw new HttpError(400, "Use a valid ID, category, name and local image path.");
  return { id, name, category, image, subtitle: text("subtitle", 200), description: text("description", 1000), imageAlt: text("imageAlt", 200) || name, imageNote: text("imageNote", 300) || "Illustrative sample; availability on enquiry", color: /^#[0-9a-f]{6}$/i.test(text("color", 7)) ? text("color", 7) : "#baa48e", accent: text("accent", 100), pricePerMeter: null, archived: input.archived === true };
}
