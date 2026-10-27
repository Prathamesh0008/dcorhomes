import { ClerkProvider } from '@clerk/nextjs';
import { authProvider, clerkConfigured } from '@/lib/auth-provider';
export default function ClerkScope({ children }: { children: React.ReactNode }) {
  if (authProvider() !== 'clerk' || !clerkConfigured()) return children;
  return <ClerkProvider signInUrl="/login" signInFallbackRedirectUrl="/account" afterSignOutUrl="/login" localization={{ formFieldLabel__username: 'User ID' }} appearance={{ variables: { colorPrimary: '#254637', colorBackground: '#f8f6ef', colorForeground: '#233a2e', colorDanger: '#a33131', fontFamily: 'inherit', borderRadius: '4px' } }}>{children}</ClerkProvider>;
}
