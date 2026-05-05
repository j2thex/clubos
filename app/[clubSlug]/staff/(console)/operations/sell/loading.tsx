import { SkeletonHeader, SkeletonCardGrid } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <SkeletonHeader />
      <SkeletonCardGrid count={6} cols={2} />
    </div>
  );
}
