export default function OffersLoading() {
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
        <div className="h-2.5 w-24 rounded-[var(--m-radius-xs)] bg-gray-200" />
        <div className="mt-2 h-8 w-40 rounded-[var(--m-radius-sm)] bg-gray-200" />
      </header>

      <div className="mx-auto max-w-md space-y-6 px-5 pb-24 pt-5">
        {[1, 2].map((group) => (
          <div key={group} className="space-y-3">
            <div className="h-2.5 w-20 rounded-[var(--m-radius-xs)] bg-gray-300" />
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6].map((tile) => (
                <div
                  key={tile}
                  className="m-card relative flex min-h-[112px] flex-col overflow-hidden"
                >
                  <div
                    className="h-16 w-full"
                    style={{ background: "var(--m-surface-sunken)" }}
                  />
                  <div className="flex flex-1 flex-col gap-1 p-2">
                    <div className="h-2.5 w-full rounded-[var(--m-radius-xs)] bg-gray-200" />
                    <div className="h-2.5 w-2/3 rounded-[var(--m-radius-xs)] bg-gray-200" />
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
