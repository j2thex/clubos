import { SkeletonHeader, SkeletonStatRow, SkeletonTable } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <SkeletonHeader />
      <SkeletonStatRow count={3} />
      <SkeletonTable rows={6} />
    </div>
  );
}
