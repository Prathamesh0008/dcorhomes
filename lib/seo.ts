import type { Metadata } from 'next';
import seo from '@/data/site/seo.json';
export type SeoOverride = { title?: string; description?: string; socialDescription?: string; image?: string; imageAlt?: string };
export function canonicalOrigin(value = process.env.SEO_SITE_URL || seo.canonicalOrigin) {
  let url: URL;
  try { url = new URL(value); } catch { throw Error('SEO canonical origin must be a public HTTPS origin. Configure data/site/seo.json or SEO_SITE_URL.'); }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/' || /^(localhost|127\.|0\.|10\.|192\.168\.|\[.*\])|\.local$|\.test$/i.test(url.hostname)) throw Error('SEO canonical origin is invalid; use the approved public HTTPS origin without a path or credentials.');
  return url.origin;
}
export const siteUrl = canonicalOrigin();
export function indexingAllowed(env: NodeJS.ProcessEnv = process.env) {
  if (env.VERCEL_ENV === 'production' && !seo.indexingEnabled) throw Error('Production SEO indexing is disabled. Review data/site/seo.json before deployment.');
  return seo.indexingEnabled && (env.VERCEL_ENV ? env.VERCEL_ENV === 'production' : env.NODE_ENV === 'production');
}
export function canonicalUrl(path: string) {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('#') || path.includes('\\')) throw Error('SEO canonical path must be a local absolute path without a fragment.');
  const url = new URL(path, siteUrl);
  if (url.origin !== siteUrl) throw Error('SEO canonical must use the approved origin.');
  if (url.pathname !== '/') url.pathname = url.pathname.replace(/\/+$/, '');
  return url.href;
}
export function pageMetadata(title: string, description: string, path: string, options: { index?: boolean; image?: string; imageAlt?: string; type?: 'website' | 'article'; override?: SeoOverride } = {}): Metadata {
  const override = options.override || (seo.pages as Record<string, SeoOverride>)[path] || {};
  title = override.title?.trim() || title; description = override.description?.trim() || description;
  const branded = title.includes('| Dcorhome') ? title : `${title} | Dcorhome`;
  const image = override.image || options.image || seo.socialImage;
  const alt = override.imageAlt || options.imageAlt || seo.socialImageAlt;
  const index = options.index !== false && indexingAllowed();
  return { title: { absolute: branded }, description, alternates: { canonical: canonicalUrl(path) },
    robots: { index, follow: options.index === false || index, googleBot: { index, follow: options.index === false || index, 'max-image-preview': 'large' } },
    openGraph: { title: branded, description: override.socialDescription || description, url: canonicalUrl(path), siteName: seo.siteName, locale: 'en_IN', type: options.type || 'website', images: [{ url: canonicalUrl(image), alt }] },
    twitter: { card: 'summary_large_image', title: branded, description: override.socialDescription || description, images: [{ url: canonicalUrl(image), alt }] } };
}
