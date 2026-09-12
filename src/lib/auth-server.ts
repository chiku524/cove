import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { getDb } from "@/db";
import { account, session, user, verification } from "@/db/schema";

function appUrl() {
  return (
    process.env.BETTER_AUTH_URL ||
    process.env.COVE_PUBLIC_URL ||
    "http://127.0.0.1:43127"
  );
}

function createAuth() {
  return betterAuth({
    secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET,
    baseURL: appUrl(),
    trustedOrigins: [
      "http://127.0.0.1:43127",
      "http://localhost:43127",
      "https://cove-rho-lac.vercel.app",
      "https://cove-nico-builds.vercel.app",
      ...(process.env.COVE_PUBLIC_URL
        ? [process.env.COVE_PUBLIC_URL.replace(/\/$/, "")]
        : []),
      ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ],
    database: drizzleAdapter(getDb(), {
      provider: "pg",
      schema: { user, session, account, verification },
    }),
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
    user: {
      additionalFields: {
        plan: { type: "string", defaultValue: "free", input: false },
        stripeCustomerId: { type: "string", required: false, input: false },
        stripeSubscriptionId: { type: "string", required: false, input: false },
        stripeSubscriptionStatus: {
          type: "string",
          required: false,
          input: false,
        },
      },
    },
    plugins: [nextCookies()],
  });
}

let _auth: ReturnType<typeof createAuth> | null = null;

export function getAuth() {
  if (!_auth) _auth = createAuth();
  return _auth;
}
