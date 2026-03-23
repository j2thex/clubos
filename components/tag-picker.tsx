"use client";

import { useState } from "react";
import { PREDEFINED_TAGS, getTagLabel } from "@/lib/tags";
import type { Locale } from "@/lib/i18n";

interface TagPickerProps {
  value: string[];
  onChange: (tags: string[]) => void;
  locale: Locale;
}

export function TagPicker({ value, onChange, locale }: TagPickerProps) {
  const [customInput, setCustomInput] = useState("");

  function toggleTag(tagValue: string) {
    if (value.includes(tagValue)) {
      onChange(value.filter((t) => t !== tagValue));
    } else {
      onChange([...value, tagValue]);
    }
  }

  function addCustomTag() {
    const cleaned = customInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!cleaned || value.includes(cleaned)) {
      setCustomInput("");
      return;
    }
    onChange([...value, cleaned]);
    setCustomInput("");
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      addCustomTag();
    }
  }

  // Separate selected custom tags (not in predefined list)
  const predefinedValues = new Set(PREDEFINED_TAGS.map((t) => t.value));
  const customTags = value.filter((t) => !predefinedValues.has(t));

  return (
    <div className="space-y-3">
      {/* Predefined tags */}
      <div className="flex flex-wrap gap-1.5">
        {PREDEFINED_TAGS.map((tag) => {
          const selected = value.includes(tag.value);
          return (
            <button
              key={tag.value}
              type="button"
              onClick={() => toggleTag(tag.value)}
              className={`px-2.5 py-1 text-xs font-medium rounded-full border transition-colors ${
                selected
                  ? "bg-gray-800 text-white border-gray-800"
                  : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
              }`}
            >
              {getTagLabel(tag.value, locale)}
            </button>
          );
        })}
      </div>

      {/* Custom tags display */}
      {customTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {customTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700"
            >
              {getTagLabel(tag, locale)}
              <button
                type="button"
                onClick={() => onChange(value.filter((t) => t !== tag))}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Custom tag input */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={locale === "es" ? "Agregar etiqueta personalizada..." : "Add custom tag..."}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
        />
        {customInput.trim() && (
          <button
            type="button"
            onClick={addCustomTag}
            className="text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
          >
            {locale === "es" ? "Agregar" : "Add"}
          </button>
        )}
      </div>

      {/* Hidden field for form serialization */}
      <input type="hidden" name="tags" value={JSON.stringify(value)} />
    </div>
  );
}
