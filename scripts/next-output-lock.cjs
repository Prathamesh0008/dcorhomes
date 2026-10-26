// Next 15 does not lock its distDir. Acquire ownership before its startup clean.
// The CLI's child/restart workers inherit the lease; independent CLI invocations do not.
const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const key = Symbol.for('dcorhome.next-output-leases');
const owned = globalThis[key] || (globalThis[key] = new Map());
function alive(pid) {
  try { process.kill(pid, 0); return true; }
  catch (error) { return error.code !== 'ESRCH'; } // EPERM must fail closed.
}
function read(file) {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch (error) {
    if (error.code === 'ENOENT') return null;
    throw Error(`Next.js output ownership is being initialized or cannot be read: ${file}. Retry after checking the existing terminal.`, { cause: error });
  }
}
function same(a, b) { return a && b && a.pid === b.pid && a.token === b.token && a.root === b.root; }
function inherit(envKey, lease) {
  const env = { [envKey]: JSON.stringify(lease) };
  Object.assign(process.env, env);
  // next dev forks from @next/env's initial snapshot, not just process.env.
  require('@next/env').updateInitialEnv(env);
}

function acquireNextOutput(distDir, root = path.resolve(__dirname, '..')) {
  if (!['.next-dev', '.next'].includes(distDir)) throw Error('Unexpected Next.js output directory.');
  root = fs.realpathSync(root);
  const file = path.join(root, distDir + '.lock');
  const envKey = distDir === '.next-dev' ? 'DCORHOME_NEXT_DEV_OWNER' : 'DCORHOME_NEXT_PROD_OWNER';
  const existing = read(file);
  let inherited;
  try { inherited = JSON.parse(process.env[envKey] || 'null'); } catch {}
  if (same(existing, inherited) && alive(existing.pid)) return; // Next child/restart worker.
  if (same(existing, owned.get(file))) { inherit(envKey, existing); return; }
  if (existing) {
    if (!Number.isInteger(existing.pid) || existing.pid <= 0 || !existing.token || existing.root !== root) {
      throw Error(`Invalid Next.js ownership file: ${file}. Check it before restarting; it was not removed.`);
    }
    if (alive(existing.pid)) {
      throw Error(`Another Next.js process already owns ${distDir} (PID ${existing.pid}). Stop that project's existing terminal before starting another server/build. A different port still shares the same output directory.`);
    }
    // Recover only a positively identified dead owner, never generated output or user data.
    if (!same(read(file), existing)) throw Error('Next.js output ownership changed. Please retry.');
    try { fs.unlinkSync(file); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  const lease = { pid: process.pid, token: randomUUID(), root };
  let fd;
  try { fd = fs.openSync(file, 'wx'); }
  catch (error) {
    if (error.code === 'EEXIST') throw Error(`Another Next.js process is acquiring ${distDir}. Use the existing server or retry after it stops.`);
    throw error;
  }
  try { fs.writeFileSync(fd, JSON.stringify(lease)); } finally { fs.closeSync(fd); }
  owned.set(file, lease);
  inherit(envKey, lease);
  process.once('exit', () => {
    try { if (same(read(file), lease)) fs.unlinkSync(file); } catch {}
    owned.delete(file);
  });
}
module.exports = { acquireNextOutput };
