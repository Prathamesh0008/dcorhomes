# Authentication-only MongoDB architecture — 27 October 2026

This report supersedes the earlier MongoDB-all-records readiness and connectivity reports. The code is implemented locally. Nothing was deployed or pushed. Production preservation and connectivity are not verified.

## Result and release blocker

Public page rendering, catalogue APIs and manual Studio interactions no longer open MongoDB connections. MongoDB remains in invite-only authentication, account/security administration and session validation on private routes. Existing cloud records and object-storage assets have not been deleted, reset or migrated automatically.

**Do not deploy the initial cutover until production content is exported and verified.** The checked-in baseline contains seven existing demonstration fabrics and zero supplier records. These are unchanged repository records, labelled `demo`; they are not a recovered production catalogue. The read-only configured-cluster ping timed out at 25 seconds. The production-content export attempt also timed out during connection. It created no successful production snapshot. Dashboard access and Vercel runtime connectivity are unavailable here.

`data/catalogue/migration.json` therefore remains `pending-production-export`. The content checker deliberately refuses a Vercel **Production** build (`VERCEL_ENV=production`) until an operator has verified preservation. Local production compilation and controlled tests remain possible without MongoDB. The gate comes from the requirement not to disconnect unique production records before preservation; it is not a request to reset or replace the database.

## Dependency audit

| Former dependency / records | Former consumers | Current source / behavior |
| --- | --- | --- |
| Root `customerSession`, header/footer session checks | Every public page, including visitors with account cookies | Public navigation performs no account lookup. Account/admin pages and explicitly invoked auth endpoints validate sessions. |
| `rows('fabric')`, `allRecords('fabric-record')`, `allRecords('fabric-category')` in `legacy_fabrics`, `fabric_products`, `fabric_collections` | Homepage, footer, collection filters/search/sorting, product details, Studio provider, saved-fabric page, sitemap/product SEO, `/api/catalogue`, `/api/fabrics` | `data/catalogue/fabrics.json`, `collections.json`; shades embedded in each fabric. Pure in-memory projections preserve existing filtering/sorting/pagination/specification handling. |
| `row('settings','hero')` in `site_settings` | Homepage comparison and admin comparison editor | Approved unchanged `lib/assets.ts` / `lib/hero-comparisons.ts` assets. Runtime editing disabled. Earlier overrides retained in private export for review. |
| `row('settings','design-options')` | Configurators and `/api/options` | `data/site/design-options.json`, re-exported by `lib/design-options.ts`. |
| `rows('content')` in `site_content` | FAQ, inspiration articles, sitemap, admin editorial management | `data/site/editorial.json`; public renderers import static data. Operational FAQ/privacy text now describes browser saves and email acceptance truthfully. |
| Database-backed settings/editorial editing | Admin content/catalogue UI; no separate dedicated SEO Manager was found in this checkout | `data/site/seo.json`, static page definitions, product records. Admin content page explains repository workflow. PATCH returns 405 after authorization. No live Save success or repository JSON writes on Vercel. |
| `manual-design`, `design`, `saved-fabric` in `saved_designs`; `share` in `design_shares` | Save/restore/delete, `/designs`, account history, public shared previews | New manual configurations use browser localStorage; existing browser photographs remain in IndexedDB. Public pages no longer probe account/guest storage. Cloud endpoints return explicit 410. Private CLI export and browser manual-configuration import preserve an upgrade path. |
| `enquiry`, `account-enquiry` in `enquiries` | Contact/quote/swatch submissions, account/admin enquiry history | Direct server-side Resend delivery to sales@dcorhome.com. No database write or account lookup. Earlier records remain in the database/private export. |
| `upload`, `generation`, `catalogue-image` in `asset_metadata`; private S3 keys | AI routes, uploads, image serving, public catalogue image URLs, cleanup | Cloud upload/generation/sharing/retention/image endpoints retired with 410. Public catalogue images must ship as assets. Export tooling downloads old public catalogue images read-only and can export private images separately. No paid AI call is reachable through these routes. |
| Generic `put`, `remove`, `consume`, `transaction`, application indexes/control/quotas | Legacy non-auth persistence and cleanup | Generic `lib/server/db.ts` now has explicit nonconnecting retired-operation guards. No generic initialization, collection creation or write path remains in application operation. Old migration/runtime scripts stop with an explanatory error before doing work. |

The only active MongoDB call sites in application code are `customer-auth.ts`, `members.ts` and the admin-users API, using `mongodb.ts`. Authentication uses `users`, `accounts`, `sessions`, verification/library rate-limit records, `member_login_limits`, `member_audit` and `member_control`. Authentication pooling/retry behavior is preserved. The standalone ping/export CLIs are explicitly invoked operator tools, outside page rendering.

## Public data and assets

