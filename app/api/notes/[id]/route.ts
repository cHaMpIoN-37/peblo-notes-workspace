// src/app/api/notes/[id]/route.ts
// PATCH  /api/notes/:id   — update note fields
// DELETE /api/notes/:id   — delete a note

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { nanoid } from "nanoid";

function parseNote(note: {
  id: string;
  title: string;
  content: string;
  tags: string;
  summary: string | null;
  actionItems: string | null;
  suggestedTitle: string | null;
  isPublic: boolean;
  shareId: string | null;
  lastSavedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}) {
  return {
    ...note,
    tags: (() => {
      try { return JSON.parse(note.tags); } catch { return []; }
    })(),
    actionItems: (() => {
      if (!note.actionItems) return null;
      try { return JSON.parse(note.actionItems); } catch { return null; }
    })(),
  };
}


export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const note = await prisma.note.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  return NextResponse.json({ note: parseNote(note) });
}

// PATCH /api/notes/:id
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.note.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const body = await req.json();
  const { title, content, tags, isPublic, isArchived } = body;

  // Handle shareId generation when making public
  let shareId = existing.shareId;
  if (isPublic === true && !shareId) {
    shareId = nanoid(10);
  }
  if (isPublic === false) {
    shareId = null;
  }

  const updated = await prisma.note.update({
    where: { id: params.id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(content !== undefined ? { content } : {}),
      ...(tags !== undefined ? { tags: JSON.stringify(tags) } : {}),
      ...(isPublic !== undefined ? { isPublic, shareId } : {}),
      ...(isArchived !== undefined ? { isArchived } : {}),
      lastSavedAt: new Date(),
    },
  });

  return NextResponse.json({ note: parseNote(updated) });
}

// DELETE /api/notes/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.note.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  await prisma.note.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}