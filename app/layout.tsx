// app/layout.tsx
// Root layout — wraps every single page in the app.
// Responsibilities:
//   - Set HTML metadata (title, description, favicon)
//   - Load fonts and global CSS
//   - Provide NextAuth SessionProvider to the entire tree

import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

// ─────────────────────────────────────────────
// App-wide metadata
// ─────────────────────────────────────────────
export const metadata: Metadata = {
  title: {
    default: "Peblo — AI Notes Workspace",
    template: "%s | Peblo",   // e.g. "My Note | Peblo"
  },
  description:
    "A collaborative AI-powered notes workspace. Write, organize, and get AI insights on your notes.",
  keywords: ["notes", "AI", "productivity", "workspace", "Gemini"],
};

// ─────────────────────────────────────────────
// Root Layout
// ─────────────────────────────────────────────
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to Google Fonts for faster load */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        {/* Providers wraps SessionProvider and any future context */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}