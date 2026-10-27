# MongoDB connectivity repair — 27 October 2026

Production connectivity has **not** been verified. No deployment, cloud settings change, account reset, database recreation or production write was performed.

## Evidence and limits

The supplied Vercel logs prove a connection/server-selection failure classified as `network_timeout`. That category alone cannot distinguish Atlas network access, paused/unavailable clusters, an incorrect hostname, DNS, TLS, or Vercel egress restrictions. The original classifier also groups several different driver errors under that label.

This checkout's configured MongoDB ping did not complete within the diagnostic's 25-second deadline. A separate local SRV/address lookup did not complete within 10 seconds. This establishes a local DNS-resolution delay, not its underlying cause and not Vercel's DNS behavior. Sandbox/network restrictions may contribute. No authentication or TLS handshake with the configured cluster was verified. Atlas and Vercel dashboards are not connected in this session.

| Candidate | Finding |
| --- | --- |
| Atlas IP Access List | Not accessible; must check actual Vercel outbound addresses, not the developer laptop or website IP. |
| Cluster paused/unavailable | Not accessible; verify deployment health and resume the existing cluster if paused. |
| Hostname/URI | Production URI inaccessible. Local configuration passed the application's required-settings check; hostname correctness is unverified. |
| DNS SRV | Local lookup hit a 10-second deadline; production DNS unverified. |
| Missing production settings | Not accessible. The supplied `connect` event suggests settings passed validation on that failing instance; it does not prove correct deployment scopes or values. |
| Vercel network restrictions | Not accessible; check outbound networking/private endpoint configuration. |
| TLS | No insecure TLS flags in application client options. Production URI options/certificates and successful TLS negotiation are unverified. |
| Excess clients | No confirmed excessive-client defect: client promise was already cached globally. Failed connections previously cleared immediately, allowing sequential retry bursts. |

## Code repaired

- Retain one global client/promise per URI per server instance. Keep the five-connection maximum per pool, zero minimum, bounded connection/wait/socket timeouts and two concurrent connection establishments. Close failed clients and share their rejection for five seconds before retrying. This is not a connection cap across all Vercel instances; Atlas capacity must accommodate instance count and driver monitoring connections.
- Fix database-name extraction for valid standard multi-host `mongodb://host:port,host:port/database` URIs; trim surrounding URI whitespace. Missing/invalid database settings still fail closed.
- Use the approved bundled hero without querying MongoDB. Homepage catalogue reads run behind Suspense, so the static hero can stream immediately. Healthy-page markup/styles and hero assets are preserved.
- Stop silently replacing failed catalogue reads with bundled fabrics. During outages show an explicit temporary-unavailability message; do not render the catalogue/composer as an empty successful result. Existing healthy catalogue merging and real database records remain unchanged.
- Share public fabric reads within a React server render. Keep mutation validation uncached. Homepage sections share the request-local catalogue result, including failure.
- Footer links are editorial navigation, with no database query or stock claim. Header/footer session validation shares one request-local result behind Suspense. Private routes still perform their own authorization; no cookie-only authorization or offline private-data fallback was introduced.
- Logs retain fixed operation/category labels and add fixed DNS/TLS/refused/timeout hints from nested driver errors. They omit driver messages, stacks, hostnames, credentials, URIs, database names and query data.

## Exact manual operator steps

