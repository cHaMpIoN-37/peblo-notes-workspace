// src/app/api/notes/[id]/generate-summary/route.ts
// POST /api/notes/:id/generate-summary
// Calls Google Gemini to generate: summary, action items, suggested title

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

export async function POST(
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

  if (!note.content?.trim()) {
    return NextResponse.json(
      { error: "Note is empty. Add some content before generating a summary." },
      { status: 400 }
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI not configured. Set GEMINI_API_KEY in .env.local." },
      { status: 500 }
    );
  }

  const prompt = `You are an AI assistant that analyses notes and extracts structured information.

Given the following note, respond ONLY with a JSON object (no markdown, no explanation):
{
  "summary": "2-3 sentence summary of the note",
  "action_items": ["action 1", "action 2"],
  "suggested_title": "A clear, concise title for the note"
}

Note title: ${note.title}
Note content:
${note.content}`;

  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      console.error("[GEMINI ERROR]", errBody);
      return NextResponse.json(
        { error: "AI service returned an error. Check your GEMINI_API_KEY." },
        { status: 502 }
      );
    }

    const geminiData = await geminiRes.json();
    const rawText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    // Strip any markdown code fences before parsing
    const cleaned = rawText.replace(/```json|```/g, "").trim();
    let parsed: {
      summary?: string;
      action_items?: string[];
      suggested_title?: string;
    };

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "AI returned unexpected output. Please try again." },
        { status: 502 }
      );
    }

    // Save AI results to the note
    const updated = await prisma.note.update({
      where: { id: note.id },
      data: {
        summary: parsed.summary ?? null,
        actionItems: parsed.action_items
          ? JSON.stringify(parsed.action_items)
          : null,
        suggestedTitle: parsed.suggested_title ?? null,
        lastSavedAt: new Date(),
      },
    });

    return NextResponse.json({ note: parseNote(updated) });
  } catch (err) {
    console.error("[AI SUMMARY ERROR]", err);
    return NextResponse.json(
      { error: "Failed to generate AI summary. Please try again." },
      { status: 500 }
    );
  }
}