// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth(
  function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const token = req.cookies.get("next-auth.session-token")?.value
      ?? req.cookies.get("__Secure-next-auth.session-token")?.value;

    const isAuthenticated = !!token;

    if (isAuthenticated && (pathname === "/login" || pathname === "/signup")) {
      return NextResponse.redirect(new URL("/notes", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ token, req }) {
        const { pathname } = req.nextUrl;

        // Always allow auth routes
        if (pathname.startsWith("/api/auth/")) return true;

        // Always allow public pages
        if (pathname === "/login" || pathname === "/signup") return true;

        // Always allow public share pages
        if (pathname.startsWith("/shared/")) return true;

        // Allow ALL /api/ routes to pass through — they handle their own auth
        if (pathname.startsWith("/api/")) return true;

        // Everything else requires login
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};