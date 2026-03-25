import Link from "next/link";

export function PendingApproval({ clubName, clubSlug }: { clubName: string; clubSlug: string }) {
  return (
    <div className="min-h-svh flex items-center justify-center bg-gray-50 px-6">
      <div className="max-w-sm text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-yellow-100 flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900">{clubName}</h1>
        <p className="text-sm text-gray-500">
          This club is pending approval. It will be available once reviewed by our team.
        </p>
        <Link
          href={`/${clubSlug}/admin`}
          className="inline-block text-xs text-gray-400 hover:text-gray-600 transition-colors mt-2"
        >
          Club admin →
        </Link>
      </div>
    </div>
  );
}
