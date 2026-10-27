# Production release evidence — 27 October 2026

The production content-preservation blocker is resolved. The existing verification command legitimately changed `data/catalogue/migration.json` to `production-preserved`. The protection itself is unchanged. No push, deployment, production write, account reset or UI change was performed.

## Confirmed source and preserved content

The operator explicitly confirmed that the current `.env.local` source fingerprint matches the reviewed Vercel Production and Atlas database:

`09cc8791858126a34ab5dc2a73e33974cc16c7ca83b44784b8d1ec644263b495`

This is operator-confirmed configuration identity, backed by a real read-only connection/export. The agent did not independently access the Vercel or Atlas dashboards. Settings were injected into the export child process with `--env-only`; its Production scope marker was local to that process. No Vercel variable was changed.

The initial DNS attempts inside the execution sandbox timed out. The same SRV query succeeded outside the sandbox with three records, and the existing export then succeeded with network access. This establishes sandbox network restrictions as a cause of the local failures; it does not establish an Atlas access-list defect or verify Vercel's outbound network.

Private snapshot: `.data/production-content-release-2ca90d11f27d`.

- Manifest version 2; read-only; source unchanged across the export's two snapshots; exact confirmed nonlocal source identity recorded.
- Manifest SHA-256: `f60d2f61be731b5c54410decc89f8fa3b0528608a4cbca6b504fa688d0785862`.
- All legacy public/application collections exported by the tool contained **zero records**: fabric products, fabric collections, legacy fabrics, editorial content, site settings, asset metadata, saved designs, enquiries, shares and generic application records/control/limits.
- A separate read-only `listCollections`/count inventory found **only authentication/security collections**, with no unmapped collection requiring preservation. The existing administrator credential/account remained present. No credential hashes, session tokens or user identities were exported.
- Private collection-inventory checksum: `3d4b11d2346f4da779a805d2ff68aeef6371b53cbf8f7048d1eb912a0116aba0`. The inventory remains in the ignored private snapshot directory.
- The generated candidates exactly matched the repository: **7 labelled demo fabrics, 31 embedded shades, 10 collections**, plus the existing editorial content and design options. Full JSON equality and file checksums passed; IDs and shades were unchanged. No merge/copy was necessary and no supplier inventory was invented. There are zero supplier records in the current catalogue.
- The export requested private assets but found zero referenced private assets and zero catalogue-image records. There were no missing referenced images or historical designs to copy. Object storage was not independently inventoried, so this is not a claim that an external bucket contains no orphan objects. Existing external storage was left untouched.

This is an evidence-backed approval of the existing repository content for an empty legacy public-data source. Test snapshots were not used as production evidence. The approved comparison hero, logo, room imagery, masks, textures, geometry and visualizer UI were not changed.

Commands completed against the real private export:

```powershell
npm.cmd run content:verify-export -- --snapshot .data/production-content-release-2ca90d11f27d
npm.cmd run content:verify-export -- --snapshot .data/production-content-release-2ca90d11f27d --confirm-production-source
```

Keep the entire private snapshot and inventory backed up securely. Never commit `.data`, raw exports, environment files, customer photographs or credentials.

## Validation

| Area | Result and scope |
| --- | --- |
| Production preservation gate | PASS with process-local `VERCEL_ENV=production`; source-bound evidence required and present. |
| `npm run check` | PASS, including a Production-scoped run after approval. Content, preservation guards, visualizer assets, mocked email and browser-storage checks passed. |
| `npm run lint` | PASS. |
| `npm run build` with `VERCEL_ENV=production` | PASS, including prebuild checks, compilation, types, route generation and traces. Public rendering needed no MongoDB connection. |
| Homepage/navigation/products | PASS against the production build with MongoDB deliberately unavailable. 34 internal navigation targets passed, including all seven product pages, homepage, collections, Studio, footer, sitemap and robots. External sites/inbox links were not contacted. |
| Studio and local designs | PASS in one focused browser journey: actual canvas, shade changes, room-capability gates, before/after, real PNG download, localStorage save, reopen and delete; no auth/cloud-storage/AI calls. Existing ten library rooms remain view-only; garden sample supports compositing. Unsupported previews were not enabled. |
| Asset integrity | PASS: 200 optimized shade textures and 240 byte-identical runtime copies, independent layer rules and renderer-version validation. |
| Authentication | PASS against isolated real MongoDB: invite-only admin/member login, hashes, first-password change, reset, role/status enforcement, disabling/revocation, logout and signup denial. The real confirmed database was reached read-only; an active administrator credential exists. Its actual password was not requested or tested. |
| Enquiries | PASS for mocked provider acceptance, rejection, missing configuration, malformed acknowledgement, transport failure and spam/input controls. No success without provider acceptance; no MongoDB submission storage. Local API key/sender settings are present. No real email was sent and Vercel's sender configuration/inbox delivery was not independently verified. |
| Public SEO | PASS for indexable-page titles/canonicals, product metadata, production-origin sitemap and robots. Private/noindex routes are not required to publish indexable canonicals. |
| Runtime/security boundaries | PASS: MongoDB call sites remain confined to authentication/member management; no SQLite/data-directory or Windows runtime path dependency. 58 server traces and 81 public artifacts passed the existing dependency/credential scan. |
| Git review | No unresolved merge conflicts. Only the migration evidence and release documentation are included in this release change. Private exports/environment files are ignored; no application or branding files changed. |

The architecture checks intercepted the actual MongoDB driver and verified zero connection attempts during public navigation, including requests with account-like cookies. Security tests created identities only in an ephemeral localhost database, never in the business database. No extensive Playwright suite was run.

## Release and live acceptance

There is no remaining preservation/build blocker. This is a checked release candidate, not a claim that the new commit is already live or that Vercel network access, the owner's password login and actual enquiry delivery have passed acceptance.

After the local release commit is reviewed, the operator's push command is:

```powershell
git push origin main
```

If the configured Git integration deploys `main`, that push may create the Production deployment. Otherwise, in the Vercel project serving `dcorhomes.vercel.app`, create a **Production deployment from the new release commit on `main`**. Do not redeploy an older commit that still has the pending migration file. Keep the existing Production environment and Node.js 24.x configuration.

After deployment, verify the live homepage, collections, Studio, sitemap and robots; sign in privately as the existing administrator; confirm private access restrictions; and perform one explicitly approved real enquiry to verify provider acceptance and inbox delivery. Do not reset accounts or deliberately break production MongoDB settings for acceptance tests. The current catalogue is still labelled demonstration content, not verified supplier inventory.
