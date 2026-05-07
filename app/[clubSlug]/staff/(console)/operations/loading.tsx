import { SkeletonHeader, SkeletonTabs, SkeletonCardGrid } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="space-y-4 animate-pulse">
      <SkeletonHeader />
      <SkeletonTabs count={6} />
      <SkeletonCardGrid count={5} cols={1} />
    </div>
  );
}
