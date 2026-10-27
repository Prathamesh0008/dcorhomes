# Dcorhome SEO audit and implementation

Audit date: 27 October 2026. Canonical configured production origin: `https://dcorhomes.vercel.app`. Changes are local repository work, not a deployed/live Search Console verification. No guaranteed rankings or search-volume figures are asserted.

## Baseline actually inspected

25 concrete public HTML URLs were audited before additions: nine core pages (`/`, `/collections`, `/studio`, `/measure`, `/inspiration`, `/about`, `/contact`, `/faq`, `/how-it-works`); five existing article URLs; seven demo fabric URLs; and four public utility/draft pages (`/designs`, `/collections/saved`, `/privacy`, `/terms`). Authentication surfaces and the retired `/share/[token]` route were additionally inspected for index exclusion, not treated as commercial landing pages. The final public HTML inventory is 28 after three new guides. Invalid product/article/category URLs were sampled separately.

Existing editorial URLs retained: `choosing-living-room-curtains`, `sheer-vs-blackout`, `curtain-colors-modern-homes`, `measure-windows-for-curtains`, `curtain-pleats-and-lengths`. Existing fabric slugs retained: `sienna`, `clay`, `noir`, `olive`, `solstice`, `pearl`, `silk-satin-study`. All seven are explicitly demo records, not verified supplier merchandise. The source contains zero supplier records, 31 shades and ten classification categories. No product record, shade ID or image asset was replaced.

| Confirmed source finding | Implementation / disposition |
| --- | --- |
| Empty SEO overrides, no Twitter cards and inconsistent page-specific social data | Central nine-page configuration plus reusable absolute titles, descriptions, canonical, OG/Twitter image and robots policy. |
| Public metadata/sitemap fell back to localhost and indexing depended on truthiness of SITE_URL | One validated public HTTPS canonical origin in SEO config, optional SEO_SITE_URL override; independent of authentication SITE_URL. Invalid canonical settings fail the build. |
| Preview builds could inherit indexable metadata | VERCEL_ENV=preview/development is noindex; preview sitemap is empty and robots disallows crawling. Production indexing-disabled configuration raises a clear error. |
| Sitemap included ten category filter URLs and seven demo products | Generated from eligible content only: nine core pages and eight articles = 17 URLs today. No query URLs, demos, private pages or empty categories. |
| All filter/search pages inherited indexable base metadata | Filter/search/sort/presentation requests get noindex; base collection canonical consolidates them. Normal paginated content uses its normalized page canonical, noindex/follow, and retains navigation. Out-of-range pages canonicalize to the page actually shown. |
| Demo product pages inherited indexable metadata | All seven remain accessible, with descriptive metadata and parent fabric canonicals for shade variants; noindex/follow, excluded from sitemap and Product schema. |
| Supplier-only Product schema existed but was limited | Shared eligibility and schema generation now require actual documented records; no Offer/price/availability/review/shipping claims. Current real-product count is zero. Semantic Product markup alone does not establish Google's rich-result eligibility. |
| Studio had a generic AI-oriented description and no explanatory server landing section | Accurate manual-visualizer metadata and a server-rendered narrative below the unchanged controls, with limitations and useful links. Existing single H1 preserved. |
| Existing articles were brief (96–119 words each), with limited metadata and generic author markup | Five URLs retained, metadata/social/breadcrumb/related-link rendering improved; unsupported author attribution removed. Three substantial new guides added. Existing brief guides still need deeper owner-reviewed enrichment. |
| Article schema lacked page/image identity; dates/authorship unknown | Safe shared serialization, page/image/publisher references, dates only for newly authored guides; no invented author or historical dates. |
| Address and business experience already existed on About/Contact | Retained truthful visible identity, added corresponding Organization/LocalBusiness and WebSite graph on homepage. No fabricated hours/phone/coordinates/reviews/showroom. |
| Thumbnail descriptions were generic and all thumbnails loaded eagerly | Descriptive fabric-context alt text, explicit thumbnail dimensions, lazy loading and async decoding. Existing hero/room/texture/logo files untouched. |
| Root force-dynamic exists; no global auth lookup is present | Boundary retained to avoid changing private-route behavior during the separate Clerk migration. Static parameter generation added for public detail routes; build labels them SSG, but global dynamic inheritance limits any caching claim. No private data was placed in shared caches. |
| No practical SEO quality gate | check:seo added to existing prebuild after preservation validation. Actual malformed/duplicate metadata, invalid URLs, broken article references/assets, inappropriate inventory/schema and Production indexing mistakes fail. No arbitrary keyword density/length targets. |

## Canonical and indexation policy

`data/site/seo.json` is the public SEO source, separate from authentication settings. Keep one approved canonical origin without path/query/userinfo; metadataBase and all schema/sitemap URLs use it. Next.js' existing no-trailing-slash behavior remains; root slash variants normalize to the same URL. No published path changed, so no fabricated redirect mapping was added.

