"use client";

// components/notes/NoteEditor.tsx
// Comprehensive note editor component with auto-save, AI features, and tag management.
// Handles both creation and editing of notes.
//
// Features:
//   - Real-time auto-save (debounced)
//   - Title and content editing
//   - Tag management with TagInput component
//   - AI features (summary, action items, suggested title)
//   - Auto-save status indicator
//   - Keyboard shortcuts (Cmd+S to save)
//   - Unsaved changes warning
//   - Loading states for AI operations
//   - Error handling
//   - Dark mode support

import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Note } from "@/types";
import { TagInput } from "./TagInput";
import {
  Save,
  Loader,
  AlertCircle,
  Sparkles,
  CheckCircle,
  Clock,
  Wand2,
  BookOpen,
  ListTodo,
  Lightbulb,
} from "lucide-react";

interface NoteEditorProps {
  noteId?: string;
  initialNote?: Note;
  onSave?: (note: Note) => void;
}

interface EditorState {
  title: string;
  content: string;
  tags: string[];
}

interface SaveState {
  status: "idle" | "saving" | "saved" | "error";
  lastSavedAt: Date | null;
  error: string | null;
}

interface AIState {
  generating: boolean;
  feature: "summary" | "actionItems" | "suggestedTitle" | null;
  error: string | null;
}

