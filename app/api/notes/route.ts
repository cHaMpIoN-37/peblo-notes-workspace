// src/app/api/notes/route.ts
// GET  /api/notes        — list notes (with search & tag filter)
// POST /api/notes        — create a new note

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

// GET /api/notes
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() || "";
  const tag = searchParams.get("tag")?.trim() || "";

  const notes = await prisma.note.findMany({
    where: {
      userId: session.user.id,
      isArchived: false,
      ...(q
        ? {
            OR: [
              { title: { contains: q } },
              { content: { contains: q } },
            ],
          }
        : {}),
      ...(tag ? { tags: { contains: `"${tag}"` } } : {}),
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ notes: notes.map(parseNote) });
}

// POST /api/notes
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title = "Untitled Note", content = "", tags = [] } = body;

  const note = await prisma.note.create({
    data: {
      title,
      content,
      tags: JSON.stringify(tags),
      userId: session.user.id,
    },
  });

  return NextResponse.json({ note: parseNote(note) }, { status: 201 });
}