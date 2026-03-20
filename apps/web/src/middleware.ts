import { NextRequest, NextResponse } from "next/server";

const guestPaths = ["/login", "/register", "/forgot-password", "/reset-password"];

export function middleware(request: NextRequest) {
  const token = request.cookies.get("auth_token")?.value;
  const { pathname } = request.nextUrl;

  // If on guest paths with token, redirect to dashboard
  if (token && guestPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // If on protected paths without token, redirect to login
  if (!token && (pathname.startsWith("/dashboard") || pathname.startsWith("/profile"))) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
  ],
};
