"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateBranding } from "../actions";
import { useLanguage } from "@/lib/i18n/provider";

const GREETING_TEMPLATES: ReadonlyArray<{
  id: string;
  label: { en: string; es: string };
  body: { en: string; es: string };
}> = [
  {
    id: "friendly",
    label: { en: "Friendly", es: "Cercano" },
    body: {
      en: "Welcome! We're glad you're part of the community. Check the events, claim your spins, and say hi any time.",
      es: "¡Bienvenido/a! Nos alegra tenerte en la comunidad. Mira los eventos, reclama tus tiradas y pásate a saludar cuando quieras.",
    },
  },
  {
    id: "boutique",
    label: { en: "Boutique", es: "Boutique" },
    body: {
      en: "Welcome to our space. Take your time, enjoy the atmosphere, and reach out whenever we can help.",
      es: "Bienvenido a nuestro espacio. Tómate tu tiempo, disfruta del ambiente y avísanos siempre que podamos ayudarte.",
    },
  },
  {
    id: "cannabis",
    label: { en: "Cannabis club", es: "Club cannábico" },
    body: {
      en: "Welcome home. Settle in, browse the menu, and let staff know if you need a recommendation.",
      es: "Bienvenido a casa. Acomódate, explora el menú y pídele a un miembro del equipo cualquier recomendación.",
    },
  },
  {
    id: "coworking",
    label: { en: "Coworking", es: "Coworking" },
    body: {
      en: "Welcome aboard. Find a desk, grab a coffee, and book a room from the events tab whenever you need one.",
      es: "Bienvenido al equipo. Busca un sitio, toma un café y reserva una sala desde la pestaña de eventos cuando lo necesites.",
    },
  },
  {
    id: "fitness",
    label: { en: "Sports & fitness", es: "Deporte y fitness" },
    body: {
      en: "Welcome to the team. Check the schedule, lock in your sessions, and let's get to work.",
      es: "Bienvenido al equipo. Mira el horario, reserva tus sesiones y vamos a darlo todo.",
    },
  },
];

function formAction(_prev: { error: string } | undefined, formData: FormData) {
  return updateBranding(formData);
}

