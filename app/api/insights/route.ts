// src/app/api/insights/route.ts
// GET /api/insights — returns dashboard productivity stats

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const notes = await prisma.note.findMany({
    where: { userId, isArchived: false },
    orderBy: { updatedAt: "desc" },
  });

  const totalNotes = notes.length;

  // Recently edited (top 5)
  const recentNotes = notes.slice(0, 5).map((n) => ({
    ...n,
    tags: (() => { try { return JSON.parse(n.tags); } catch { return []; } })(),
    actionItems: (() => {
      if (!n.actionItems) return null;
      try { return JSON.parse(n.actionItems); } catch { return null; }
    })(),
  }));

  // AI usage = notes that have a summary
  const aiUsageCount = notes.filter((n) => n.summary).length;

  // Top tags
  const tagMap: Record<string, number> = {};
  for (const note of notes) {
    let tags: string[] = [];
    try { tags = JSON.parse(note.tags); } catch { tags = []; }
    for (const t of tags) {
      tagMap[t] = (tagMap[t] || 0) + 1;
    }
  }
  const topTags = Object.entries(tagMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([tag, count]) => ({ tag, count }));

  // Weekly activity (last 7 days)
  const now = new Date();
  const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (6 - i));
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const count = notes.filter((n) => {
      const u = new Date(n.updatedAt);
      return u >= d && u < next;
    }).length;
    return { date: d.toISOString(), count };
  });

  return NextResponse.json({
    totalNotes,
    recentNotes,
    topTags,
    aiUsageCount,
    weeklyActivity,
  });
}