// lib/gemini.ts
// Google Gemini AI integration for all AI features:
//   1. Generate summary
//   2. Extract action items
//   3. Suggest a better title
//
// Uses the free @google/generative-ai SDK.
// Make sure GEMINI_API_KEY is set in your .env file.

import { GoogleGenerativeAI } from "@google/generative-ai";

// ─────────────────────────────────────────────
// Initialize Gemini client
// ─────────────────────────────────────────────
if (!process.env.GEMINI_API_KEY) {
  throw new Error("Missing GEMINI_API_KEY in environment variables.");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// We use gemini-1.5-flash — it's free tier, fast, and capable enough
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// ─────────────────────────────────────────────
// Helper: call Gemini with a prompt
// ─────────────────────────────────────────────
async function generate(prompt: string): Promise<string> {
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text().trim();
}

// ─────────────────────────────────────────────
// 1. Generate Summary
// ─────────────────────────────────────────────

/**
 * Summarizes the given note content in 2-3 concise sentences.
 *
 * @param title   - Note title for context
 * @param content - Note body text
 * @returns       - A plain-text summary string
 */
export async function generateSummary(
  title: string,
  content: string
): Promise<string> {
  const prompt = `
You are a helpful assistant that summarizes notes.
Summarize the following note in 2-3 concise sentences.
Be direct and factual. Do not use bullet points. Return plain text only.

Note Title: ${title}
Note Content:
${content}

Summary:`.trim();

  return generate(prompt);
}

// ─────────────────────────────────────────────
// 2. Extract Action Items
// ─────────────────────────────────────────────

/**
 * Extracts a list of actionable tasks from the note content.
 *
 * @param title   - Note title for context
 * @param content - Note body text
 * @returns       - Array of action item strings (e.g. ["Buy groceries", "Call John"])
 */
export async function extractActionItems(
  title: string,
  content: string
): Promise<string[]> {
  const prompt = `
You are a productivity assistant that extracts action items from notes.
Read the note below and extract all actionable tasks or to-dos.
Return ONLY a JSON array of strings. No explanation, no markdown, no extra text.
If there are no action items, return an empty array: []

Note Title: ${title}
Note Content:
${content}

JSON array of action items:`.trim();

  const raw = await generate(prompt);

  // Strip markdown code fences if Gemini wraps response in ```json ... ```
  const cleaned = raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) {
      // Ensure every item is a string
      return parsed.map((item) => String(item));
    }
    return [];
  } catch {
    // If Gemini returned malformed JSON, split by newlines as fallback
    return cleaned
      .split("\n")
      .map((line) => line.replace(/^[-*\d.]\s*/, "").trim())
      .filter(Boolean);
  }
}

// ─────────────────────────────────────────────
// 3. Suggest Title
// ─────────────────────────────────────────────

/**
 * Suggests a concise, descriptive title for the note.
 *
 * @param content - Note body text
 * @returns       - A single suggested title string
 */
export async function suggestTitle(content: string): Promise<string> {
  const prompt = `
You are a helpful assistant that creates concise note titles.
Based on the note content below, suggest ONE short and descriptive title (max 8 words).
Return ONLY the title text. No quotes, no explanation, no punctuation at the end.

Note Content:
${content}

Suggested Title:`.trim();

  const result = await generate(prompt);

  // Clean up any surrounding quotes Gemini might add
  return result.replace(/^["']|["']$/g, "").trim();
}