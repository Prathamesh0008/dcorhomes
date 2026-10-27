# Live login connectivity investigation - 27 October 2026

Live login is not verified fixed. The reported Vercel failure is `network_timeout`, `detail: tls`, on authentication connection. Public HTTP 200 does not test the authentication database.

## Evidence

- `databaseFailure` classifies MongoDB Network/ServerSelection/Timeout error names as `network_timeout`; this broad category does not establish a literal socket timeout.
- `databaseFailureDetail` labels an error `tls` if its code contains TLS/SSL/CERT or its message contains TLS/SSL/certificate, including nested topology errors. For example, a TCP reset described as "disconnected before secure TLS connection was established" receives this label. It does not prove certificate failure, completed TCP connectivity or an Atlas access-list cause.
- Existing shared client/promise, pool size 5, failed-connection cooldown and original error propagation remain unchanged. Better Auth uses that client, retries failed initialization and keeps its invite-only policy. The auth route explicitly uses the Node.js runtime and returns a secure 503 on database failure.
- `npm run db:ping` passed using normal Next production-mode environment-file precedence on the workstation.
- A second invocation of the same diagnostic with `--env-only` passed after injecting the operator-confirmed source from those settings and checking its fingerprint against the previously reviewed production fingerprint. This is NOT a freshly fetched Vercel Production environment export and NOT execution in a deployed Vercel function.
- Workstation: Node 24.11.0, OpenSSL 3.5.4, installed MongoDB driver 6.21.0; package engines require Node 24.x. The driver package accepts Node >=16.20.1; that lower bound alone is not a complete compatibility guarantee. The successful real TLS ping supplies direct evidence for this workstation version/configuration. No version downgrade is justified by the reported keyword alone.
- Effective local MongoDB options have TLS enabled, no certificate/hostname verification bypass and no custom CA/client certificate file. No local NODE_OPTIONS, NODE_EXTRA_CA_CERTS or disabled Node TLS verification was found.
- Browser connector was unavailable, no Vercel project link/CLI or separate private Production environment export was available. Therefore the serving deployment ID, deployed commit, variable revision, Node/OpenSSL patch versions, region, outbound addresses and runtime-specific underlying error are not independently verified.

## Diagnostic change

Server logs now add fixed-allowlist underlying network/TLS error codes and Node/OpenSSL versions. The original error still propagates; raw messages, stacks, hosts, usernames, URI, database names and query values remain excluded. Nested causes, topology server errors and aggregate errors are inspected with cycle/depth/node limits. The original broad `detail` label is retained for compatibility; use the codes as additional evidence, not proof of a configuration cause. An empty code list means no recognized code was found.

The existing CLI includes driver/runtime version, injected-only versus env-file configuration and an execution marker. `vercel-marked-process` is explicitly a marker, not proof of serverless execution; setting VERCEL locally cannot verify deployed networking. No HTTP diagnostic endpoint was added.

## Required dashboard investigation and conditional corrections

1. Vercel project serving `dcorhomes.vercel.app` -> Deployments: identify the deployment currently assigned the Production domain. Record its deployment ID, commit, creation time and function region privately. Do not assume the newest listed deployment serves the domain.
2. Settings -> Environment Variables: verify MONGODB_URI, MONGODB_DB, BETTER_AUTH_SECRET and SITE_URL have Production scope and match the reviewed source. Check for URI TLS overrides and CA-related Node variables privately, without copying secrets to chat/logs. Compare the last settings change with the serving deployment's creation time. Existing deployments do not acquire later variable changes. If settings changed afterward, a manually approved new deployment is required; do not edit credentials or reset users to test this. See [Vercel environment variable behavior](https://vercel.com/docs/environment-variables).
3. Atlas intended project -> Database/Clusters: ensure the existing cluster is running; Connect -> Drivers: compare its generated hostname/options privately against the Production URI, keeping TLS/certificate checks enabled. The successful workstation ping rules out a globally unavailable source at test time, not a different URI in the deployed function.
4. Vercel Settings -> Connectivity: inspect function networking/Static IPs or Secure Compute and all configured regions. Atlas -> Security -> Network Access -> IP Access List: ensure the actual Vercel function egress addresses are active entries. If Static IPs are enabled, add BOTH listed addresses for EACH function region as individual /32 entries if missing. Use the dedicated egress addresses for Secure Compute. A workstation IP or the site's public inbound IP is not a function egress address. With dynamic egress and a restrictive list, fixed egress/private networking must be configured by the operator; do not weaken the list globally. See [Vercel egress allowlisting](https://vercel.com/kb/guide/how-to-allowlist-deployment-ip-address) and [Atlas troubleshooting](https://www.mongodb.com/docs/atlas/troubleshoot-connection/).
5. On a manually approved deployment containing the diagnostics, inspect the failing function's codes and runtime. ENOTFOUND/EAI_AGAIN/ENODATA/ESERVFAIL identify resolver failures; ETIMEDOUT/ECONNREFUSED/ECONNRESET require egress/access-list/socket investigation; certificate-specific codes require the exact hostname/trust chain to be checked; SSL alert codes require handshake investigation. A reset or timeout alone cannot prove an Atlas allowlist defect. Never use tlsInsecure, tlsAllowInvalidCertificates, tlsAllowInvalidHostnames or NODE_TLS_REJECT_UNAUTHORIZED=0.
6. Verify the actual function Node version from its safe failure log and the deployment's runtime/build settings. If a reproducible runtime-specific incompatibility is established, test the proposed version in an operator-created Preview with equivalent connectivity before considering Production. No Preview or Production deployment was created in this task.
7. Privately sign in through the serving site's existing login form using the existing administrator's credentials. Confirm sign-in HTTP 200, HttpOnly session and authorized account access, then logout. Do not use fake users or repeated password attempts as a network diagnostic; they mutate rate-limit/audit state. No real login or production database write was attempted here.

No exact configuration defect is confirmed while the serving deployment remains inaccessible. The next required action is inspecting its environment revision and actual outbound access; do not apply a speculative TLS or Node downgrade.

## Validation

- `node scripts/database-diagnostics-check.cjs`: PASS; TLS keyword ambiguity, nested TCP/certificate/DNS codes, cycle handling and no private values emitted.
- `node scripts/customer-auth-check.cjs` without database/fixture flags: PASS; real scrypt hashing/verification, user-ID/password rules, disabled/revoked session policy and signup denial. No production users/passwords were changed. This does not exercise live login or persistent session creation.
- `npm run lint` (TypeScript): PASS.
- Both read-only pings: PASS on workstation, as scoped above.
- Public rendering/data architecture, catalogue, Studio, homepage, branding, SEO and authentication policy were not modified. Nothing was deployed.
