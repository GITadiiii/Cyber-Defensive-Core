import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// NOTE: this only checks that the "token" cookie is PRESENT, not that it's
// a valid/unexpired JWT. Real verification happens on Payal's gateway when
// the actual API call is made (it will 401 on an invalid/expired token).
// This check exists purely so we don't flash protected page content before
// redirecting an unauthenticated visitor to /login.
const PROTECTED_PATHS = ["/map", "/mule-trace", "/reports", "/cases", "/analytics"];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtected = PROTECTED_PATHS.some((p) => path.startsWith(p));

  if (!isProtected) return NextResponse.next();

  const token = request.cookies.get("token");
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/map/:path*",
    "/mule-trace/:path*",
    "/reports/:path*",
    "/cases/:path*",
    "/analytics/:path*",
  ],
};