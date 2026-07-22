import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = ["/map", "/mule-trace", "/reports", "/cases", "/analytics"];

export function proxy(request: NextRequest) {
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