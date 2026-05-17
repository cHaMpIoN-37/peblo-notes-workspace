"use client";

// components/notes/TagInput.tsx
// Tag input component for adding/removing tags in the note editor.
//
// Features:
//   - Add tags by typing and pressing Enter
//   - Remove tags by clicking the X button
//   - Autocomplete from existing tags (optional)
//   - Validation (no duplicates, max length)
//   - Display as pills/badges
//   - Dark mode support

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  maxTagLength?: number;
}

export function TagInput({
  tags,
  onChange,
  maxTags = 10,
  maxTagLength = 20,
}: TagInputProps) {
  // ─────────────────────────────────────────────
  // State Management
  // ─────────────────────────────────────────────
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ─────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────

  const addTag = (tag: string) => {
    // Trim and lowercase
    const cleanTag = tag.trim().toLowerCase();

    // Validation
    if (!cleanTag) {
      setError("Tag cannot be empty");
      return;
    }

    if (cleanTag.length > maxTagLength) {
      setError(`Tag must be ${maxTagLength} characters or less`);
      return;
    }

    if (tags.includes(cleanTag)) {
      setError("This tag already exists");
      return;
    }

    if (tags.length >= maxTags) {
      setError(`Maximum ${maxTags} tags allowed`);
      return;
    }

    // Add tag and clear input
    onChange([...tags, cleanTag]);
    setInputValue("");
    setError(null);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && inputValue === "" && tags.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      removeTag(tags[tags.length - 1]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    // Clear error on input change
    if (error) setError(null);
  };

  // ─────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────

  return (
    <div className="space-y-2">
      {/* Tag Input Container */}
      <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500">
        {/* Display existing tags */}
        {tags.map((tag) => (
          <div
            key={tag}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium"
          >
            <span>#{tag}</span>
            <button
              onClick={() => removeTag(tag)}
              className="ml-1 hover:text-blue-900 dark:hover:text-blue-200 transition-colors"
              aria-label={`Remove tag ${tag}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}

        {/* Input field */}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? "Add tags (press Enter)" : ""}
          className="flex-1 min-w-32 bg-transparent outline-none text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400"
        />
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {/* Helper Text */}
      <p className="text-xs text-slate-600 dark:text-slate-400">
        {tags.length}/{maxTags} tags • Press Enter to add • Backspace to remove
      </p>
    </div>
  );
}
