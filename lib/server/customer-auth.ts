import { betterAuth } from "better-auth";
import { DatabaseSync } from "node:sqlite";
import { Pool } from "pg";
import path from "node:path";
import { headers } from "next/headers";
import { dataDirectory } from "./db";
import { emailReady, sendEmail } from "./email";

let instance: ReturnType<typeof createCustomerAuth> | undefined;
export function customerAuthReady() {
  return Boolean(process.env.BETTER_AUTH_SECRET && process.env.BETTER_AUTH_SECRET.length >= 32 && process.env.SITE_URL && (process.env.DCORHOME_DATABASE_URL || (!process.env.VERCEL && process.env.DCORHOME_DATA_DIR)));
}
export function customerAuth() {
  if (!customerAuthReady()) throw Error("Customer accounts are awaiting configuration.");
  return instance ||= createCustomerAuth();
}
function createCustomerAuth() {
  return betterAuth({
    appName: "Dcorhome", baseURL: process.env.SITE_URL, secret: process.env.BETTER_AUTH_SECRET,
    database: process.env.DCORHOME_DATABASE_URL ? new Pool({ connectionString: process.env.DCORHOME_DATABASE_URL, max: 3 }) : new DatabaseSync(path.join(dataDirectory(), "customer-auth.sqlite")),
    emailAndPassword: {
      enabled: true, minPasswordLength: 12, maxPasswordLength: 128,
      requireEmailVerification: emailReady(), revokeSessionsOnPasswordReset: true,
      ...(emailReady() ? { sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => { await sendEmail(user.email, "Reset your Dcorhome password", `Reset your password using this expiring link: ${url}`); } } : {}),
    },
    emailVerification: {
      sendOnSignUp: emailReady(), autoSignInAfterVerification: false,
      sendVerificationEmail: async ({ user, url }) => { await sendEmail(user.email, "Verify your Dcorhome email", `Verify your email: ${url}`); },
    },
    session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
    rateLimit: { enabled: true, storage: "database", window: 60, max: 20, customRules: { "/sign-in/email": { window: 60, max: 5 }, "/sign-up/email": { window: 3600, max: 5 }, "/request-password-reset": { window: 3600, max: 3 } } },
    advanced: {
      useSecureCookies: process.env.NODE_ENV === "production" && process.env.ALLOW_LOCAL_HTTP !== "true",
      // Share the limit unless an operator explicitly trusts the deployment proxy.
      ipAddress: { ipAddressHeaders: process.env.TRUST_PROXY === "true" ? ["x-forwarded-for"] : [] },
    },
  });
}
export async function customerSession() {
  if (!customerAuthReady()) return null;
  try { return await customerAuth().api.getSession({ headers: await headers() }); } catch { return null; }
}
