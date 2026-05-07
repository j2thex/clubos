import { SkeletonHeader, SkeletonCardGrid } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <SkeletonHeader />
      <SkeletonCardGrid count={4} cols={1} />
    </div>
  );
}
