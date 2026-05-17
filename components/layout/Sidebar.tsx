"use client";

// components/layout/Sidebar.tsx
// Left sidebar navigation for the dashboard.
// Shows main navigation links (Notes, Insights) with active state.
//
// Features:
//   - Active route highlighting
//   - Responsive collapse on mobile
//   - Dark mode support
//   - Icons for each navigation item
//   - User-friendly labels

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { FileText, BarChart3, Menu, X } from "lucide-react";

export function Sidebar() {
  // ─────────────────────────────────────────────
  // State Management
  // ─────────────────────────────────────────────
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // ─────────────────────────────────────────────
  // Navigation Items
  // ─────────────────────────────────────────────
  const navItems = [
    {
      label: "Notes",
      href: "/dashboard",
      icon: FileText,
      isActive: pathname === "/dashboard",
    },
    {
      label: "Insights",
      href: "/dashboard/insights",
      icon: BarChart3,
      isActive: pathname === "/dashboard/insights",
    },
  ];

  // ─────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────

  // Check if mobile on mount and handle resize
  useEffect(() => {
    const handleResize = () => {
      const isMobileScreen = window.innerWidth < 768;
      setIsMobile(isMobileScreen);
      // Auto-collapse on mobile
      if (isMobileScreen) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };

    // Check initial size
    handleResize();

    // Listen for resize
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close sidebar when navigating on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [pathname, isMobile]);

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden fixed top-20 left-4 z-40">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? (
            <X className="w-5 h-5 text-slate-900 dark:text-white" />
          ) : (
            <Menu className="w-5 h-5 text-slate-900 dark:text-white" />
          )}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative top-16 left-0 h-[calc(100vh-64px)] w-64 
          bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700
          transition-transform duration-300 ease-in-out z-30
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Sidebar Content */}
        <nav className="h-full overflow-y-auto py-6 px-4 space-y-2">
          {/* Main Navigation Section */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
              Navigation
            </h3>
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`
                        flex items-center gap-3 px-3 py-2.5 rounded-lg 
                        transition-all duration-200
                        ${
                          item.isActive
                            ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                            : "text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800"
                        }
                      `}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span>{item.label}</span>
                      {item.isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Divider */}
          <div className="my-6 border-t border-slate-200 dark:border-slate-700" />

          {/* Quick Actions Section */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
              Actions
            </h3>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/dashboard/notes/new"
                  className="
                    flex items-center gap-3 px-3 py-2.5 rounded-lg 
                    text-slate-700 dark:text-slate-300
                    bg-gradient-to-r from-blue-500 to-blue-600
                    text-white font-medium
                    hover:shadow-lg hover:scale-105
                    transition-all duration-200
                  "
                >
                  <span className="text-lg">+</span>
                  <span>New Note</span>
                </Link>
              </li>
            </ul>
          </div>
        </nav>

        {/* Footer Info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur-sm">
          <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <p className="font-medium">Peblo Notes</p>
            <p>v1.0.0</p>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && isMobile && (
        <div
          className="fixed inset-0 top-16 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Scoped Styles */}
      <style jsx>{`
        aside {
          box-shadow: 
            rgba(0, 0, 0, 0.1) 0px 1px 3px 0px,
            rgba(0, 0, 0, 0.06) 0px 1px 2px 0px;
        }

        /* Smooth scrollbar for sidebar */
        aside::-webkit-scrollbar {
          width: 6px;
        }

        aside::-webkit-scrollbar-track {
          background: transparent;
        }

        aside::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.5);
          border-radius: 3px;
        }

        aside::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.8);
        }
      `}</style>
    </>
  );
}
