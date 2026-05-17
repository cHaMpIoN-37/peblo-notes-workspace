"use client";

// app/shared/[shareId]/page.tsx
// Public page for viewing shared notes.
// No authentication required — anyone with the link can view.
//
// Features:
//   - Loads note from /api/shared/[shareId]
//   - Displays title, content, tags, summary, action items
//   - Shows creation date and last saved time
//   - Responsive design optimized for reading
//   - Copy-to-clipboard for note content
//   - Error handling for invalid/private notes

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Note } from "@/types";
import { Loading } from "@/components/common/Loading";
import { EmptyState } from "@/components/common/EmptyState";
import { CheckCircle, Copy, AlertCircle, Clock } from "lucide-react";

export default function SharedNotePage() {
  const params = useParams();
  const shareId = params?.shareId as string;

  // ─────────────────────────────────────────────
  // State Management
  // ─────────────────────────────────────────────
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // ─────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────
  
  // Fetch shared note on mount
  useEffect(() => {
    if (!shareId) {
      setError("Invalid share link.");
      setLoading(false);
      return;
    }

    const fetchSharedNote = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/shared/${shareId}`);
        const result = await response.json();

        if (!response.ok) {
          setError(result.error || "Failed to load shared note.");
          setNote(null);
        } else {
          setNote(result.data);
          setError(null);
        }
      } catch (err) {
        console.error("Error fetching shared note:", err);
        setError("Failed to load shared note. Please try again.");
        setNote(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSharedNote();
  }, [shareId]);

  // ─────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────

  const handleCopyContent = async () => {
    if (!note) return;

    try {
      await navigator.clipboard.writeText(note.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4">
        <EmptyState
          icon={AlertCircle}
          title="Unable to Load Note"
          description={error}
          action={{
            label: "Go Home",
            href: "/",
          }}
        />
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center px-4">
        <EmptyState
          icon={AlertCircle}
          title="Note Not Found"
          description="This note doesn't exist or is no longer shared."
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-sm font-medium text-slate-600 dark:text-slate-400">
              Shared Note
            </h1>
          </div>
          <a
            href="/"
            className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Back
          </a>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <article className="bg-white dark:bg-slate-800 rounded-lg shadow-lg overflow-hidden">
          {/* Title Section */}
          <div className="px-6 sm:px-8 py-8 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4 break-words">
              {note.title}
            </h2>

            {/* Metadata */}
            <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>Created {formatDate(note.createdAt)}</span>
              </div>
              {note.updatedAt !== note.createdAt && (
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>Updated {formatDate(note.updatedAt)}</span>
                </div>
              )}
            </div>

            {/* Tags */}
            {note.tags && note.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Note Content */}
          <div className="px-6 sm:px-8 py-8 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Note
              </h3>
              <button
                onClick={handleCopyContent}
                className="flex items-center gap-1 px-3 py-1 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                {copied ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words leading-relaxed">
                {note.content}
              </p>
            </div>
          </div>

          {/* Summary Section */}
          {note.summary && (
            <div className="px-6 sm:px-8 py-8 border-b border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/10">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-400">✨</span>
                AI Summary
              </h3>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {note.summary}
              </p>
            </div>
          )}

          {/* Action Items Section */}
          {note.actionItems && note.actionItems.length > 0 && (
            <div className="px-6 sm:px-8 py-8 border-b border-slate-200 dark:border-slate-700 bg-green-50 dark:bg-green-900/10">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="text-green-600 dark:text-green-400">📋</span>
                Action Items
              </h3>
              <ul className="space-y-2">
                {note.actionItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-3 text-slate-700 dark:text-slate-300"
                  >
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-200 dark:bg-green-800 flex items-center justify-center text-xs font-bold text-green-800 dark:text-green-200 mt-0.5">
                      {idx + 1}
                    </span>
                    <span className="flex-1">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggested Title (if available) */}
          {note.suggestedTitle && (
            <div className="px-6 sm:px-8 py-8 bg-amber-50 dark:bg-amber-900/10">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                <span className="text-amber-600 dark:text-amber-400">💡</span>
                Suggested Title
              </h3>
              <p className="text-slate-700 dark:text-slate-300 italic">
                "{note.suggestedTitle}"
              </p>
            </div>
          )}
        </article>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
          <p>
            This is a publicly shared note.{" "}
            <a
              href="/"
              className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Create your own notes
            </a>
          </p>
        </div>
      </div>

      {/* Scoped Styles */}
      <style jsx>{`
        .prose {
          color: inherit;
        }

        .prose p {
          margin: 0;
        }
      `}</style>
    </div>
  );
}
