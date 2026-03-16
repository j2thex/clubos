"use client";

import { DynamicIcon } from "@/components/dynamic-icon";
import { useLanguage } from "@/lib/i18n/provider";

interface BadgeInfo {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  imageUrl: string | null;
  color: string;
  questTitle: string | null;
}

interface EarnedBadge {
  badgeId: string;
  earnedAt: string;
}

export function BadgeCollection({
  allBadges,
  earnedBadges,
}: {
  allBadges: BadgeInfo[];
  earnedBadges: EarnedBadge[];
}) {
  const { t } = useLanguage();
  const earnedSet = new Map(earnedBadges.map((e) => [e.badgeId, e.earnedAt]));

  const earned = allBadges.filter((b) => earnedSet.has(b.id));
  const locked = allBadges.filter((b) => !earnedSet.has(b.id));

  if (allBadges.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Earned */}
      {earned.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {earned.map((badge) => (
            <div
              key={badge.id}
              className="bg-white rounded-2xl shadow-lg p-4 text-center"
            >
              {badge.imageUrl ? (
                <img src={badge.imageUrl} alt="" className="w-12 h-12 rounded-full mx-auto object-cover" />
              ) : (
                <div
                  className="w-12 h-12 rounded-full mx-auto flex items-center justify-center"
                  style={{ backgroundColor: badge.color + "20", color: badge.color }}
                >
                  {badge.icon ? (
                    <DynamicIcon name={badge.icon} className="w-6 h-6" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                  )}
                </div>
              )}
              <p className="mt-2 text-xs font-semibold text-gray-900 leading-tight">{badge.name}</p>
              <p className="text-[10px] text-gray-400 mt-1">
                {new Date(earnedSet.get(badge.id)!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Locked */}
      {locked.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {locked.map((badge) => (
            <div
              key={badge.id}
              className="bg-white/60 rounded-2xl shadow p-4 text-center opacity-50"
            >
              <div className="relative mx-auto w-12 h-12">
                {badge.imageUrl ? (
                  <img src={badge.imageUrl} alt="" className="w-12 h-12 rounded-full object-cover grayscale" />
                ) : (
                  <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 text-gray-300">
                    {badge.icon ? (
                      <DynamicIcon name={badge.icon} className="w-6 h-6" />
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                    )}
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <p className="mt-2 text-xs font-semibold text-gray-500 leading-tight">{badge.name}</p>
              {badge.questTitle && (
                <p className="text-[10px] text-gray-400 mt-1 leading-tight">
                  {t("profile.completeToUnlock", { title: badge.questTitle })}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
