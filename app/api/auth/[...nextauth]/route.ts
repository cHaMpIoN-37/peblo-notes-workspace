// app/api/auth/[...nextauth]/route.ts
// This is the NextAuth.js catch-all API route.
// It handles ALL auth endpoints automatically:
//   POST /api/auth/signin
//   POST /api/auth/signout
//   GET  /api/auth/session
//   GET  /api/auth/csrf
//   GET  /api/auth/providers
//
// We also add a custom POST /api/auth/signup handler here
// so signup lives under the same auth namespace.

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { hashPassword, validatePassword } from "@/lib/auth";

// ─────────────────────────────────────────────
// NextAuth handler
// ─────────────────────────────────────────────
const handler = NextAuth(authOptions);

// GET handles session checks, CSRF, providers
export { handler as GET };

// ─────────────────────────────────────────────
// Custom POST — handles both NextAuth + Signup
// ─────────────────────────────────────────────
export async function POST(req: NextRequest, context: { params: { nextauth: string[] } }) {
  const { nextauth } = context.params;

  // If the route is /api/auth/signup → handle registration
  if (nextauth?.[0] === "signup") {
    return handleSignup(req);
  }

  // Everything else → delegate to NextAuth
  return handler(req, context);
}

// ─────────────────────────────────────────────
// Signup handler
// POST /api/auth/signup
// Body: { name, email, password }
// ─────────────────────────────────────────────
async function handleSignup(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    // 1. Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    // 2. Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    // 3. Validate password strength
    const passwordError = validatePassword(password);
    if (passwordError) {
      return NextResponse.json(
        { error: passwordError },
        { status: 400 }
      );
    }

    // 4. Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    // 5. Hash password and create user
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        name: name?.trim() || null,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // 6. Return created user (never return password)
    return NextResponse.json(
      {
        message: "Account created successfully.",
        user,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("[SIGNUP ERROR]", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}