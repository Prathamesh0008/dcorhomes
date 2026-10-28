export function normalizeUserId(value: string) { return value.trim().toLowerCase(); }
export function validUserId(value: string) { return /^[a-zA-Z0-9][a-zA-Z0-9_.-]{2,29}$/.test(value); }
export { passwordProblem } from '../password-policy';
export function activeSession(user: Record<string, unknown> | null, version: unknown) {
  return Boolean(user && user.status === 'active' && Number.isInteger(version) && user.sessionVersion === version);
}
