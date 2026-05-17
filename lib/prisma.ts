// This file stores one instance on the global object so HMR reuses it.

import { PrismaClient } from "@prisma/client";

// ─────────────────────────────────────────────
// Type declaration for the global prisma instance
// ─────────────────────────────────────────────
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

// ─────────────────────────────────────────────
// Singleton logic
// ─────────────────────────────────────────────
const prisma: PrismaClient =
  globalThis.__prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]  // logs every SQL query in dev
        : ["warn", "error"],          // silent in production
  });

// In development, persist the instance across HMR reloads
if (process.env.NODE_ENV !== "production") {
  globalThis.__prisma = prisma;
}

export default prisma;