"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateBranding } from "../actions";

function formAction(_prev: { error: string } | undefined, formData: FormData) {
  return updateBranding(formData);
}

function BrandingForm() {
  const searchParams = useSearchParams();
  const clubId = searchParams.get("clubId") ?? "";
  const [state, dispatch, isPending] = useActionState(formAction, undefined);

  const [primaryColor, setPrimaryColor] = useState("#16a34a");
  const [secondaryColor, setSecondaryColor] = useState("#052e16");
  const [heroContent, setHeroContent] = useState("");

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-green-700">Step 2 of 3</p>
        <div className="flex items-center justify-center gap-2">
          <span className="h-2 w-8 rounded-full bg-green-600" />
          <span className="h-2 w-8 rounded-full bg-green-600" />
          <span className="h-2 w-8 rounded-full bg-gray-200" />
        </div>
      </div>

      <Card className="border-green-200 shadow-lg shadow-green-100/50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-gray-900">Customize Your Branding</CardTitle>
          <CardDescription className="text-gray-600">
            Choose your club colors and welcome message.
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

            {/* Primary Color */}
            <div className="space-y-2">
              <Label htmlFor="primaryColor" className="text-gray-800">
                Primary Color
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
                Secondary Color
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
                Welcome Message
              </Label>
              <textarea
                id="heroContent"
                name="heroContent"
                rows={3}
                placeholder="e.g. Welcome to our exclusive club! Enjoy premium perks and rewards."
                value={heroContent}
                onChange={(e) => setHeroContent(e.target.value)}
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-green-500 focus-visible:ring-[3px] focus-visible:ring-green-500/30 resize-none"
              />
            </div>

            {/* Live Preview */}
            <div className="space-y-2">
              <Label className="text-gray-800">Preview</Label>
              <div
                className="rounded-lg border p-5 transition-colors"
                style={{ backgroundColor: secondaryColor }}
              >
                <h3
                  className="text-lg font-bold mb-2"
                  style={{ color: primaryColor }}
                >
                  Your Club
                </h3>
                <p className="text-sm" style={{ color: primaryColor, opacity: 0.85 }}>
                  {heroContent || "Your welcome message will appear here..."}
                </p>
                <div
                  className="mt-3 inline-block rounded-md px-4 py-1.5 text-xs font-semibold"
                  style={{ backgroundColor: primaryColor, color: secondaryColor }}
                >
                  Sample Button
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
              {isPending ? "Saving..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function BrandingPage() {
  return (
    <Suspense fallback={<div className="text-center text-gray-500 py-12">Loading...</div>}>
      <BrandingForm />
    </Suspense>
  );
}
