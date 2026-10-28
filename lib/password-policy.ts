import { ZxcvbnFactory } from '@zxcvbn-ts/core';
import { adjacencyGraphs, dictionary as commonDictionary } from '@zxcvbn-ts/language-common';
import { dictionary as englishDictionary, translations } from '@zxcvbn-ts/language-en';

export type PasswordContext = { userId?: string; name?: string; email?: string };
const estimator = new ZxcvbnFactory({ translations, graphs: adjacencyGraphs,
  dictionary: { ...commonDictionary, ...englishDictionary }, maxLength: 128 });
const levels = [
  { label: 'WEAK', color: '#DC4545', fill: 25 },
  { label: 'FAIR', color: '#ED963B', fill: 50 },
  { label: 'GOOD', color: '#E8BC47', fill: 75 },
  { label: 'STRONG', color: '#27845B', fill: 100 },
] as const;
function personalWords(context: PasswordContext) {
  const values = [context.userId || '', context.name || '', context.email?.split('@')[0] || ''];
  return ['dcorhome', 'dcor home', ...values, ...values.map(value => value.replace(/[\s._@-]+/g, '')), ...values.flatMap(value => value.split(/[\s._@-]+/))].filter(value => value.length >= 3);
}
// A familiar base plus a year/short number/sequence is still predictable even
// when the estimator's score rises at the edge of a score band. This is anchored
// to the whole password; an unrelated passphrase containing a common word is fine.
function predictableComposition(password: string, bases: string[]) {
  const candidate = password.toLowerCase().replace(/^[!@#$%^&*._-]{1,4}|[!@#$%^&*._-]{1,4}$/g, '').replace(/[\s._-]/g, '');
  const substitutions: Record<string, string> = { '@': 'a', '4': 'a', '0': 'o', '$': 's', '5': 's', '!': 'i', '1': 'i', '3': 'e', '7': 't' };
  const unmangle = (value: string) => value.replace(/[@40$5!137]/g, character => substitutions[character]);
  const predictable = (value: string) => {
    const plain = value.replace(/^[!@#$%^&*._-]{1,4}|[!@#$%^&*._-]{1,4}$/g, '');
    return /^(?:\d{0,4}|123456(?:7890?)?|0123456789|9876543210?|0987654321|123123)$/.test(plain) || /^(\d)\1+$/.test(plain);
  };
  return bases.some(value => {
    const base = value.toLowerCase().replace(/[\s._-]/g, '');
    return base.length >= 3 && ((unmangle(candidate.slice(0, base.length)) === unmangle(base) && predictable(candidate.slice(base.length))) || (unmangle(candidate.slice(-base.length)) === unmangle(base) && predictable(candidate.slice(0, -base.length))));
  });
}
export function assessPassword(password: unknown, context: PasswordContext = {}) {
  let score = 0, problem: string | null = null;
  if (typeof password !== 'string' || password.length < 12) problem = 'Use at least 12 characters. Try several unrelated words or Generate.';
  else if (password.length > 128) problem = 'Use no more than 128 characters.';
  else if (predictableComposition(password.normalize('NFKC'), personalWords(context))) problem = 'Avoid basing the password on the User ID, name, email or Dcorhome. Add unrelated words or use Generate.';
  else if (predictableComposition(password.normalize('NFKC'), ['password', 'qwerty', 'letmein', 'welcome', 'changeme', 'admin', 'administrator', 'iloveyou', 'correct horse battery staple', 'this is a very long password', 'this is my password'])) problem = 'Avoid a common password or well-known phrase with added numbers or symbols. Try unrelated words or Generate.';
  else {
    // Better Auth hashes NFKC-normalized passwords. Score that same representation.
    const result = estimator.check(password.normalize('NFKC'), personalWords(context));
    score = result.score;
    if (score < 3) {
      if (result.sequence.some(match => match.pattern === 'dictionary' && match.dictionaryName === 'userInputs')) problem = 'Avoid basing the password on the User ID, name, email or Dcorhome. Add unrelated words or use Generate.';
      else if (result.sequence.some(match => match.pattern === 'repeat')) problem = 'Avoid repeated words or character groups. Try several unrelated words.';
      else if (result.sequence.some(match => match.pattern === 'sequence' || match.pattern === 'wordSequence')) problem = 'Avoid predictable letter, number or word sequences. Try unrelated words or Generate.';
      else if (result.sequence.some(match => match.pattern === 'spatial')) problem = 'Avoid keyboard patterns. Try several unrelated words or Generate.';
      else if (result.sequence.some(match => match.pattern === 'date' || match.pattern === 'regex')) problem = 'Avoid relying on dates or years. Add several unrelated words.';
      else problem = 'Common passwords, names and familiar phrases are easy to guess. Try several unrelated words or Generate.';
    }
  }
  const level = levels[score <= 1 ? 0 : score - 1];
  return { ...level, score, valid: problem === null, problem,
    fill: typeof password === 'string' && password.length ? level.fill : 0,
    message: problem || (score === 4 ? 'Strong estimate. Keep this password unique to this account.' : 'Good estimate. More unrelated words can make it stronger.') };
}
export function passwordProblem(password: unknown, context: PasswordContext = {}) { return assessPassword(password, context).problem; }

export function generatePassword(context: PasswordContext = {}) {
  for (let attempt = 0; attempt < 8; attempt++) {
    // 192 random bits, unbiased hex encoding; Web Crypto also works on Node 22.
    const value = Array.from(crypto.getRandomValues(new Uint8Array(24)), byte => byte.toString(16).padStart(2, '0')).join('');
    const result = assessPassword(value, context);
    if (result.valid && result.score === 4) return value;
  }
  throw Error('Unable to generate a strong password. Please try Generate again.');
}
