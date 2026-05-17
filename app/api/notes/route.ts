// app/api/notes/route.ts
// Handles all notes collection endpoints:
//   GET  /api/notes  → fetch all notes for logged-in user (with search & filter)
//   POST /api/notes  → create a new note

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { parseNote } from "@/types";
import type { CreateNoteInput } from "@/types";

// ─────────────────────────────────────────────
// GET /api/notes
// Returns all notes for the authenticated user.
// Supports: ?search=, ?tags=, ?archived=, ?sort=, ?order=
// ─────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    // 1. Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // 2. Parse query params
    const { searchParams } = req.nextUrl;
    const search   = searchParams.get("search") || "";
    const tagsParam = searchParams.get("tags") || "";   // comma-separated
    const archived  = searchParams.get("archived") === "true";
    const sortBy    = searchParams.get("sort") || "updatedAt";
    const sortOrder = searchParams.get("order") === "asc" ? "asc" : "desc";

    // 3. Build Prisma where clause
    const where: Record<string, unknown> = {
      userId:     session.user.id,
      isArchived: archived,
    };

    // Full-text search on title and content
    if (search) {
      where.OR = [
        { title:   { contains: search } },
        { content: { contains: search } },
      ];
    }

    // 4. Fetch notes from DB
    const rawNotes = await prisma.note.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
    });

    // 5. Parse JSON fields (tags, actionItems) and filter by tags if needed
    let notes = rawNotes.map(parseNote);

    // Tag filtering happens in JS (SQLite can't query inside JSON strings)
    if (tagsParam) {
      const filterTags = tagsParam
        .split(",")
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      if (filterTags.length > 0) {
        notes = notes.filter((note) =>
          filterTags.every((ft) =>
            note.tags.some((nt) => nt.toLowerCase() === ft)
          )
        );
      }
    }

    return NextResponse.json({ data: notes }, { status: 200 });

  } catch (error) {
    console.error("[GET /api/notes]", error);
    return NextResponse.json(
      { error: "Failed to fetch notes." },
      { status: 500 }
    );
  }
}

// ─────────────────────────────────────────────
// POST /api/notes
// Creates a new empty (or pre-filled) note.
// Body: { title?, content?, tags? }
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    // 1. Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // 2. Parse body (all fields optional — supports quick "new note" creation)
    const body: CreateNoteInput = await req.json().catch(() => ({}));
    const {
      title   = "Untitled Note",
      content = "",
      tags    = [],
    } = body;

    // 3. Validate
    if (title.length > 200) {
      return NextResponse.json(
        { error: "Title must be under 200 characters." },
        { status: 400 }
      );
    }

    if (!Array.isArray(tags)) {
      return NextResponse.json(
        { error: "Tags must be an array." },
        { status: 400 }
      );
    }

    // 4. Create note
    // tags stored as JSON string in SQLite
    const rawNote = await prisma.note.create({
      data: {
        title:       title.trim(),
        content,
        tags:        JSON.stringify(tags),
        userId:      session.user.id,
        lastSavedAt: new Date(),
      },
    });

    // 5. Return parsed note
    const note = parseNote(rawNote);

    return NextResponse.json(
      { data: note, message: "Note created." },
      { status: 201 }
    );

  } catch (error) {
    console.error("[POST /api/notes]", error);
    return NextResponse.json(
      { error: "Failed to create note." },
      { status: 500 }
    );
  }
}