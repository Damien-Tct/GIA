import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth/jwt";

const publicPaths = [
  "/login",
  "/setup",
  "/api/auth",
  "/_next/static",
  "/_next/image",
  "/favicon.ico",
];

export async function proxy(request: NextRequest) {
  const { pathname, origin } = request.nextUrl;

  // Routes publiques
  if (publicPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth-token")?.value;

  if (!token) {
    const url = new URL("/api/auth/me", request.url);
    url.searchParams.set("redirect", "1");
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
