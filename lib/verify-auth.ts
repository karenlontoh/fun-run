export const VERIFY_AUTH_COOKIE = "verify_auth";

export type VerifyRole = "admin" | "volunteer";

// Edge middleware and Node API routes both have the Web Crypto API globally,
// so this works identically in either runtime without extra polyfills.
async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Hashing "role:code" together (rather than just the code) binds the cookie
// to the role it was minted for, so it can never be reinterpreted as the
// other role even if the two access codes happened to collide.
export async function hashVerifyCookie(role: VerifyRole, code: string): Promise<string> {
  return sha256Hex(`${role}:${code}`);
}

export async function getVerifyRole(cookieValue: string | undefined): Promise<VerifyRole | null> {
  if (!cookieValue) return null;

  const adminCode = process.env.VERIFY_ACCESS_CODE;
  if (adminCode && cookieValue === (await hashVerifyCookie("admin", adminCode))) {
    return "admin";
  }

  const volunteerCode = process.env.VERIFY_VOLUNTEER_ACCESS_CODE;
  if (volunteerCode && cookieValue === (await hashVerifyCookie("volunteer", volunteerCode))) {
    return "volunteer";
  }

  return null;
}

export async function isValidVerifyAuthCookie(cookieValue: string | undefined): Promise<boolean> {
  return (await getVerifyRole(cookieValue)) !== null;
}

// The volunteer (race-pack collection) code can browse the read-only
// registrations dashboard (to look someone up, view their PDF) and open a
// single participant/registration's page after scanning their QR code —
// but never add/edit anything, nor reach exports or any other committee
// tooling under /verify. Write actions are blocked separately, per API
// route (see getVerifyRole call sites) — this only gates which *pages*
// load.
const RESTRICTED_VERIFY_SEGMENTS = new Set(["race-photos", "fun-walk", "tambah-peserta"]);

export function isVolunteerAllowedPath(pathname: string): boolean {
  if (pathname === "/verify") return true;
  const match = pathname.match(/^\/verify\/([^/]+)$/);
  if (!match) return false;
  return !RESTRICTED_VERIFY_SEGMENTS.has(match[1]);
}
