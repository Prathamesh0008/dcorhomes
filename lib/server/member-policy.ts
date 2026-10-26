export function normalizeUserId(value: string) { return value.trim().toLowerCase(); }
export function validUserId(value: string) { return /^[a-zA-Z0-9][a-zA-Z0-9_.-]{2,29}$/.test(value); }
export function passwordProblem(password: unknown): string | null {
  if (typeof password !== 'string' || password.length < 12 || password.length > 128) return 'Use a password between 12 and 128 characters.';
  const common = ['password', 'qwerty', 'letmein', 'welcome', '123456', 'dcorhome', 'changeme'];
  if (common.some(word => password.toLowerCase().includes(word)) || /^(.)\1+$/.test(password)) return 'Choose a less predictable password or a longer passphrase.';
  return null;
}
export function activeSession(user: Record<string, unknown> | null, version: unknown) {
  return Boolean(user && user.status === 'active' && Number.isInteger(version) && user.sessionVersion === version);
}
