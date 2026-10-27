import type { MetadataRoute } from "next";
import { siteUrl, indexingAllowed } from "@/lib/seo";
export default function robots():MetadataRoute.Robots{return{rules:indexingAllowed()?{userAgent:'*',allow:'/',disallow:['/api/','/admin','/account','/login','/designs','/share/','/collections/saved']}:{userAgent:'*',disallow:'/'},sitemap:siteUrl+'/sitemap.xml'};}
