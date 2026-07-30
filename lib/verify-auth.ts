export const VERIFY_AUTH_COOKIE = "verify_auth";

// Edge middleware and Node API routes both have the Web Crypto API globally,
// so this works identically in either runtime without extra polyfills.
export async function hashAccessCode(code: string): Promise<string> {
  const data = new TextEncoder().encode(code);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function isValidVerifyAuthCookie(cookieValue: string | undefined): Promise<boolean> {
  const accessCode = process.env.VERIFY_ACCESS_CODE;
  if (!accessCode || !cookieValue) return false;
  const expected = await hashAccessCode(accessCode);
  return cookieValue === expected;
}
