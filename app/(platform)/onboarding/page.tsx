"use client";

import { useActionState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { createOrgAndClub } from "./actions";

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
];

const CURRENCIES = [
  { value: "USD", label: "USD - US Dollar" },
  { value: "EUR", label: "EUR - Euro" },
  { value: "GBP", label: "GBP - British Pound" },
  { value: "CAD", label: "CAD - Canadian Dollar" },
  { value: "AUD", label: "AUD - Australian Dollar" },
  { value: "JPY", label: "JPY - Japanese Yen" },
  { value: "CHF", label: "CHF - Swiss Franc" },
  { value: "INR", label: "INR - Indian Rupee" },
];

function formAction(_prev: { error: string } | undefined, formData: FormData) {
  return createOrgAndClub(formData);
}

export default function OnboardingPage() {
  const [state, dispatch, isPending] = useActionState(formAction, undefined);

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
            Set up your organization and club to get started.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {state?.error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {state.error}
            </div>
          )}

          <form action={dispatch} className="space-y-5">
            {/* Organization Name */}
            <div className="space-y-2">
              <Label htmlFor="orgName" className="text-gray-800">
                Organization Name
              </Label>
              <Input
                id="orgName"
                name="orgName"
                placeholder="e.g. Greenfield Hospitality Group"
                required
                className="focus-visible:border-green-500 focus-visible:ring-green-500/30"
              />
            </div>

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

            {/* Timezone */}
            <div className="space-y-2">
              <Label htmlFor="timezone" className="text-gray-800">
                Timezone
              </Label>
              <select
                id="timezone"
                name="timezone"
                defaultValue="UTC"
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-green-500 focus-visible:ring-[3px] focus-visible:ring-green-500/30"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace(/_/g, " ")}
                  </option>
                ))}
              </select>
            </div>

            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="currency" className="text-gray-800">
                Currency
              </Label>
              <select
                id="currency"
                name="currency"
                defaultValue="USD"
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-green-500 focus-visible:ring-[3px] focus-visible:ring-green-500/30"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
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
