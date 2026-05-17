// src/app/shared/[shareId]/page.tsx
// Public note view — accessible without login via share link

import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";

interface Props {
  params: { shareId: string };
}

export default async function SharedNotePage({ params }: Props) {
  const note = await prisma.note.findFirst({
    where: { shareId: params.shareId, isPublic: true },
    include: { user: { select: { name: true } } },
  });

  if (!note) notFound();

  let tags: string[] = [];
  try { tags = JSON.parse(note.tags); } catch { tags = []; }

  let actionItems: string[] | null = null;
  try { if (note.actionItems) actionItems = JSON.parse(note.actionItems); } catch { actionItems = null; }

  return (
    <div className="min-h-screen bg-stone-50 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Brand */}
        <p className="text-sm font-semibold text-amber-500 mb-8">
          peblo<span className="text-stone-400 font-normal">.notes</span> — shared note
        </p>

        <article className="bg-white border border-stone-200 rounded-2xl p-8 shadow-sm">
          {/* Title */}
          <h1 className="text-3xl font-bold text-stone-900 leading-tight">
            {note.title || "Untitled Note"}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-3 mt-3 text-sm text-stone-400">
            {note.user?.name && <span>by {note.user.name}</span>}
            <span>·</span>
            <span>
              {new Date(note.updatedAt).toLocaleDateString("en", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {tags.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-full text-xs font-medium"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Divider */}
          <hr className="my-6 border-stone-100" />

          {/* Content */}
          <div className="text-stone-700 text-base leading-relaxed whitespace-pre-wrap">
            {note.content || <em className="text-stone-300">Empty note.</em>}
          </div>

          {/* AI insights */}
          {(note.summary || (actionItems && actionItems.length > 0)) && (
            <div className="mt-8 p-5 bg-amber-50 border border-amber-200 rounded-xl space-y-4">
              <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
                ✨ AI Insights
              </p>
              {note.suggestedTitle && (
                <div>
                  <p className="text-xs text-amber-500 font-medium mb-0.5">Suggested title</p>
                  <p className="text-sm text-stone-700 font-medium">{note.suggestedTitle}</p>
                </div>
              )}
              {note.summary && (
                <div>
                  <p className="text-xs text-amber-500 font-medium mb-0.5">Summary</p>
                  <p className="text-sm text-stone-600 leading-relaxed">{note.summary}</p>
                </div>
              )}
              {actionItems && actionItems.length > 0 && (
                <div>
                  <p className="text-xs text-amber-500 font-medium mb-1">Action items</p>
                  <ul className="space-y-1">
                    {actionItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-stone-600">
                        <span className="mt-0.5 w-4 h-4 shrink-0 rounded border border-amber-300 bg-white flex items-center justify-center text-[10px] text-amber-500">
                          {i + 1}
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </article>

        <p className="text-center text-xs text-stone-300 mt-8">
          Shared via peblo.notes
        </p>
      </div>
    </div>
  );
}