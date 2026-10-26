# Production failure investigation ? 2026-10-26

## Evidence and limits

Read-only live HTTP requests to https://dcorhomes.vercel.app returned:

| Route | HTTP | Observation |
| --- | --- | --- |
| / | 500 | Footer category-unavailable message present |
| /api/catalogue | 503 | Existing DatabaseUnavailable response |
| /collections | 500 | Footer category-unavailable message present |
| /login | 200 | Login renders; this does not prove credentials work in production |

The user supplied Vercel runtime logs confirming the same DatabaseUnavailable exception from homepage and collections rendering (digests 1117958927 and 778143753). Those logs contain no original cause because the deployed wrapper discarded it. The deployed repository revision and Production environment settings remain inaccessible from this workspace. Do not infer that Vercel has the same environment as .env.local. No production settings or data were modified.

The observed 503 originates in the old repository connection/configuration boundary. This confirms a database availability failure, but cannot distinguish absent/invalid configuration, credentials, DNS/network restrictions or cluster availability without runtime evidence. An empty collection is not a connection error and should not crash catalogue reads. No evidence confirms that a destructive migration or any migration is needed.

The homepage previously required three independent database-backed paths: its provider, below-hero sections and saved hero override. Footer category queries added another database dependency. These dependencies caused static public content to disappear during a database outage. The previous wrapper also discarded original connection exceptions, obscuring the reason.

A read-only check of the locally configured existing database passed: users=1, accounts=1; application fabric/category, enquiry, saved-design and hero-setting collections checked were empty. These are local configured-connection observations, not a production audit. Bundled catalogue records remain in the repository and are explicitly illustrative/demo records, not verified supplier inventory.

## Local change behavior

- A request-local homepage catalogue snapshot uses MongoDB overlays normally and the existing bundled public records/categories only if reading fails. Both the client provider and server sections use this same snapshot.
- The hero uses the existing static comparison when no override exists or the override cannot be read. No changes to hero markup, animation, logo, CSS or SEO metadata.
- Footer navigation uses existing bundled category links on failure; it does not write or replace database records.
- Catalogue API/page reads remain strict. They never return an invented empty database success. Admin, authentication, saved designs and all mutations have no public-data fallback.
- Repository failures preserve the original exception in cause. Application logs include only an operation name and a bounded category, never driver messages/stacks, URIs, database names, passwords or query values.
- MongoDB transient exceptions remain original inside transactions so the driver can retry correctly. Application/business validation exceptions are not reclassified as database outages.

## Required Vercel Production actions

1. Confirm the Vercel project is connected to the intended repository and Production branch main. The current checked-out and locally tracked origin/main baseline is 1c1e56adfb37270d4fe279d4614a9301dc5b70da. This patch is currently uncommitted/local; deploy a reviewed commit containing these changes, not just that baseline. Compare the deployment's Git SHA in Vercel; the live SHA is unconfirmed.
2. In Project Settings ? Environment Variables, verify Production scope for the core variable names below. A local .env.local file does not configure Vercel Production. Never paste values into support tickets or logs.
3. MONGODB_URI must point to the existing intended cluster with valid database-user credentials and correctly encoded password characters. Select the existing database through MONGODB_DB or the URI path. An empty, placeholder, invalid or unintended database selection must be corrected by the operator; do not create a second database.
4. Verify the database user has the required read/write and index permissions on that existing application/auth database. Ensure the Atlas cluster is running and DNS/TLS connectivity is available.
5. In Atlas Network Access, verify the actual Vercel outbound network can connect. Local connectivity proves only the local source is permitted. Prefer approved fixed egress/private networking and narrowly scoped access entries. Do not automatically add a global allow-all entry or disable TLS.
6. After configuration is corrected and the patch reviewed/committed, explicitly deploy/redeploy the intended main commit. Environment variable edits do not change existing deployments. No deployment was executed by this investigation.
7. In Vercel Runtime Logs inspect a failing request. After this patch, search database_failure and its category: missing_configuration, invalid_configuration, authentication, permission, network_timeout or query. The operation field distinguishes connection, record reads/writes, homepage/hero/footer fallbacks and authentication. Do not log environment values to troubleshoot.
8. Recheck /, /collections, a real /collections/<fabric-id>, /login and /studio on the live deployment. Verify authorized login privately, admin access restrictions, disabled signup and the catalogue API. Confirm failed data-dependent routes remain non-2xx during an outage. Check live logs and actual persisted records before declaring production repaired.

### Environment variable names

Core public/application/authentication:

- MONGODB_URI
- MONGODB_DB (required if the URI does not select the intended database)
- SITE_URL
- SESSION_SECRET
- BETTER_AUTH_SECRET

Private uploads / saved generated images, when used:

- S3_ENDPOINT
- S3_REGION
- S3_BUCKET
- S3_ACCESS_KEY_ID
- S3_SECRET_ACCESS_KEY

Optional AI generation (manual bundled visualizer does not require AI):

- DCORHOME_AI_ENABLED
- OPENAI_API_KEY
- DCORHOME_IMAGE_MODEL
- DCORHOME_IMAGE_QUALITY
- AI_DAILY_LIMIT
- DCORHOME_MAX_GENERATIONS_PER_GUEST
- DCORHOME_MAX_CONCURRENT_GENERATIONS

Optional enquiry email (the route uses sender/recipient aliases in this order):

- RESEND_API_KEY
- RESEND_FROM_EMAIL / ENQUIRY_FROM_EMAIL / EMAIL_FROM
- CONTACT_EMAIL / DCORHOME_CONTACT_EMAIL

Optional operator settings:

- DCORHOME_WHATSAPP_NUMBER
- TRUST_PROXY
- CRON_SECRET
- RETENTION_DAYS
- ALLOW_LOCAL_HTTP (local development only; do not enable for public HTTPS)

ENQUIRY_TO_EMAIL in the example environment is not read by the current enquiry route; use a supported recipient name above. Legacy DCORHOME_DATA_DIR, DCORHOME_DATABASE_URL and ADMIN_PASSWORD are not the application's MongoDB authentication configuration. No SQLite runtime file is needed.

## References

- https://vercel.com/docs/environment-variables
- https://www.mongodb.com/docs/atlas/security/ip-access-list/

## Completed local verification

- npm run lint: passed (TypeScript noEmit).
- npm run build: passed using Next.js 15.5.28, including asset/configuration prechecks.
- npm run check:mongodb: passed, restricted to an ephemeral localhost replica set. Includes diagnostic category/redaction checks, preserved exception causes, MongoDB record/ownership/transaction/quota behavior, migration fixture safety, public routes, fabric detail/search, admin/member login and password change, role/ownership restrictions, disabled signup, enquiries/saved designs, restart persistence and revocation.
- Missing MongoDB: homepage HTTP 200 with homepage content and bundled category navigation; /login and /contact HTTP 200; /api/catalogue HTTP 503; /collections non-2xx server error.
- git diff --check: passed.
- Configured existing local database: read-only ping/counts passed. No actual credentials submitted or production account records changed.
- These route/authentication results are local production-mode fixture tests, not claims that live login, collections or the live visualizer have been repaired.
- Changes remain local and uncommitted; no push or deployment executed. No production migration, data mutation or network-security change executed.
