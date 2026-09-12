import { randomBytes } from "crypto";

export function createId(prefix: string) {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}

export function createApiKey() {
  return `cove_live_${randomBytes(18).toString("base64url")}`;
}

export function slugify(value: string) {
  return (
    value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "bot"
  );
}
