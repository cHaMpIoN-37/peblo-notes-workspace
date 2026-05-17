// app/(auth)/signup/page.tsx
// Signup page — creates a new account then auto-signs in.
//
// Flow:
//   1. User fills name + email + password + confirm password
//   2. Client-side validation runs first
//   3. POST /api/auth/signup to create account
//   4. On success → auto signIn() → redirect to dashboard
//   5. On failure → show inline error

"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { validatePassword } from "@/lib/auth";

// ─────────────────────────────────────────────
// Signup Page
// ─────────────────────────────────────────────
export default function SignupPage() {
  const router = useRouter();

  // Form state
  const [name,     setName]     = useState("");
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [confirm,  setConfirm]  = useState("");

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState("");
  const [showPass,  setShowPass]  = useState(false);

  // Password strength indicator (0-4)
  const passwordStrength = getPasswordStrength(password);

  // ─────────────────────────────────────────────
  // Submit handler
  // ─────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // 1. Client-side validation
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    // Reuse the same password validator from lib/auth.ts
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      // 2. Create account
      const res = await fetch("/api/auth/signup", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:     name.trim() || undefined,
          email:    email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account.");
        return;
      }

      // 3. Auto sign-in after successful signup
      const result = await signIn("credentials", {
        email:    email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (result?.error) {
        // Account created but login failed — send to login page
        router.push("/login?message=account-created");
        return;
      }

      // 4. Success → dashboard
      router.push("/");
      router.refresh();

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
    <div className="signup-page page-enter">

      {/* Header */}
      <div className="signup-header">
        <div className="signup-icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect
              x="4" y="4" width="20" height="20" rx="5"
              fill="var(--accent-subtle)"
              stroke="var(--accent)"
              strokeWidth="1.5"
            />
            <path
              d="M14 10v8M10 14h8"
              stroke="var(--accent)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h2>Create your workspace</h2>
        <p>Start writing smarter with AI-powered notes</p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="error-banner" role="alert">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="var(--error)" strokeWidth="1.5"/>
            <path
              d="M8 5v3M8 10.5v.5"
              stroke="var(--error)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
          {error}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="signup-form" noValidate>

        {/* Name (optional) */}
        <div className="field">
          <label htmlFor="name">
            Name <span className="optional">(optional)</span>
          </label>
          <input
            id="name"
            type="text"
            className="input"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            autoFocus
            disabled={isLoading}
          />
        </div>

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
            disabled={isLoading}
            required
          />
        </div>

        {/* Password */}
        <div className="field">
          <label htmlFor="password">Password</label>
          <div className="input-wrapper">
            <input
              id="password"
              type={showPass ? "text" : "password"}
              className="input"
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              disabled={isLoading}
              required
            />
            <button
              type="button"
              className="pass-toggle"
              onClick={() => setShowPass(!showPass)}
              aria-label={showPass ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPass ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z"
                    stroke="var(--text-muted)" strokeWidth="1.5"
                  />
                  <circle cx="8" cy="8" r="2" stroke="var(--text-muted)" strokeWidth="1.5"/>
                  <path d="M3 3l10 10" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M2 8s2.5-5 6-5 6 5 6 5-2.5 5-6 5-6-5-6-5z"
                    stroke="var(--text-muted)" strokeWidth="1.5"
                  />
                  <circle cx="8" cy="8" r="2" stroke="var(--text-muted)" strokeWidth="1.5"/>
                </svg>
              )}
            </button>
          </div>

          {/* Password strength bar */}
          {password.length > 0 && (
            <div className="strength-bar-wrap" aria-label={`Password strength: ${strengthLabel(passwordStrength)}`}>
              <div className="strength-bars">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="strength-segment"
                    data-active={i < passwordStrength}
                    data-level={passwordStrength}
                  />
                ))}
              </div>
              <span className="strength-label" data-level={passwordStrength}>
                {strengthLabel(passwordStrength)}
              </span>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="field">
          <label htmlFor="confirm">Confirm password</label>
          <input
            id="confirm"
            type={showPass ? "text" : "password"}
            className={`input ${
              confirm.length > 0 && confirm !== password
                ? "input-error"
                : ""
            }`}
            placeholder="Repeat your password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            disabled={isLoading}
            required
          />
          {confirm.length > 0 && confirm !== password && (
            <span className="field-error">Passwords do not match</span>
          )}
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
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </button>

        {/* Terms note */}
        <p className="terms-note">
          By creating an account you agree to our{" "}
          <Link href="#">Terms of Service</Link> and{" "}
          <Link href="#">Privacy Policy</Link>.
        </p>
      </form>

      {/* Footer */}
      <p className="signup-footer">
        Already have an account?{" "}
        <Link href="/login">Sign in</Link>
      </p>

      {/* Scoped styles */}
      <style jsx>{`
        .signup-page {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Header */
        .signup-header {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .signup-icon {
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
        .signup-header h2 {
          font-family: var(--font-display);
          font-size: 26px;
          color: var(--text-primary);
          margin: 0;
        }
        .signup-header p {
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
        .signup-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        /* Field */
        .field {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .field label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .optional {
          font-weight: 400;
          color: var(--text-muted);
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
          border-radius: 4px;
          transition: background var(--transition-fast);
        }
        .pass-toggle:hover {
          background: var(--bg-hover);
        }

        /* Input error state */
        .input-error {
          border-color: var(--error) !important;
        }
        .field-error {
          font-size: 12px;
          color: var(--error);
        }

        /* Strength bar */
        .strength-bar-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 2px;
        }
        .strength-bars {
          display: flex;
          gap: 4px;
          flex: 1;
        }
        .strength-segment {
          height: 3px;
          flex: 1;
          border-radius: 2px;
          background: var(--border-subtle);
          transition: background 0.2s ease;
        }
        .strength-segment[data-active="true"][data-level="1"] { background: var(--error); }
        .strength-segment[data-active="true"][data-level="2"] { background: var(--warning); }
        .strength-segment[data-active="true"][data-level="3"] { background: var(--accent); }
        .strength-segment[data-active="true"][data-level="4"] { background: var(--success); }

        .strength-label {
          font-size: 11px;
          font-weight: 500;
          min-width: 48px;
          text-align: right;
        }
        .strength-label[data-level="1"] { color: var(--error); }
        .strength-label[data-level="2"] { color: var(--warning); }
        .strength-label[data-level="3"] { color: var(--accent); }
        .strength-label[data-level="4"] { color: var(--success); }

        /* Submit */
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

        /* Terms */
        .terms-note {
          font-size: 12px;
          color: var(--text-muted);
          text-align: center;
          margin: 0;
          line-height: 1.6;
        }

        /* Footer */
        .signup-footer {
          text-align: center;
          font-size: 13px;
          color: var(--text-muted);
          margin: 0;
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// Helpers: password strength
// ─────────────────────────────────────────────

/** Returns 0-4 strength score */
function getPasswordStrength(password: string): number {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8)          score++;
  if (/[A-Z]/.test(password))        score++;
  if (/[0-9]/.test(password))        score++;
  if (/[^A-Za-z0-9]/.test(password)) score++; // special char bonus
  return score;
}

/** Returns label for strength score */
function strengthLabel(score: number): string {
  return ["", "Weak", "Fair", "Good", "Strong"][score] ?? "";
}