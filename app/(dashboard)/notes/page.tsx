// app/(dashboard)/page.tsx
// Main notes dashboard — lists all notes with search, filter, and sort.
// This is the first page users see after logging in.

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Note, NoteFilters } from "@/types";

// ─────────────────────────────────────────────
// Main Dashboard Page
// ─────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();

  // Notes state
  const [notes,     setNotes]     = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState("");

  // Filter state
  const [search,   setSearch]   = useState("");
  const [sortBy,   setSortBy]   = useState<"updatedAt" | "createdAt" | "title">("updatedAt");
  const [showArchived, setShowArchived] = useState(false);

  // Creating new note state
  const [isCreating, setIsCreating] = useState(false);

  // ─────────────────────────────────────────────
  // Fetch notes
  // ─────────────────────────────────────────────
  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        search,
        sort:     sortBy,
        order:    "desc",
        archived: String(showArchived),
      });

      const res = await fetch(`/api/notes?${params}`);
      if (!res.ok) throw new Error("Failed to fetch notes.");

      const data = await res.json();
      setNotes(data.data || []);
    } catch {
      setError("Could not load notes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [search, sortBy, showArchived]);

  // Fetch on mount and when filters change
  useEffect(() => {
    const debounce = setTimeout(fetchNotes, 300);
    return () => clearTimeout(debounce);
  }, [fetchNotes]);

  // ─────────────────────────────────────────────
  // Create new note → redirect to editor
  // ─────────────────────────────────────────────
  async function handleNewNote() {
    setIsCreating(true);
    try {
      const res = await fetch("/api/notes", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ title: "Untitled Note", content: "" }),
      });

      if (!res.ok) throw new Error("Failed to create note.");
      const data = await res.json();
      router.push(`/notes/${data.data.id}`);
    } catch {
      setError("Could not create note. Please try again.");
      setIsCreating(false);
    }
  }

  // ─────────────────────────────────────────────
  // Delete note
  // ─────────────────────────────────────────────
  async function handleDelete(noteId: string, e: React.MouseEvent) {
    e.stopPropagation(); // prevent navigating to note
    if (!confirm("Delete this note permanently?")) return;

    try {
      await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch {
      setError("Could not delete note.");
    }
  }

  // ─────────────────────────────────────────────
  // Archive / unarchive
  // ─────────────────────────────────────────────
  async function handleArchive(noteId: string, archive: boolean, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await fetch(`/api/notes/${noteId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ isArchived: archive }),
      });
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch {
      setError("Could not archive note.");
    }
  }

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────
  return (
    <div className="dashboard-page">

      {/* ── Page Header ─────────────────────── */}
      <div className="page-header">
        <div className="header-left">
          <h1>{showArchived ? "Archived Notes" : "My Notes"}</h1>
          <span className="note-count">
            {isLoading ? "..." : `${notes.length} note${notes.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        <button
          className="btn-primary"
          onClick={handleNewNote}
          disabled={isCreating}
        >
          {isCreating ? (
            <><span className="spinner" /> Creating...</>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              New Note
            </>
          )}
        </button>
      </div>

      {/* ── Toolbar: Search + Filters ─────────── */}
      <div className="toolbar">
        {/* Search */}
        <div className="search-wrap">
          <svg className="search-icon" width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="6.5" cy="6.5" r="4.5" stroke="var(--text-muted)" strokeWidth="1.5"/>
            <path d="M10 10l3 3" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            className="input search-input"
            placeholder="Search notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch("")}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M2 2l9 9M11 2l-9 9" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* Sort */}
        <select
          className="input sort-select"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
        >
          <option value="updatedAt">Last edited</option>
          <option value="createdAt">Date created</option>
          <option value="title">Title A–Z</option>
        </select>

        {/* Archive toggle */}
        <button
          className={`archive-toggle ${showArchived ? "archive-toggle-active" : ""}`}
          onClick={() => setShowArchived(!showArchived)}
          title={showArchived ? "Show active notes" : "Show archived"}
        >
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <rect x="1.5" y="4.5" width="12" height="9" rx="1.5"
              stroke="currentColor" strokeWidth="1.5"/>
            <path d="M1.5 7.5h12" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M3 2.5h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {showArchived ? "Active" : "Archived"}
        </button>
      </div>

      {/* ── Error ────────────────────────────── */}
      {error && (
        <div className="error-banner" role="alert">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
            <circle cx="7.5" cy="7.5" r="6" stroke="var(--error)" strokeWidth="1.5"/>
            <path d="M7.5 4.5v3M7.5 10v.5" stroke="var(--error)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          {error}
        </div>
      )}

      {/* ── Notes Grid ───────────────────────── */}
      {isLoading ? (
        <div className="notes-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="note-skeleton">
              <div className="skeleton" style={{ height: "20px", width: "70%", marginBottom: "12px" }} />
              <div className="skeleton" style={{ height: "14px", width: "100%", marginBottom: "8px" }} />
              <div className="skeleton" style={{ height: "14px", width: "85%" }} />
              <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                <div className="skeleton" style={{ height: "22px", width: "60px", borderRadius: "100px" }} />
                <div className="skeleton" style={{ height: "22px", width: "50px", borderRadius: "100px" }} />
              </div>
            </div>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <EmptyState search={search} showArchived={showArchived} onNew={handleNewNote} />
      ) : (
        <div className="notes-grid">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              onClick={() => router.push(`/notes/${note.id}`)}
              onDelete={(e) => handleDelete(note.id, e)}
              onArchive={(e) => handleArchive(note.id, !note.isArchived, e)}
            />
          ))}
        </div>
      )}

      {/* Scoped styles */}
      <style jsx>{`
        .dashboard-page {
          padding: 32px;
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        @media (max-width: 640px) {
          .dashboard-page { padding: 20px 16px; }
        }

        /* Header */
        .page-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .header-left {
          display: flex;
          align-items: baseline;
          gap: 12px;
        }
        .page-header h1 {
          font-family: var(--font-display);
          font-size: 28px;
          color: var(--text-primary);
          margin: 0;
        }
        .note-count {
          font-size: 13px;
          color: var(--text-muted);
        }

        /* Toolbar */
        .toolbar {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }

        /* Search */
        .search-wrap {
          position: relative;
          flex: 1;
          min-width: 200px;
        }
        .search-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          pointer-events: none;
        }
        .search-input {
          padding-left: 36px;
          padding-right: 36px;
        }
        .search-clear {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          border-radius: 4px;
        }
        .search-clear:hover { background: var(--bg-hover); }

        /* Sort select */
        .sort-select {
          width: auto;
          cursor: pointer;
          padding-right: 12px;
        }

        /* Archive toggle */
        .archive-toggle {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: transparent;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          color: var(--text-muted);
          font-size: 13px;
          font-family: var(--font-body);
          cursor: pointer;
          transition: all var(--transition-fast);
          white-space: nowrap;
        }
        .archive-toggle:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }
        .archive-toggle-active {
          background: var(--accent-muted);
          border-color: rgba(240,165,0,0.2);
          color: var(--accent);
        }

        /* Error */
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

        /* Notes grid */
        .notes-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        /* Skeleton card */
        .note-skeleton {
          background: var(--bg-surface);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-lg);
          padding: 20px;
        }

        /* Spinner */
        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(15,14,13,0.3);
          border-top-color: var(--text-inverse);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// Note Card Component
// ─────────────────────────────────────────────
function NoteCard({
  note,
  onClick,
  onDelete,
  onArchive,
}: {
  note: Note;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onArchive: (e: React.MouseEvent) => void;
}) {
  // Truncate content preview
  const preview = note.content
    ? note.content.replace(/[#*`>-]/g, "").slice(0, 120).trim()
    : "No content yet...";

  // Format date
  const date = new Date(note.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day:   "numeric",
    year:  "numeric",
  });

  return (
    <div className="note-card card" onClick={onClick} role="button" tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}>

      {/* Header */}
      <div className="card-header">
        <h3 className="card-title">{note.title || "Untitled Note"}</h3>

        {/* Actions */}
        <div className="card-actions" onClick={(e) => e.stopPropagation()}>
          {/* Archive */}
          <button
            className="action-btn"
            onClick={onArchive}
            title={note.isArchived ? "Restore note" : "Archive note"}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              {note.isArchived ? (
                <path d="M2 7h10M7 2v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              ) : (
                <rect x="1" y="4" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5"/>
              )}
            </svg>
          </button>

          {/* Delete */}
          <button
            className="action-btn action-btn-danger"
            onClick={onDelete}
            title="Delete note"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 4h10M5 4V3h4v1M6 7v3M8 7v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <rect x="3" y="4" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Preview */}
      <p className="card-preview">{preview}</p>

      {/* Footer */}
      <div className="card-footer">
        {/* Tags */}
        <div className="card-tags">
          {note.tags.slice(0, 3).map((tag) => (
            <span key={tag} className="tag">{tag}</span>
          ))}
          {note.tags.length > 3 && (
            <span className="tag">+{note.tags.length - 3}</span>
          )}
        </div>

        {/* Meta */}
        <div className="card-meta">
          {note.isPublic && (
            <span className="public-badge" title="Publicly shared">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <circle cx="5.5" cy="5.5" r="4.5" stroke="var(--success)" strokeWidth="1.2"/>
                <path d="M5.5 1C5.5 1 3.5 3 3.5 5.5s2 4.5 2 4.5" stroke="var(--success)" strokeWidth="1.2"/>
                <path d="M1 5.5h9" stroke="var(--success)" strokeWidth="1.2"/>
              </svg>
              Public
            </span>
          )}
          <span className="card-date">{date}</span>
        </div>
      </div>

      <style jsx>{`
        .note-card {
          padding: 20px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 10px;
          transition: transform var(--transition-fast),
                      border-color var(--transition-normal),
                      box-shadow var(--transition-normal);
        }
        .note-card:hover {
          transform: translateY(-2px);
          border-color: var(--border-default);
          box-shadow: var(--shadow-md);
        }
        .note-card:focus-visible {
          outline: 2px solid var(--accent);
          outline-offset: 2px;
        }

        /* Header */
        .card-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }
        .card-title {
          font-family: var(--font-body);
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
          line-height: 1.4;
          flex: 1;
          /* Clamp to 2 lines */
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Action buttons */
        .card-actions {
          display: flex;
          gap: 4px;
          opacity: 0;
          transition: opacity var(--transition-fast);
          flex-shrink: 0;
        }
        .note-card:hover .card-actions { opacity: 1; }

        .action-btn {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-hover);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .action-btn:hover {
          background: var(--bg-elevated);
          color: var(--text-primary);
        }
        .action-btn-danger:hover {
          background: var(--error-subtle);
          border-color: rgba(224,92,92,0.3);
          color: var(--error);
        }

        /* Preview */
        .card-preview {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.6;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Footer */
        .card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          margin-top: auto;
          padding-top: 4px;
        }
        .card-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          flex: 1;
          min-width: 0;
        }

        /* Meta */
        .card-meta {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .card-date {
          font-size: 11px;
          color: var(--text-muted);
          white-space: nowrap;
        }
        .public-badge {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 11px;
          color: var(--success);
        }
      `}</style>
    </div>
  );
}

