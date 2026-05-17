// middleware.ts
// Route protection middleware — runs on every request BEFORE the page loads.
//
// Rules:
//   - Unauthenticated users hitting /dashboard routes → redirect to /login
//   - Authenticated users hitting /login or /signup → redirect to /dashboard
//   - Public routes (/shared/...) → always accessible, no auth needed
//   - API routes for auth (/api/auth/...) → always accessible

import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─────────────────────────────────────────────
// Routes that never require authentication
// ─────────────────────────────────────────────
const PUBLIC_ROUTES = [
  "/login",
  "/signup",
];

const PUBLIC_PREFIXES = [
  "/shared/",       // public note share pages
  "/api/auth/",     // NextAuth internal API
  "/api/shared/",   // public share API endpoint
];

// ─────────────────────────────────────────────
// Middleware logic
// ─────────────────────────────────────────────
export default withAuth(
  function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    const token = req.cookies.get("next-auth.session-token")?.value
      ?? req.cookies.get("__Secure-next-auth.session-token")?.value;

    const isAuthenticated = !!token;

    // If logged-in user visits /login or /signup → send to dashboard
    if (isAuthenticated && (pathname === "/login" || pathname === "/signup")) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // All other cases handled by withAuth config below
    return NextResponse.next();
  },
  {
    callbacks: {
      // Return true = allow request, false = redirect to signIn page
      authorized({ token, req }) {
        const { pathname } = req.nextUrl;

        // Always allow public exact routes
        if (PUBLIC_ROUTES.includes(pathname)) return true;

        // Always allow public prefixes
        if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
          return true;
        }

        // Everything else requires a valid JWT token
        return !!token;
      },
    },
    pages: {
      signIn: "/login", // redirect here if unauthorized
    },
  }
);

// ─────────────────────────────────────────────
// Matcher: which routes this middleware runs on
// Excludes static files and Next.js internals
// ─────────────────────────────────────────────
export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     *   - _next/static  (Next.js static files)
     *   - _next/image   (Next.js image optimization)
     *   - favicon.ico
     *   - public folder files (png, jpg, svg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};