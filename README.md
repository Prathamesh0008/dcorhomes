# Dcorhome

Next.js 15 / React 19 curtain website. This diagnostic branch uses Node.js 22.x for MongoDB TLS compatibility testing; a Production runtime change is not yet approved. MongoDB is used only for invite-only accounts, authentication sessions, permissions and related security records.

Public catalogue, guides, metadata and the manual curtain studio work without MongoDB. Public data lives in `data/catalogue` and `data/site`; prepared imagery stays in `public/images/manual-visualizer`. No SQLite or persistent server filesystem is required.

See [the architecture audit, production preservation procedure and verification report](docs/auth-only-mongodb-architecture.md). **Initial production cutover is blocked until unique production content is exported and verified.** The current repository baseline contains seven demonstration fabrics and no supplier records; it is not a production database export. Do not recreate/reset/delete the existing database or users.

## Development and checks

```powershell
npm.cmd run dev
npm.cmd run lint
npm.cmd run check:content
npm.cmd run build
npm.cmd run check:architecture
npm.cmd run check:enquiries
npm.cmd run check:visualizer
```

`check:architecture` uses an isolated localhost MongoDB replica set, a production Next server and one focused browser journey. It never uses business credentials as a write target. Chrome is required for that focused desktop smoke check. Email checks mock the provider and send no actual mail. No extensive browser suite is required.

Development writes `.next-dev`; production build/start uses `.next`. Stop the matching server before rebuilding. The checkout output lock prevents unrelated processes from sharing an output directory. Vercel deployments bypass this local CLI lock.

## Content and customer flows

- Public fabrics, embedded shades and collections: update reviewed repository JSON and approved assets, validate, then redeploy. Runtime admin content/catalogue/SEO editing is disabled.
- Manual Studio: select a supported room/material/shade, compare and download supported compositions. Existing room capability gates remain; unsupported previews are not fabricated.
- Saved designs: localStorage for lightweight configurations; IndexedDB for existing private local image blobs. Saves belong to the current browser/device and can be lost when storage is cleared. My Saved Designs offers backup/import; no cross-device sync is advertised.
- Enquiries: accepted only when the configured Resend provider accepts delivery to sales@dcorhome.com. No MongoDB enquiry storage. Failures provide a direct-contact fallback.
- Login/accounts/admin users: existing invite-only Better Auth and MongoDB security remain. Do not bootstrap an existing database or rotate/reset accounts for this change.

Copy `.env.example` for variable names; preserve real production secrets. `db:ping` is a read-only operator diagnostic. `content:export` and `content:verify-export` provide the explicit safe migration workflow documented in the architecture report. Private exports remain under ignored `.data`, never in public assets or Git. Legacy cloud storage/AI/retention endpoints return explicit 410 responses; existing records remain untouched.

No push or deployment is performed automatically. The earlier configurator and MongoDB reports are historical references; the linked architecture report describes the current runtime.