function BrandingForm() {
  const searchParams = useSearchParams();
  const clubId = searchParams.get("clubId") ?? "";
  const [state, dispatch, isPending] = useActionState(formAction, undefined);
  const { t, locale } = useLanguage();
  const templateLocale: "en" | "es" = locale === "es" ? "es" : "en";

  const [primaryColor, setPrimaryColor] = useState("#16a34a");
  const [secondaryColor, setSecondaryColor] = useState("#052e16");
  const [heroContent, setHeroContent] = useState("");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [logoUrlInput, setLogoUrlInput] = useState("");
  const [coverUrlInput, setCoverUrlInput] = useState("");

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-green-700">{t("onboarding.step2")}</p>
        <div className="flex items-center justify-center gap-2">
          <span className="h-2 w-8 rounded-full bg-green-600" />
          <span className="h-2 w-8 rounded-full bg-green-600" />
          <span className="h-2 w-8 rounded-full bg-gray-200" />
        </div>
      </div>

      <Card className="border-green-200 shadow-lg shadow-green-100/50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-gray-900">{t("onboarding.brandingTitle")}</CardTitle>
          <CardDescription className="text-gray-600">
            {t("onboarding.brandingSubtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state?.error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </div>
          )}

          <form action={dispatch} className="space-y-5">
            <input type="hidden" name="clubId" value={clubId} />

            {/* Club Logo */}
            <div className="space-y-2">
              <Label htmlFor="logo" className="text-gray-800">
                {t("onboarding.logoLabel")}
              </Label>
              <p className="text-xs text-gray-500">{t("onboarding.logoHelp")}</p>
              <input
                type="file"
                id="logo"
                name="logo"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setLogoPreview(URL.createObjectURL(file));
                    setLogoUrlInput("");
                  }
                }}
                className="w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-green-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-green-700 hover:file:bg-green-100"
              />
              <div className="flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-wide pt-1">
                <span className="h-px flex-1 bg-gray-200" />
                <span>{t("onboarding.orUrl")}</span>
                <span className="h-px flex-1 bg-gray-200" />
              </div>
              <input
                type="url"
                name="logoUrl"
                placeholder="https://…"
                value={logoUrlInput}
                onChange={(e) => {
                  const v = e.target.value;
                  setLogoUrlInput(v);
                  setLogoPreview(v && /^https?:\/\//.test(v) ? v : null);
                }}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-green-500 focus-visible:ring-[3px] focus-visible:ring-green-500/30"
              />
              {logoPreview && (
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  onError={() => setLogoPreview(null)}
                  className="h-16 w-16 rounded-lg object-cover border border-gray-200"
                />
              )}
            </div>

            {/* Cover Image */}
            <div className="space-y-2">
              <Label htmlFor="cover" className="text-gray-800">
                {t("onboarding.coverLabel")}
              </Label>
              <p className="text-xs text-gray-500">{t("onboarding.coverHelp")}</p>
              <input
                type="file"
                id="cover"
                name="cover"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setCoverPreview(URL.createObjectURL(file));
                    setCoverUrlInput("");
                  }
                }}
                className="w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-green-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-green-700 hover:file:bg-green-100"
              />
              <div className="flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-wide pt-1">
                <span className="h-px flex-1 bg-gray-200" />
                <span>{t("onboarding.orUrl")}</span>
                <span className="h-px flex-1 bg-gray-200" />
              </div>
              <input
                type="url"
                name="coverUrl"
                placeholder="https://…"
                value={coverUrlInput}
                onChange={(e) => {
                  const v = e.target.value;
                  setCoverUrlInput(v);
                  setCoverPreview(v && /^https?:\/\//.test(v) ? v : null);
                }}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-green-500 focus-visible:ring-[3px] focus-visible:ring-green-500/30"
              />
              {coverPreview && (
                <img
                  src={coverPreview}
                  alt="Cover preview"
                  onError={() => setCoverPreview(null)}
                  className="w-full h-24 rounded-lg object-cover border border-gray-200"
                />
              )}
            </div>

            {/* Primary Color */}
            <div className="space-y-2">
              <Label htmlFor="primaryColor" className="text-gray-800">
                {t("onboarding.primaryColor")}
              </Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="primaryColor"
                  name="primaryColor"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-md border border-input p-1"
                />
                <span className="text-sm text-gray-500 font-mono">{primaryColor}</span>
              </div>
            </div>

            {/* Secondary Color */}
            <div className="space-y-2">
              <Label htmlFor="secondaryColor" className="text-gray-800">
                {t("onboarding.secondaryColor")}
              </Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="secondaryColor"
                  name="secondaryColor"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded-md border border-input p-1"
                />
                <span className="text-sm text-gray-500 font-mono">{secondaryColor}</span>
              </div>
            </div>

            {/* Hero Content */}
            <div className="space-y-2">
              <Label htmlFor="heroContent" className="text-gray-800">
                {t("onboarding.welcomeMessage")}
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {GREETING_TEMPLATES.map((tpl) => {
                  const active = heroContent === tpl.body[templateLocale];
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setHeroContent(tpl.body[templateLocale])}
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border transition-colors ${
                        active
                          ? "bg-green-600 text-white border-green-600"
                          : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      {tpl.label[templateLocale]}
                    </button>
                  );
                })}
                <button
                  type="button"
                  onClick={() => setHeroContent("")}
                  className="text-xs font-medium px-2.5 py-1 rounded-full border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 transition-colors"
                >
                  {locale === "es" ? "Personalizado" : "Custom"}
                </button>
              </div>
              <textarea
                id="heroContent"
                name="heroContent"
                rows={3}
                placeholder={t("onboarding.welcomePlaceholder")}
                value={heroContent}
                onChange={(e) => setHeroContent(e.target.value)}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-green-500 focus-visible:ring-[3px] focus-visible:ring-green-500/30 resize-none"
              />
            </div>

            {/* Live Preview */}
            <div className="space-y-2">
              <Label className="text-gray-800">{t("onboarding.preview")}</Label>
              <div
                className="rounded-lg border p-5 transition-colors"
                style={{ backgroundColor: secondaryColor }}
              >
                <h3
                  className="text-lg font-bold mb-2"
                  style={{ color: primaryColor }}
                >
                  {t("onboarding.previewClub")}
                </h3>
                <p className="text-sm" style={{ color: primaryColor, opacity: 0.85 }}>
                  {heroContent || t("onboarding.previewPlaceholder")}
                </p>
                <div
                  className="mt-3 inline-block rounded-md px-4 py-1.5 text-xs font-semibold"
                  style={{ backgroundColor: primaryColor, color: secondaryColor }}
                >
                  {t("onboarding.sampleButton")}
                </div>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500/30"
              size="lg"
            >
              {isPending ? t("onboarding.saving") : t("common.continue")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BrandingPage() {
  const { t } = useLanguage();
  return (
    <Suspense fallback={<div className="text-center text-gray-500 py-12">{t("common.loading")}</div>}>
      <BrandingForm />
    </Suspense>
  );
}
