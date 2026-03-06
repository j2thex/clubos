"use client";

import { useActionState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createOrgAndClub } from "./actions";

function formAction(_prev: { error: string } | undefined, formData: FormData) {
  return createOrgAndClub(formData);
}

export default function OnboardingPage() {
  const [state, dispatch, isPending] = useActionState(formAction, undefined);
  const detectedTimezone = typeof window !== "undefined"
    ? Intl.DateTimeFormat().resolvedOptions().timeZone
    : "UTC";

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-green-700">Step 1 of 3</p>
        <div className="flex items-center justify-center gap-2">
          <span className="h-2 w-8 rounded-full bg-green-600" />
          <span className="h-2 w-8 rounded-full bg-gray-200" />
          <span className="h-2 w-8 rounded-full bg-gray-200" />
        </div>
      </div>

      <Card className="border-green-200 shadow-lg shadow-green-100/50">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-gray-900">Create Your Club</CardTitle>
          <CardDescription className="text-gray-600">
            What&apos;s your club called?
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state?.error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </div>
          )}

          <form action={dispatch} className="space-y-5">
            <input type="hidden" name="timezone" value={detectedTimezone} />
            <input type="hidden" name="currency" value="EUR" />

            {/* Club Name */}
            <div className="space-y-2">
              <Label htmlFor="clubName" className="text-gray-800">
                Club Name
              </Label>
              <Input
                id="clubName"
                name="clubName"
                placeholder="e.g. The Emerald Lounge"
                required
                className="focus-visible:border-green-500 focus-visible:ring-green-500/30"
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              disabled={isPending}
              className="w-full bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500/30"
              size="lg"
            >
              {isPending ? "Creating..." : "Continue"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
