# Dcorhome

Existing Next.js 15.5.28 / React 19 curtain-design application. Node 24 or newer is required for the built-in SQLite adapter. Fonts and colors are preserved; styling remains in Tailwind TSX classes.

See [the manual curtain configurator and catalogue report](MANUAL_CURTAIN_CONFIGURATOR.md) for independent layer rendering, catalogue imports, Studio integration, asset provenance and verification limits. The earlier [prepared-look report](CURTAIN_CONFIGURATOR.md) documents the previous implementation.

## Run locally

Use `npm.cmd run dev` on Windows, or `npm run dev` elsewhere. `npm run lint` checks TypeScript; `npm run build` validates comparison assets and builds production output. `npm start` serves the last build.

Development uses `.next-dev` and `tsconfig.dev.json`; production uses `.next` and `tsconfig.build.json`. Stop the relevant server before rebuilding or clearing its generated output. Do not manually create generated manifests.

Only one Next.js process tree may own each output directory. `next.config.ts` enforces this before Next cleans or writes it, including direct CLI starts on different ports. Development and a production build can run together because their outputs are separate. A production server must stop before another production build. Duplicate launches fail with the owner's PID; stop that project's existing terminal rather than deleting build folders. Next's own child workers and Fast Refresh restarts share the original lease. A terminated owner's stale lock is recovered automatically; unknown or unreadable ownership files are left untouched. Lock files live beside the output directories and are ignored by Git.

## Pages

- `/`: automatic/manual comparison, distinct photographic sample composer, fabrics, process, inspiration, measurements, FAQ and consultation.
- `/studio`: upload/drop a room, select style/material/pattern/color/heading/length/fullness/layers, generate when configured, compare, save, download, share and enquire.
- `/designs`: browser-local and private guest-session history with reopen/delete.
- `/collections` and `/collections/[id]`: illustrative reference catalogue with search/category/palette/surface filters, persistent favorites and detail pages.
- `/measure`: cm/in planning estimator with panel count, roll width, fullness, repeat and allowances; passes measurements to consultation.
- `/contact`: consent, validation, duplicate protection, persistent enquiry and optional email notification.
- `/inspiration` and `/inspiration/[slug]`: original editorial guides.
- `/how-it-works`, `/faq`, `/privacy`, `/terms`: supporting content; legal notices are explicitly drafts for owner approval.
- `/admin`: server-authorized administration for enquiries, catalogue, public image uploads, design options, homepage pair, FAQ/articles and retention cleanup.
- `/share/[token]`: explicit, expiring, revocable result-only sharing.

## Configuration

Copy `.env.example` to `.env.local` and configure only the services you intend to use. Never paste keys in chat or commit credentials.

Browser-local saving remains available through IndexedDB. All server application records and invite-only authentication now use the existing MongoDB database, via `MONGODB_URI` and `MONGODB_DB` (or the database selected by the URI). Runtime code no longer reads `DCORHOME_DATA_DIR` or `DCORHOME_DATABASE_URL` and never creates SQLite files. Keep `SESSION_SECRET`, `BETTER_AUTH_SECRET` and `SITE_URL` configured privately.

Private customer photographs require private S3-compatible object storage; local files and Vercel `/tmp` are not persistent storage. Missing storage configuration disables dependent upload/generation operations. Static catalogue/visualizer assets remain bundled in `public/`. AI remains off unless explicitly enabled later.

See [MongoDB architecture, data audit, migration and Vercel setup](docs/mongodb-production-readiness.md). Source SQLite files are preserved; migration is an explicit backed-up dry-run/insert-only procedure, never startup/build behavior. Existing MongoDB users and credential hashes are not migrated or reset.

For targeted verification after building, use `npm.cmd run check:mongodb`. It starts an ephemeral localhost replica set and tests only isolated data; the configured business database is never its write target. Old SQLite-only fixture harnesses stop with an explanatory error rather than risking writes against MongoDB.

## Verification commands

- `node scripts/validate-assets.cjs`: rejects identical paths/content and mismatched comparison dimensions.
- `node scripts/logic-check.cjs`: measurement formulas, units, repeats, panels and invalid inputs.
- `npm.cmd run check:mongodb`: targeted isolated MongoDB repository, migration, route, authentication and restart checks. Run after a production build; no real AI/email requests.
- `node scripts/browser-check.cjs`: Chrome on Windows, against a production preview on 3100; responsive screenshots, interactions and browser-local saving.

See `docs/mongodb-production-readiness.md` for the current database verification and remaining production configuration. `lib/assets.ts` centralizes photography provenance; `PHOTOGRAPHY.md` documents original licenses. Historical phase documents describe earlier states and are superseded by the implementation report.

Nothing is deployed by these commands.
