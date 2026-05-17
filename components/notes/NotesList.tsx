"use client";

// components/notes/NotesList.tsx
// List/grid container for displaying multiple notes.
// Handles fetching, searching, filtering, and deletion.
//
// Features:
//   - Grid/list view toggle
//   - Search functionality
//   - Tag filtering
//   - Sort options (newest, oldest, alphabetical)
//   - Note creation and deletion
//   - Empty state handling
//   - Loading states
//   - Error handling

import { useEffect, useState, useCallback } from "react";
import { Note } from "@/types";
import { NoteCard } from "./NoteCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Loading } from "@/components/common/Loading";
import {
  Grid3X3,
  List,
  Search,
  ChevronDown,
  Loader,
  AlertCircle,
} from "lucide-react";

interface NotesListProps {
  onCreateNote?: () => void;
}

type ViewMode = "grid" | "list";
type SortOption = "newest" | "oldest" | "alphabetical";

export function NotesList({ onCreateNote }: NotesListProps) {
  // ─────────────────────────────────────────────
  // State Management
  // ─────────────────────────────────────────────
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  // ─────────────────────────────────────────────
  // Fetch Notes
  // ─────────────────────────────────────────────
  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/notes");

      if (!response.ok) {
        throw new Error("Failed to fetch notes");
      }

      const result = await response.json();
      const notesData = result.data || [];
      setNotes(notesData);
      setError(null);
    } catch (err) {
      console.error("Error fetching notes:", err);
      setError("Failed to load notes. Please try again.");
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch notes on mount
  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // ─────────────────────────────────────────────
  // Filter and Sort Notes
  // ─────────────────────────────────────────────
  useEffect(() => {
    let filtered = [...notes];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(query) ||
          note.content.toLowerCase().includes(query)
      );
    }

    // Apply tag filter
    if (selectedTag) {
      filtered = filtered.filter((note) =>
        note.tags.some((tag) => tag === selectedTag)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "alphabetical":
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });

    setFilteredNotes(filtered);
  }, [notes, searchQuery, selectedTag, sortBy]);

  // ─────────────────────────────────────────────
  // Get All Unique Tags
  // ─────────────────────────────────────────────
  const allTags = Array.from(
    new Set(notes.flatMap((note) => note.tags))
  ).sort();

  // ─────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────

  const handleDeleteNote = async (noteId: string) => {
    try {
      setDeletingNoteId(noteId);

      const response = await fetch(`/api/notes/${noteId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete note");
      }

      // Remove from local state
      setNotes((prev) => prev.filter((note) => note.id !== noteId));
      setDeletingNoteId(null);
    } catch (err) {
      console.error("Error deleting note:", err);
      setDeletingNoteId(null);
      setError("Failed to delete note. Please try again.");
    }
  };

  const handleShareNote = async (noteId: string): Promise<string> => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPublic: true }),
      });

      if (!response.ok) {
        throw new Error("Failed to share note");
      }

      const result = await response.json();
      const shareId = result.data.shareId;

      // Update local state
      setNotes((prev) =>
        prev.map((note) =>
          note.id === noteId
            ? { ...note, isPublic: true, shareId }
            : note
        )
      );

      // Return the public URL
      const shareUrl = `${window.location.origin}/shared/${shareId}`;
      return shareUrl;
    } catch (err) {
      console.error("Error sharing note:", err);
      throw err;
    }
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  if (loading) {
    return <Loading />;
  }

  if (error && notes.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <EmptyState
          icon={AlertCircle}
          title="Failed to Load Notes"
          description={error}
          action={{
            label: "Try Again",
            onClick: fetchNotes,
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            My Notes
          </h1>
          <button
            onClick={onCreateNote}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            + New Note
          </button>
        </div>

        {/* Controls Section */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              <span className="text-sm font-medium">
                {sortBy === "newest"
                  ? "Newest"
                  : sortBy === "oldest"
                  ? "Oldest"
                  : "A-Z"}
              </span>
              <ChevronDown className="w-4 h-4" />
            </button>

            {showSortDropdown && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden z-10">
                {[
                  { value: "newest" as SortOption, label: "Newest First" },
                  { value: "oldest" as SortOption, label: "Oldest First" },
                  { value: "alphabetical" as SortOption, label: "A - Z" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setShowSortDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                      sortBy === option.value
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                        : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 border border-slate-300 dark:border-slate-600 rounded-lg p-1 bg-white dark:bg-slate-800">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded transition-colors ${
                viewMode === "grid"
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
              title="Grid view"
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded transition-colors ${
                viewMode === "list"
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700"
              }`}
              title="List view"
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tags Filter */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedTag === null
                  ? "bg-blue-600 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600"
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  selectedTag === tag
                    ? "bg-blue-600 text-white"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-600"
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        {/* Results Count */}
        {(searchQuery || selectedTag) && (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Found {filteredNotes.length} note{filteredNotes.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Notes Grid/List */}
      {filteredNotes.length === 0 ? (
        <div className="flex items-center justify-center min-h-96">
          <EmptyState
            icon={searchQuery || selectedTag ? AlertCircle : undefined}
            title={
              searchQuery || selectedTag
                ? "No Notes Found"
                : "No Notes Yet"
            }
            description={
              searchQuery || selectedTag
                ? "Try adjusting your search or filters"
                : "Create your first note to get started"
            }
            action={
              searchQuery || selectedTag
                ? {
                    label: "Clear Filters",
                    onClick: () => {
                      setSearchQuery("");
                      setSelectedTag(null);
                    },
                  }
                : {
                    label: "Create Note",
                    onClick: onCreateNote,
                  }
            }
          />
        </div>
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max"
              : "space-y-3"
          }
        >
          {filteredNotes.map((note) => (
            <div key={note.id} className={viewMode === "list" ? "" : ""}>
              <NoteCard
                note={note}
                onDelete={handleDeleteNote}
                onShare={handleShareNote}
                isDeleting={deletingNoteId === note.id}
              />
            </div>
          ))}
        </div>
      )}

      {/* Error Toast */}
      {error && notes.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white rounded-lg p-4 shadow-lg z-40 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
