// Compile project TS in memory for migration and isolated security checks.
const fs = require('node:fs'), path = require('node:path'), Module = require('node:module'), ts = require('typescript');
const resolve = Module._resolveFilename;
// This loader runs only in trusted local Node CLI tools. Next enforces server-only in the application bundle.
const load = Module._load;
Module._load = function (name, ...args) { return name === 'server-only' ? {} : load.call(this, name, ...args); };
Module._resolveFilename = function (name, ...args) { return resolve.call(this, name.startsWith('@/') ? path.resolve(name.slice(2)) : name, ...args); };
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText, filename);
