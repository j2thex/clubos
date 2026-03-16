"use client";

import { useState, useTransition } from "react";
import { createUnclaimedClub } from "./actions";

interface ClubInfo {
  id: string;
  name: string;
  slug: string;
  inviteOnly: boolean;
  logoUrl: string | null;
  primaryColor: string;
  createdAt: string;
}

export function PlatformAdminClient({
  clubs,
  secret,
}: {
  clubs: ClubInfo[];
  secret: string;
}) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#16a34a");
  const [secondaryColor, setSecondaryColor] = useState("#052e16");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleNameChange(val: string) {
    setName(val);
    // Auto-generate slug from name
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
  }

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await createUnclaimedClub(formData, secret);
      if ("error" in result) {
        setError(result.error);
      } else {
        setName("");
        setSlug("");
        setPrimaryColor("#16a34a");
        setSecondaryColor("#052e16");
        setSuccess(`Created! Visit /${result.slug}/public to see it.`);
        setTimeout(() => setSuccess(null), 8000);
      }
    });
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 sm:p-10">
      <h1 className="text-3xl font-extralight tracking-tight">Platform Admin</h1>
      <p className="text-sm text-white/50 mt-1">Create unclaimed club listings</p>

      {/* Create form */}
      <div className="mt-8 max-w-lg">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-4">New Club Listing</h2>

          {error && <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-2 text-sm text-red-400">{error}</div>}
          {success && <div className="mb-4 rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-2 text-sm text-green-400">{success}</div>}

          <form action={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-white/50 mb-1">Club Name</label>
              <input
                name="name"
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                placeholder="The Secret Garden Club"
                className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-white/30"
              />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Slug (URL path)</label>
              <div className="flex items-center gap-1">
                <span className="text-xs text-white/30">osocios.club/</span>
                <input
                  name="slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  required
                  placeholder="secret-garden"
                  className="flex-1 rounded-lg bg-white/5 border border-white/10 px-3 py-2 text-sm text-white font-mono placeholder:text-white/20 focus:outline-none focus:ring-1 focus:ring-white/30"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-white/50 mb-1">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input name="primaryColor" type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-8 h-8 rounded border border-white/10 cursor-pointer" />
                  <span className="text-xs text-white/30 font-mono">{primaryColor}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-white/50 mb-1">Secondary Color</label>
                <div className="flex items-center gap-2">
                  <input name="secondaryColor" type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-8 h-8 rounded border border-white/10 cursor-pointer" />
                  <span className="text-xs text-white/30 font-mono">{secondaryColor}</span>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Logo (optional)</label>
              <input name="logo" type="file" accept="image/*" className="text-sm text-white/50 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white/70" />
            </div>
            <div>
              <label className="block text-xs text-white/50 mb-1">Cover Image (optional)</label>
              <input name="cover" type="file" accept="image/*" className="text-sm text-white/50 file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-white/70" />
            </div>
            <button
              type="submit"
              disabled={isPending || !name.trim() || !slug.trim()}
              className="w-full rounded-lg bg-white text-gray-900 px-4 py-2.5 text-sm font-semibold hover:bg-white/90 disabled:opacity-50 transition-colors"
            >
              {isPending ? "Creating..." : "Create Club Listing"}
            </button>
          </form>
        </div>
      </div>

      {/* Existing unclaimed clubs */}
      {clubs.length > 0 && (
        <div className="mt-10 max-w-2xl">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-4">
            Unclaimed Listings ({clubs.length})
          </h2>
          <div className="space-y-2">
            {clubs.map((c) => (
              <div key={c.id} className="rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 flex items-center gap-3">
                {c.logoUrl ? (
                  <img src={c.logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: c.primaryColor }}>
                    {c.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs text-white/40">/{c.slug}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <a
                    href={`/${c.slug}/public`}
                    target="_blank"
                    className="text-xs text-white/40 hover:text-white/70 transition-colors"
                  >
                    Public
                  </a>
                  <a
                    href={`/${c.slug}/admin`}
                    target="_blank"
                    className="text-xs text-white/40 hover:text-white/70 transition-colors"
                  >
                    Admin
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
