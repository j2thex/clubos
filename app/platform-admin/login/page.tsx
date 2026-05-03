import { redirect } from "next/navigation";
import { getPlatformAdminFromCookie } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function PlatformAdminLoginPage() {
  const session = await getPlatformAdminFromCookie();
  if (session) redirect("/platform-admin");

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 bg-gray-50"
      style={{ colorScheme: "light" }}
    >
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gray-100 mb-4">
              <svg
                className="w-7 h-7 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Platform Admin</h1>
            <p className="text-sm text-gray-500 mt-1">
              Restricted area. Sign in with the platform secret.
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
