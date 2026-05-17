// app/(dashboard)/_components/SignOutButton.tsx
"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="signout-btn"
      aria-label="Sign out"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M10 11l3-3-3-3M13 8H6"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>Sign out</span>
      <style jsx>{`
        .signout-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 7px 14px;
          background: transparent;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          color: var(--text-muted);
          font-size: 13px;
          font-family: var(--font-body);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .signout-btn:hover {
          background: var(--error-subtle);
          border-color: rgba(224, 92, 92, 0.3);
          color: var(--error);
        }
      `}</style>
    </button>
  );
}