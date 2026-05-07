export function SkeletonHeader() {
  return (
    <div className="space-y-2 px-1">
      <div className="h-3 w-24 rounded bg-gray-300" />
      <div className="h-6 w-56 max-w-full rounded bg-gray-200" />
    </div>
  );
}

export function SkeletonStatRow({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="h-3 w-16 rounded bg-gray-200" />
          <div className="mt-3 h-7 w-20 rounded bg-gray-300" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 6 }: { rows?: number }) {
  return (
    <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
      <div className="border-b border-gray-100 p-4">
        <div className="h-3 w-32 rounded bg-gray-300" />
      </div>
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4">
            <div className="h-9 w-9 shrink-0 rounded-full bg-gray-200" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-3/5 rounded bg-gray-200" />
              <div className="h-2.5 w-2/5 rounded bg-gray-100" />
            </div>
            <div className="h-7 w-16 rounded bg-gray-200" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCardGrid({
  count = 6,
  cols = 2,
}: {
  count?: number;
  cols?: 1 | 2;
}) {
  const gridCls = cols === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2";
  return (
    <div className={`grid gap-3 ${gridCls}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl bg-white p-5 shadow-lg">
          <div className="h-4 w-2/3 rounded bg-gray-300" />
          <div className="mt-2 h-3 w-4/5 rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTabs({ count = 5 }: { count?: number }) {
  return (
    <div className="flex gap-2 overflow-hidden py-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-10 w-24 shrink-0 rounded-full bg-gray-200" />
      ))}
    </div>
  );
}

export function SkeletonPage({
  variant = "table",
}: {
  variant?: "table" | "grid" | "stats-table";
}) {
  return (
    <div className="space-y-4 animate-pulse">
      <SkeletonHeader />
      {variant === "stats-table" && <SkeletonStatRow count={3} />}
      {variant === "grid" ? <SkeletonCardGrid count={6} /> : <SkeletonTable rows={6} />}
    </div>
  );
}
