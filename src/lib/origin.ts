import { headers } from "next/headers";

export async function getPublicOrigin() {
  if (process.env.COVE_PUBLIC_URL) {
    return process.env.COVE_PUBLIC_URL.replace(/\/$/, "");
  }
  const headerStore = await headers();
  const host =
    headerStore.get("x-forwarded-host") ||
    headerStore.get("host") ||
    "127.0.0.1:43127";
  const proto =
    headerStore.get("x-forwarded-proto") ||
    (host.includes("localhost") || host.startsWith("127.") ? "http" : "https");
  return `${proto}://${host}`;
}
