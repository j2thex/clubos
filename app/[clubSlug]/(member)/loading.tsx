export default function MemberLoading() {
  return (
    <div className="min-h-screen club-page-bg animate-pulse">
      {/* Hero skeleton */}
      <div className="relative px-6 pt-10 pb-16 text-center">
        <div className="absolute inset-0 bg-gray-200" />
        <div className="relative space-y-3">
          <div className="w-14 h-14 rounded-xl bg-gray-300 mx-auto" />
          <div className="h-3 w-24 bg-gray-300 rounded mx-auto" />
          <div className="h-6 w-48 bg-gray-300 rounded mx-auto" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="relative z-10 px-4 -mt-8 pb-10 max-w-md mx-auto space-y-4">
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-lg p-4 space-y-2">
              <div className="h-2 w-12 bg-gray-200 rounded mx-auto" />
              <div className="h-8 w-10 bg-gray-200 rounded mx-auto" />
              <div className="h-2 w-8 bg-gray-200 rounded mx-auto" />
            </div>
          ))}
        </div>

        {/* Card skeletons */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-lg p-5 space-y-3">
            <div className="h-4 w-3/4 bg-gray-200 rounded" />
            <div className="h-3 w-full bg-gray-200 rounded" />
            <div className="h-3 w-2/3 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}
