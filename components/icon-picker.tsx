"use client";

import { useState } from "react";
import { CONTENT_ICONS } from "@/lib/icons";
import { DynamicIcon } from "./dynamic-icon";

export function IconPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (icon: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = search
    ? CONTENT_ICONS.filter((i) =>
        i.label.toLowerCase().includes(search.toLowerCase()) ||
        i.name.toLowerCase().includes(search.toLowerCase())
      )
    : CONTENT_ICONS;

  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">Icon</label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {value ? (
            <>
              <DynamicIcon name={value} className="w-4 h-4" />
              <span className="text-xs">{CONTENT_ICONS.find((i) => i.name === value)?.label ?? value}</span>
            </>
          ) : (
            <span className="text-xs text-gray-400">Choose icon...</span>
          )}
        </button>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-gray-400 hover:text-gray-600"
          >
            Clear
          </button>
        )}
      </div>

      {open && (
        <div className="mt-2 rounded-lg border border-gray-200 bg-white p-3 shadow-lg">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search icons..."
            className="w-full rounded-md border border-gray-200 px-2.5 py-1.5 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 mb-2"
          />
          <div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto">
            {filtered.map((icon) => (
              <button
                key={icon.name}
                type="button"
                onClick={() => {
                  onChange(icon.name);
                  setOpen(false);
                  setSearch("");
                }}
                title={icon.label}
                className={`p-2 rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center ${
                  value === icon.name ? "bg-gray-200 ring-1 ring-gray-400" : ""
                }`}
              >
                <DynamicIcon name={icon.name} className="w-4 h-4 text-gray-600" />
              </button>
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-2">No icons found</p>
          )}
        </div>
      )}
    </div>
  );
}
