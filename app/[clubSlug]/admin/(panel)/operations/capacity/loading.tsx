import { SkeletonHeader, SkeletonStatRow, SkeletonTable } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <SkeletonHeader />
      <SkeletonStatRow count={2} />
      <SkeletonTable rows={8} />
    </div>
  );
}
