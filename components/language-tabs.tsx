"use client";

export function LanguageTabs({
  value,
  onChange,
}: {
  value: "en" | "es";
  onChange: (lang: "en" | "es") => void;
}) {
  return (
    <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
      <button
        type="button"
        onClick={() => onChange("en")}
        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
          value === "en"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => onChange("es")}
        className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
          value === "es"
            ? "bg-white text-gray-900 shadow-sm"
            : "text-gray-500 hover:text-gray-700"
        }`}
      >
        ES
      </button>
    </div>
  );
}
