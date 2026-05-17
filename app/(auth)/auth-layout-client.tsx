"use client";

// app/(auth)/auth-layout-client.tsx
// Client component that handles all the UI and styled-jsx for the auth layout.
// Separated from the layout.tsx so that metadata can remain a server export.

export function AuthLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-shell">
      {/* ── Left: Brand Panel ─────────────────── */}
      <div className="auth-brand">
        {/* Decorative background grid */}
        <div className="brand-grid" aria-hidden="true" />

        {/* Floating accent orb */}
        <div className="brand-orb" aria-hidden="true" />

        {/* Brand content */}
        <div className="brand-content">
          {/* Logo */}
          <div className="brand-logo">
            <svg
              width="40"
              height="40"
              viewBox="0 0 40 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="40" height="40" rx="10" fill="var(--accent)" />
              <path
                d="M12 14h16M12 20h10M12 26h13"
                stroke="var(--text-inverse)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="brand-name">Peblo</span>
          </div>

          {/* Tagline */}
          <div className="brand-tagline">
            <h1>Your notes,<br /><em>supercharged.</em></h1>
            <p>
              Write freely. Let AI summarize, extract action
              items, and suggest titles — automatically.
            </p>
          </div>

          {/* Feature list */}
          <ul className="brand-features">
            {[
              "AI-powered summaries & insights",
              "Auto-save as you type",
              "Share notes with a public link",
              "Productivity dashboard",
            ].map((feature) => (
              <li key={feature}>
                <span className="feature-dot" aria-hidden="true" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Right: Form Slot ──────────────────── */}
      <div className="auth-form-panel">
        <div className="auth-form-wrapper">
          {children}
        </div>
      </div>

      {/* ── Scoped Styles ─────────────────────── */}
      <style jsx>{`
        /* Shell */
        .auth-shell {
          display: flex;
          min-height: 100vh;
          background: var(--bg-base);
        }

        /* ── Brand Panel ── */
        .auth-brand {
          position: relative;
          width: 480px;
          flex-shrink: 0;
          background: var(--bg-surface);
          border-right: 1px solid var(--border-subtle);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
        }

        /* Hide brand panel on narrow screens */
        @media (max-width: 900px) {
          .auth-brand { display: none; }
        }

        /* Decorative dot grid */
        .brand-grid {
          position: absolute;
          inset: 0;
          background-image: radial-gradient(
            circle,
            var(--border-subtle) 1px,
            transparent 1px
          );
          background-size: 28px 28px;
          opacity: 0.6;
        }

        /* Glowing amber orb */
        .brand-orb {
          position: absolute;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          background: radial-gradient(
            circle,
            rgba(240, 165, 0, 0.12) 0%,
            transparent 70%
          );
          bottom: -80px;
          right: -80px;
          pointer-events: none;
        }

        /* Brand content sits above decorative layers */
        .brand-content {
          position: relative;
          z-index: 1;
          display: flex;
          flex-direction: column;
          gap: 40px;
        }

        /* Logo row */
        .brand-logo {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .brand-name {
          font-family: var(--font-display);
          font-size: 26px;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }

        /* Tagline */
        .brand-tagline h1 {
          font-family: var(--font-display);
          font-size: 36px;
          color: var(--text-primary);
          margin: 0 0 16px 0;
          line-height: 1.15;
        }
        .brand-tagline h1 em {
          color: var(--accent);
          font-style: italic;
        }
        .brand-tagline p {
          font-size: 15px;
          color: var(--text-secondary);
          line-height: 1.7;
          margin: 0;
        }

        /* Feature list */
        .brand-features {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .brand-features li {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          color: var(--text-secondary);
        }
        .feature-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent);
          flex-shrink: 0;
        }

        /* ── Form Panel ── */
        .auth-form-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 24px;
          overflow-y: auto;
        }

        .auth-form-wrapper {
          width: 100%;
          max-width: 420px;
        }
      `}</style>
    </div>
  );
}