1. **Atlas → correct project → Database / Clusters:** confirm the existing cluster is available. If paused, resume it and wait until ready. Do not create a replacement cluster or database.
2. **Atlas → cluster → Connect → Drivers → Node.js:** copy the generated URI for this existing cluster into a secret manager. Use the database user's credentials (not an Atlas dashboard login), percent-encode reserved characters in username/password, and preserve the generated options, including `authSource` if provided. Do not invent shard hostnames or disable TLS/certificate verification. If using a standard seed-list URI to troubleshoot SRV, obtain it from Atlas and retain `tls=true`, replica set and authentication options.
3. **Vercel → project → Settings → Environment Variables → Production:** set `MONGODB_URI` to that secret URI and `MONGODB_DB` to the exact existing application database name. Use plain values with no literal wrapping quotes. Do not use `NEXT_PUBLIC_` variables. Check for stale overrides/integration values. Development/Preview values do not configure Production. Preserve the existing `BETTER_AUTH_SECRET` (at least 32 characters), `SESSION_SECRET` and canonical HTTPS `SITE_URL`; do not rotate secrets or reset users for this network repair.
4. **Vercel → project → Settings → Networking:** if using restricted Atlas access, configure Static IPs for every function region, or use the existing Secure Compute network. Record every outbound IP shown. Static IPs is a paid plan feature; do not purchase/enable it without the account owner's decision. If using Secure Compute/private Atlas networking, verify routing, private endpoint and DNS are configured for that network. Do not use the website's public IP as an egress address.
5. **Atlas → Security → Network Access → IP Access List → Add IP Address:** add each Vercel outbound IPv4 address as its own `/32` entry (both addresses for each Static IP region); add the dedicated egress addresses instead if using Secure Compute. Wait until entries are active. A laptop `/32` permits laptop diagnostics only. Without fixed egress/private networking, a narrow permanent Vercel allowlist cannot be inferred. An operator may choose a short-lived `0.0.0.0/0` entry solely to isolate an allowlist issue, with existing authentication/TLS retained, then remove it; it exposes the database network listener globally and is not the recommended permanent configuration.
6. **Atlas → Security → Database Access:** verify the existing application database user has `readWrite` on the existing application database (including required collections/index creation); verify any cluster restriction includes this cluster. Do not grant Atlas administration or change application accounts. Permission errors are distinct from network timeouts.
7. Keep the Vercel runtime on Node.js 24.x, matching `package.json`; do not move MongoDB access into Edge Middleware. Allow outbound DNS SRV/TXT/address resolution and TLS TCP access to Atlas on its advertised ports (normally 27017). Check custom egress policies if present. Do not change the inbound website firewall to fix outbound MongoDB traffic.
8. After approval, manually create a new deployment so the environment/network changes apply. This task did not deploy. Inspect authenticated and public catalogue operations from that deployment's functions. Mark production verified only after successful database-backed reads and secure account operations from that runtime; a local ping alone does not verify Vercel.

Official references: [Atlas connection troubleshooting](https://www.mongodb.com/docs/atlas/troubleshoot-connection/), [Vercel Static IPs](https://vercel.com/docs/networking/static-ips), [Vercel environment scopes](https://vercel.com/docs/environment-variables).

## Diagnostics and validation

`npm run db:ping` loads environment files using Next's production precedence and performs only `{ ping: 1 }` through the actual application's client. It does not initialize collections, indexes or users. It emits only redacted status and exits nonzero on failure, with a 25-second overall diagnostic deadline. Use `npm run db:ping -- --env-only` in a trusted execution environment where the intended variables are already injected; this prevents local `.env` files from affecting the check. It requires development tooling dependencies for the existing TypeScript CLI loader. Do not expose it as an HTTP endpoint. A CI/build ping tests that CI/build network, not the deployed function network, unless those are configured identically.

Checks executed:

- `npm run lint`: passed TypeScript.
- `npm run build`: passed production compilation, type validation, asset/configuration checks and route generation.
- `npm run check:mongodb`: passed against an ephemeral localhost replica set. Includes real ping, concurrent client reuse, multi-host URI validation, failed-connection rejection sharing/cooldown/recovery, repositories/transactions/quotas, catalogue reads, admin/member login, ownership denial, password-change rules, saved-design persistence/restart, disable revocation, logout and missing-database failure. Existing migration tests use isolated SQLite fixtures only; no business data is targeted.
- Build dependency traces: 58 server traces, no SQLite or local data-directory dependencies. Application/runtime source scan found no SQLite provider, `DCORHOME_DATA_DIR` or Windows drive paths. Existing filesystem checks are for deployed public assets, not database storage.
- Configured remote read-only ping: failed at diagnostic deadline; local DNS lookup also timed out. Production connectivity remains unverified.

No Playwright suite was run. No homepage design, logo, visualizer UI, production catalogue records, accounts or saved designs were changed.
