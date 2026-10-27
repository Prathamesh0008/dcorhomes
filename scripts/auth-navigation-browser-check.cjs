// Focused signed-out check using a fresh browser profile, not the owner's cookies.
// No credential entry, account creation or claim of successful provider login.
const fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict'), { spawn } = require('node:child_process');
const base = process.env.DCORHOME_TEST_BASE_URL || 'http://localhost:3000';
assert.ok(['localhost', '127.0.0.1'].includes(new URL(base).hostname), 'Local test server only.');
const output = path.resolve('.test-data/auth-navigation'); fs.mkdirSync(output, { recursive: true });
const profile = fs.mkdtempSync(path.join(output, 'profile-')), port = 23000 + Math.floor(Math.random() * 7000);
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--disable-extensions', '--disable-background-networking', '--no-first-run', '--remote-debugging-port=' + port, '--user-data-dir=' + profile, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
let ws, sequence = 0; const pending = new Map(), routes = [];
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const deadline = setTimeout(() => { chrome.kill(); console.error('BLOCKED: Local signed-out browser check deadline. No credentials submitted.'); process.exit(1); }, 70000);
function call(method, params = {}) { return new Promise((resolve, reject) => { const id = ++sequence; const timer = setTimeout(() => { pending.delete(id); reject(Error('Browser command timeout')); }, 15000); pending.set(id, { resolve: value => { clearTimeout(timer); resolve(value); }, reject }); ws.send(JSON.stringify({ id, method, params })); }); }
async function evaluate(expression) { const result = await call('Runtime.evaluate', { expression, returnByValue: true }); if (result.exceptionDetails) throw Error('Browser evaluation failed'); return result.result.value; }
(async () => {
  let target;
  for (let i = 0; i < 50; i++) { try { target = await fetch('http://127.0.0.1:' + port + '/json/new?about:blank', { method: 'PUT' }).then(r => r.json()); break; } catch { await delay(100); } }
  assert.ok(target?.webSocketDebuggerUrl); ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  ws.onmessage = event => { const data = JSON.parse(event.data); if (data.id) { const action = pending.get(data.id); if (action) { pending.delete(data.id); data.error ? action.reject(Error('Browser command failed')) : action.resolve(data.result); } } else if (data.method === 'Page.frameNavigated' && !data.params.frame.parentId) { const url = new URL(data.params.frame.url); if (url.origin === base) routes.push(url.pathname); } };
  await call('Page.enable'); await call('Runtime.enable');
  await call('Page.navigate', { url: base + '/login' });
  let formLoaded = false;
  for (let i = 0; i < 300; i++) { if (await evaluate("Boolean(document.querySelector('form input'))")) { formLoaded = true; break; } await delay(100); }
  assert.ok(formLoaded, 'Actual Clerk sign-in widget did not finish loading.');
  await delay(6000);
  assert.equal(await evaluate('location.pathname'), '/login'); assert.equal(routes.filter(route => route === '/account').length, 0);
  const loginVisits = routes.filter(route => route === '/login').length; assert.equal(loginVisits, 1);
  routes.length = 0; await call('Page.navigate', { url: base + '/account' });
  for (let i = 0; i < 150 && await evaluate('location.pathname') !== '/login'; i++) await delay(100);
  await delay(6000); assert.equal(await evaluate('location.pathname'), '/login');
  assert.equal(routes.filter(route => route === '/login').length, 1);
  console.log('PASS: Actual configured Clerk widget loaded in a fresh signed-out browser; /login stayed stable and /account returned once to /login without repeated navigation. Real authorized login/logout NOT tested.');
})().catch(() => { console.error('FAIL/BLOCKED: Local signed-out Clerk browser check; no credentials or response bodies printed.'); process.exitCode = 1; }).finally(() => { clearTimeout(deadline); if (ws) ws.close(); chrome.kill(); });
