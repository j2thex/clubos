export default function MemberLoading() {
  return (
    <div
      className="min-h-screen animate-pulse"
      style={{ background: "var(--m-surface-sunken)" }}
    >
      {/* Hero skeleton (288px) */}
      <div className="relative h-[288px] w-full overflow-hidden bg-gray-200">
        <div
          className="absolute inset-x-0 top-0 flex items-center justify-between px-5"
          style={{ paddingTop: "calc(env(safe-area-inset-top) + 1rem)" }}
        >
          <div className="h-11 w-11 rounded-[var(--m-radius-sm)] bg-gray-300" />
          <div className="flex gap-2">
            <div className="h-9 w-9 rounded-full bg-gray-300" />
            <div className="h-9 w-9 rounded-full bg-gray-300" />
            <div className="h-9 w-9 rounded-full bg-gray-300" />
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 px-5 pb-7 space-y-3">
          <div className="h-2.5 w-40 rounded-[var(--m-radius-xs)] bg-gray-300" />
          <div className="h-8 w-64 rounded-[var(--m-radius-sm)] bg-gray-300" />
        </div>
      </div>

      {/* Bento row — double-wide + single-wide */}
      <div className="relative z-10 mx-auto -mt-6 max-w-md px-5">
        <div className="grid grid-cols-3 gap-3">
          <div
            className="col-span-2 h-24 rounded-[var(--m-radius-sm)] border bg-white"
            style={{
              borderColor: "var(--m-border)",
              boxShadow: "var(--m-elev-raised)",
            }}
          />
          <div
            className="col-span-1 h-24 rounded-[var(--m-radius-sm)] border bg-white"
            style={{
              borderColor: "var(--m-border)",
              boxShadow: "var(--m-elev-raised)",
            }}
          />
        </div>

        {/* Section header */}
        <div className="mt-8 mb-3 flex items-center justify-between px-1">
          <div className="h-2.5 w-24 rounded-[var(--m-radius-xs)] bg-gray-300" />
          <div className="h-2.5 w-20 rounded-[var(--m-radius-xs)] bg-gray-300" />
        </div>

        {/* Quest card skeletons */}
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="m-card p-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 shrink-0 rounded-full bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-3/4 rounded-[var(--m-radius-xs)] bg-gray-200" />
                  <div className="h-2.5 w-1/2 rounded-[var(--m-radius-xs)] bg-gray-200" />
                </div>
                <div className="h-7 w-16 rounded-[var(--m-radius-sm)] bg-gray-200 shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
