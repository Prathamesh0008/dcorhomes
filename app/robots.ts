import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
export default function robots():MetadataRoute.Robots{return{rules:{userAgent:'*',allow:process.env.SITE_URL?'/':undefined,disallow:process.env.SITE_URL?['/admin','/api/','/designs','/share/','/privacy','/terms']:['/']},sitemap:siteUrl+'/sitemap.xml'};}
