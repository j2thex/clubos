"use client";

import { useState, useTransition } from "react";
import {
  addPartner,
  updatePartner,
  deletePartner,
  togglePartnerActive,
  reorderPartner,
} from "./actions";

interface Partner {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl: string;
  displayOrder: number;
  active: boolean;
}

interface Props {
  partners: Partner[];
}

export function PartnersManager({ partners }: Props) {
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleAdd(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await addPartner(formData);
      if ("error" in res) setError(res.error);
      else {
        const form = document.getElementById("add-partner-form") as HTMLFormElement | null;
        form?.reset();
      }
    });
  }

  function handleUpdate(id: string, formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await updatePartner(id, formData);
      if ("error" in res) setError(res.error);
      else setEditingId(null);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this partner? This cannot be undone.")) return;
    setError(null);
    startTransition(async () => {
      const res = await deletePartner(id);
      if ("error" in res) setError(res.error);
    });
  }

  function handleToggle(id: string, active: boolean) {
    setError(null);
    startTransition(async () => {
      const res = await togglePartnerActive(id, active);
      if ("error" in res) setError(res.error);
    });
  }

  function handleReorder(id: string, direction: "up" | "down") {
    setError(null);
    startTransition(async () => {
      const res = await reorderPartner(id, direction);
      if ("error" in res) setError(res.error);
    });
  }

  return (
    <div className="bg-landing-surface rounded-xl border border-landing-border-subtle p-5 space-y-4">
      <h2 className="text-sm font-semibold text-landing-text-secondary uppercase tracking-wide">
        Partners ({partners.length})
      </h2>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 rounded-md px-3 py-2">{error}</div>
      )}

      {/* Add form */}
      <form
        id="add-partner-form"
        action={handleAdd}
        className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto] gap-2 items-center text-sm"
      >
        <input
          name="name"
          required
          placeholder="Partner name"
          className="rounded-md border border-landing-border-subtle bg-landing-surface-hover px-2 py-1.5 text-sm"
        />
        <input
          name="website_url"
          required
          type="url"
          placeholder="https://partner.com"
          className="rounded-md border border-landing-border-subtle bg-landing-surface-hover px-2 py-1.5 text-sm"
        />
        <input
          name="logo"
          required
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="text-xs"
        />
        <button
          type="submit"
          disabled={isPending}
          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 transition-colors"
        >
          Add
        </button>
      </form>

      {/* Existing partners */}
      <div className="space-y-2">
        {partners.length === 0 && (
          <p className="text-xs text-landing-text-tertiary">No partners yet.</p>
        )}

        {partners.map((p, i) => {
          const isEditing = editingId === p.id;
          return (
            <div
              key={p.id}
              className={`flex items-center gap-3 rounded-md border border-landing-border-subtle p-2 ${
                p.active ? "" : "opacity-50"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.logoUrl}
                alt={p.name}
                className="w-12 h-12 object-contain bg-white rounded-md"
              />

              {isEditing ? (
                <form
                  action={(fd) => handleUpdate(p.id, fd)}
                  className="flex-1 grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_auto_auto] gap-2 items-center"
                >
                  <input
                    name="name"
                    required
                    defaultValue={p.name}
                    className="rounded-md border border-landing-border-subtle bg-landing-surface-hover px-2 py-1.5 text-sm"
                  />
                  <input
                    name="website_url"
                    required
                    type="url"
                    defaultValue={p.websiteUrl}
                    className="rounded-md border border-landing-border-subtle bg-landing-surface-hover px-2 py-1.5 text-sm"
                  />
                  <input
                    name="logo"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    className="text-xs"
                  />
                  <button
                    type="submit"
                    disabled={isPending}
                    className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="text-xs text-landing-text-tertiary px-2 py-1 hover:text-landing-text"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-landing-text truncate">{p.name}</p>
                    <a
                      href={p.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-landing-text-tertiary hover:underline truncate block"
                    >
                      {p.websiteUrl}
                    </a>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleReorder(p.id, "up")}
                      disabled={isPending || i === 0}
                      title="Move up"
                      className="text-xs px-2 py-1 rounded hover:bg-landing-surface-hover disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReorder(p.id, "down")}
                      disabled={isPending || i === partners.length - 1}
                      title="Move down"
                      className="text-xs px-2 py-1 rounded hover:bg-landing-surface-hover disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggle(p.id, !p.active)}
                      disabled={isPending}
                      className={`text-xs font-semibold px-3 py-1 rounded-full ${
                        p.active
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-landing-surface-hover text-landing-text-tertiary hover:bg-landing-surface"
                      } disabled:opacity-50`}
                    >
                      {p.active ? "Active" : "Hidden"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(p.id)}
                      disabled={isPending}
                      className="text-xs px-2 py-1 rounded hover:bg-landing-surface-hover"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(p.id)}
                      disabled={isPending}
                      className="text-xs text-red-600 px-2 py-1 rounded hover:bg-red-50 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
