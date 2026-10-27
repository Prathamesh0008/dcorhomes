import 'server-only';
import { cache } from 'react';
import { headers } from 'next/headers';
import { validatedCustomerSession } from './customer-auth';
import { logDatabaseFailure } from './database-diagnostics';
import { HttpError } from './http';

export const accountAuthState = cache(async (allowPasswordChange = false) => {
  try {
    const account = await validatedCustomerSession(await headers(), allowPasswordChange);
    return account ? { status: 'authenticated' as const, account } : { status: 'signed_out' as const, account: null };
  } catch (error) {
    logDatabaseFailure('account_session', error);
    return { status: 'unavailable' as const, account: null };
  }
});
export async function accountSession(allowPasswordChange = false) {
  const state = await accountAuthState(allowPasswordChange);
  if (state.status === 'unavailable') throw new HttpError(503, 'Account access is temporarily unavailable. Please try again later.');
  return state.account;
}
export async function requireAccountAdmin() {
  const account = await accountSession();
  if (!account) throw new HttpError(401, 'Administrator sign-in required.');
  if (account.user.role !== 'admin') throw new HttpError(403, 'Administrator access required.');
  return account;
}
