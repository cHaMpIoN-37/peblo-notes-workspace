"use client";

// components/notes/NoteCard.tsx
// Individual note card component for displaying notes in a grid/list.
// Shows note preview, tags, timestamps, and quick actions.
//
// Features:
//   - Note title and content preview
//   - Tag display
//   - Creation/update timestamps
//   - Quick action buttons (edit, delete, share)
//   - Copy share link functionality
//   - Dark mode support
//   - Loading and error states

import { Note } from "@/types";
import Link from "next/link";
import { useState } from "react";
import {
  Trash2,
  Share2,
  Edit2,
  Copy,
  CheckCircle,
  AlertCircle,
  Lock,
} from "lucide-react";

interface NoteCardProps {
  note: Note;
  onDelete: (noteId: string) => Promise<void>;
  onShare: (noteId: string) => Promise<string>;
  isDeleting?: boolean;
}

export function NoteCard({
  note,
  onDelete,
  onShare,
  isDeleting = false,
}: NoteCardProps) {
  // ─────────────────────────────────────────────
  // State Management
  // ─────────────────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  // ─────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────

  const handleDelete = async () => {
    try {
      await onDelete(note.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error("Failed to delete note:", error);
      setShowDeleteConfirm(false);
    }
  };

  const handleShare = async () => {
    try {
      setIsSharing(true);
      setShareError(null);
      const link = await onShare(note.id);
      setShareLink(link);
    } catch (error) {
      console.error("Failed to share note:", error);
      setShareError("Failed to generate share link");
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyShareLink = async () => {
    if (!shareLink) return;

    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  };

  const getContentPreview = (content: string, maxLength: number = 120) => {
    if (!content) return "No content yet...";
    return content.length > maxLength
      ? content.substring(0, maxLength) + "..."
      : content;
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <>
      <div className="group relative bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md dark:hover:shadow-lg hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-200 overflow-hidden flex flex-col h-full">
        {/* Card Header */}
        <div className="p-4 pb-3 border-b border-slate-200 dark:border-slate-700">
          <Link
            href={`/dashboard/notes/${note.id}`}
            className="group/title"
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white line-clamp-2 group-hover/title:text-blue-600 dark:group-hover/title:text-blue-400 transition-colors">
              {note.title || "Untitled Note"}
            </h3>
          </Link>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {formatDate(note.createdAt)}
          </p>
        </div>

        {/* Card Content */}
        <div className="flex-1 p-4">
          {/* Content Preview */}
          <Link href={`/dashboard/notes/${note.id}`} className="block mb-3">
            <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3 hover:text-slate-900 dark:hover:text-slate-300 transition-colors">
              {getContentPreview(note.content)}
            </p>
          </Link>

          {/* Tags */}
          {note.tags && note.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {note.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                >
                  #{tag}
                </span>
              ))}
              {note.tags.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 text-xs font-medium text-slate-600 dark:text-slate-400">
                  +{note.tags.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* AI Summary Badge (if available) */}
          {note.summary && (
            <div className="mt-3 flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
              <span className="text-yellow-600 dark:text-yellow-400">✨</span>
              <span>AI summary available</span>
            </div>
          )}
        </div>

        {/* Card Footer - Actions */}
        <div className="p-4 pt-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center justify-between gap-2">
            {/* Public/Private Badge */}
            <div className="flex items-center gap-1">
              {note.isPublic ? (
                <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">
                  <Share2 className="w-3 h-3" />
                  <span>Public</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">
                  <Lock className="w-3 h-3" />
                  <span>Private</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              {/* Edit Button */}
              <Link
                href={`/dashboard/notes/${note.id}`}
                className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-md transition-colors"
                title="Edit note"
              >
                <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </Link>

              {/* Share Button */}
              <button
                onClick={handleShare}
                disabled={isSharing}
                className="p-1.5 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-md transition-colors disabled:opacity-50"
                title={note.isPublic ? "Generate new share link" : "Share note"}
              >
                <Share2 className="w-4 h-4 text-green-600 dark:text-green-400" />
              </button>

              {/* Delete Button */}
              <button
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting}
                className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-md transition-colors disabled:opacity-50"
                title="Delete note"
              >
                <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Share Link Modal */}
      {shareLink && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Share This Note
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              Anyone with this link can view your note:
            </p>

            {/* Link Display */}
            <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-3 mb-4 flex items-center justify-between gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white outline-none truncate"
              />
              <button
                onClick={handleCopyShareLink}
                className="flex-shrink-0 p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors"
              >
                {copied ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                )}
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShareLink(null)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Delete Note?
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              This action cannot be undone. Are you sure you want to delete this
              note?
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg font-medium hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Error Toast */}
      {shareError && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white rounded-lg p-4 shadow-lg z-40 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{shareError}</span>
        </div>
      )}
    </>
  );
}
