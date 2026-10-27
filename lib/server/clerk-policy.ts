// Pure policy; only pass metadata obtained from Clerk's authenticated Backend API.
export function clerkAccountRole(user: { banned?: boolean; locked?: boolean; username: string | null; publicMetadata: Record<string, unknown> }): 'admin' | 'user' | null {
  if (user.banned || user.locked || !user.username || user.publicMetadata.dcorhomeAccess !== 'approved') return null;
  if (user.publicMetadata.role === 'ADMIN') return 'admin';
  if (user.publicMetadata.role === 'USER') return 'user';
  return null;
}
