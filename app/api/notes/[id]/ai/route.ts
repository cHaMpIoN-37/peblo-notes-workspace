// app/api/notes/[id]/ai/route.ts
// Handles all AI feature requests for a single note.
//
// POST /api/notes/[id]/ai
// Body: { type: "summary" | "action-items" | "suggest-title" }
//
// Flow:
//   1. Verify auth + note ownership
//   2. Call the appropriate Gemini function
//   3. Save the result back to the note in DB
//   4. Return the result to the frontend

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { parseNote } from "@/types";
import type { AIFeatureType } from "@/types";
import {
  generateSummary,
  extractActionItems,
  suggestTitle,
} from "@/lib/gemini";

// ─────────────────────────────────────────────
// POST /api/notes/[id]/ai
// ─────────────────────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    // 2. Parse request body
    const body = await req.json().catch(() => ({}));
    const { type }: { type: AIFeatureType } = body;

    // 3. Validate AI feature type
    const validTypes: AIFeatureType[] = [
      "summary",
      "action-items",
      "suggest-title",
    ];
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json(
        {
          error: `Invalid type. Must be one of: ${validTypes.join(", ")}`,
        },
        { status: 400 }
      );
    }

    // 4. Fetch note and verify ownership
    const note = await prisma.note.findFirst({
      where: {
        id:     params.id,
        userId: session.user.id,
      },
    });

    if (!note) {
      return NextResponse.json({ error: "Note not found." }, { status: 404 });
    }

    // 5. Ensure note has content to analyze
    const contentLength = note.content?.trim().length ?? 0;
    if (contentLength < 20) {
      return NextResponse.json(
        {
          error:
            "Note content is too short. Add more content before using AI features.",
        },
        { status: 400 }
      );
    }

    // 6. Call the appropriate Gemini function + save result to DB
    let result: string | string[];
    let updateData: Record<string, string> = {};

    switch (type) {
      // ── Summary ──────────────────────────────
      case "summary": {
        const summary = await generateSummary(note.title, note.content);
        result     = summary;
        updateData = { summary };
        break;
      }

      // ── Action Items ─────────────────────────
      case "action-items": {
        const items = await extractActionItems(note.title, note.content);
        result     = items;
        // Store as JSON string in SQLite
        updateData = { actionItems: JSON.stringify(items) };
        break;
      }

      // ── Suggest Title ─────────────────────────
      case "suggest-title": {
        const suggested = await suggestTitle(note.content);
        result     = suggested;
        updateData = { suggestedTitle: suggested };
        break;
      }
    }

    // 7. Persist AI result back to the note
    const updated = await prisma.note.update({
      where: { id: params.id },
      data:  {
        ...updateData,
        lastSavedAt: new Date(),
      },
    });

    // 8. Return result + updated note
    return NextResponse.json(
      {
        data: {
          type,
          result,
          note: parseNote(updated),
        },
        message: "AI feature applied successfully.",
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("[POST /api/notes/[id]/ai]", error);

    // Give a friendlier message for Gemini API failures
    const message =
      error instanceof Error ? error.message : "Unknown error occurred.";

    const isGeminiError =
      message.includes("API key") ||
      message.includes("quota") ||
      message.includes("GEMINI");

    return NextResponse.json(
      {
        error: isGeminiError
          ? "AI service error. Check your GEMINI_API_KEY or quota."
          : "Failed to process AI request.",
        details: message,
      },
      { status: 500 }
    );
  }
}