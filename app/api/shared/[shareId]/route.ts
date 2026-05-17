// app/api/shared/[shareId]/route.ts
// Public API endpoint for shared notes.
// No authentication required — accessible by anyone with the share link.
//
// GET /api/shared/[shareId]
//   → Returns a sanitized public view of the note
//   → Only works if note.isPublic === true
//   → Never exposes userId or private fields

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { parseNote } from "@/types";

// ─────────────────────────────────────────────
// GET /api/shared/[shareId]
// ─────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: { shareId: string } }
) {
  try {
    const { shareId } = params;

    // 1. Validate shareId format (basic sanity check)
    if (!shareId || shareId.length < 6) {
      return NextResponse.json(
        { error: "Invalid share link." },
        { status: 400 }
      );
    }

    // 2. Find note by shareId
    const note = await prisma.note.findUnique({
      where: { shareId },
    });

    // 3. Note not found
    if (!note) {
      return NextResponse.json(
        { error: "This note doesn't exist or the link is invalid." },
        { status: 404 }
      );
    }

    // 4. Note exists but owner made it private again
    if (!note.isPublic) {
      return NextResponse.json(
        {
          error:
            "This note is no longer public. The owner may have disabled sharing.",
        },
        { status: 403 }
      );
    }

    // 5. Parse the note (converts JSON strings → arrays)
    const parsed = parseNote(note);

    // 6. Return only safe public fields — never expose userId
    const publicNote = {
      id:            parsed.id,
      title:         parsed.title,
      content:       parsed.content,
      tags:          parsed.tags,
      summary:       parsed.summary,
      actionItems:   parsed.actionItems,
      createdAt:     parsed.createdAt,
      updatedAt:     parsed.updatedAt,
      lastSavedAt:   parsed.lastSavedAt,
    };

    return NextResponse.json(
      { data: publicNote },
      {
        status: 200,
        headers: {
          // Cache public notes for 60 seconds on CDN edge
          // Revalidates in background — good balance of freshness + performance
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=30",
        },
      }
    );

  } catch (error) {
    console.error("[GET /api/shared/[shareId]]", error);
    return NextResponse.json(
      { error: "Failed to load shared note." },
      { status: 500 }
    );
  }
}