- `data/catalogue/fabrics.json`: stable fabric IDs/slugs, descriptions, actual existing specifications, images and embedded shade IDs/codes/SKUs/availability.
- `data/catalogue/collections.json`: category IDs, labels, descriptions and active state.
- `data/site/editorial.json`: guides, articles and FAQs.
- `data/site/design-options.json`: supported design-option definitions.
- `data/site/seo.json`: default metadata and per-path title/description overrides; product metadata and JSON-LD still derive from product records.
- `lib/manual-visualizer/manifest.ts`, `library-assets.json`, `types.ts`, `configuration.ts`: prepared rooms/materials, geometry, schema/versioning and capability rules.
- `public/images/manual-visualizer/`: unchanged optimized room/texture/mask/fold assets; no customer photograph is written here.
- `lib/assets.ts`, `lib/hero-comparisons.ts`: unchanged approved comparison imagery and ordering.

Content changes are reviewed repository changes followed by redeployment. `npm run check:content` validates record structure, stable identities, supplier SKUs, paths, image presence and prepared visualizer assets. `import:supplier-csv` produces a candidate array for review/merge; it no longer advertises a live admin database import. Legacy supplier JSON is retained as historical input, not the public source of truth.

## Safe production preservation procedure

Run from a trusted workstation with access to the **existing intended production database**. Restore Atlas/network access first if necessary; see the previous connectivity runbook for networking checks. Do not bootstrap, recreate, reset or delete anything.

1. Inject production `MONGODB_URI`, `MONGODB_DB` and, if exporting earlier image objects, existing S3 settings into a trusted shell. Do not put values in commands, logs, chat or public variables. `--env-only` prevents local `.env` files from changing the selected source. Use a database user with read-only access for export where available; the exporter itself issues only read operations and a ping.
2. Run:

   ```powershell
   npm.cmd run content:export -- --env-only --out .data/production-content-export --include-private-assets
   ```

   The output directory must be new and inside ignored `.data`. The tool never writes source records/indexes. It reads a transaction snapshot of known non-auth collections, preserves raw Extended JSON privately, and rereads the source to detect changes during export. It never reads `users`, `accounts`, `sessions` or password hashes. A failed/changed snapshot cannot verify a release.
3. Review `manifest.json`, raw records and generated candidates. Public catalogue candidates merge the previous repository seed/legacy overlays and real fabric/category records, retaining IDs, shades, specifications, archived state and image mappings. Catalogue image API URLs are replaced with exported `/images/catalogue/...` assets. Unknown settings and earlier hero overrides remain in the private raw snapshot for explicit review; do not publish unreviewed settings. Private enquiries/designs/owner mappings never belong in public data.
4. Copy only reviewed `candidate/catalogue/*.json` to `data/catalogue`, reviewed `candidate/site/editorial.json` and `design-options.json` to `data/site`, and exported **public** catalogue images to `public/images/catalogue`. Keep approved hero imagery unchanged. Do not copy `PRIVATE-*`, raw snapshots or owner exports into version control or `public`.
5. Run:

   ```powershell
   npm.cmd run content:verify-export -- --snapshot .data/production-content-export
   npm.cmd run check:content
   npm.cmd run lint
   npm.cmd run build
   npm.cmd run check:architecture
   npm.cmd run check:enquiries
   ```

   Verification checks snapshot checksums, source stability, exact repository/candidate equality, fabric/shade counts and public-image checksums. A unique database product absent from repository files fails this check. Resolve missing/incompatible assets or schema errors before release; do not drop offending records to obtain a pass.
6. After confirming the snapshot came from the correct production database, run:

   ```powershell
   npm.cmd run content:verify-export -- --snapshot .data/production-content-export --confirm-production-source
   ```

   This explicit operator attestation updates the versioned migration gate only after preservation verification. Missing earlier private image exports must be resolved if those records reference images. This step does not claim Vercel connectivity or email delivery. Archive private snapshots/backups securely and preserve the original database/object storage. Later reviewed content edits continue through the repository workflow.

Earlier manual configurations are exported under hashed owner directories as `manual-designs.json`. Verify ownership outside the public website, give each owner only their own file through a private channel, then use **My Saved Designs → Import or back up manual designs**. Import validates asset versions, materials, shades, IDs, dates and conflicts. A storage/quota failure reports any partial import count. Old cloud photograph originals/results are separate private files; download them to their owners, never move them to public assets. Earlier local IndexedDB designs remain readable. No account-wide synchronization is advertised.

## Studio, saving, email and security

The manual workflow uses the existing client renderer and prepared assets. Ten library rooms remain inspiration/view-only under the existing capability manifest; their per-room compositing has not been approved. The garden sample supports actual canvas compositing, independent materials/shades, before/after and PNG export. Unsupported combinations are not fabricated or offered as downloadable compositions. Studio itself needs no login or database, and makes no paid AI request.

