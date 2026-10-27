require('./forbid-mongodb-preload.cjs');
const original=globalThis.fetch;
globalThis.fetch=function(input,...args){const value=typeof input==='string'?input:input instanceof URL?input.href:input?.url||'';if(/^https:\/\/(?:api\.)?clerk\.com\//i.test(value)){console.error('SEO_FORBIDDEN_AUTH_LOOKUP');throw Error('Public SEO must not call an authentication backend.');}return original.call(this,input,...args);};
