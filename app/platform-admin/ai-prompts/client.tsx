"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { savePromptVersion, restorePromptVersion } from "./actions";

const CONTENT_TYPES = ["quest", "event", "offer", "badge", "setup_agent"] as const;
type ContentType = (typeof CONTENT_TYPES)[number];

const LABELS: Record<ContentType, string> = {
  quest: "Quest",
  event: "Event",
  offer: "Offer",
  badge: "Badge",
  setup_agent: "Setup Agent",
};

const PLACEHOLDER_HINTS: Record<ContentType, string> = {
  quest: "{{club_name}}, {{club_description}}, {{primary_color}}, {{user_prompt}}",
  event: "{{club_name}}, {{club_description}}, {{user_prompt}}",
  offer: "{{club_name}}, {{club_description}}, {{offer_catalog}}, {{user_prompt}}",
  badge: "{{club_name}}, {{club_description}}, {{primary_color}}, {{user_prompt}}",
  setup_agent: "{{club_name}}, {{club_description}}, {{primary_color}}, {{user_prompt}}",
};

interface PromptRow {
  id: string;
  content_type: string;
  version: number;
  system_prompt: string;
  user_template: string;
  model: string;
  active: boolean;
  updated_by: string | null;
  updated_at: string;
}

export function AiPromptsClient({
  secret,
  rows,
}: {
  secret: string;
  rows: PromptRow[];
}) {
  const router = useRouter();
  const [activeType, setActiveType] = useState<ContentType>("quest");
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  const grouped = useMemo(() => {
    const m = new Map<ContentType, PromptRow[]>();
    for (const t of CONTENT_TYPES) m.set(t, []);
    for (const r of rows) {
      if ((CONTENT_TYPES as readonly string[]).includes(r.content_type)) {
        m.get(r.content_type as ContentType)!.push(r);
      }
    }
    return m;
  }, [rows]);

  const versions = grouped.get(activeType) ?? [];
  const activeVersion = versions.find((v) => v.active) ?? versions[0];

  // Local editor state keyed by content type (so flipping tabs keeps drafts)
  const [drafts, setDrafts] = useState<Record<ContentType, { system: string; user: string; model: string } | undefined>>({
    quest: undefined,
    event: undefined,
    offer: undefined,
    badge: undefined,
    setup_agent: undefined,
  });

  const current = drafts[activeType] ?? {
    system: activeVersion?.system_prompt ?? "",
    user: activeVersion?.user_template ?? "",
    model: activeVersion?.model ?? "anthropic/claude-sonnet-4.6",
  };

  function setField(field: "system" | "user" | "model", value: string) {
    setDrafts((prev) => ({
      ...prev,
      [activeType]: {
        system: field === "system" ? value : (prev[activeType]?.system ?? activeVersion?.system_prompt ?? ""),
        user: field === "user" ? value : (prev[activeType]?.user ?? activeVersion?.user_template ?? ""),
        model: field === "model" ? value : (prev[activeType]?.model ?? activeVersion?.model ?? "anthropic/claude-sonnet-4.6"),
      },
    }));
  }

  function handleSave() {
    setMsg(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("content_type", activeType);
      fd.set("system_prompt", current.system);
      fd.set("user_template", current.user);
      fd.set("model", current.model);
      const r = await savePromptVersion(secret, fd);
      if ("error" in r) {
        setMsg({ kind: "err", text: r.error });
      } else {
        setMsg({ kind: "ok", text: `Saved as v${r.version}` });
        setDrafts((prev) => ({ ...prev, [activeType]: undefined }));
        router.refresh();
      }
    });
  }

  function handleRestore(id: string) {
    if (!confirm("Restore this version as active?")) return;
    setMsg(null);
    startTransition(async () => {
      const r = await restorePromptVersion(secret, id);
      if ("error" in r) {
        setMsg({ kind: "err", text: r.error });
      } else {
        setMsg({ kind: "ok", text: "Restored" });
        router.refresh();
      }
    });
  }

  const isDirty =
    drafts[activeType] !== undefined &&
    (current.system !== (activeVersion?.system_prompt ?? "") ||
      current.user !== (activeVersion?.user_template ?? "") ||
      current.model !== (activeVersion?.model ?? "anthropic/claude-sonnet-4.6"));

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">AI Prompts</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Tower-level prompt library powering the admin AI assist buttons.
              Every save creates a new versioned row; the previous version stays
              in history and can be restored.
            </p>
          </div>
          <a
            href={`/platform-admin?secret=${encodeURIComponent(secret)}`}
            className="text-xs text-zinc-400 hover:text-zinc-200"
          >
            ← Back to platform admin
          </a>
        </div>

        {/* Content type tabs */}
        <div className="flex gap-1 bg-zinc-900 rounded-lg p-1 mb-4 w-fit">
          {CONTENT_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setActiveType(t);
                setMsg(null);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                activeType === t
                  ? "bg-zinc-100 text-zinc-900"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {LABELS[t]}
              <span className="ml-1.5 text-[10px] opacity-60">
                {grouped.get(t)?.length ?? 0}
              </span>
            </button>
          ))}
        </div>

        {/* Editor */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold">
                {LABELS[activeType]} — active v{activeVersion?.version ?? "—"}
              </h2>
              {activeVersion?.updated_at && (
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Last updated{" "}
                  {new Date(activeVersion.updated_at).toLocaleString()} by{" "}
                  {activeVersion.updated_by ?? "unknown"}
                </p>
              )}
            </div>
            <button
              onClick={handleSave}
              disabled={isPending || !isDirty}
              className="px-4 py-1.5 bg-emerald-500 text-zinc-950 text-xs font-semibold rounded-md hover:bg-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isPending ? "Saving…" : isDirty ? "Save new version" : "No changes"}
            </button>
          </div>

          {msg && (
            <div
              className={`mb-3 px-3 py-2 rounded text-xs ${
                msg.kind === "ok"
                  ? "bg-emerald-900/40 text-emerald-200 border border-emerald-800"
                  : "bg-red-900/40 text-red-200 border border-red-800"
              }`}
            >
              {msg.text}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1 uppercase tracking-wide">
                Model (provider/model)
              </label>
              <input
                type="text"
                value={current.model}
                onChange={(e) => setField("model", e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-zinc-600"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                Examples: anthropic/claude-sonnet-4.6, anthropic/claude-haiku-4.5, openai/gpt-5.4
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1 uppercase tracking-wide">
                System prompt
              </label>
              <textarea
                value={current.system}
                onChange={(e) => setField("system", e.target.value)}
                rows={12}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm font-mono leading-relaxed focus:outline-none focus:border-zinc-600 resize-y"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1 uppercase tracking-wide">
                User template
              </label>
              <textarea
                value={current.user}
                onChange={(e) => setField("user", e.target.value)}
                rows={6}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-sm font-mono leading-relaxed focus:outline-none focus:border-zinc-600 resize-y"
              />
              <p className="text-[10px] text-zinc-500 mt-1">
                Available placeholders: {PLACEHOLDER_HINTS[activeType]}
              </p>
            </div>
          </div>
        </div>

        {/* Version history */}
        <div className="bg-zinc-900 rounded-xl border border-zinc-800">
          <div className="px-5 py-3 border-b border-zinc-800">
            <h2 className="text-sm font-semibold">Version history</h2>
          </div>
          {versions.length === 0 ? (
            <p className="px-5 py-4 text-sm text-zinc-500">No versions yet.</p>
          ) : (
            <ul className="divide-y divide-zinc-800">
              {versions.map((v) => (
                <li key={v.id} className="px-5 py-3 flex items-center gap-4">
                  <span className="font-mono text-sm w-12 text-zinc-400">v{v.version}</span>
                  {v.active ? (
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 rounded-full">
                      ACTIVE
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-zinc-800 text-zinc-500 rounded-full">
                      archived
                    </span>
                  )}
                  <span className="text-xs text-zinc-500 flex-1">
                    {new Date(v.updated_at).toLocaleString()} · by{" "}
                    {v.updated_by ?? "unknown"} · {v.model}
                  </span>
                  {!v.active && (
                    <button
                      onClick={() => handleRestore(v.id)}
                      disabled={isPending}
                      className="text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-40"
                    >
                      Restore
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
