// app/(dashboard)/notes/[id]/page.tsx
// Full note editor page with:
//   - Auto-save (debounced 1.5s after typing stops)
//   - Tag management
//   - AI features (summary, action items, title suggestion)
//   - Public share toggle
//   - Rich editing experience

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import type { Note, AIFeatureType } from "@/types";

// ─────────────────────────────────────────────
// Note Editor Page
// ─────────────────────────────────────────────
export default function NoteEditorPage() {
  const router = useRouter();
  const params = useParams();
  const noteId = params.id as string;

  // Note state
  const [note,     setNote]     = useState<Note | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound,  setNotFound]  = useState(false);

  // Editor state
  const [title,   setTitle]   = useState("");
  const [content, setContent] = useState("");
  const [tags,    setTags]    = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Save state
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  // AI state
  const [aiLoading, setAiLoading] = useState<AIFeatureType | null>(null);
  const [aiPanel, setAiPanel] = useState<"summary" | "action-items" | "suggest-title" | null>(null);

  // Share state
  const [isPublic, setIsPublic] = useState(false);
  const [shareId,  setShareId]  = useState<string | null>(null);
  const [copied,   setCopied]   = useState(false);

  // Delete state
  const [isDeleting, setIsDeleting] = useState(false);

  // ─────────────────────────────────────────────
  // Fetch note on mount
  // ─────────────────────────────────────────────
  useEffect(() => {
    async function fetchNote() {
      try {
        const res = await fetch(`/api/notes/${noteId}`);
        if (res.status === 404) { setNotFound(true); return; }
        if (!res.ok) throw new Error();

        const data = await res.json();
        const n: Note = data.note;

        setNote(n);
        setTitle(n.title);
        setContent(n.content);
        setTags(n.tags);
        setIsPublic(n.isPublic);
        setShareId(n.shareId);
      } catch {
        setNotFound(true);
      } finally {
        setIsLoading(false);
      }
    }

    fetchNote();
  }, [noteId]);

  // ─────────────────────────────────────────────
  // Auto-save: debounced 1.5s after changes
  // ─────────────────────────────────────────────
  const save = useCallback(
    async (data: {
      title?: string;
      content?: string;
      tags?: string[];
    }) => {
      setSaveStatus("saving");
      try {
        const res = await fetch(`/api/notes/${noteId}`, {
          method:  "PATCH",
          headers: { "Content-Type": "application/json" },
          body:    JSON.stringify(data),
        });

        if (!res.ok) throw new Error();
        const updated = await res.json();
        setNote(updated.note);
        setSaveStatus("saved");

        // Reset to idle after 2s
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch {
        setSaveStatus("error");
      }
    },
    [noteId]
  );

  // Trigger auto-save when title/content/tags change
  useEffect(() => {
    if (!note) return; // don't save before initial load

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      save({ title, content, tags });
    }, 1500);

    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [title, content, tags]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────
  // Tag management
  // ─────────────────────────────────────────────
  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
    if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  function addTag() {
    const cleaned = tagInput.trim().toLowerCase().replace(/,/g, "");
    if (cleaned && !tags.includes(cleaned) && tags.length < 10) {
      setTags((prev) => [...prev, cleaned]);
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  // ─────────────────────────────────────────────
  // AI Features
  // ─────────────────────────────────────────────
  async function handleAI(type: AIFeatureType) {
    setAiLoading(type);
    setAiPanel(type);

    try {
      const res = await fetch(`/api/notes/${noteId}/ai`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ type }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "AI request failed.");
      }

      const data = await res.json();
      // Update local note state with AI result
      setNote(data.note);

      // If title was suggested, offer to apply it
      if (type === "suggest-title" && data.data.result) {
        const apply = confirm(
          `AI suggests this title:\n\n"${data.data.result}"\n\nApply it?`
        );
        if (apply) {
          setTitle(data.data.result as string);
        }
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "AI feature failed.");
      setAiPanel(null);
    } finally {
      setAiLoading(null);
    }
  }

  // ─────────────────────────────────────────────
  // Share toggle
  // ─────────────────────────────────────────────
  async function handleShareToggle() {
    const newValue = !isPublic;
    setIsPublic(newValue);

    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ isPublic: newValue }),
      });

      const data = await res.json();
      setShareId(data.note.shareId);
      setNote(data.note);
    } catch {
      setIsPublic(!newValue); // revert on error
    }
  }

  function handleCopyLink() {
    if (!shareId) return;
    const url = `${window.location.origin}/shared/${shareId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ─────────────────────────────────────────────
  // Delete note
  // ─────────────────────────────────────────────
  async function handleDelete() {
    if (!confirm("Delete this note permanently? This cannot be undone.")) return;
    setIsDeleting(true);

    try {
      await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
      router.push("/");
    } catch {
      alert("Could not delete note.");
      setIsDeleting(false);
    }
  }

  // ─────────────────────────────────────────────
  // Loading state
  // ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="editor-loading">
        <div className="skeleton" style={{ height: "36px", width: "60%", marginBottom: "16px" }} />
        <div className="skeleton" style={{ height: "16px", width: "40%", marginBottom: "32px" }} />
        <div className="skeleton" style={{ height: "400px", width: "100%" }} />
        <style jsx>{`
          .editor-loading {
            padding: 40px;
            max-width: 860px;
            margin: 0 auto;
          }
        `}</style>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // Not found state
  // ─────────────────────────────────────────────
  if (notFound) {
    return (
      <div className="not-found">
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <circle cx="24" cy="24" r="20" fill="var(--accent-muted)"
            stroke="var(--border-default)" strokeWidth="1.5"/>
          <path d="M24 16v10M24 30v2"
            stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round"/>
        </svg>
        <h2>Note not found</h2>
        <p>This note may have been deleted or you don&apos;t have access.</p>
        <button className="btn-primary" onClick={() => router.push("/")}>
          Back to notes
        </button>
        <style jsx>{`
          .not-found {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 12px;
            height: 100%;
            min-height: 400px;
            text-align: center;
            padding: 40px;
          }
          .not-found h2 {
            font-family: var(--font-display);
            font-size: 24px;
            color: var(--text-primary);
            margin: 0;
          }
          .not-found p {
            font-size: 14px;
            color: var(--text-muted);
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // Main editor render
  // ─────────────────────────────────────────────
  return (
    <div className="editor-page">

      {/* ── Editor Column ────────────────────── */}
      <div className="editor-column">

        {/* Top bar */}
        <div className="editor-topbar">
          <button
            className="back-btn"
            onClick={() => router.push("/")}
            aria-label="Back to notes"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 3L5 8l5 5"
                stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            All notes
          </button>

          {/* Save status */}
          <div className="save-status">
            {saveStatus === "saving" && (
              <span className="status-saving saving-pulse">
                <span className="status-dot" />
                Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="status-saved">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2 7l3 3 6-6"
                    stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Saved
              </span>
            )}
            {saveStatus === "error" && (
              <span className="status-error">Save failed</span>
            )}
          </div>

          {/* Actions */}
          <div className="editor-actions">
            <button
              className="action-chip"
              onClick={handleDelete}
              disabled={isDeleting}
              title="Delete note"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 4h10M5 4V3h4v1M6 7v3M8 7v3"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                <rect x="3" y="4" width="8" height="8" rx="1"
                  stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>

        {/* Title input */}
        <input
          type="text"
          className="title-input"
          placeholder="Note title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
        />

        {/* Tags input */}
        <div className="tags-row">
          <div className="tags-container">
            {tags.map((tag) => (
              <span key={tag} className="tag">
                {tag}
                <button
                  className="tag-remove"
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove tag ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
            <input
              type="text"
              className="tag-input"
              placeholder={tags.length === 0 ? "Add tags (Enter to add)..." : ""}
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              onBlur={addTag}
            />
          </div>
        </div>

        {/* Content textarea */}
        <textarea
          className="content-textarea"
          placeholder="Start writing your note here...

Use markdown-style formatting:
# Heading
**bold**, *italic*
- bullet points"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          spellCheck
        />

        {/* Word count */}
        <div className="editor-footer">
          <span className="word-count">
            {content.trim()
              ? `${content.trim().split(/\s+/).length} words · ${content.length} chars`
              : "Start writing..."}
          </span>
          {note?.lastSavedAt && (
            <span className="last-saved">
              Last saved {new Date(note.lastSavedAt).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* ── Right Panel ──────────────────────── */}
      <div className="right-panel">

        {/* ── AI Features ──────────────────── */}
        <div className="panel-section">
          <h4 className="panel-heading">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1l1.5 3.5L12 6l-3.5 1.5L7 11l-1.5-3.5L2 6l3.5-1.5z"
                stroke="var(--accent)" strokeWidth="1.2" strokeLinejoin="round"/>
            </svg>
            AI Features
          </h4>

          <div className="ai-buttons">
            {/* Summary */}
            <button
              className="ai-btn"
              onClick={() => handleAI("summary")}
              disabled={!!aiLoading}
            >
              {aiLoading === "summary" ? (
                <span className="spinner-sm" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 3h10M2 6h7M2 9h9M2 12h5"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )}
              Generate Summary
            </button>

            {/* Action Items */}
            <button
              className="ai-btn"
              onClick={() => handleAI("action-items")}
              disabled={!!aiLoading}
            >
              {aiLoading === "action-items" ? (
                <span className="spinner-sm" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 4h1.5M5 4h7M2 7h1.5M5 7h5M2 10h1.5M5 10h6"
                    stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )}
              Extract Action Items
            </button>

            {/* Suggest Title */}
            <button
              className="ai-btn"
              onClick={() => handleAI("suggest-title")}
              disabled={!!aiLoading}
            >
              {aiLoading === "suggest-title" ? (
                <span className="spinner-sm" />
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2h10v3H2zM4 9l2-4 2 4M4.8 7.5h2.4"
                    stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
              Suggest Title
            </button>
          </div>

          {/* AI Results Panel */}
          {aiPanel && note && (
            <div className="ai-result">
              <div className="ai-result-header">
                <span className="ai-result-label">
                  {aiPanel === "summary"
                    ? "Summary"
                    : aiPanel === "action-items"
                    ? "Action Items"
                    : "Suggested Title"}
                </span>
                <button
                  className="ai-result-close"
                  onClick={() => setAiPanel(null)}
                  aria-label="Close AI panel"
                >
                  ×
                </button>
              </div>

              {/* Summary result */}
              {aiPanel === "summary" && note.summary && (
                <p className="ai-result-text">{note.summary}</p>
              )}

              {/* Action items result */}
              {aiPanel === "action-items" && note.actionItems.length > 0 && (
                <ul className="ai-action-list">
                  {note.actionItems.map((item, i) => (
                    <li key={i}>
                      <span className="action-bullet" aria-hidden="true">→</span>
                      {item}
                    </li>
                  ))}
                </ul>
              )}

              {/* Suggested title result */}
              {aiPanel === "suggest-title" && note.suggestedTitle && (
                <div>
                  <p className="ai-result-text ai-title-preview">
                    &ldquo;{note.suggestedTitle}&rdquo;
                  </p>
                  <button
                    className="ai-apply-btn"
                    onClick={() => {
                      setTitle(note.suggestedTitle!);
                      setAiPanel(null);
                    }}
                  >
                    Apply this title
                  </button>
                </div>
              )}

              {/* Loading state */}
              {aiLoading === aiPanel && (
                <div className="ai-loading-text">
                  <span className="spinner-sm" />
                  Thinking...
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Share Section ─────────────────── */}
        <div className="panel-section">
          <h4 className="panel-heading">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="11" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="3" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <circle cx="11" cy="11" r="1.5" stroke="currentColor" strokeWidth="1.2"/>
              <path d="M4.5 6.2l5-2.5M4.5 7.8l5 2.5"
                stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
            Share
          </h4>

          {/* Public toggle */}
          <div className="share-toggle-row">
            <div>
              <div className="share-toggle-label">Public link</div>
              <div className="share-toggle-sub">
                {isPublic ? "Anyone with the link can view" : "Only you can see this"}
              </div>
            </div>
            <button
              className={`toggle ${isPublic ? "toggle-on" : ""}`}
              onClick={handleShareToggle}
              role="switch"
              aria-checked={isPublic}
              aria-label="Toggle public sharing"
            >
              <span className="toggle-thumb" />
            </button>
          </div>

          {/* Share link */}
          {isPublic && shareId && (
            <div className="share-link-row">
              <input
                type="text"
                className="input share-link-input"
                value={`${typeof window !== "undefined" ? window.location.origin : ""}/shared/${shareId}`}
                readOnly
              />
              <button
                className={`copy-btn ${copied ? "copy-btn-success" : ""}`}
                onClick={handleCopyLink}
                title="Copy link"
              >
                {copied ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7l3 3 7-7"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="5" y="1" width="8" height="8" rx="1.5"
                      stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M9 9v3a1 1 0 01-1 1H2a1 1 0 01-1-1V6a1 1 0 011-1h3"
                      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── Note Info ────────────────────── */}
        <div className="panel-section note-info">
          <h4 className="panel-heading">Info</h4>
          <div className="info-rows">
            <div className="info-row">
              <span>Created</span>
              <span>{note ? new Date(note.createdAt).toLocaleDateString() : "—"}</span>
            </div>
            <div className="info-row">
              <span>Modified</span>
              <span>{note ? new Date(note.updatedAt).toLocaleDateString() : "—"}</span>
            </div>
            <div className="info-row">
              <span>Words</span>
              <span>
                {content.trim()
                  ? content.trim().split(/\s+/).length
                  : 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Scoped Styles ───────────────────── */}
      <style jsx>{`
        /* Page layout */
        .editor-page {
          display: flex;
          height: 100%;
          min-height: 100vh;
        }

        /* ── Editor column ── */
        .editor-column {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 0;
          min-width: 0;
          border-right: 1px solid var(--border-subtle);
        }

        /* Top bar */
        .editor-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 32px;
          border-bottom: 1px solid var(--border-subtle);
          background: var(--bg-surface);
          gap: 16px;
        }

        .back-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 13px;
          font-family: var(--font-body);
          cursor: pointer;
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          transition: all var(--transition-fast);
        }
        .back-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        /* Save status */
        .save-status {
          display: flex;
          align-items: center;
          font-size: 12px;
          min-width: 80px;
          justify-content: center;
        }
        .status-saving {
          display: flex;
          align-items: center;
          gap: 6px;
          color: var(--text-muted);
        }
        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent);
        }
        .status-saved {
          display: flex;
          align-items: center;
          gap: 5px;
          color: var(--success);
        }
        .status-error { color: var(--error); }

        /* Editor actions */
        .editor-actions {
          display: flex;
          gap: 8px;
        }
        .action-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: transparent;
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          color: var(--text-muted);
          font-size: 12px;
          font-family: var(--font-body);
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .action-chip:hover {
          background: var(--error-subtle);
          border-color: rgba(224,92,92,0.3);
          color: var(--error);
        }
        .action-chip:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Title */
        .title-input {
          padding: 28px 32px 12px;
          background: transparent;
          border: none;
          font-family: var(--font-display);
          font-size: 32px;
          color: var(--text-primary);
          width: 100%;
          outline: none;
          line-height: 1.2;
        }
        .title-input::placeholder { color: var(--text-muted); }

        /* Tags */
        .tags-row {
          padding: 0 32px 16px;
        }
        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          align-items: center;
          padding: 8px 12px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          min-height: 42px;
          cursor: text;
        }
        .tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .tag-remove {
          background: none;
          border: none;
          color: var(--accent);
          cursor: pointer;
          font-size: 14px;
          padding: 0;
          line-height: 1;
          opacity: 0.7;
          transition: opacity var(--transition-fast);
        }
        .tag-remove:hover { opacity: 1; }

        .tag-input {
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-family: var(--font-body);
          font-size: 13px;
          flex: 1;
          min-width: 120px;
        }
        .tag-input::placeholder { color: var(--text-muted); }

        /* Content textarea */
        .content-textarea {
          flex: 1;
          padding: 8px 32px 24px;
          background: transparent;
          border: none;
          outline: none;
          resize: none;
          font-family: var(--font-body);
          font-size: 15px;
          color: var(--text-primary);
          line-height: 1.8;
          min-height: 400px;
        }
        .content-textarea::placeholder { color: var(--text-muted); }

        /* Footer */
        .editor-footer {
          padding: 12px 32px;
          border-top: 1px solid var(--border-subtle);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .word-count,
        .last-saved {
          font-size: 12px;
          color: var(--text-muted);
          font-family: var(--font-mono);
        }

        /* ── Right panel ── */
        .right-panel {
          width: 280px;
          flex-shrink: 0;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 0;
        }

        @media (max-width: 900px) {
          .right-panel { display: none; }
        }

        .panel-section {
          padding: 20px;
          border-bottom: 1px solid var(--border-subtle);
        }

        .panel-heading {
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-muted);
          margin: 0 0 14px 0;
          font-family: var(--font-body);
        }

        /* AI buttons */
        .ai-buttons {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ai-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 9px 12px;
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: 13px;
          font-family: var(--font-body);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
        }
        .ai-btn:hover:not(:disabled) {
          background: var(--accent-muted);
          border-color: rgba(240,165,0,0.2);
          color: var(--accent);
        }
        .ai-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* AI result */
        .ai-result {
          margin-top: 14px;
          padding: 14px;
          background: var(--accent-muted);
          border: 1px solid rgba(240,165,0,0.15);
          border-radius: var(--radius-md);
        }
        .ai-result-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .ai-result-label {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--accent);
        }
        .ai-result-close {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 18px;
          cursor: pointer;
          padding: 0;
          line-height: 1;
          transition: color var(--transition-fast);
        }
        .ai-result-close:hover { color: var(--text-primary); }

        .ai-result-text {
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.7;
          margin: 0;
        }
        .ai-title-preview {
          font-style: italic;
          color: var(--text-primary);
          margin-bottom: 10px;
        }
        .ai-action-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .ai-action-list li {
          display: flex;
          gap: 8px;
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .action-bullet {
          color: var(--accent);
          flex-shrink: 0;
        }
        .ai-apply-btn {
          display: inline-flex;
          align-items: center;
          padding: 6px 12px;
          background: var(--accent);
          color: var(--text-inverse);
          border: none;
          border-radius: var(--radius-sm);
          font-size: 12px;
          font-weight: 600;
          font-family: var(--font-body);
          cursor: pointer;
          transition: background var(--transition-fast);
        }
        .ai-apply-btn:hover { background: var(--accent-hover); }

        .ai-loading-text {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: var(--text-muted);
          margin-top: 8px;
        }

        /* Share */
        .share-toggle-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 12px;
        }
        .share-toggle-label {
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 2px;
        }
        .share-toggle-sub {
          font-size: 11px;
          color: var(--text-muted);
        }

        /* Toggle switch */
        .toggle {
          width: 40px;
          height: 22px;
          border-radius: 100px;
          background: var(--border-default);
          border: none;
          cursor: pointer;
          position: relative;
          transition: background var(--transition-normal);
          flex-shrink: 0;
          padding: 0;
        }
        .toggle-on { background: var(--accent); }
        .toggle-thumb {
          position: absolute;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: white;
          top: 3px;
          left: 3px;
          transition: transform var(--transition-normal);
          box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        }
        .toggle-on .toggle-thumb {
          transform: translateX(18px);
        }

        /* Share link */
        .share-link-row {
          display: flex;
          gap: 8px;
        }
        .share-link-input {
          font-size: 11px;
          font-family: var(--font-mono);
          color: var(--text-muted);
          padding: 8px 10px;
          flex: 1;
          min-width: 0;
        }
        .copy-btn {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-elevated);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          color: var(--text-muted);
          cursor: pointer;
          flex-shrink: 0;
          transition: all var(--transition-fast);
        }
        .copy-btn:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }
        .copy-btn-success {
          background: var(--success-subtle);
          border-color: rgba(76,175,125,0.3);
          color: var(--success);
        }

        /* Info rows */
        .info-rows {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .info-row {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }
        .info-row span:first-child { color: var(--text-muted); }
        .info-row span:last-child {
          color: var(--text-secondary);
          font-family: var(--font-mono);
        }

        /* Spinners */
        .spinner-sm {
          width: 12px;
          height: 12px;
          border: 1.5px solid rgba(240,165,0,0.3);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          display: inline-block;
          flex-shrink: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}