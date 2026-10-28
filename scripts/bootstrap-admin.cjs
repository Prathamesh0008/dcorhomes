require('@next/env').loadEnvConfig(process.cwd());
require('./auth-loader.cjs');
const { hiddenPassword } = require('./member-prompt.cjs');
(async () => {
  const { customerAuthReady } = require('../lib/server/customer-auth.ts');
  const { mongoDatabase, mongoClient } = require('../lib/server/mongodb.ts');
  const { provisionMember } = require('../lib/server/members.ts');
  const { passwordProblem } = require('../lib/server/member-policy.ts');
  if (!customerAuthReady()) throw Error('Configure MONGODB_URI, MONGODB_DB (or URI database), SITE_URL and BETTER_AUTH_SECRET before bootstrap.');
  const [userId, fullName, email] = process.argv.slice(2);
  if (!userId || !fullName || !email) throw Error('Usage: npm.cmd run auth:bootstrap -- owner.id "Owner Full Name" real-contact-email');
  const db = await mongoDatabase();
  if (await db.collection('users').findOne({ role: 'admin' })) throw Error('An administrator already exists. Bootstrap refused.');
  let password;
  while (true) {
    password = await hiddenPassword('Choose administrator password (not displayed): ');
    const problem = passwordProblem(password, { userId, name: fullName, email });
    if (problem) { console.error(problem); continue; }
    if (password !== await hiddenPassword('Confirm password (not displayed): ')) { console.error('Passwords do not match. Please try again.'); continue; }
    break;
  }
  await provisionMember(null, { userId, fullName, email, role: 'admin' }, password);
  console.log('Administrator created. Sign in at /login using the chosen User ID and password.');
  await (await mongoClient()).close();
})().then(() => process.exit(0)).catch(error => {
  // Never print MongoDB driver errors, connection URIs or credentials.
  const safe = error?.name === 'MongoServerError' || /Mongo|ECONN|ENOTFOUND|querySrv|SSL|TLS/.test(error?.message || '')
    ? 'MongoDB bootstrap failed. Check configuration, database permissions, network access and replica-set transaction support.'
    : ['HttpError', 'Error'].includes(error?.constructor?.name) ? error.message : 'Administrator bootstrap failed.';
  console.error(safe); process.exit(1);
});
