# Maintaining Dcorhome SEO

Public content is edited in the repository, reviewed and deployed. There is no production Save button or MongoDB SEO manager. The existing `/admin` explains this workflow; no fake persistent editing UI was added. Do not change authentication files or secrets to edit SEO.

## Page SEO and canonical domain

Edit `data/site/seo.json`. `pages` uses actual paths such as `/`, `/collections`, `/studio`, `/measure`, `/about` and `/contact`. Each override supports `title`, `description`, optional `socialDescription`, `image` and `imageAlt`. Use an approved local `/images/...` image path. A blank override falls back to the real page's metadata, but empty configured page titles/descriptions fail validation. Titles are branded once by the helper; do not add repeated brand/keyword strings.

For homepage changes, edit the `/` entry. `defaultTitle`/`description` are layout fallbacks. Global `socialImage` and `socialImageAlt` supply sharing defaults. There is no fixed social account handle or fabricated logo/photo.

`canonicalOrigin` is the approved public HTTPS origin, currently `https://dcorhomes.vercel.app`. An optional server-only `SEO_SITE_URL` overrides it for controlled domain changes. Neither value should contain a path, credentials, query or localhost. Authentication's SITE_URL remains separate and was not changed. Invalid canonical configuration fails prebuild instead of silently emitting localhost or noindexing all Production pages.

If adopting an owned custom domain: verify DNS/Vercel domain ownership first, update the canonical origin/override consistently, arrange genuine old-domain redirects in Vercel, rebuild, and inspect live canonicals/sitemap. Never redirect unowned domains or fabricate redirects for routes that did not change. Production should keep `indexingEnabled: true`; Preview/development are automatically noindex according to VERCEL_ENV. Do not disable the Production flag merely to make a build pass.

## Categories and products

Real fabric records live in `data/catalogue/fabrics.json`; categories live in `collections.json`. Use the existing supplier validation/import/review workflow. Preserve IDs and shade codes. Do not mark demos as supplier inventory, insert prices/availability without confirmation or remove the preservation gate.

Category guidance is in `data/site/category-guidance.json`. Optional SEO-only overrides go in `seo.categories[categoryId]`. A category is linked/indexed only when it has matching active eligible supplier records and guidance. Today there are none, so category URLs return 404 and are not published as empty landing pages. Classifications such as blackout require actual supporting records; do not infer them from an illustrative texture.

Optional product overrides go in `seo.products[fabricSlug]`; the product page otherwise uses the documented record. Real eligible products get unique metadata and semantic Product markup without invented offers/ratings. Demo pages remain usable with noindex and no Product schema. Shade URLs retain the chosen shade but canonicalize to the parent product. Filters/search/sort remain customer tools, not independent landing pages. Pagination is navigable, noindex/follow and canonicalized to the actual normalized page.

## Add or update an article

Preserve existing slugs. Add a substantive guide in `data/site/guides.json` using the existing examples: slug, title, description, approved image and body; then meaningful `sections` with heading/paragraphs, imageAlt and valid relatedSlugs. Use only real known publication/update dates; never invent an author or backdate an old guide. New content is dated when prepared for publication, not when it is indexed. Check all factual product claims with source evidence.

The hub, article routes, metadata and sitemap discover published repository entries automatically. Proposed topics belong in SEO-CONTENT-PLAN.md, not the live guides array, until ready. Add relevant links to measurement, Studio and actual fabrics; do not build duplicate-intent articles merely to target another spelling.

## Validate and review

```powershell
npm run lint
npm run check:seo
npm run check:content
npm run build
node scripts/seo-http-check.cjs
```

The HTTP check starts the production build locally on port 3356 and performs a small public crawl, with the actual MongoDB driver and Clerk backend lookups forbidden. It checks headings, metadata, JSON-LD, canonicals, indexing, public links, invalid routes, sitemap and robots. It does not exercise login or send email. Local results/timings are ignored under `.test-data`, not committed. No broad browser suite is needed for ordinary SEO edits.

Vercel's existing prebuild preservation gate still runs, followed by the critical SEO gate. To reproduce Production-specific validation privately, set VERCEL_ENV=production only in that command's process; do not change Vercel variables automatically or treat a local build as a deployed test. Review the diff, approve a commit, push/deploy only when authorized. This task did not push or deploy.

After deployment, inspect the rendered homepage, one article, collections, a demo/product and a filter URL. Confirm the correct canonical origin, Production indexability and Preview noindex behavior. Use Google's Rich Results Test for structured-data feedback; local parsing is not an external acceptance claim.

## Google Search Console: owner action

For the current Vercel subdomain, create a **URL-prefix property** for `https://dcorhomes.vercel.app/`; you do not own the whole `vercel.app` domain. Use Google's verification token via the optional `GOOGLE_SITE_VERIFICATION` server variable, rebuild/publish with approval, then complete verification. The token creates the supported metadata verification tag; it is not an API credential. For a future owned custom domain, a Domain property can use the owner's DNS TXT verification.

Submit `/sitemap.xml`. Inspect `/`, `/collections`, `/studio`, `/contact` and one new guide; inspect category/product URLs only when real eligible inventory exists. Check selected versus declared canonical, indexed/excluded status, crawl errors and query/page performance. Monitor field CWV when enough data exists. No ownership, indexed status, impressions, clicks, rankings or RUM data has been accessed in this task.

## Google Business Profile checklist: owner action

- Check actual eligibility and in-person customer contact under Google's current rules before creating/claiming a profile. An office address alone does not prove eligibility; do not misrepresent an online-only or unstaffed office as a storefront.
- Use the real name Dcorhome without appended keyword/city spam. Match the verified office address/email on the website. This is an office, not a confirmed showroom.
- Select the closest actually offered business category that accurately matches operations; confirm available category labels in the dashboard.
- Use genuine approved office/fabric/business photographs and an accurate description. Supply hours, phone or service areas only when the owner verifies them. Do not invent coordinates or multiple city locations.
- Connect the actual canonical website. Configure address visibility/service-area mode according to real customer contact, not ranking convenience.
- Invite genuine customers to leave honest reviews; no purchased/fabricated reviews or review schema. Keep contact details consistent and respond appropriately.

See [Google's business representation rules](https://support.google.com/business/answer/3038177). No Business Profile was accessed, edited or verified here.
