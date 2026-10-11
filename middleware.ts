import { NextResponse, type NextRequest } from "next/server";
import { VERIFY_AUTH_COOKIE, getVerifyRole, isVolunteerAllowedPath } from "@/lib/verify-auth";

export async function middleware(request: NextRequest) {
  const cookie = request.cookies.get(VERIFY_AUTH_COOKIE)?.value;
  const role = await getVerifyRole(cookie);

  if (role === "admin") {
    return NextResponse.next();
  }
  if (role === "volunteer" && isVolunteerAllowedPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/verify-login", request.url);
  if (role === "volunteer") {
    // Already logged in, but this code can't open anything beyond a
    // scanned participant's page — nothing useful to send them back to.
    loginUrl.searchParams.set("error", "restricted");
  } else {
    loginUrl.searchParams.set("next", request.nextUrl.pathname);
  }
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/verify/:path*"],
};
