// Synthetic fixtures only. Never loads environment credentials or prints passwords.
const assert = require('node:assert/strict');
require('./auth-loader.cjs');
const { assessPassword, passwordProblem, generatePassword } = require('../lib/password-policy.ts');
const context = { userId: 'alice.smith', name: 'Alice Smith', email: 'alice@example.invalid' };
const tests = [
  ['short', 'tiny', false, /at least 12/],
  ['too long', 'x'.repeat(129), false, /no more than 128/],
  ['common long', 'passwordpasswordpassword2026!', false, /repeated|Common/],
  ['common with sequence', 'Password123456789!', false, /common password/],
  ['common with substitutions', 'P@ssw0rd123456789!', false, /common password/],
  ['well-known public example', 'correct horse battery staple', false, /well-known phrase/],
  ['repeated', 'abcabcabcabcabcabc', false, /repeated|predictable/],
  ['account-specific', 'AliceSmith2026!', false, /User ID/],
  ['brand-specific', 'Dcorhome2026!', false, /User ID|Common|dates/],
  ['random', 'j7Yv4sT9q2Xb8nK6mR3w5Zc1', true],
  ['12-character random', 'M7s4y9R2v8Q6', true],
  ['passphrase', 'otter lantern copper meadow orbit', true],
  ['old substring false positive', 'welcome timber orbit kiln heron pebble', true],
];
for (const [label, value, valid, feedback] of tests) {
  const result = assessPassword(value, context);
  assert.equal(result.valid, valid, label);
  assert.equal(passwordProblem(value, context), result.problem, label);
  assert.ok(!result.message.includes(value), 'Feedback must never echo a password');
  if (feedback) assert.match(result.message, feedback, label);
}
assert.equal(assessPassword('').fill, 0);
assert.equal(assessPassword('staplecinema').label, 'FAIR');
assert.equal(assessPassword('copper meadow').label, 'GOOD');
assert.equal(assessPassword('otter lantern copper meadow orbit').label, 'STRONG');
const generated = new Set();
for (let i = 0; i < 64; i++) {
  const value = generatePassword(context), result = assessPassword(value, context);
  assert.equal(value.length, 48); assert.ok(result.valid); assert.equal(result.label, 'STRONG'); generated.add(value);
}
assert.equal(generated.size, 64);
assert.equal(assessPassword('otter lantern copper meadow orbit').color, '#27845B');
assert.equal(assessPassword('tiny').color, '#DC4545');
console.log('PASS: 12–128 limits, common/repeated/account-specific rejection, random passwords and unrelated passphrases, old substring false positive, safe feedback and 64 unique policy-compliant STRONG generated passwords.');
