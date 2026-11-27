"use client";
import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient({
  baseURL: typeof window === "undefined" ? undefined : window.location.origin,
  basePath: "/api/auth",
  fetchOptions: { credentials: "same-origin", mode: "same-origin", redirect: "error" },
});
