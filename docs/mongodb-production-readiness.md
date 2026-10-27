> Historical report. Superseded by [the authentication-only architecture report](auth-only-mongodb-architecture.md). Earlier verification claims do not establish current production preservation or connectivity.

# MongoDB runtime and production readiness

Audit and verification: 2026-10-26. No deployment and no business-data migration were executed.

## Cause and environment findings

The former `lib/server/db.ts` selected Postgres only when `DCORHOME_DATABASE_URL` existed. Otherwise it imported Node SQLite, resolved `process.env.DCORHOME_DATA_DIR`, created that directory and opened `dcorhome.sqlite`. MongoDB configured for member authentication did not change this separate application-record repository. `app/layout.tsx` and `SiteFooter` loaded the full catalogue, bringing the local database into every route.

There was **no Nova fallback in that implementation**: the failing mkdir path could only come from the failing process's `DCORHOME_DATA_DIR`. Next.js checks existing `process.env` before env files, so a process/IDE launch environment or an already-running environment snapshot can retain a different value from a newly edited `.env.local`. See [Next.js environment lookup order](https://nextjs.org/docs/15/app/guides/environment-variables#environment-variable-load-order).

This audit found the AMD path in `.env.local`, no current shell/User/Machine override, and no other env file or application-source Nova fallback. It cannot retrospectively identify which earlier terminal/IDE process supplied the old value. Do not claim the historical launcher was proven. The current Node environment correctly resolves the AMD setting; runtime code now ignores that setting altogether, removing the failure path rather than relocating SQLite.

The expected old Nova SQLite file was not found. If another copy contains historical work, locate and dry-run it separately before claiming that history is migrated.

## Source-of-truth audit

| Dataset | Previous persistence | Current source of truth |
| --- | --- | --- |
| Approved users, roles, status, session version | MongoDB | Existing `users`, unchanged |
| Password hashes | Better Auth MongoDB `accounts` | Same records/hashes, unchanged; no copies in app records |
| Member sessions and authentication limits/audit | MongoDB | Existing `sessions`, `rateLimit`, `member_login_limits`, `member_control`, `member_audit`, adapter infrastructure |
| Fabric product overrides, specifications, images, variants and swatches | SQL `records`, kind `fabric-record` | `fabric_products`; variants embedded in `payload.colors` for atomic product updates |
| Fabric material categories/collections | SQL kind `fabric-category` | `fabric_collections` |
| Legacy editorial fabric overrides | SQL kind `fabric` | `legacy_fabrics`; merged with the same documented precedence |
| Verified supplier seed catalogue | Bundled `supplier-catalogue.json` | Same bundled baseline plus MongoDB overrides; bundled demo data remains explicitly demo when supplier seed is empty |
| Manual visualizer sample library, scenes, textures | Bundled manifest/library and static assets | Same versioned files; these are demonstration assets, not invented supplier stock |
| Enquiries and account-owned enquiry references | SQL kinds `enquiry`, `account-enquiry` | `enquiries`, distinguished by kind and stable ID; original guest/account owner preserved |
| Account manual designs, saved fabric shades, guest/generated designs | SQL kinds `manual-design`, `saved-fabric`, `design` | `saved_designs`, distinguished by kind; server-derived owner checks retained |
| Browser-only designs and preferences | IndexedDB/local browser preferences | Unchanged, device-local; not implicitly imported into an account |
| Upload/generation/catalogue-image metadata | SQL kinds `upload`, `generation`, `catalogue-image` | `asset_metadata`; private bytes live only in configured object storage |
| Revocable public share metadata | SQL kind `share` | `design_shares` |
| FAQ/article overrides, design options, approved hero settings | SQL kinds `content`, `settings` | `site_content`, `site_settings`; existing UI and seed defaults retained when no override exists |
| Application rate/usage limits | SQL `limits` | `application_limits` with unique key and expiry TTL |
| Serialized application transactions | SQLite IMMEDIATE / Postgres advisory lock | MongoDB session transactions and `application_control` write revision |
| Swatch parents/variants/facets/revision tables | Derived SQL caches | Removed as a second mutable store; request-local search/facet projection of canonical MongoDB-backed fabric data |
| Old shared-password admin sessions | SQL `admin-session` records | No longer grant access. Administrative authorization uses current active MongoDB members, including private-image admin access. Existing source data is not deleted. |

