export default function EventsLoading() {
  return (
    <div
      className="min-h-screen animate-pulse"
      style={{ background: "var(--m-surface-sunken)" }}
    >
      {/* Editorial top bar */}
      <header
        className="border-b px-5 pt-12 pb-5"
        style={{
          background: "var(--m-surface)",
          borderColor: "var(--m-border)",
          paddingTop: "calc(env(safe-area-inset-top) + 2.5rem)",
        }}
      >
        <div className="h-2.5 w-20 rounded-[var(--m-radius-xs)] bg-gray-200" />
        <div className="mt-2 h-8 w-32 rounded-[var(--m-radius-sm)] bg-gray-200" />
      </header>

      <div className="mx-auto max-w-md space-y-5 px-5 pb-10 pt-5">
        {/* View toggle placeholder */}
        <div className="flex gap-0.5">
          <div className="h-10 w-20 rounded-[var(--m-radius-sm)] bg-gray-200" />
          <div className="h-10 w-24 rounded-[var(--m-radius-sm)] bg-gray-100" />
        </div>

        {/* Two date groups, two rows each */}
        {[0, 1].map((group) => (
          <div key={group} className="space-y-2">
            <div className="h-2.5 w-24 rounded-[var(--m-radius-xs)] bg-gray-300 ml-1" />
            <div className="space-y-2">
              {[0, 1].map((i) => (
                <div key={i} className="m-card p-3">
                  <div className="flex items-stretch gap-3">
                    <div className="h-20 w-20 shrink-0 rounded-[var(--m-radius-sm)] bg-gray-200" />
                    <div className="flex min-w-0 flex-1 flex-col justify-between">
                      <div className="space-y-2">
                        <div className="h-3.5 w-3/4 rounded-[var(--m-radius-xs)] bg-gray-200" />
                        <div className="h-2.5 w-1/2 rounded-[var(--m-radius-xs)] bg-gray-200" />
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="h-4 w-12 rounded-[var(--m-radius-xs)] bg-gray-100" />
                        <div className="h-7 w-20 rounded-[var(--m-radius-sm)] bg-gray-200" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
