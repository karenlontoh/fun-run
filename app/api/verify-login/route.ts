import { NextResponse } from "next/server";
import { VERIFY_AUTH_COOKIE, hashAccessCode } from "@/lib/verify-auth";

const MAX_AGE_SECONDS = 60 * 60 * 12; // 12 hours — long enough to cover one race day

function safeNextPath(next: FormDataEntryValue | null): string {
  const value = typeof next === "string" ? next : "";
  return value.startsWith("/verify") ? value : "/";
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const code = String(formData.get("code") ?? "");
  const next = safeNextPath(formData.get("next"));

  const accessCode = process.env.VERIFY_ACCESS_CODE;
  if (!accessCode || code !== accessCode) {
    const loginUrl = new URL("/verify-login", request.url);
    loginUrl.searchParams.set("next", next);
    loginUrl.searchParams.set("error", "1");
    return NextResponse.redirect(loginUrl, { status: 303 });
  }

  const response = NextResponse.redirect(new URL(next, request.url), { status: 303 });
  response.cookies.set(VERIFY_AUTH_COOKIE, await hashAccessCode(accessCode), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE_SECONDS,
    path: "/",
  });
  return response;
}
