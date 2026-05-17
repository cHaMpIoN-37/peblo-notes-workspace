// app/api/notes/[id]/route.ts
// Handles single note endpoints:
//   GET    /api/notes/[id]  → fetch one note
//   PATCH  /api/notes/[id]  → update note (also used for auto-save)
//   DELETE /api/notes/[id]  → delete note permanently

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { parseNote } from "@/types";
import type { UpdateNoteInput } from "@/types";
import { nanoid } from "nanoid";

// ─────────────────────────────────────────────
// Helper: verify note belongs to current user
// Returns the raw note or null
// ─────────────────────────────────────────────
async function getNoteForUser(noteId: string, userId: string) {
  return prisma.note.findFirst({
    where: {
      id:     noteId,
      userId: userId,   // ensures users can't access each other's notes
    },
  });
}

// ─────────────────────────────────────────────
// GET /api/notes/[id]
// Fetch a single note by ID
// ─────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const note = await getNoteForUser(params.id, session.user.id);

    if (!note) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    return NextResponse.json({ data: parseNote(note) }, { status: 200 });

  } catch (error) {
    console.error("[GET /api/notes/[id]]", error);
    return NextResponse.json(
      { error: "Failed to fetch note." },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────
// PATCH /api/notes/[id]
// Update any fields of a note.
// Also handles:
//   - Auto-save (updates lastSavedAt)
//   - Toggling isPublic (generates shareId if needed)
//   - Archiving/restoring
// Body: Partial<UpdateNoteInput>
// ─────────────────────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // 1. Verify ownership
    const existing = await getNoteForUser(params.id, session.user.id);
    if (!existing) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    // 2. Parse update body
    const body: UpdateNoteInput = await req.json().catch(() => ({}));
    const {
      title,
      content,
      tags,
      summary,
      actionItems,
      suggestedTitle,
      isPublic,
      isArchived,
    } = body;

    // 3. Build update data object — only include provided fields
    const updateData: Record<string, unknown> = {
      lastSavedAt: new Date(), // always update on any PATCH (auto-save)
    };

    if (title      !== undefined) updateData.title      = title.trim();
    if (content    !== undefined) updateData.content    = content;
    if (summary    !== undefined) updateData.summary    = summary;
    if (suggestedTitle !== undefined) updateData.suggestedTitle = suggestedTitle;
    if (isArchived !== undefined) updateData.isArchived = isArchived;

    // Serialize arrays back to JSON strings for SQLite
    if (tags !== undefined) {
      updateData.tags = JSON.stringify(
        Array.isArray(tags) ? tags : []
      );
    }

    if (actionItems !== undefined) {
      updateData.actionItems = JSON.stringify(
        Array.isArray(actionItems) ? actionItems : []
      );
    }

    // Handle isPublic toggle:
    // When making public → generate a unique shareId if one doesn't exist
    // When making private → keep shareId (so old links just stop working)
    if (isPublic !== undefined) {
      updateData.isPublic = isPublic;
      if (isPublic && !existing.shareId) {
        updateData.shareId = nanoid(12); // e.g. "V1StGXR8_Z5j"
      }
    }

    // 4. Validate title length if being updated
    if (title && title.trim().length > 200) {
      return NextResponse.json(
        { error: "Title must be under 200 characters." },
        { status: 400 }
      );
    }

    // 5. Perform update
    const updated = await prisma.note.update({
      where: { id: params.id },
      data:  updateData,
    });

    return NextResponse.json(
      { data: parseNote(updated), message: "Note updated." },
      { status: 200 }
    );

  } catch (error) {
    console.error("[PATCH /api/notes/[id]]", error);
    return NextResponse.json(
      { error: "Failed to update note." },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────
// DELETE /api/notes/[id]
// Permanently deletes a note.
// ─────────────────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // 1. Verify ownership before deleting
    const existing = await getNoteForUser(params.id, session.user.id);
    if (!existing) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    // 2. Hard delete
    await prisma.note.delete({
      where: { id: params.id },
    });

    return NextResponse.json(
      { message: "Note deleted successfully." },
      { status: 200 }
    );

  } catch (error) {
    console.error("[DELETE /api/notes/[id]]", error);
    return NextResponse.json(
      { error: "Failed to delete note." },
      { status: 500 }
    );
  }
}