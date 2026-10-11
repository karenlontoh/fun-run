import { NextResponse } from "next/server";
import { VERIFY_AUTH_COOKIE, hashVerifyCookie, isVolunteerAllowedPath, type VerifyRole } from "@/lib/verify-auth";

const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours — long enough to cover one race day

function safeNextPath(next: FormDataEntryValue | null): string {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/verify") ? value : "/verify";
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const code = String(formData.get("code") ?? "");
  const next = safeNextPath(formData.get("next"));

  let role: VerifyRole | null = null;
  if (process.env.VERIFY_ACCESS_CODE && code === process.env.VERIFY_ACCESS_CODE) {
    role = "admin";
  } else if (process.env.VERIFY_VOLUNTEER_ACCESS_CODE && code === process.env.VERIFY_VOLUNTEER_ACCESS_CODE) {
    role = "volunteer";
  }

  if (!role) {
    const loginUrl = new URL("/verify-login", request.url);
    loginUrl.searchParams.set("next", next);
    loginUrl.searchParams.set("error", "1");
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  // The volunteer code only opens a scanned participant's page — if it was
  // entered while trying to reach anything else under /verify, there's
  // nowhere valid for it to go.
  const redirectUrl =
    role === "volunteer" && !isVolunteerAllowedPath(next)
      ? new URL("/verify-login?error=restricted", request.url)
      : new URL(next, request.url);

  const response = NextResponse.redirect(redirectUrl, { status: 303 });
  response.cookies.set(VERIFY_AUTH_COOKIE, await hashVerifyCookie(role, code), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
  return response;
}