export function NoteEditor({
  noteId,
  initialNote,
  onSave,
}: NoteEditorProps) {
  // ─────────────────────────────────────────────
  // State Management
  // ─────────────────────────────────────────────
  const router = useRouter();
  const [editorState, setEditorState] = useState<EditorState>({
    title: initialNote?.title || "",
    content: initialNote?.content || "",
    tags: initialNote?.tags || [],
  });

  const [displayState, setDisplayState] = useState({
    summary: initialNote?.summary || null,
    actionItems: initialNote?.actionItems || [],
    suggestedTitle: initialNote?.suggestedTitle || null,
  });

  const [saveState, setSaveState] = useState<SaveState>({
    status: "idle",
    lastSavedAt: initialNote ? new Date(initialNote.lastSavedAt) : null,
    error: null,
  });

  const [aiState, setAIState] = useState<AIState>({
    generating: false,
    feature: null,
    error: null,
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Refs for debouncing
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // ─────────────────────────────────────────────
  // Computed Values
  // ─────────────────────────────────────────────

  const hasChanges = useMemo(() => {
    if (!initialNote) return true;
    return (
      editorState.title !== initialNote.title ||
      editorState.content !== initialNote.content ||
      JSON.stringify(editorState.tags) !== JSON.stringify(initialNote.tags)
    );
  }, [editorState, initialNote]);

  // ─────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────

  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(hasChanges);
  }, [hasChanges]);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // Auto-save on changes (debounced)
  useEffect(() => {
    if (!hasChanges) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout (auto-save after 2 seconds of inactivity)
    setSaveState((prev) => ({ ...prev, status: "saving" }));

    saveTimeoutRef.current = setTimeout(() => {
      handleSave();
    }, 2000);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [editorState, hasChanges]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+S or Ctrl+S to save
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editorState]);

  // ─────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!hasChanges) return;

    try {
      setSaveState((prev) => ({ ...prev, status: "saving", error: null }));

      const method = noteId ? "PATCH" : "POST";
      const endpoint = noteId ? `/api/notes/${noteId}` : "/api/notes";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editorState.title || "Untitled Note",
          content: editorState.content,
          tags: editorState.tags,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save note");
      }

      const result = await response.json();
      const savedNote = result.data;

      // Update initial note to reflect saved state
      if (!noteId) {
        // New note created - redirect to edit page
        router.push(`/dashboard/notes/${savedNote.id}`);
      }

      setSaveState({
        status: "saved",
        lastSavedAt: new Date(),
        error: null,
      });

      // Reset saving status after 2 seconds
      setTimeout(() => {
        setSaveState((prev) =>
          prev.status === "saved" ? { ...prev, status: "idle" } : prev
        );
      }, 2000);

      if (onSave) {
        onSave(savedNote);
      }
    } catch (error) {
      console.error("Error saving note:", error);
      setSaveState((prev) => ({
        ...prev,
        status: "error",
        error: "Failed to save note. Please try again.",
      }));
    }
  }, [editorState, hasChanges, noteId, router, onSave]);

  const handleGenerateAI = useCallback(
    async (feature: "summary" | "actionItems" | "suggestedTitle") => {
      if (!noteId || !editorState.content.trim()) {
        setAIState((prev) => ({
          ...prev,
          error:
            "Please write some content and save the note before generating AI features.",
        }));
        return;
      }

      try {
        setAIState({ generating: true, feature, error: null });

        const response = await fetch(`/api/notes/${noteId}/ai`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ feature }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate AI content");
        }

        const result = await response.json();
        const data = result.data;

        // Update display state with new AI content
        setDisplayState((prev) => ({
          ...prev,
          summary: data.summary || prev.summary,
          actionItems: data.actionItems || prev.actionItems,
          suggestedTitle: data.suggestedTitle || prev.suggestedTitle,
        }));

        setAIState({ generating: false, feature: null, error: null });
      } catch (error) {
        console.error("Error generating AI content:", error);
        setAIState((prev) => ({
          ...prev,
          generating: false,
          error: "Failed to generate AI content. Please try again.",
        }));
      }
    },
    [noteId, editorState.content]
  );

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);

    if (diffSecs < 60) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900">
      {/* Top Bar - Title and Save Status */}
      <div className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          {/* Title Input */}
          <div className="flex-1">
            <input
              type="text"
              value={editorState.title}
              onChange={(e) =>
                setEditorState((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="Untitled Note"
              className="w-full text-2xl font-bold text-slate-900 dark:text-white bg-transparent outline-none placeholder-slate-400 dark:placeholder-slate-500"
            />
          </div>

          {/* Save Status and Button */}
          <div className="flex items-center gap-3 ml-4">
            {/* Status Indicator */}
            <div className="flex items-center gap-2 text-sm">
              {saveState.status === "saving" && (
                <>
                  <Loader className="w-4 h-4 text-blue-600 animate-spin" />
                  <span className="text-slate-600 dark:text-slate-400">
                    Saving...
                  </span>
                </>
              )}
              {saveState.status === "saved" && (
                <>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span className="text-green-600">Saved</span>
                </>
              )}
              {saveState.status === "error" && (
                <>
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <span className="text-red-600">Error</span>
                </>
              )}
              {saveState.status === "idle" && saveState.lastSavedAt && (
                <>
                  <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  <span className="text-slate-600 dark:text-slate-400">
                    {formatLastSaved(saveState.lastSavedAt)}
                  </span>
                </>
              )}
            </div>

            {/* Manual Save Button */}
            <button
              onClick={handleSave}
              disabled={!hasChanges || saveState.status === "saving"}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Save className="w-4 h-4" />
              <span className="hidden sm:inline">Save</span>
            </button>
          </div>
        </div>

        {/* Error Message */}
        {saveState.error && (
          <div className="mt-2 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            {saveState.error}
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden flex gap-4 px-6 py-6">
        {/* Editor Section */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Tags Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Tags
            </label>
            <TagInput
              tags={editorState.tags}
              onChange={(tags) =>
                setEditorState((prev) => ({ ...prev, tags }))
              }
            />
          </div>

          {/* Content Editor */}
          <div className="flex-1 flex flex-col">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Content
            </label>
            <textarea
              ref={contentRef}
              value={editorState.content}
              onChange={(e) =>
                setEditorState((prev) => ({ ...prev, content: e.target.value }))
              }
              placeholder="Write your notes here..."
              className="flex-1 p-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>
        </div>

        {/* Sidebar - AI Features and Preview */}
        <div className="w-80 flex flex-col gap-6 overflow-y-auto">
          {/* AI Features Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              AI Features
            </h3>

            {/* AI Error */}
            {aiState.error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-600 dark:text-red-400 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{aiState.error}</span>
              </div>
            )}

            {/* Generate Summary Button */}
            <button
              onClick={() => handleGenerateAI("summary")}
              disabled={
                aiState.generating ||
                !noteId ||
                !editorState.content.trim()
              }
              className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {aiState.generating && aiState.feature === "summary" ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" />
                  <span>Generate Summary</span>
                </>
              )}
            </button>

            {/* Generate Action Items Button */}
            <button
              onClick={() => handleGenerateAI("actionItems")}
              disabled={
                aiState.generating ||
                !noteId ||
                !editorState.content.trim()
              }
              className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {aiState.generating && aiState.feature === "actionItems" ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <ListTodo className="w-4 h-4" />
                  <span>Extract Action Items</span>
                </>
              )}
            </button>

            {/* Generate Title Suggestion Button */}
            <button
              onClick={() => handleGenerateAI("suggestedTitle")}
              disabled={
                aiState.generating ||
                !noteId ||
                !editorState.content.trim()
              }
              className="w-full flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {aiState.generating && aiState.feature === "suggestedTitle" ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Lightbulb className="w-4 h-4" />
                  <span>Suggest Title</span>
                </>
              )}
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-slate-200 dark:border-slate-700" />

          {/* Preview Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-blue-500" />
              Preview
            </h3>

            {/* Summary Preview */}
            {displayState.summary && (
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-1">
                  <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  Summary
                </h4>
                <p className="text-sm text-slate-700 dark:text-slate-300 line-clamp-4">
                  {displayState.summary}
                </p>
              </div>
            )}

            {/* Action Items Preview */}
            {displayState.actionItems && displayState.actionItems.length > 0 && (
              <div className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-1">
                  <ListTodo className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  Action Items
                </h4>
                <ul className="space-y-1">
                  {displayState.actionItems.slice(0, 3).map((item, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2"
                    >
                      <span className="text-blue-600 dark:text-blue-400 flex-shrink-0">
                        •
                      </span>
                      <span className="line-clamp-2">{item}</span>
                    </li>
                  ))}
                  {displayState.actionItems.length > 3 && (
                    <li className="text-sm text-slate-600 dark:text-slate-400 italic">
                      +{displayState.actionItems.length - 3} more
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Suggested Title Preview */}
            {displayState.suggestedTitle && (
              <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-1">
                  <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Suggested Title
                </h4>
                <p className="text-sm font-medium text-slate-900 dark:text-white italic">
                  "{displayState.suggestedTitle}"
                </p>
              </div>
            )}

            {!displayState.summary &&
              !displayState.actionItems &&
              !displayState.suggestedTitle && (
                <p className="text-sm text-slate-600 dark:text-slate-400 text-center py-4">
                  AI previews will appear here
                </p>
              )}
          </div>
        </div>
      </div>

      {/* Scoped Styles */}
      <style jsx>{`
        /* Smooth scroll in sidebar */
        .overflow-y-auto {
          scroll-behavior: smooth;
        }
      `}</style>
    </div>
  );
}
