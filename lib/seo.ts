import type { Metadata } from "next";
import seo from "@/data/site/seo.json";
export const siteUrl=process.env.SITE_URL||"http://localhost:3000";
export function pageMetadata(title:string,description:string,path:string):Metadata{const override=(seo.pages as Record<string,{title?:string;description?:string}>)[path];title=override?.title||title;description=override?.description||description;return{title,description,alternates:{canonical:path},openGraph:{title,description,url:path,siteName:"Dcorhome",type:"website",images:[{url:"/images/hero-room-after.webp",width:1120,height:1400,alt:"Dcorhome illustrative curtain design"}]}};}
