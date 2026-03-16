import { createAdminClient } from "@/lib/supabase/admin";
import { ResetForm } from "./reset-form";
import Link from "next/link";

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ clubSlug: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { clubSlug } = await params;
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 text-center">
          <p className="text-sm text-red-600 mb-4">Invalid reset link.</p>
          <Link href={`/${clubSlug}/admin/login`} className="text-sm text-gray-500 hover:text-gray-700">
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  // Validate token server-side
  const supabase = createAdminClient();
  const { data: resetToken } = await supabase
    .from("password_reset_tokens")
    .select("id, expires_at, used")
    .eq("token", token)
    .single();

  const isValid = resetToken && !resetToken.used && new Date(resetToken.expires_at) > new Date();

  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-50 mb-4">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Link expired</h1>
          <p className="text-sm text-gray-500 mb-6">
            {resetToken?.used
              ? "This reset link has already been used."
              : "This reset link has expired. Please request a new one."}
          </p>
          <Link
            href={`/${clubSlug}/admin/login`}
            className="inline-block rounded-lg bg-gray-800 text-white px-6 py-2.5 text-sm font-semibold hover:bg-gray-700 transition-colors"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mb-4">
              <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Set new password</h1>
            <p className="text-sm text-gray-500 mt-1">
              Choose a new password for your admin account
            </p>
          </div>

          <ResetForm token={token} />
        </div>
      </div>
    </div>
  );
}
