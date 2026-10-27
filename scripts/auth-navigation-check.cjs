// Synthetic redirect/client-render regressions. No real login or provider connection.
const assert = require('node:assert/strict'), fs = require('node:fs'), Module = require('node:module');
require('./auth-loader.cjs');
const { authDestination, clerkLoginView, authNavigationDiagnostic } = require('../lib/auth-navigation.ts');
for (const state of ['authenticated', 'signed_out', 'pending', 'denied', 'unavailable']) {
  for (const route of ['/login', '/account']) {
    const destination = authDestination(route, state);
    assert.notEqual(destination, route);
    if (destination) assert.equal(authDestination(destination, state), null, 'A resolved state must not bounce back.');
  }
}
assert.equal(authDestination('/account', 'authenticated'), null); // includes ordinary users
assert.equal(clerkLoginView(false, true, false), 'loading');
assert.equal(clerkLoginView(true, true, false), 'session_mismatch');
assert.equal(clerkLoginView(true, true, true), 'tasks');
assert.equal(clerkLoginView(true, false, false), 'sign_in');
const { clerkAuthorizedParties } = require('../lib/auth-provider.ts');
process.env.SITE_URL = 'https://site.example'; process.env.NODE_ENV = 'development';
assert.deepEqual(clerkAuthorizedParties('http://localhost:3000'), ['https://site.example', 'http://localhost:3000']);
assert.deepEqual(clerkAuthorizedParties('https://untrusted.example'), ['https://site.example']);
process.env.NODE_ENV = 'production';
assert.deepEqual(clerkAuthorizedParties('http://localhost:3000'), ['https://site.example']);
let logs = []; const originalInfo = console.info; console.info = value => logs.push(value);
process.env.AUTH_NAVIGATION_DIAGNOSTICS = 'true';
authNavigationDiagnostic('/login', 'clerk', 'pending'); assert.equal(logs.length, 0);
process.env.NODE_ENV = 'development'; authNavigationDiagnostic('/login', 'clerk', 'pending');
console.info = originalInfo; assert.equal(JSON.parse(logs[0]).pending, true);
// Exercise the actual login component: SignIn's implicit navigation must never mount
// when browser auth disagrees with a signed-out server, or while tasks are pending.
const React = require('react'), { renderToStaticMarkup } = require('react-dom/server');
let state = { loaded: true, sessionId: 'synthetic-only', session: { status: 'active' } }, mounted = '';
const originalLoad = Module._load;
Module._load = function(name, ...args) {
  if (name === '@clerk/nextjs') return {
    useAuth: () => ({ isLoaded: state.loaded, sessionId: state.sessionId }),
    useSession: () => ({ isLoaded: state.loaded, session: state.session }),
    useClerk: () => ({ signOut() { throw Error('No real sign-out in synthetic checks.'); } }),
    SignIn: () => { mounted = 'sign_in'; return React.createElement('div', null, 'Synthetic sign-in widget'); },
    TaskResetPassword: () => { mounted = 'reset-password'; return React.createElement('div', null, 'Synthetic reset task'); },
    TaskSetupMFA: () => { mounted = 'setup-mfa'; return React.createElement('div', null, 'Synthetic MFA task'); },
    TaskChooseOrganization: () => { mounted = 'choose-organization'; return React.createElement('div', null, 'Synthetic organization task'); },
  };
  return originalLoad.call(this, name, ...args);
};
const ts = require('typescript');
require.extensions['.tsx'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText, filename);
const { ClerkLogin } = require('../components/account/ClerkAccount.tsx');
function render() { mounted = ''; return renderToStaticMarkup(React.createElement(ClerkLogin)); }
assert.ok(render().includes('could not verify that session')); assert.equal(mounted, '');
state.loaded = false; assert.ok(render().includes('Checking your sign-in')); assert.equal(mounted, '');
state = { loaded: true, sessionId: null, session: null }; render(); assert.equal(mounted, 'sign_in');
for (const task of ['reset-password', 'setup-mfa', 'choose-organization']) { state = { loaded: true, sessionId: 'synthetic-only', session: { status: 'pending', currentTask: { key: task } } }; render(); assert.equal(mounted, task); }
state.session.currentTask.key = 'unknown-task'; render(); assert.equal(mounted, '');
Module._load = originalLoad;
console.log('PASS: Stable redirect matrix, actual login rendering under client/server disagreement/loading/tasks, ordinary-user destination, development-only diagnostics and strict Production origins. Synthetic checks; real Clerk login/logout NOT claimed.');
