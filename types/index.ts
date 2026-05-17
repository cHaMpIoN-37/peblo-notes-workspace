// types/index.ts
// Central type definitions for the entire application.
// Import from here instead of redefining types across files.

/**
 * Raw Note as it comes back from Prisma.
 * tags and actionItems are JSON strings in the DB.
 */
export interface RawNote {
  id: string;
  title: string;
  content: string;
  tags: string;           // JSON string: '["tag1","tag2"]'
  summary: string | null;
  actionItems: string | null; // JSON string: '["item1","item2"]'
  suggestedTitle: string | null;
  isPublic: boolean;
  shareId: string | null;
  isArchived: boolean;
  lastSavedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

/**
 * Note with parsed arrays — use this everywhere in the frontend.
 * Converted from RawNote via parseNote() utility below.
 */
export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];           // parsed array
  summary: string | null;
  actionItems: string[];    // parsed array
  suggestedTitle: string | null;
  isPublic: boolean;
  shareId: string | null;
  isArchived: boolean;
  lastSavedAt: string;      // ISO string (safe for JSON serialization)
  createdAt: string;
  updatedAt: string;
  userId: string;
}

/**
 * Payload for creating a new note (POST /api/notes)
 */
export interface CreateNoteInput {
  title?: string;
  content?: string;
  tags?: string[];
}

/**
 * Payload for updating a note (PATCH /api/notes/[id])
 */
export interface UpdateNoteInput {
  title?: string;
  content?: string;
  tags?: string[];
  summary?: string;
  actionItems?: string[];
  suggestedTitle?: string;
  isPublic?: boolean;
  isArchived?: boolean;
}

// ─────────────────────────────────────────────
// USER TYPES
// ─────────────────────────────────────────────

export interface User {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
}

/** Shape of the session user returned by NextAuth */
export interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

// ─────────────────────────────────────────────
// AI TYPES
// ─────────────────────────────────────────────

/** The three AI operations supported */
export type AIFeatureType = "summary" | "action-items" | "suggest-title";

/** Request body for POST /api/notes/[id]/ai */
export interface AIRequest {
  type: AIFeatureType;
}

/** Response from the AI route */
export interface AIResponse {
  type: AIFeatureType;
  result: string | string[];   // string for summary/title, string[] for action items
}

// ─────────────────────────────────────────────
// API RESPONSE TYPES
// ─────────────────────────────────────────────

/** Standard success response wrapper */
export interface ApiSuccess<T> {
  data: T;
  message?: string;
}

/** Standard error response wrapper */
export interface ApiError {
  error: string;
  details?: string;
}

// ─────────────────────────────────────────────
// INSIGHTS / DASHBOARD TYPES
// ─────────────────────────────────────────────

export interface InsightsData {
  totalNotes: number;
  totalWords: number;
  avgWordsPerNote: number;
  notesThisWeek: number;
  notesThisMonth: number;
  topTags: { tag: string; count: number }[];
  activityByDay: { date: string; count: number }[];
  mostEditedNotes: { id: string; title: string; updatedAt: string }[];
}

// ─────────────────────────────────────────────
// SEARCH & FILTER TYPES
// ─────────────────────────────────────────────

export interface NoteFilters {
  search?: string;
  tags?: string[];
  isArchived?: boolean;
  sortBy?: "createdAt" | "updatedAt" | "title";
  sortOrder?: "asc" | "desc";
}

// ─────────────────────────────────────────────
// UTILITY: Parse raw DB note → frontend Note
// ─────────────────────────────────────────────

/**
 * Converts a RawNote (from Prisma) into a frontend-safe Note.
 * Parses JSON strings into arrays and converts Dates to ISO strings.
 *
 * Usage:
 *   import { parseNote } from "@/types";
 *   const note = parseNote(rawNoteFromPrisma);
 */
export function parseNote(raw: RawNote): Note {
  return {
    ...raw,
    tags: safeParseJSON<string[]>(raw.tags, []),
    actionItems: safeParseJSON<string[]>(raw.actionItems ?? "[]", []),
    lastSavedAt: raw.lastSavedAt instanceof Date
      ? raw.lastSavedAt.toISOString()
      : String(raw.lastSavedAt),
    createdAt: raw.createdAt instanceof Date
      ? raw.createdAt.toISOString()
      : String(raw.createdAt),
    updatedAt: raw.updatedAt instanceof Date
      ? raw.updatedAt.toISOString()
      : String(raw.updatedAt),
  };
}

/**
 * Safely parses a JSON string, returning a fallback on failure.
 * Prevents the entire app from crashing on malformed DB data.
 */
function safeParseJSON<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}