// ─────────────────────────────────────────────
// Empty State Component
// ─────────────────────────────────────────────
function EmptyState({
  search,
  showArchived,
  onNew,
}: {
  search: string;
  showArchived: boolean;
  onNew: () => void;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <rect x="8" y="6" width="32" height="36" rx="4"
            fill="var(--accent-muted)" stroke="var(--border-default)" strokeWidth="1.5"/>
          <path d="M16 16h16M16 22h12M16 28h8"
            stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>

      {search ? (
        <>
          <h3>No notes match &ldquo;{search}&rdquo;</h3>
          <p>Try a different search term or clear the search.</p>
        </>
      ) : showArchived ? (
        <>
          <h3>No archived notes</h3>
          <p>Notes you archive will appear here.</p>
        </>
      ) : (
        <>
          <h3>No notes yet</h3>
          <p>Create your first note to get started.</p>
          <button className="btn-primary" onClick={onNew}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            Create your first note
          </button>
        </>
      )}

      <style jsx>{`
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 80px 24px;
          text-align: center;
        }
        .empty-icon {
          margin-bottom: 8px;
          opacity: 0.7;
        }
        .empty-state h3 {
          font-family: var(--font-display);
          font-size: 22px;
          color: var(--text-primary);
          margin: 0;
        }
        .empty-state p {
          font-size: 14px;
          color: var(--text-muted);
          margin: 0;
          max-width: 280px;
        }
      `}</style>
    </div>
  );
}