Every application document preserves `{kind,id,owner,created,payload}`. `payload` is a MongoDB object, not an escaped SQL JSON string. The public repository still returns the original `{kind,id,owner,created,data}` interface to preserve consumers. Updating an existing record changes only payload, retaining its owner and creation timestamp. Owner filters remain server-derived. Unknown future kinds use `application_records`; the migration refuses unknown kinds pending schema review.

Each application collection receives unique `(kind,id)`, `(kind,owner,created)` and `(kind,created)` indexes. Product indexes cover embedded variant IDs/SKUs and category/active fields. Categories and variant identifiers stay stable. Source categories are not confused with supplier collection-name metadata. Product validation and transaction-level SKU checks remain intact.

Swatch filtering, disjunctive facets, numeric ranges, sorting and pagination remain server-side computations over the request's canonical product snapshot. This avoids a competing index database. For substantially larger catalogues, replace that projection with a MongoDB aggregation/search implementation; the current implementation still loads the bounded catalogue into server memory and does not claim Atlas Search has been provisioned.

## Runtime/layout behavior

- `db.ts` is server-only and contains no SQLite, Postgres, mkdir or local-file database path.
- The shared MongoDB client is cached across development module reloads/serverless reuse, uses a bounded pool and clears failed connection attempts. A changed connection URI gets a new pool. No secret is exposed to client components.
- Normal record reads do not create collections or indexes. First writes initialize indexes in MongoDB, not on disk.
- Nested repository transactions reuse the same session. Operations inside one transaction are awaited sequentially, consistent with [MongoDB's transaction requirements](https://www.mongodb.com/docs/drivers/node/current/crud/transactions/).
- The root layout only supplies shared account/navigation/contact state. Full catalogue providers are scoped to the homepage/catalogue/Studio/design consumers and account saved-design section. Their JSX appearance and existing route metadata are preserved.
- Footer navigation queries small category/product summaries and reports a category outage locally. A catalogue failure no longer crashes Login/About/Contact through a root catalogue load.
- Missing MongoDB produces an explicit repository error; catalogue APIs return 503. Data-dependent pages use an application error boundary rather than returning an empty successful catalogue. A valid empty database still permits the same clearly labelled bundled seed/demo baseline.
- Better Auth uses its MongoDB adapter/minimal build; existing identities, hashes and sessions were not reset. Signup remains denied. Active status/version/role/ownership checks remain server-side.
- Local Next output locks still prevent competing local builds/dev servers. Vercel skips checkout ownership-file writes because the deployed filesystem is immutable.

## Actual SQLite inventory and migration status

Located source: `.data/showroom-local/dcorhome.sqlite`.

| Table | Rows found |
| --- | ---: |
| records | 0 |
| limits | 1 |
| swatch_parents | 7 |
| swatch_variants | 31 |
| swatch_facets | 62 |
| swatch_revision | 1 |

The swatch tables were **derived demo/search caches**, not independent business-product records. They are preserved in the original file and backup, but deliberately not promoted to canonical product records. The one legacy limit remains in the untouched source. No business database records were inserted, updated or deleted by a migration in this task.

A consistent SQLite backup including WAL state was created with Node's backup API. Integrity and source validation passed. The dry-run report is `.data/migration-audit/dry-run.json`; backups are under `.data/migration-backups/`. These are ignored/private local artifacts, not committed assets. The source file was never deleted or edited by the migration tool.

Safe review command:

```powershell
npm.cmd run db:migrate:sqlite -- --source .data/showroom-local/dcorhome.sqlite --dry-run --report .data/migration-audit/review.json
```

After reviewing a backup, record inventory, reference checks and conflicts, a separately authorized operator may execute:

```powershell
npm.cmd run db:migrate:sqlite -- --source .data/showroom-local/dcorhome.sqlite --apply --report .data/migration-audit/applied.json
```

`--apply` was **not** run against the configured business database. It is insert-only: identical existing records are skipped; differing records block the operation and are never overwritten. It validates stable keys, catalogue structure/variants, account owners and design/share/enquiry references, and uses a transaction to avoid partial copying. Active usage counters are inserted only when no target counter exists; target usage is never reset. Dry-run does not initialize target indexes or write target data. Unknown kinds, unresolved owners or conflicting payloads require manual reconciliation. The report counts inserted/updated/skipped/failed records and verifies post-copy payload/owner/time equality. Updated remains zero by design.

SQL authentication databases are not silently copied. If one exists elsewhere, its identity mapping needs a separate reviewed migration; existing MongoDB users/passwords must never be replaced. Private asset bytes also require an explicit object-storage migration, separate from metadata. Historical missing products/shades/owners are blocked for review, never automatically reassigned.

## Vercel configuration and external setup

Select Next.js with **Node 24.x**, matching package engines. Vercel currently supports that major version: [Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions). Use `npm run build`; no database migrations or account bootstrap occur in install/build/start.

Configure privately for the intended environment:

- `MONGODB_URI`: the existing Atlas connection; never a NEXT_PUBLIC variable.
- `MONGODB_DB`: existing database name, optional only if URI selects it.
- `SITE_URL`: approved HTTPS origin.
- Independent strong `SESSION_SECRET` and `BETTER_AUTH_SECRET` (32+ characters).
- Private object storage when uploads are required: `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`. Use HTTPS and keep public access blocked; authorize only needed bucket/key operations. Verify the existing path-style Signature V4 adapter against the chosen provider before launch.
- Keep `DCORHOME_AI_ENABLED=false`. No paid AI call was made; no AI service was enabled.
- `ALLOW_LOCAL_HTTP=false` in production. Only trust forwarded IPs when the deployment ingress replaces them (`TRUST_PROXY`).
- Optional business integrations: verified Resend sender/API key and destination/contact email, approved WhatsApp number, authenticated retention scheduling as documented in `.env.example`.

Do not set a local data directory as a Vercel persistence mechanism. `DCORHOME_DATA_DIR`, `DCORHOME_DATABASE_URL` and the old local asset mode are ignored by the new runtime. Preserve any old files until their inventories and migration have been reviewed. Vercel filesystem writes are not persistent application storage: [Vercel runtimes](https://vercel.com/docs/functions/runtimes).

The existing Atlas deployment was reachable from this development environment. Verify Atlas database-user permissions and network access for Vercel's actual egress strategy before deployment. No Atlas allowlist, dashboard, credentials or live networking settings were changed automatically. No second persistent MongoDB deployment/database was created.

Private object storage is not configured locally; persistent upload/asset requests are therefore unavailable rather than pretending to persist to local disk or `/tmp`. Existing public assets in `public/` and all local private files remain untouched.

## Verification and honest limits

| Area | Status | Evidence |
| --- | --- | --- |
| Runtime without local SQLite / machine paths | VERIFIED WORKING | No SQL/local-path imports in app repository or built server output; local and production-mode routes load. |
| MongoDB repositories and quotas | VERIFIED WORKING | Isolated real MongoDB: round trip, owner/timestamp immutability, rollback, nested transactions, concurrent rate limits. |
| Migration implementation | VERIFIED WORKING | Isolated SQLite fixtures: backup, dry-run no target writes, records/references preserved, insert-only apply, idempotent rerun, conflicting target refused. |
| Actual local source dry-run | VERIFIED WORKING | Backup/integrity check; zero canonical records; source retained. |
| Business production migration | NOT IMPLEMENTED / NOT EXECUTED | Explicitly not authorized; no full historical migration claim. Missing old Nova database remains unverified. |
| Existing business MongoDB data | VERIFIED WORKING | Read-only before/after equality of collection counts, user identity/status/version and credential integrity; no new application collections created during implementation. Existing dcorhome-admin retained. |
| Authentication regression | VERIFIED WORKING | Isolated real DB/HTTP: admin/member login, admin creation, first-login change, password rejection, role/ownership denial, disable revocation and logout. No real owner password was requested. |
| Enquiries / saved manual designs | VERIFIED WORKING | Isolated HTTP writes persisted in MongoDB and survived server restart; cross-account deletion rejected. |
| Catalogue product/variants/search | VERIFIED WORKING | Isolated persisted product appeared in product detail and filtered swatch results; shared navigation remained available. |
| Public/local route smoke | VERIFIED WORKING | /, /collections, actual /collections/sienna, /studio, /measure, /about, /contact, /inspiration, /login returned 200; anonymous /account and /admin/users redirected. |
| Vercel-style execution | VERIFIED WORKING locally | Production Next server with VERCEL=1 and a poisoned/uncreated local data-directory setting; records/sessions survived restart. Actual cloud deployment not performed. |
| TypeScript / production build | VERIFIED WORKING | Direct TypeScript, npm lint and production build passed, including existing hero/visualizer asset/config checks. |
| Private S3 persistence | BLOCKED BY CONFIGURATION | Provider credentials/bucket are absent; actual storage requests not verified. Missing configuration correctly disables dependent operations. |
| Vercel/Atlas dashboard/network reachability | IMPLEMENTED, NOT VERIFIED | Configuration documented; no cloud deployment or dashboard modification performed. |
| Historical Nova data | BLOCKED BY CONFIGURATION / SOURCE AVAILABILITY | Old expected source file not found. Obtain it and dry-run before declaring that history migrated. |

The targeted test uses an ephemeral localhost MongoDB replica set with generated in-memory fixture credentials. It never loads the business URI as a write target, never logs passwords and never calls paid AI/email services. Local test binaries/results live under ignored `.test-data/`; temporary database state is stopped afterward. Old SQLite-only harnesses are guarded against accidental execution because their former file-path isolation no longer isolates a MongoDB database.

Commands:

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd run check:mongodb
```

No extensive browser/E2E suite or visual redesign was performed. Existing homepage/hero, logo, Studio JSX, assets and user files were preserved; only data-provider boundaries changed on those routes. Existing uncommitted changes from earlier work were left intact.

## Files in this task

Runtime: `lib/server/db.ts`, `mongodb.ts`, `record-schema.ts` (new), `fabric-records.ts`, `swatch-search.ts`, `navigation-categories.ts` (new), `assets.ts`, `security.ts`, `customer-auth.ts`, `content.ts`, `options.ts`, `showcase.ts`.

Provider/error integration: `app/layout.tsx`, `app/page.tsx` (provider wrapper only), `app/account/page.tsx` (saved-design provider only), `app/collections/layout.tsx`, `app/studio/layout.tsx`, `app/designs/layout.tsx`, `app/error.tsx` (new), `components/curtains/ServerCatalogueProvider.tsx` (new), `components/curtains/FabricCatalogueProvider.tsx`, `components/SiteFooter.tsx` (query/error handling only), `lib/homepage.ts`, `lib/curtains/categories.ts` (narrower input types), `app/api/catalogue/route.ts` (explicit failure response).

Configuration/docs: `next.config.ts`, `package.json`, `package-lock.json`, `.env.example`, `README.md`, this report. `.env.local` was not changed or committed in this task.

Tools: `scripts/migrate-sqlite-to-mongodb.cjs` (new), `scripts/mongodb-runtime-check.cjs` (new), `scripts/sqlite-fixture-retired.cjs` (new). Guards were added to the old `api-check`, `ai-window-integration`, `catalogue-integration-check`, `manual-visualizer-integration`, `swatch-search-check`, `phase3-server` and `ai-services-check` harnesses; their historical source was retained. Unused Postgres dependencies were removed; MongoDB's local test server is a dev dependency only.
