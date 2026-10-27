# Deployment edf26be — production preservation blocker

The failing command is the `prebuild` repository-content check. With `VERCEL_ENV=production`, it rejects `data/catalogue/migration.json` because its status is `pending-production-export` and `productionSourceConfirmed` is false. This is an unmet data-preservation requirement, not a Next.js compilation failure. The protection has not been disabled and the migration state has not been changed.

## Evidence inspected

- The checkout started clean at `edf26be`.
- `.data/architecture-export-30f052baa902` and `.data/architecture-export-38b50cf20738` contain checksum-valid snapshots. Both contain `fixture-export-preservation` / `Isolated export fixture`, one fixture product, one private fixture enquiry and one fixture manual design. Neither records a production identity. Both are isolated test outputs, not evidence of a production migration.
- The older migration audit contains local authentication counts and a SQLite dry-run report. It does not identify or certify Vercel Production's public content.
- No successful production-content snapshot or production-preservation verification was found in the private export artifacts inspected.
- The configured MongoDB URI/database come from local environment files, not injected Vercel Production settings. No Vercel project identity/scope is injected. The local canonical origin does not match the supplied deployment URL. The redacted cluster+database fingerprint is `09cc8791858126a34ab5dc2a73e33974cc16c7ca83b44784b8d1ec644263b495`. This identifies a configuration for comparison; it does **not** certify it as production. Credentials, connection strings, database names and hostnames were not printed.
- No connected Vercel/Atlas administration tool is available; the browser connector reports no browser connection. Production settings therefore cannot be independently inspected here.

The intended source identity must be confirmed before a new production connection/export. No new production connection was attempted in this investigation with the unconfirmed local settings. The earlier architecture task reported connection/export timeouts; those historical results are not presented as a fresh connectivity test. The current unique public-record count and missing production image inventory remain **unknown**, not zero. Local private-object-storage settings are absent, so image export also needs the correct existing storage configuration if source records reference those images.

## Safe changes made

1. Added the missing `npm run check` command for repository content, preservation-policy regression checks, visualizer assets and mocked enquiry/browser-storage behavior.
2. Added `npm run content:identity`: it parses application MongoDB configuration and emits only SHA-256 source fingerprints, local/nonlocal classification and configuration-scope indicators. It never connects.
3. Production export now requires `--production-source --env-only --expected-source-sha256 <trusted fingerprint>`. It checks the expected nonlocal source and injected Production scope **before** calling the MongoDB client. Export manifests record that source identity. The scope marker and fingerprint are assertions checked against trusted operator configuration; they cannot substitute for obtaining the correct Production settings.
4. Production approval requires version-2 source-bound evidence. Legacy/fixture manifests, incomplete exports and source mismatches cannot approve the gate. Offline integrity checks require all raw/candidate/inventory artifacts and checksums, and restrict published image paths to exported public catalogue images.
5. No runtime application/authentication code, visual styling, hero, logo, public content records or production environment variables were changed. MongoDB remains authentication-only at runtime. Export tools remain explicit read-only preservation operations.

No production records were migrated or copied in this task. No private snapshot, enquiry, design, original image or credential was added to Git or `public/`.

## Operator actions required

1. Privately verify the correct Vercel project, deployment `edf26be`, Production-scoped `MONGODB_URI` and selected existing `MONGODB_DB`. Confirm whether the local configuration fingerprint above represents that same source, or inject the correct settings through a trusted private channel. Do not paste secrets into chat. Development settings are not proof of Production settings. See [Vercel environment scopes](https://vercel.com/docs/environment-variables).
2. If the confirmed source still times out, check Atlas cluster health/paused status and the Atlas-generated hostname/URI. For a **workstation export**, Atlas Network Access must permit that trusted workstation's actual outbound IP (`/32`), or its approved private network. Vercel IP access rules do not by themselves authorize this workstation. Resolve SRV/TXT/address DNS and allow TLS TCP access to Atlas's advertised ports. Keep TLS/certificate validation enabled. The exact faulty setting cannot be identified from a generic historical timeout without dashboard/network evidence. See [Atlas connection troubleshooting](https://www.mongodb.com/docs/atlas/troubleshoot-connection/).
3. For deployed authentication, separately allow the actual Vercel fixed outbound IPs for each function region or use the approved private network. Obtain them from the project networking settings, not the website's inbound IP. Do not enable global access just to force a pass. See [Vercel Static IPs](https://vercel.com/docs/networking/static-ips).
4. From a trusted shell with the verified Production settings injected and the local scope marker set, run `npm.cmd run content:identity -- --env-only`. Set `$verifiedSourceSha256` to the independently verified source fingerprint. Run:

   ```powershell
   npm.cmd run content:export -- --env-only --production-source --expected-source-sha256 $verifiedSourceSha256 --out .data/production-content-export --include-private-assets
   ```

5. Review the resulting manifest/raw source and public candidates. Follow the architecture report's copy/validation procedure. Copy only reviewed public catalogue/editorial/design-option files and approved public catalogue images. Preserve all source records, identifiers and shades. Keep private records/images/backups under private storage and out of Git.
6. Run `content:verify-export` without approval first. Only after the correct source and actual preservation are verified, run it with `--confirm-production-source`. The tool derives the real manifest checksum; never enter a made-up checksum or manually flip migration flags.
7. If a source-bound successful snapshot proves there is genuinely no unique public content, retain that evidence, review the exact repository initial content and record explicit operator approval through the verified-snapshot workflow. A timeout, auth-only local count or empty test database cannot justify initial-content approval. No initial-content approval has been issued here.
8. Run `npm run check`, `npm run lint`, `npm run build`, and a Production-scoped build. Review/commit only safe source changes. Do not push a deployment-triggering branch or deploy the content cutover until the preservation gate is genuinely satisfied. No deployment or environment change is performed by this task.

## Verification results

| Check | Result |
| --- | --- |
| `npm run check` | Passed content, preservation-policy, visualizer-asset and mocked email/storage checks. |
| `npm run lint` | Passed TypeScript. |
| `npm run build` | Passed local optimized production compilation and prebuild checks. |
| `npm run build` with process-local `VERCEL_ENV=production` | Failed at the preservation gate, as required by the unchanged pending migration. No Vercel setting was changed. |
| `npm run check:architecture` | Passed controlled offline public routes, footer, sitemap/catalogue, focused Studio journey, isolated authentication and read-only export-preservation guards. |
| `npm run check:build-boundaries` | Passed 58 server traces and 81 public artifacts; no SQLite/data-directory dependency or configured server credential found. |

The controlled server denied MongoDB connections for public requests, including cookie-bearing requests. Homepage, collections, real product details, Studio, footer, sitemap and other public content worked. A focused browser journey verified canvas rendering, shades, PNG download and local save/restore/delete without auth/cloud-storage/AI requests. Isolated auth checks and newly generated fixture exports used only localhost test databases. Those new exports are explicitly local and unconfirmed, and cannot approve production.

Production records migrated: **zero**. Production preservation verification: **not completed**. Missing production records/images: **unknown**, not absent. No initial-content approval was issued. The migration file remains unchanged. Tooling changes are ready for review/commit; the content cutover is not ready for a production-triggering push/deployment. Confirm the intended source and complete the real export/verification first.
