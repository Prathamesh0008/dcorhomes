import type { Metadata } from "next";
export const siteUrl=process.env.SITE_URL||"http://localhost:3000";
export function pageMetadata(title:string,description:string,path:string):Metadata{return{title,description,alternates:{canonical:path},openGraph:{title,description,url:path,siteName:"Dcorhome",type:"website",images:[{url:"/images/hero-room-after.webp",width:1120,height:1400,alt:"Dcorhome illustrative curtain design"}]}};}
