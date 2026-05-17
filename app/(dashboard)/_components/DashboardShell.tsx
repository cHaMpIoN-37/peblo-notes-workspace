// app/(dashboard)/_components/DashboardShell.tsx
"use client";

import SignOutButton from "./SignOutButton";
import SidebarNav from "./SidebarNav";

interface DashboardShellProps {
  children: React.ReactNode;
  userName: string | null;
  userEmail: string | null;
}

export default function DashboardShell({
  children,
  userName,
  userEmail,
}: DashboardShellProps) {
  return (
    <div className="dashboard-shell">
      {/* ── Navbar ── */}
      <header className="dashboard-navbar">
        <div className="navbar-left">
          <div className="navbar-logo">
            <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
              <rect width="40" height="40" rx="10" fill="var(--accent)" />
              <path
                d="M12 14h16M12 20h10M12 26h13"
                stroke="#0f0e0d"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="navbar-brand">Peblo</span>
          </div>
        </div>

        <div className="navbar-right">
          <div className="navbar-user">
            <div className="user-avatar">
              {userName?.[0]?.toUpperCase() ||
                userEmail?.[0]?.toUpperCase() ||
                "U"}
            </div>
            <div className="user-info">
              <span className="user-name">{userName || "My Workspace"}</span>
              <span className="user-email">{userEmail}</span>
            </div>
          </div>
          <SignOutButton />
        </div>
      </header>

      {/* ── Body ── */}
      <div className="dashboard-body">
        <aside className="dashboard-sidebar">
          <SidebarNav />
        </aside>
        <main className="dashboard-main">
          <div className="dashboard-content page-enter">
            {children}
          </div>
        </main>
      </div>

      <style jsx>{`
        .dashboard-shell {
          display: flex;
          flex-direction: column;
          height: 100vh;
          overflow: hidden;
          background: var(--bg-base);
        }
        .dashboard-navbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          height: 56px;
          flex-shrink: 0;
          background: var(--bg-surface);
          border-bottom: 1px solid var(--border-subtle);
          z-index: 50;
        }
        .navbar-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .navbar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .navbar-brand {
          font-family: var(--font-display);
          font-size: 20px;
          color: var(--text-primary);
          letter-spacing: -0.02em;
        }
        .navbar-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .navbar-user {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--accent-subtle);
          border: 1px solid rgba(240, 165, 0, 0.3);
          color: var(--accent);
          font-size: 13px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .user-info {
          display: flex;
          flex-direction: column;
          gap: 1px;
        }
        .user-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
          line-height: 1;
        }
        .user-email {
          font-size: 11px;
          color: var(--text-muted);
          line-height: 1;
        }
        @media (max-width: 640px) {
          .user-info { display: none; }
        }
        .dashboard-body {
          display: flex;
          flex: 1;
          overflow: hidden;
        }
        .dashboard-sidebar {
          width: 220px;
          flex-shrink: 0;
          background: var(--bg-surface);
          border-right: 1px solid var(--border-subtle);
          overflow-y: auto;
          padding: 16px 12px;
        }
        @media (max-width: 768px) {
          .dashboard-sidebar { display: none; }
        }
        .dashboard-main {
          flex: 1;
          overflow-y: auto;
          background: var(--bg-base);
        }
        .dashboard-content {
          height: 100%;
        }
      `}</style>
    </div>
  );
}