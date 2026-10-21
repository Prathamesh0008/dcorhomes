import { existsSync } from "node:fs";
import path from "node:path";
import { row } from "./db";
import { products, categoryNames, type CurtainProduct } from "@/lib/catalog";
import { databaseReady, rows } from "./db";
import { HttpError } from "./security";
import supplierData from '@/lib/curtains/supplier-catalogue.json';
import type { FabricRecord } from '@/lib/curtains/catalogue';
export function catalogue() { const overrides = databaseReady() ? rows("fabric") : []; const entries = new Map(products.map(p => [p.id, p])); for(const f of supplierData as FabricRecord[])entries.set(f.id,{id:f.id,name:f.name,subtitle:f.brand||f.category,category:f.category as CurtainProduct['category'],description:f.description,image:f.images[0],imageAlt:f.name,imageNote:'Supplier catalogue photograph',color:f.colors.find(c=>c.available!==false)!.hexPreview,accent:f.colors[0].family,pricePerMeter:f.pricePerMetre??null}); for (const item of overrides) entries.set(item.id, JSON.parse(item.data)); return [...entries.values()].filter(p => !(p as CurtainProduct & { archived?: boolean }).archived); }
export function validateFabric(input: Record<string, unknown>) {
  const text = (key: string, max: number) => typeof input[key] === "string" ? String(input[key]).trim().slice(0, max) : "";
  const id = text("id", 60), name = text("name", 100), category = text("category", 40), image = text("image", 200);
  if (!/^[a-z0-9-]+$/.test(id) || name.length < 2 || !categoryNames.includes(category as never) || category === "All fabrics" || !((/^\/images\/[a-z0-9-]+\.(jpg|webp|avif)$/.test(image)&&existsSync(path.join(process.cwd(),"public",image)))||(/^\/api\/catalogue\/images\/[a-f0-9-]{36}$/.test(image)&&row("catalogue-image",image.split("/").pop()!)))) throw new HttpError(400, "Use a valid ID, category, name and local image path.");
  return { id, name, category, image, subtitle: text("subtitle", 200), description: text("description", 1000), imageAlt: text("imageAlt", 200) || name, imageNote: text("imageNote", 300) || "Illustrative sample; availability on enquiry", color: /^#[0-9a-f]{6}$/i.test(text("color", 7)) ? text("color", 7) : "#baa48e", accent: text("accent", 100), pricePerMeter: null, archived: input.archived === true };
}
