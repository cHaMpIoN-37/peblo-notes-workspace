// app/(dashboard)/_components/SidebarNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  {
    href: "/",
    label: "All Notes",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M3 3h10M3 6h10M3 9h6"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    href: "/insights",
    label: "Insights",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path
          d="M2 12l3-4 3 2 3-5 3 3"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        />
      </svg>
    ),
  },
];

export default function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="sidebar-nav">
      {/* New Note button */}
      <Link href="/notes/new" className="new-note-btn">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M7 2v10M2 7h10"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          />
        </svg>
        New Note
      </Link>

      {/* Divider */}
      <div className="nav-divider" />

      {/* Nav links */}
      <ul className="nav-list">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`nav-link ${isActive ? "nav-link-active" : ""}`}
              >
                {item.icon}
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <style jsx>{`
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        /* New Note button */
        .new-note-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 14px;
          background: var(--accent);
          color: var(--text-inverse);
          border-radius: var(--radius-md);
          font-size: 13px;
          font-weight: 600;
          font-family: var(--font-body);
          text-decoration: none;
          transition: background var(--transition-fast),
                      transform var(--transition-fast);
          margin-bottom: 4px;
        }
        .new-note-btn:hover {
          background: var(--accent-hover);
          color: var(--text-inverse);
          transform: translateY(-1px);
        }

        /* Divider */
        .nav-divider {
          height: 1px;
          background: var(--border-subtle);
          margin: 8px 0;
        }

        /* Nav list */
        .nav-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        /* Nav link */
        .nav-link {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: var(--radius-md);
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          text-decoration: none;
          transition: all var(--transition-fast);
        }
        .nav-link:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }
        .nav-link-active {
          background: var(--accent-muted);
          color: var(--accent);
          border: 1px solid rgba(240, 165, 0, 0.15);
        }
        .nav-link-active:hover {
          background: var(--accent-muted);
          color: var(--accent);
        }
      `}</style>
    </nav>
  );
}