New manual configurations store ID, saved timestamp, room, both layer/material/fabric/shade selections, schema/asset/renderer versions and lightweight selection metadata in localStorage. No original/result blobs or inline photographs enter that configuration store. Browser photographs from existing saves stay in IndexedDB. Save, list, restore, delete, PNG download and JSON configuration backup/import are provided. The UI warns that clearing browser storage loses designs and that saves belong to the current browser/device.

Contact, quote and swatch forms send through the existing Resend integration. The route validates consent, honeypot, origin, bounded JSON size, email/phone, fabric/shade identifiers and structured visualizer configuration; verified IDs and a server-built summary accompany the email. Provider errors, missing configuration, malformed provider acknowledgements and transport failures return actual failure with the direct sales email fallback. Success means provider acceptance, not inbox delivery; `stored:false` explicitly states no database save. Resend idempotency keys are retained. No real enquiry/email was sent by the tests.

The public limiter is bounded and **per server instance**, not a durable distributed quota. For production abuse protection configure a Vercel WAF rule matching POST `/api/enquiries`, keyed by client IP, with a suitable rate limit (for example five requests/hour) and a block/challenge action. Review plan availability and shared-IP traffic before enabling. Trust proxy headers only when the platform controls them. Authentication retains its independent durable MongoDB rate limits. See [Vercel WAF rate limiting](https://vercel.com/docs/vercel-firewall/vercel-waf/rate-limiting) and [Resend send-email API](https://resend.com/docs/api-reference/emails/send-email).

Invite-only authentication, admin-created users, hashed passwords, mandatory first-login password changes, role/status enforcement, session-version revocation, logout and administrator user management remain enforced. Public pages do not inspect account cookies; users can follow Login/Account links for private operations. A database outage returns a safe unavailable response for login and denies access to private data. No public signup or cookie-only authorization was added.

## Verification and remaining limits

- TypeScript and the local production build passed, including asset/configuration/content checks.
- Controlled production-server checks deliberately made MongoDB unavailable and intercepted the actual driver's connect method. `/`, `/collections`, real `/collections/[id]`, `/studio`, `/measure`, `/inspiration`, `/about`, `/contact`, `/faq`, `/how-it-works`, `/designs`, `/collections/saved`, sitemap, robots and public catalogue/options APIs worked. Public requests also carried account-like cookies. No MongoDB connection attempt or database diagnostic occurred before the explicit login test.
- One focused headless-browser journey verified actual canvas rendering, shade updates, room-view capability gating, comparison, a real PNG download, localStorage saving, restore and delete with no auth/cloud-storage/AI requests. This was a small CDP smoke check, not an extensive Playwright/E2E suite.
- The existing visualizer-library sanity check passed: 200 optimized shade textures, ten room capability gates, layer independence, sampling/lighting/version validation and 240 byte-identical runtime asset copies.
- Isolated real-MongoDB tests verified invite-only login, admin user creation, password hashing/change/reset, roles, disabling/revocation and logout; only auth collections were created by application operations. No business database was used as a write target.
- Mocked email tests verified acceptance, failure, missing configuration, invalid acknowledgements, transport errors, spam/input guards and zero MongoDB calls. Local storage tests verified configuration round trips, deletion, photo exclusion and quota errors. Actual provider acceptance/inbox delivery remain unverified.
- Configured remote MongoDB ping/export failed on connection timeout. Unique production catalogue data and cloud images are not yet preserved by this task. The live Studio URL was not accessible through the read-only web tool. No live deployment was verified.
- Build-boundary validation passed across 58 server dependency traces and 81 public artifacts: no SQLite/data-directory dependency or configured server credential was found. The Vercel Production migration gate was also tested and correctly refused an unverified cutover.
- Public code has no SQLite provider, persistent data-directory dependency or Windows filesystem path. Runtime filesystem checks are read-only validation of shipped public assets. Operator exports/test artifacts are local tools, not serverless persistence.

## Push and redeploy instructions

Complete the production preservation gate first. Set Vercel Node.js to 24.x, keep the existing authentication database/secrets and set the canonical HTTPS `SITE_URL`. Configure `RESEND_API_KEY` and a Resend-verified `RESEND_FROM_EMAIL` (or existing sender alias). Recipient is fixed to sales@dcorhome.com. Configure WAF protection as described above. No SQLite/data directory, new database provider, public upload bucket or OpenAI key is needed.

Review the full diff and ensure private exports/credentials are ignored. Create a review branch, stage only reviewed source/assets/data, commit and push it. If Git integration would automatically deploy, disable that trigger or keep the branch outside its deployment rules until approval. After review, manually deploy/redeploy the approved commit in Vercel. This task did neither. Environment changes apply to new deployments.

After manual deployment, verify public routes while auth is unavailable using an isolated Preview environment, then verify production login/user administration against the existing database and perform one explicitly approved real enquiry. Do not intentionally break production MongoDB credentials to run outage tests. Mark live behavior verified only after those checks.
