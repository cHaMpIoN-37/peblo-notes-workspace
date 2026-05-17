// app/providers.tsx
// Client-side providers wrapper.
// SessionProvider must be a Client Component — it uses React context.
// We isolate it here so layout.tsx can stay a Server Component.

"use client";

import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  );
}