// app/(auth)/layout.tsx
// Layout wrapper for all authentication pages (/login, /signup).
// Keeps auth pages visually separate from the main dashboard.
//
// Renders a centered, branded split-screen layout:
//   Left  → decorative brand panel (hidden on mobile)
//   Right → auth form slot (children)

import type { Metadata } from "next";
import { AuthLayoutClient } from "./auth-layout-client";

export const metadata: Metadata = {
  title: {
    default: "Welcome to Peblo",
    template: "%s | Peblo",
  },
  description: "Sign in or create your Peblo AI Notes account.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthLayoutClient>{children}</AuthLayoutClient>;
}
