// app/(dashboard)/insights/page.tsx
// Productivity Insights Dashboard
// Shows stats computed from the user's notes:
//   - Total notes, words, avg words per note
//   - Notes created this week / this month
//   - Top tags by usage
//   - Activity heatmap (notes per day)
//   - Most recently edited notes

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Note } from "@/types";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
interface InsightsData {
  totalNotes: number;
  totalWords: number;
  avgWordsPerNote: number;
  notesThisWeek: number;
  notesThisMonth: number;
  topTags: { tag: string; count: number }[];
  activityByDay: { date: string; count: number }[];
  mostRecentNotes: Note[];
  longestNote: Note | null;
  aiUsage: {
    withSummary: number;
    withActionItems: number;
    withSuggestedTitle: number;
  };
}

// ─────────────────────────────────────────────
// Insights Page
// ─────────────────────────────────────────────
export default function InsightsPage() {
  const router = useRouter();
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // ─────────────────────────────────────────────
  // Fetch all notes and compute insights client-side
  // ─────────────────────────────────────────────
  useEffect(() => {
    async function fetchAndCompute() {
      try {
        const res = await fetch("/api/notes?sort=createdAt&order=desc");
        if (!res.ok) throw new Error("Failed to fetch notes.");
        const data = await res.json();
        const notes: Note[] = data.data || [];

        setInsights(computeInsights(notes));
      } catch {
        setError("Could not load insights. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAndCompute();
  }, []);

  // ─────────────────────────────────────────────
  // Loading skeletons
  // ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="insights-page">
        <div className="page-header">
          <h1>Insights</h1>
          <p>Loading your productivity data...</p>
        </div>
        <div className="stats-grid">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="stat-card skeleton-card">
              <div className="skeleton" style={{ height: "14px", width: "60%", marginBottom: "12px" }} />
              <div className="skeleton" style={{ height: "36px", width: "40%" }} />
            </div>
          ))}
        </div>
        <style jsx>{`
          .insights-page { padding: 32px; max-width: 1100px; margin: 0 auto; }
          .page-header { margin-bottom: 32px; }
          .page-header h1 {
            font-family: var(--font-display);
            font-size: 28px;
            color: var(--text-primary);
            margin: 0 0 6px 0;
          }
          .page-header p { font-size: 14px; color: var(--text-muted); margin: 0; }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 16px;
          }
          .stat-card {
            background: var(--bg-surface);
            border: 1px solid var(--border-subtle);
            border-radius: var(--radius-lg);
            padding: 20px;
          }
          .skeleton-card { min-height: 100px; }
        `}</style>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // Error state
  // ─────────────────────────────────────────────
  if (error) {
    return (
      <div className="insights-page">
        <div className="error-banner">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="7.5" cy="7.5" r="6" stroke="var(--error)" strokeWidth="1.5"/>
            <path d="M7.5 4.5v3M7.5 10v.5"
              stroke="var(--error)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {error}
        </div>
        <style jsx>{`
          .insights-page { padding: 32px; }
          .error-banner {
            display: flex; align-items: center; gap: 8px;
            padding: 12px 14px;
            background: var(--error-subtle);
            border: 1px solid rgba(224,92,92,0.25);
            border-radius: var(--radius-md);
            color: var(--error); font-size: 13px;
          }
        `}</style>
      </div>
    );
  }

  if (!insights) return null;

  const hasNotes = insights.totalNotes > 0;

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div className="insights-page page-enter">

      {/* ── Header ──────────────────────────── */}
      <div className="page-header">
        <h1>Insights</h1>
        <p>A snapshot of your writing and productivity habits.</p>
      </div>

      {/* ── Empty state ─────────────────────── */}
      {!hasNotes ? (
        <div className="empty-insights">
          <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
            <rect x="8" y="6" width="40" height="44" rx="5"
              fill="var(--accent-muted)" stroke="var(--border-default)" strokeWidth="1.5"/>
            <path d="M18 20h20M18 28h14M18 36h10"
              stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <h3>No data yet</h3>
          <p>Create some notes to see your productivity insights here.</p>
          <button className="btn-primary" onClick={() => router.push("/")}>
            Go to notes
          </button>
        </div>
      ) : (
        <>
          {/* ── Stat Cards ────────────────────── */}
          <div className="stats-grid">
            <StatCard
              label="Total Notes"
              value={insights.totalNotes}
              icon={
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="2" y="2" width="14" height="14" rx="3"
                    stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M5 6h8M5 9h6M5 12h7"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              }
            />
            <StatCard
              label="Total Words Written"
              value={insights.totalWords.toLocaleString()}
              icon={
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3 4h12M3 8h12M3 12h8"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              }
            />
            <StatCard
              label="Avg Words / Note"
              value={insights.avgWordsPerNote}
              icon={
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3 13l4-5 3 3 3-6 3 4"
                    stroke="currentColor" strokeWidth="1.5"
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
            />
            <StatCard
              label="Notes This Week"
              value={insights.notesThisWeek}
              icon={
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="2" y="4" width="14" height="12" rx="2"
                    stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M6 2v2M12 2v2M2 8h14"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              }
              highlight={insights.notesThisWeek > 0}
            />
            <StatCard
              label="Notes This Month"
              value={insights.notesThisMonth}
              icon={
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 3v6l4 2"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="9" cy="9" r="7"
                    stroke="currentColor" strokeWidth="1.5"/>
                </svg>
              }
            />
            <StatCard
              label="AI Summaries Generated"
              value={insights.aiUsage.withSummary}
              icon={
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2l2 5h5l-4 3 1.5 5L9 12l-4.5 3L6 10 2 7h5z"
                    stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/>
                </svg>
              }
            />
          </div>

          {/* ── Activity Heatmap ──────────────── */}
          <div className="section">
            <h3 className="section-title">Activity — Last 30 Days</h3>
            <div className="heatmap-card">
              <ActivityHeatmap data={insights.activityByDay} />
            </div>
          </div>

          {/* ── Two Column: Tags + Recent ─────── */}
          <div className="two-col">

            {/* Top Tags */}
            <div className="section">
              <h3 className="section-title">Top Tags</h3>
              <div className="panel-card">
                {insights.topTags.length === 0 ? (
                  <p className="empty-panel">No tags used yet.</p>
                ) : (
                  <div className="tags-list">
                    {insights.topTags.map(({ tag, count }, i) => (
                      <div key={tag} className="tag-row">
                        <div className="tag-rank">#{i + 1}</div>
                        <span className="tag">{tag}</span>
                        <div className="tag-bar-wrap">
                          <div
                            className="tag-bar"
                            style={{
                              width: `${Math.round(
                                (count / insights.topTags[0].count) * 100
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="tag-count">
                          {count} {count === 1 ? "note" : "notes"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recent Notes */}
            <div className="section">
              <h3 className="section-title">Recently Edited</h3>
              <div className="panel-card">
                {insights.mostRecentNotes.length === 0 ? (
                  <p className="empty-panel">No notes yet.</p>
                ) : (
                  <div className="recent-list">
                    {insights.mostRecentNotes.map((note) => (
                      <div
                        key={note.id}
                        className="recent-row"
                        onClick={() => router.push(`/notes/${note.id}`)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) =>
                          e.key === "Enter" && router.push(`/notes/${note.id}`)
                        }
                      >
                        <div className="recent-title">
                          {note.title || "Untitled Note"}
                        </div>
                        <div className="recent-meta">
                          <span>
                            {note.content.trim()
                              ? `${note.content.trim().split(/\s+/).length} words`
                              : "Empty"}
                          </span>
                          <span>
                            {new Date(note.updatedAt).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric" }
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── AI Usage ──────────────────────── */}
          <div className="section">
            <h3 className="section-title">AI Feature Usage</h3>
            <div className="ai-usage-grid">
              <AiUsageCard
                label="Summaries"
                count={insights.aiUsage.withSummary}
                total={insights.totalNotes}
                color="var(--accent)"
              />
              <AiUsageCard
                label="Action Items"
                count={insights.aiUsage.withActionItems}
                total={insights.totalNotes}
                color="var(--success)"
              />
              <AiUsageCard
                label="Title Suggestions"
                count={insights.aiUsage.withSuggestedTitle}
                total={insights.totalNotes}
                color="var(--warning)"
              />
            </div>
          </div>
        </>
      )}

      {/* ── Scoped Styles ───────────────────── */}
      <style jsx>{`
        .insights-page {
          padding: 32px;
          max-width: 1100px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 32px;
        }

        @media (max-width: 640px) {
          .insights-page { padding: 20px 16px; }
        }

        /* Header */
        .page-header { display: flex; flex-direction: column; gap: 6px; }
        .page-header h1 {
          font-family: var(--font-display);
          font-size: 28px;
          color: var(--text-primary);
          margin: 0;
        }
        .page-header p { font-size: 14px; color: var(--text-muted); margin: 0; }

        /* Empty state */
        .empty-insights {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 80px 24px;
          text-align: center;
        }
        .empty-insights h3 {
          font-family: var(--font-display);
          font-size: 22px;
          color: var(--text-primary);
          margin: 0;
        }
        .empty-insights p {
          font-size: 14px; color: var(--text-muted);
          margin: 0; max-width: 280px;
        }

        /* Stats grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 14px;
        }

        /* Section */
        .section { display: flex; flex-direction: column; gap: 12px; }
        .section-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin: 0;
          font-family: var(--font-body);
        }

        /* Heatmap card */
        .heatmap-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 20px;
          overflow-x: auto;
        }

        /* Two-column layout */
        .two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        @media (max-width: 768px) {
          .two-col { grid-template-columns: 1fr; }
        }

        /* Panel card */
        .panel-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }
        .empty-panel {
          padding: 24px;
          text-align: center;
          font-size: 13px;
          color: var(--text-muted);
          margin: 0;
        }

        /* Tags list */
        .tags-list { display: flex; flex-direction: column; }
        .tag-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-subtle);
          transition: background var(--transition-fast);
        }
        .tag-row:last-child { border-bottom: none; }
        .tag-row:hover { background: var(--bg-hover); }
        .tag-rank {
          font-size: 11px;
          color: var(--text-muted);
          font-family: var(--font-mono);
          min-width: 24px;
        }
        .tag-bar-wrap {
          flex: 1;
          height: 4px;
          background: var(--bg-hover);
          border-radius: 2px;
          overflow: hidden;
        }
        .tag-bar {
          height: 100%;
          background: var(--accent);
          border-radius: 2px;
          transition: width 0.5s ease;
        }
        .tag-count {
          font-size: 11px;
          color: var(--text-muted);
          white-space: nowrap;
          font-family: var(--font-mono);
        }

        /* Recent list */
        .recent-list { display: flex; flex-direction: column; }
        .recent-row {
          padding: 12px 16px;
          border-bottom: 1px solid var(--border-subtle);
          cursor: pointer;
          transition: background var(--transition-fast);
        }
        .recent-row:last-child { border-bottom: none; }
        .recent-row:hover { background: var(--bg-hover); }
        .recent-title {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 4px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .recent-meta {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: var(--text-muted);
          font-family: var(--font-mono);
        }

        /* AI usage grid */
        .ai-usage-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 14px;
        }

        /* Error */
        .error-banner {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 14px;
          background: var(--error-subtle);
          border: 1px solid rgba(224,92,92,0.25);
          border-radius: var(--radius-md);
          color: var(--error); font-size: 13px;
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// Stat Card Component
// ─────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={`stat-card ${highlight ? "stat-card-highlight" : ""}`}>
      <div className="stat-icon">{icon}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>

      <style jsx>{`
        .stat-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 20px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          transition: border-color var(--transition-normal),
                      box-shadow var(--transition-normal);
        }
        .stat-card:hover {
          border-color: var(--border-default);
          box-shadow: var(--shadow-sm);
        }
        .stat-card-highlight {
          border-color: rgba(240,165,0,0.2);
          background: var(--accent-muted);
        }
        .stat-icon { color: var(--accent); }
        .stat-value {
          font-family: var(--font-display);
          font-size: 32px;
          color: var(--text-primary);
          line-height: 1;
        }
        .stat-label {
          font-size: 12px;
          color: var(--text-muted);
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// Activity Heatmap Component
// Shows last 30 days as colored squares
// ─────────────────────────────────────────────
function ActivityHeatmap({
  data,
}: {
  data: { date: string; count: number }[];
}) {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="heatmap">
      <div className="heatmap-grid">
        {data.map(({ date, count }) => {
          const intensity = count === 0 ? 0 : Math.ceil((count / maxCount) * 4);
          const label = `${date}: ${count} note${count !== 1 ? "s" : ""}`;

          return (
            <div
              key={date}
              className="heatmap-cell"
              data-intensity={intensity}
              title={label}
              aria-label={label}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="heatmap-legend">
        <span>Less</span>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="heatmap-cell" data-intensity={i} />
        ))}
        <span>More</span>
      </div>

      <style jsx>{`
        .heatmap { display: flex; flex-direction: column; gap: 12px; }
        .heatmap-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        .heatmap-cell {
          width: 18px;
          height: 18px;
          border-radius: 3px;
          background: var(--bg-elevated);
          transition: transform var(--transition-fast);
          cursor: default;
        }
        .heatmap-cell:hover { transform: scale(1.3); }
        .heatmap-cell[data-intensity="0"] { background: var(--bg-elevated); }
        .heatmap-cell[data-intensity="1"] { background: rgba(240,165,0,0.2); }
        .heatmap-cell[data-intensity="2"] { background: rgba(240,165,0,0.45); }
        .heatmap-cell[data-intensity="3"] { background: rgba(240,165,0,0.7); }
        .heatmap-cell[data-intensity="4"] { background: var(--accent); }

        .heatmap-legend {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: var(--text-muted);
        }
        .heatmap-legend span { margin: 0 4px; }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// AI Usage Card Component
// ─────────────────────────────────────────────
function AiUsageCard({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className="ai-card">
      <div className="ai-card-header">
        <span className="ai-card-label">{label}</span>
        <span className="ai-card-pct">{pct}%</span>
      </div>
      <div className="ai-card-bar-bg">
        <div className="ai-card-bar" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="ai-card-count">
        {count} of {total} notes
      </div>

      <style jsx>{`
        .ai-card {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 18px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ai-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .ai-card-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
        }
        .ai-card-pct {
          font-size: 20px;
          font-family: var(--font-display);
          color: var(--text-primary);
        }
        .ai-card-bar-bg {
          height: 6px;
          background: var(--bg-elevated);
          border-radius: 3px;
          overflow: hidden;
        }
        .ai-card-bar {
          height: 100%;
          border-radius: 3px;
          transition: width 0.6s ease;
        }
        .ai-card-count {
          font-size: 11px;
          color: var(--text-muted);
          font-family: var(--font-mono);
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// computeInsights — pure function, no API needed
// Takes the notes array and returns all stats
// ─────────────────────────────────────────────
function computeInsights(notes: Note[]): InsightsData {
  const now = new Date();

  // Week boundary (last 7 days)
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Month boundary (last 30 days)
  const monthAgo = new Date(now);
  monthAgo.setDate(monthAgo.getDate() - 30);

  // Word counts
  const wordCounts = notes.map((n) =>
    n.content.trim() ? n.content.trim().split(/\s+/).length : 0
  );
  const totalWords = wordCounts.reduce((a, b) => a + b, 0);
  const avgWordsPerNote =
    notes.length > 0 ? Math.round(totalWords / notes.length) : 0;

  // Time-based counts
  const notesThisWeek = notes.filter(
    (n) => new Date(n.createdAt) >= weekAgo
  ).length;
  const notesThisMonth = notes.filter(
    (n) => new Date(n.createdAt) >= monthAgo
  ).length;

  // Tag frequency
  const tagMap: Record<string, number> = {};
  notes.forEach((n) => {
    n.tags.forEach((t) => {
      tagMap[t] = (tagMap[t] || 0) + 1;
    });
  });
  const topTags = Object.entries(tagMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([tag, count]) => ({ tag, count }));

  // Activity by day — last 30 days
  const activityMap: Record<string, number> = {};
  // Pre-fill every day with 0
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    activityMap[key] = 0;
  }
  // Count notes per day
  notes.forEach((n) => {
    const key = new Date(n.createdAt).toISOString().split("T")[0];
    if (key in activityMap) {
      activityMap[key]++;
    }
  });
  const activityByDay = Object.entries(activityMap).map(([date, count]) => ({
    date,
    count,
  }));

  // Most recent 5 notes
  const mostRecentNotes = [...notes]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 5);

  // Longest note
  const longestNote =
    notes.length > 0
      ? notes.reduce((prev, curr) => {
          const prevWords = prev.content.trim().split(/\s+/).length;
          const currWords = curr.content.trim().split(/\s+/).length;
          return currWords > prevWords ? curr : prev;
        })
      : null;

  // AI usage
  const aiUsage = {
    withSummary:       notes.filter((n) => !!n.summary).length,
    withActionItems:   notes.filter((n) => n.actionItems.length > 0).length,
    withSuggestedTitle: notes.filter((n) => !!n.suggestedTitle).length,
  };

  return {
    totalNotes: notes.length,
    totalWords,
    avgWordsPerNote,
    notesThisWeek,
    notesThisMonth,
    topTags,
    activityByDay,
    mostRecentNotes,
    longestNote,
    aiUsage,
  };
}