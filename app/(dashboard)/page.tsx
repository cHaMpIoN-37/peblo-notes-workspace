"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Note } from "@/types";

export default function DashboardPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"updatedAt" | "createdAt" | "title">("updatedAt");
  const [showArchived, setShowArchived] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        search,
        sort: sortBy,
        order: "desc",
        archived: String(showArchived),
      });
      const res = await fetch(`/api/notes?${params}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setNotes(data.data || []);
    } catch {
      setError("Could not load notes. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [search, sortBy, showArchived]);

  useEffect(() => {
    const t = setTimeout(fetchNotes, 300);
    return () => clearTimeout(t);
  }, [fetchNotes]);

  async function handleNewNote() {
    setIsCreating(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Untitled Note", content: "" }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      router.push(`/notes/${data.data.id}`);
    } catch {
      setError("Could not create note.");
      setIsCreating(false);
    }
  }

  async function handleDelete(noteId: string, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this note permanently?")) return;
    try {
      await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch {
      setError("Could not delete note.");
    }
  }

  async function handleArchive(noteId: string, archive: boolean, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: archive }),
      });
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch {
      setError("Could not archive note.");
    }
  }

  return (
    <div style={{ padding: "32px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", color: "var(--text-primary)", margin: 0 }}>
            {showArchived ? "Archived Notes" : "My Notes"}
          </h1>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            {isLoading ? "..." : `${notes.length} note${notes.length !== 1 ? "s" : ""}`}
          </span>
        </div>
        <button className="btn-primary" onClick={handleNewNote} disabled={isCreating}>
          {isCreating ? "Creating..." : "+ New Note"}
        </button>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "24px", flexWrap: "wrap" }}>
        <input
          type="text"
          className="input"
          placeholder="Search notes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: "200px" }}
        />
        <select
          className="input"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          style={{ width: "auto" }}
        >
          <option value="updatedAt">Last edited</option>
          <option value="createdAt">Date created</option>
          <option value="title">Title A–Z</option>
        </select>
        <button className="btn-ghost" onClick={() => setShowArchived(!showArchived)}>
          {showArchived ? "Show Active" : "Show Archived"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: "12px 14px", background: "var(--error-subtle)", border: "1px solid rgba(224,92,92,0.25)", borderRadius: "8px", color: "var(--error)", fontSize: "13px", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {/* Notes Grid */}
      {isLoading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: "160px", borderRadius: "12px" }} />
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div style={{ textAlign: "center", padding: "80px 24px" }}>
          <h3 style={{ fontFamily: "var(--font-display)", fontSize: "22px", color: "var(--text-primary)", margin: "0 0 8px 0" }}>
            {search ? `No notes match "${search}"` : "No notes yet"}
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", margin: "0 0 20px 0" }}>
            {search ? "Try a different search term." : "Create your first note to get started."}
          </p>
          {!search && (
            <button className="btn-primary" onClick={handleNewNote}>
              Create your first note
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "16px" }}>
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
    </div>
  );
}

function NoteCard({ note, onClick, onDelete, onArchive }: {
  note: Note;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onArchive: (e: React.MouseEvent) => void;
}) {
  const preview = note.content
    ? note.content.replace(/[#*`>-]/g, "").slice(0, 120).trim()
    : "No content yet...";

  const date = new Date(note.updatedAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "12px",
        padding: "20px",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-default)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "0 4px 12px rgba(0,0,0,0.5)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-subtle)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px" }}>
        <h3 style={{ fontFamily: "var(--font-body)", fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", margin: 0, flex: 1 }}>
          {note.title || "Untitled Note"}
        </h3>
        <div style={{ display: "flex", gap: "4px" }} onClick={e => e.stopPropagation()}>
          <button
            onClick={onArchive}
            title={note.isArchived ? "Restore" : "Archive"}
            style={{ width: "28px", height: "28px", background: "var(--bg-hover)", border: "1px solid var(--border-subtle)", borderRadius: "4px", color: "var(--text-muted)", cursor: "pointer", fontSize: "12px" }}
          >
            {note.isArchived ? "↩" : "⊡"}
          </button>
          <button
            onClick={onDelete}
            title="Delete"
            style={{ width: "28px", height: "28px", background: "var(--bg-hover)", border: "1px solid var(--border-subtle)", borderRadius: "4px", color: "var(--text-muted)", cursor: "pointer", fontSize: "12px" }}
          >
            ✕
          </button>
        </div>
      </div>

      <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical" }}>
        {preview}
      </p>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "auto" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
          {note.tags.slice(0, 3).map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
        <span style={{ fontSize: "11px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>{date}</span>
      </div>
    </div>
  );
}
