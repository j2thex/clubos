import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { seedClubData } from "../actions";

export default async function CompletePage({
  searchParams,
}: {
  searchParams: Promise<{ clubId?: string }>;
}) {
  const { clubId } = await searchParams;

  if (!clubId) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Missing club ID. Please start onboarding again.</p>
        <Link href="/onboarding" className="text-green-600 underline mt-2 inline-block">
          Go to Onboarding
        </Link>
      </div>
    );
  }

  // Seed wheel config and create test member
  const { memberCode, pin } = await seedClubData(clubId);

  // Fetch club slug
  const supabase = createAdminClient();
  const { data: club } = await supabase
    .from("clubs")
    .select("slug")
    .eq("id", clubId)
    .single();

  const portalUrl = club?.slug ? `/${club.slug}/login` : "/";

  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="text-center space-y-1">
        <p className="text-sm font-medium text-green-700">Step 3 of 3</p>
        <div className="flex items-center justify-center gap-2">
          <span className="h-2 w-8 rounded-full bg-green-600" />
          <span className="h-2 w-8 rounded-full bg-green-600" />
          <span className="h-2 w-8 rounded-full bg-green-600" />
        </div>
      </div>

      <Card className="border-green-200 shadow-lg shadow-green-100/50">
        <CardHeader className="text-center">
          {/* Success checkmark */}
          <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>
          <CardTitle className="text-2xl text-gray-900">Your Club is Ready!</CardTitle>
          <CardDescription className="text-gray-600">
            We&apos;ve set up your wheel configuration and created a test member account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test credentials box */}
          <div className="rounded-lg border border-green-300 bg-green-50 p-5">
            <h3 className="text-sm font-semibold text-green-900 mb-3">Test Member Credentials</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-800">Member Code</span>
                <span className="font-mono text-lg font-bold text-green-950">{memberCode}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-800">PIN</span>
                <span className="font-mono text-lg font-bold text-green-950">{pin}</span>
              </div>
            </div>
            <p className="mt-3 text-xs text-green-700">
              This test member has 10 spins pre-loaded. Use these credentials to log in to the
              member portal and try the spin-the-wheel experience.
            </p>
          </div>

          {/* Portal link */}
          <Link
            href={portalUrl}
            className="block w-full rounded-md bg-green-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 transition-colors"
          >
            Go to Member Portal
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