Base public pages and published guides are indexable only in Production. Draft legal pages, local saved content, demos, account/admin/login/API/share surfaces are excluded. Noindex is an indexing directive, not resource authorization. Private route authorization was not changed. Robots does not block all collection query URLs, so crawlers can read their noindex/canonical directives; search/filter URLs are absent from the sitemap. Crawl demand should be assessed in Search Console before adding broader crawl restrictions.

Category architecture is `/collections/category/[category]`. Seven distinct material guidance templates are ready, but a category returns 404 and stays out of links/sitemap until active, eligible supplier records exist. Cotton/silk/linen/velvet/sheer/jacquard/textured guidance is general decision support, not supplier performance data. No empty blackout or city pages were published. Current indexable category count: zero.

## Structured data and visible content

Homepage: one graph with the actual brand/approved logo, office address/email and WebSite. Product detail: BreadcrumbList, plus supplier-only Product if eligible. Editorial: Article plus BreadcrumbList and visible publication date only when known. Structured data escapes HTML delimiters and line separators and is parsed in validation. No fabricated author, review, rating, availability or sale offer. No FAQ rich-result promise is made. Google Rich Results Test acceptance is an external owner check, not established by local JSON parsing.

## Performance and image evidence

Existing hero first-image priority, image aspect-ratio containers, responsive swatch sizes and optimized Photograph derivatives were inspected and preserved. Below-fold thumbnails now load lazily; no new JS/image-generation/SEO package was installed. Studio's actual renderer and fabric selection functions are unchanged. Build shared first-load JavaScript remains approximately 103 kB; homepage approximately 130 kB (build estimates, not user CWV).

The first local production HTTP sample covered 28 pages at 21–906 ms end-to-end per request on this workstation, including initial requests. These are local checks, not origin TTFB benchmarks or LCP/INP/CLS. There is no comparable before/after controlled Lighthouse test, CrUX, Search Console or real-user dataset. Targets remain p75 LCP <=2.5 s, INP <=200 ms, CLS <=0.1; achievement is NOT VERIFIED.

## Remaining high-priority work

1. Supply real approved supplier records, composition/care details, shade photographs and actual availability before indexing merchandise/categories. Do not relabel demos to meet a quota.
2. Expand the five retained short guides with original, owner-reviewed detail. Resolve homepage hero wording about uploads separately with the owner: the protected hero was not edited, while Studio metadata/narrative and the how-it-works page accurately describe current capabilities.
3. Verify Search Console and the actual business-profile eligibility. No ownership, indexing, GBP verification, clicks or ranking was accessed or fabricated.
4. After the separate auth rollout is stable, consider route-specific static caching with private-route regression checks; do not remove dynamic boundaries globally without that review.
5. Confirm an owned custom domain if desired. Keep canonical/domain/DNS changes coordinated; no automatic domain changes were performed.
6. Existing package audit's inherited Next/PostCSS advisories remain outside this SEO change; no forced framework upgrade was introduced.

## Reference basis

- [Next.js 15 metadata API](https://nextjs.org/docs/15/app/api-reference/functions/generate-metadata)
- [Google faceted-navigation guidance](https://developers.google.com/crawling/docs/faceted-navigation)
- [Google product structured-data requirements](https://developers.google.com/search/docs/appearance/structured-data/product)
- [Google crawlable ecommerce navigation](https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure)
- [Google Business Profile representation/eligibility](https://support.google.com/business/answer/3038177)
- [V&A textile study, including velvet pile structure](https://www.vam.ac.uk/blog/projects/project-interwoven-studying-textiles-from-the-outside-in), [CottonWorks material reference library](https://cottonworks.com/product-innovation/material-library/). General guidance is original text, not copied product specifications.

## Verification status

VERIFIED locally: final TypeScript/lint, repository SEO gate, Production preservation validation and final Next.js production build all PASS under Node 22.23.4. The final production-mode HTTP crawl passed 28 public pages and 28 internal targets, canonical/filter/sort/shade rules (including actual selected-shade preservation), normalized out-of-range pagination, 404 samples, required JSON-LD fields, 17 sitemap URLs and robots with the actual MongoDB driver/auth backend forbidden. Build-boundary checks passed 59 server traces and 87 public artifacts without configured server credentials or SQLite/data-directory dependencies.

Focused layout inspection passed the collections page and new linen/velvet guide at 390px and 1440px: one H1 and no horizontal page overflow. This was four viewport checks, not an extensive browser/E2E suite or a CWV measurement. Authentication/configuration hashes match this task's private baseline, including .env.local; no authentication file was edited. The existing production-preservation gate and migration evidence remain unchanged.

IMPLEMENTED BUT NOT LIVE-TESTED: all SEO/content changes; no commit/push/deployment was performed. NEEDS EXTERNAL CONFIGURATION: Search Console verification, sitemap submission/URL inspection and eligible Google Business Profile ownership/setup. BLOCKED BY SOURCE DATA: indexable supplier/category pages, until genuine approved inventory exists. Rank, traffic and field-CWV outcomes are NOT VERIFIED.
