import { NextResponse, type NextRequest } from "next/server";
import { VERIFY_AUTH_COOKIE, isValidVerifyAuthCookie } from "@/lib/verify-auth";

export async function middleware(request: NextRequest) {
  const cookie = request.cookies.get(VERIFY_AUTH_COOKIE)?.value;
  if (await isValidVerifyAuthCookie(cookie)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/verify-login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/verify/:path*"],
};
