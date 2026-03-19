"use client";

import { useState, useTransition } from "react";
import { updateClubBranding } from "./branding-actions";

interface BrandingData {
  logo_url: string | null;
  cover_url: string | null;
  primary_color: string;
  secondary_color: string;
  hero_content: string | null;
  social_instagram: string | null;
  social_whatsapp: string | null;
  social_telegram: string | null;
  social_google_maps: string | null;
  social_website: string | null;
  google_place_id: string | null;
}

export function BrandingManager({
  branding,
  clubId,
  clubSlug,
}: {
  branding: BrandingData;
  clubId: string;
  clubSlug: string;
}) {
  const [primaryColor, setPrimaryColor] = useState(branding.primary_color);
  const [secondaryColor, setSecondaryColor] = useState(branding.secondary_color);
  const [heroContent, setHeroContent] = useState(branding.hero_content ?? "");
  const [socialInstagram, setSocialInstagram] = useState(branding.social_instagram ?? "");
  const [socialWhatsapp, setSocialWhatsapp] = useState(branding.social_whatsapp ?? "");
  const [socialTelegram, setSocialTelegram] = useState(branding.social_telegram ?? "");
  const [socialGoogleMaps, setSocialGoogleMaps] = useState(branding.social_google_maps ?? "");
  const [socialWebsite, setSocialWebsite] = useState(branding.social_website ?? "");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);

    formData.set("clubId", clubId);
    formData.set("clubSlug", clubSlug);

    startTransition(async () => {
      const result = await updateClubBranding(formData);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setLogoPreview(null);
        setCoverPreview(null);
        setTimeout(() => setSuccess(false), 3000);
      }
    });
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1">
        Branding
      </h2>
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <form action={handleSubmit} className="divide-y divide-gray-100">
          {/* Logo */}
          <div className="px-5 py-4 space-y-2">
            <label className="text-sm font-medium text-gray-700">Club Logo</label>
            <div className="flex items-center gap-3">
              {(logoPreview || branding.logo_url) && (
                <img
                  src={logoPreview ?? branding.logo_url!}
                  alt="Logo"
                  className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                />
              )}
              <input
                type="file"
                name="logo"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) setLogoPreview(URL.createObjectURL(file));
                }}
                className="text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
              />
            </div>
            <p className="text-xs text-gray-400">Square image recommended (512x512px)</p>
          </div>

          {/* Cover Image */}
          <div className="px-5 py-4 space-y-2">
            <label className="text-sm font-medium text-gray-700">Cover Image</label>
            {(coverPreview || branding.cover_url) && (
              <img
                src={coverPreview ?? branding.cover_url!}
                alt="Cover"
                className="w-full h-20 rounded-lg object-cover border border-gray-200"
              />
            )}
            <input
              type="file"
              name="cover"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setCoverPreview(URL.createObjectURL(file));
              }}
              className="text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
            />
            <p className="text-xs text-gray-400">Recommended 1200x400px (3:1 ratio)</p>
          </div>

          {/* Colors */}
          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-1">
                <label className="text-sm font-medium text-gray-700">Primary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    name="primaryColor"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded-md border border-gray-300 p-1"
                  />
                  <span className="text-xs text-gray-400 font-mono">{primaryColor}</span>
                </div>
              </div>
              <div className="flex-1 space-y-1">
                <label className="text-sm font-medium text-gray-700">Secondary Color</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    name="secondaryColor"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-9 w-12 cursor-pointer rounded-md border border-gray-300 p-1"
                  />
                  <span className="text-xs text-gray-400 font-mono">{secondaryColor}</span>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div
              className="rounded-lg border p-4 transition-colors"
              style={{ backgroundColor: secondaryColor }}
            >
              <p className="text-sm font-semibold" style={{ color: primaryColor }}>
                Color Preview
              </p>
              <div
                className="mt-2 inline-block rounded-md px-3 py-1 text-xs font-semibold"
                style={{ backgroundColor: primaryColor, color: secondaryColor }}
              >
                Button
              </div>
            </div>
          </div>

          {/* Hero Content */}
          <div className="px-5 py-4 space-y-2">
            <label className="text-sm font-medium text-gray-700">Welcome Message</label>
            <textarea
              name="heroContent"
              rows={2}
              value={heroContent}
              onChange={(e) => setHeroContent(e.target.value)}
              placeholder="e.g. Welcome to our exclusive club!"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-gray-400 transition resize-none"
            />
            <p className="text-xs text-gray-400">
              Use {"{{name}}"} to insert the member&apos;s name
            </p>
          </div>

          {/* Social Links */}
          <div className="px-5 py-4 space-y-3">
            <label className="text-sm font-medium text-gray-700">Social Links</label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-20 shrink-0">Instagram</span>
                <input
                  type="url"
                  name="socialInstagram"
                  value={socialInstagram}
                  onChange={(e) => setSocialInstagram(e.target.value)}
                  placeholder="https://instagram.com/yourclub"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-20 shrink-0">WhatsApp</span>
                <input
                  type="text"
                  name="socialWhatsapp"
                  value={socialWhatsapp}
                  onChange={(e) => setSocialWhatsapp(e.target.value)}
                  placeholder="+34612345678"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-20 shrink-0">Telegram</span>
                <input
                  type="url"
                  name="socialTelegram"
                  value={socialTelegram}
                  onChange={(e) => setSocialTelegram(e.target.value)}
                  placeholder="https://t.me/yourgroup"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-20 shrink-0">Maps</span>
                <input
                  type="url"
                  name="socialGoogleMaps"
                  value={socialGoogleMaps}
                  onChange={(e) => setSocialGoogleMaps(e.target.value)}
                  placeholder="https://maps.google.com/..."
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                />
              </div>
              {branding.google_place_id && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-20 shrink-0">Review Link</span>
                    <input
                      type="text"
                      readOnly
                      value={`https://search.google.com/local/writereview?placeid=${branding.google_place_id}`}
                      className="flex-1 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(
                          `https://search.google.com/local/writereview?placeid=${branding.google_place_id}`
                        );
                      }}
                      className="shrink-0 rounded-md bg-gray-100 px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-xs text-green-600 pl-22">Members will be sent directly to your Google review page</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-20 shrink-0">Website</span>
                <input
                  type="url"
                  name="socialWebsite"
                  value={socialWebsite}
                  onChange={(e) => setSocialWebsite(e.target.value)}
                  placeholder="https://yourclub.com"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="px-5 py-3 bg-gray-50 flex items-center justify-between">
            <div>
              {error && <p className="text-xs text-red-600">{error}</p>}
              {success && <p className="text-xs text-green-600">Branding updated!</p>}
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-gray-800 text-white px-4 py-1.5 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
