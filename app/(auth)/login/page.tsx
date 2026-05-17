// app/(auth)/login/page.tsx
// Login page — email + password authentication via NextAuth.
//
// Flow:
//   1. User fills form
//   2. We call signIn("credentials", ...) from NextAuth
//   3. On success → redirect to dashboard
//   4. On failure → show inline error message

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

// ─────────────────────────────────────────────
// Login Page
// ─────────────────────────────────────────────
export default function LoginPage() {
  const router = useRouter();

  // Form state
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState("");
  const [showPass,  setShowPass]  = useState(false);

  // ─────────────────────────────────────────────
  // Submit handler
  // ─────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Basic client-side validation
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
        callbackUrl: "/notes",
      });

      if (result?.error) {
        setError("Invalid email or password.");
        return;
      }

      if (result?.ok) {
        window.location.href = "/notes";  // force hard navigation, not router.replace
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div className="login-page page-enter">

      {/* Header */}
      <div className="login-header">
        <div className="login-icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <path
              d="M14 3C8.48 3 4 7.48 4 13s4.48 10 10 10 10-4.48 10-10S19.52 3 14 3z"
              fill="var(--accent-subtle)"
              stroke="var(--accent)"
              strokeWidth="1.5"
            />
            <path
              d="M14 9v5l3 3"
              stroke="var(--accent)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h2>Welcome back</h2>
        <p>Sign in to your Peblo workspace</p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="error-banner" role="alert">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="var(--error)" strokeWidth="1.5"/>
            <path d="M8 5v3M8 10.5v.5" stroke="var(--error)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="login-form" noValidate>

        {/* Email */}
        <div className="field">
          <label htmlFor="email">Email address</label>
          <input
            id="email"
            type="email"
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
            disabled={isLoading}
            required
          />
        </div>

        {/* Password */}
        <div className="field">
          <div className="field-row">
            <label htmlFor="password">Password</label>
            <Link href="#" className="forgot-link" tabIndex={-1}>
              Forgot password?
            </Link>
          </div>
          <div className="input-wrapper">
            <input
              id="password"
              type={showPass ? "text" : "password"}
              className="input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              disabled={isLoading}
              required
            />
            {/* Show/hide toggle */}
            <button
              type="button"
              className="pass-toggle"
              onClick={() => setShowPass(!showPass)}
              aria-label={showPass ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPass ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z"
                    stroke="var(--text-muted)" strokeWidth="1.5"/>
                  <circle cx="8" cy="8" r="2"
                    stroke="var(--text-muted)" strokeWidth="1.5"/>
                  <path d="M3 3l10 10" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z"
                    stroke="var(--text-muted)" strokeWidth="1.5"/>
                  <circle cx="8" cy="8" r="2"
                    stroke="var(--text-muted)" strokeWidth="1.5"/>
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="btn-primary submit-btn"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      {/* Footer */}
      <p className="login-footer">
        Don&apos;t have an account?{" "}
        <Link href="/signup">Create one free</Link>
      </p>

      {/* Scoped styles */}
      <style jsx>{`
        .login-page {
          display: flex;
          flex-direction: column;
          gap: 28px;
        }

        /* Header */
        .login-header {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .login-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          background: var(--accent-muted);
          border: 1px solid rgba(240,165,0,0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
        }
        .login-header h2 {
          font-family: var(--font-display);
          font-size: 28px;
          color: var(--text-primary);
          margin: 0;
        }
        .login-header p {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0;
        }

        /* Error banner */
        .error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 14px;
          background: var(--error-subtle);
          border: 1px solid rgba(224,92,92,0.25);
          border-radius: var(--radius-md);
          color: var(--error);
          font-size: 13px;
        }

        /* Form */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        /* Field */
        .field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .field label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .field-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .forgot-link {
          font-size: 12px;
          color: var(--text-muted);
          transition: color var(--transition-fast);
        }
        .forgot-link:hover {
          color: var(--accent);
        }

        /* Password input wrapper */
        .input-wrapper {
          position: relative;
        }
        .input-wrapper .input {
          padding-right: 42px;
        }
        .pass-toggle {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 4px;
          transition: background var(--transition-fast);
        }
        .pass-toggle:hover {
          background: var(--bg-hover);
        }

        /* Submit button */
        .submit-btn {
          width: 100%;
          justify-content: center;
          padding: 12px;
          font-size: 15px;
          margin-top: 4px;
        }

        /* Spinner */
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(15,14,13,0.3);
          border-top-color: var(--text-inverse);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        /* Footer */
        .login-footer {
          text-align: center;
          font-size: 13px;
          color: var(--text-muted);
          margin: 0;
        }
      `}</style>
    </div>
  );
}