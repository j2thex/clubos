"use client";

import { useState, useTransition } from "react";
import { createUnclaimedClub, createClubFromGoogleMaps, approveCustomOffer, approveClub, rejectClub, loginAsClubAdmin, setupStandardContent } from "./actions";

interface ClubInfo {
  id: string;
  name: string;
  slug: string;
  approved: boolean;
  claimed: boolean;
  inviteOnly: boolean;
  logoUrl: string | null;
  primaryColor: string;
  createdAt: string;
  members: number;
  spins: number;
  events: number;
  offers: number;
  ownerEmail: string | null;
}

interface Stats {
  totalClubs: number;
  totalMembers: number;
  totalSpins: number;
  totalQuestCompletions: number;
  totalEvents: number;
  pendingInvites: number;
  pendingQuests: number;
  expiringMembers: number;
}

interface Growth {
  membersToday: number;
  membersThisWeek: number;
  membersThisMonth: number;
  membersAllTime: number;
  spinsToday: number;
  spinsThisWeek: number;
  spinsThisMonth: number;
  spinsAllTime: number;
  clubsThisWeek: number;
  clubsThisMonth: number;
  clubsAllTime: number;
}

interface ActivityEntry {
  id: string;
  clubName: string;
  action: string;
  target: string | null;
  details: string | null;
  createdAt: string;
}

interface InviteRequest {
  id: string;
  clubName: string;
  name: string;
  contact: string;
  createdAt: string;
}

interface UnapprovedOffer {
  id: string;
  name: string;
  subtype: string;
  clubName: string;
  createdAt: string;
}

const ACTION_BADGES: Record<string, { label: string; color: string }> = {
  member_created: { label: "New member", color: "bg-green-500/20 text-green-300" },
  spin_performed: { label: "Spin", color: "bg-purple-500/20 text-purple-300" },
  quest_validated: { label: "Quest", color: "bg-blue-500/20 text-blue-300" },
  quest_approved: { label: "Quest", color: "bg-blue-500/20 text-blue-300" },
  checkin: { label: "Check-in", color: "bg-green-500/20 text-green-300" },
  order_fulfilled: { label: "Order", color: "bg-amber-500/20 text-amber-300" },
  offer_order_fulfilled: { label: "Order", color: "bg-amber-500/20 text-amber-300" },
  offer_walkin_order: { label: "Walk-in", color: "bg-amber-500/20 text-amber-300" },
  role_assigned: { label: "Role", color: "bg-blue-500/20 text-blue-300" },
  validity_updated: { label: "Validity", color: "bg-cyan-500/20 text-cyan-300" },
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function PlatformAdminClient({
  secret,
  stats,
  growth,
  clubs,
  activityFeed,
  inviteRequests,
  unapprovedOffers,
}: {
  secret: string;
  stats: Stats;
  growth: Growth;
  clubs: ClubInfo[];
  activityFeed: ActivityEntry[];
  inviteRequests: InviteRequest[];
  unapprovedOffers: UnapprovedOffer[];
}) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showGoogleForm, setShowGoogleForm] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#16a34a");
  const [secondaryColor, setSecondaryColor] = useState("#052e16");
  const [googleMapsUrl, setGoogleMapsUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [setupClubId, setSetupClubId] = useState<string | null>(null);
  const [setupType, setSetupType] = useState("general");

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const fd = new FormData(e.currentTarget);
      fd.set("slug", slug);
      const result = await createUnclaimedClub(fd, secret);
      if ("error" in result) {
        setError(result.error);
      } else {
        setSuccess(`Created: ${result.slug}`);
        setName("");
        setSlug("");
        setTimeout(() => setSuccess(null), 3000);
      }
    });
  }

  function handleGoogleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await createClubFromGoogleMaps(googleMapsUrl, secret);
      if ("error" in result) {
        setError(result.error);
      } else {
        setSuccess(`Created "${result.name}" → /${result.slug} — Login: ${result.email} / q1234567`);
        setGoogleMapsUrl("");
        setTimeout(() => setSuccess(null), 10000);
      }
    });
  }

  function handleApproveOffer(offerId: string) {
    startTransition(async () => {
      await approveCustomOffer(offerId, secret);
    });
  }

  const pendingTotal = stats.pendingInvites + stats.pendingQuests + stats.expiringMembers;

  return (
    <div className="min-h-screen landing-dark text-white">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">osocios control panel</h1>
            <p className="text-sm text-white/40 font-mono mt-1">platform dashboard</p>
          </div>
          <a href="/" className="text-xs text-white/30 hover:text-white/60 transition-colors">
            Back to site
          </a>
        </div>

        {/* Key Numbers */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard label="Clubs" value={stats.totalClubs} />
          <StatCard label="Members" value={stats.totalMembers} />
          <StatCard label="Spins" value={stats.totalSpins} />
          <StatCard label="Quests Done" value={stats.totalQuestCompletions} />
          <StatCard label="Events" value={stats.totalEvents} />
          <StatCard label="Pending" value={pendingTotal} alert={pendingTotal > 0} />
        </div>

        {/* Growth Timeline */}
        <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-5">
          <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-4">Growth</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <GrowthColumn label="Members" today={growth.membersToday} week={growth.membersThisWeek} month={growth.membersThisMonth} total={growth.membersAllTime} />
            <GrowthColumn label="Spins" today={growth.spinsToday} week={growth.spinsThisWeek} month={growth.spinsThisMonth} total={growth.spinsAllTime} />
            <GrowthColumn label="Clubs" week={growth.clubsThisWeek} month={growth.clubsThisMonth} total={growth.clubsAllTime} />
          </div>
        </div>

        {/* Operational Alerts */}
        {pendingTotal > 0 && (
          <div className="bg-amber-500/10 rounded-xl border border-amber-500/20 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-amber-300 uppercase tracking-wide">Alerts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              {stats.pendingQuests > 0 && (
                <div className="text-amber-200">
                  <span className="font-mono text-lg font-bold">{stats.pendingQuests}</span> pending quest verifications
                </div>
              )}
              {stats.pendingInvites > 0 && (
                <div className="text-amber-200">
                  <span className="font-mono text-lg font-bold">{stats.pendingInvites}</span> invite requests
                </div>
              )}
              {stats.expiringMembers > 0 && (
                <div className="text-amber-200">
                  <span className="font-mono text-lg font-bold">{stats.expiringMembers}</span> members expiring this week
                </div>
              )}
            </div>
          </div>
        )}

        {/* Per-Club Breakdown */}
        <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden">
          <div className="px-5 py-3 border-b border-white/[0.06]">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide">Clubs ({clubs.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-white/40 text-xs uppercase tracking-wide">
                  <th className="text-left px-5 py-2">Club</th>
                  <th className="text-left px-3 py-2">Owner</th>
                  <th className="text-right px-3 py-2">Members</th>
                  <th className="text-right px-3 py-2">Spins</th>
                  <th className="text-right px-3 py-2">Events</th>
                  <th className="text-right px-3 py-2">Offers</th>
                  <th className="text-right px-3 py-2">Status</th>
                  <th className="text-right px-3 py-2">Actions</th>
                  <th className="text-right px-5 py-2">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {clubs.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {c.logoUrl ? (
                          <img src={c.logoUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: c.primaryColor }}>
                            {c.name[0]}
                          </div>
                        )}
                        <div>
                          <a href={`/${c.slug}/admin`} className="font-medium text-white hover:underline">{c.name}</a>
                          <p className="text-xs text-white/30 font-mono">{c.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {c.ownerEmail ? (
                        <span className="text-xs text-gray-500 font-mono truncate block max-w-[180px]">{c.ownerEmail}</span>
                      ) : (
                        <span className="text-xs text-white/20">—</span>
                      )}
                    </td>
                    <td className="text-right px-3 py-3 font-mono text-white/70">{c.members}</td>
                    <td className="text-right px-3 py-3 font-mono text-white/70">{c.spins}</td>
                    <td className="text-right px-3 py-3 font-mono text-white/70">{c.events}</td>
                    <td className="text-right px-3 py-3 font-mono text-white/70">{c.offers}</td>
                    <td className="text-right px-3 py-3">
                      <div className="flex gap-1 justify-end">
                        {!c.approved ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300">Pending</span>
                        ) : c.approved && !c.claimed ? (
                          <>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-300">Live</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-500/20 text-gray-400">unclaimed</span>
                          </>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-300">Live</span>
                        )}
                        {c.inviteOnly && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300">invite-only</span>}
                      </div>
                    </td>
                    <td className="text-right px-3 py-3">
                      <div className="flex gap-1 justify-end">
                        {!c.approved ? (
                          <button
                            onClick={() => startTransition(async () => { await approveClub(c.id); })}
                            disabled={isPending}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 hover:bg-green-500/30 disabled:opacity-50 transition-colors"
                          >
                            Approve
                          </button>
                        ) : (
                          <button
                            onClick={() => startTransition(async () => { await rejectClub(c.id); })}
                            disabled={isPending}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 disabled:opacity-50 transition-colors"
                          >
                            Take Offline
                          </button>
                        )}
                        <button
                          onClick={() => startTransition(async () => {
                            const res = await loginAsClubAdmin(c.id, c.slug, secret);
                            if ("ok" in res) window.open(res.redirectUrl, "_blank");
                            else setError(res.error);
                          })}
                          disabled={isPending}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 disabled:opacity-50 transition-colors"
                        >
                          Admin ↗
                        </button>
                        {setupClubId === c.id ? (
                          <span className="flex items-center gap-1">
                            <select
                              value={setupType}
                              onChange={(e) => setSetupType(e.target.value)}
                              className="text-[10px] bg-white/10 text-white rounded px-1 py-0.5 border border-white/10"
                            >
                              <option value="general">General</option>
                              <option value="smoke">Smoke</option>
                              <option value="bar">Bar</option>
                              <option value="sports">Sports</option>
                              <option value="coworking">Coworking</option>
                              <option value="coffee">Coffee</option>
                            </select>
                            <button
                              onClick={() => startTransition(async () => {
                                const res = await setupStandardContent(c.id, setupType, secret);
                                if ("ok" in res) {
                                  setSuccess(`Added ${res.questCount} quests + ${res.eventCount} events`);
                                  setSetupClubId(null);
                                  setTimeout(() => setSuccess(null), 5000);
                                } else setError(res.error);
                              })}
                              disabled={isPending}
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-500/20 text-green-300 hover:bg-green-500/30 disabled:opacity-50"
                            >
                              Go
                            </button>
                            <button onClick={() => setSetupClubId(null)} className="text-[10px] text-white/30 hover:text-white/60">✕</button>
                          </span>
                        ) : (
                          <button
                            onClick={() => { setSetupClubId(c.id); setSetupType("general"); }}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
                          >
                            Setup
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="text-right px-5 py-3 text-xs text-white/30">{timeAgo(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Invite Requests */}
        {inviteRequests.length > 0 && (
          <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide">Recent Invite Requests</h2>
            <div className="space-y-2">
              {inviteRequests.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-white/80">{r.name}</span>
                    <span className="text-white/30 mx-2">&middot;</span>
                    <span className="text-white/40 font-mono text-xs">{r.contact}</span>
                    <span className="text-white/30 mx-2">&rarr;</span>
                    <span className="text-white/50">{r.clubName}</span>
                  </div>
                  <span className="text-xs text-white/30">{timeAgo(r.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unapproved Custom Offers */}
        {unapprovedOffers.length > 0 && (
          <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide">Custom Offers Awaiting Approval ({unapprovedOffers.length})</h2>
            <div className="space-y-2">
              {unapprovedOffers.map((o) => (
                <div key={o.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-white/80">{o.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/40 ml-2">{o.subtype}</span>
                    <span className="text-white/30 mx-2">from</span>
                    <span className="text-white/50">{o.clubName}</span>
                  </div>
                  <button onClick={() => handleApproveOffer(o.id)} disabled={isPending} className="text-xs font-semibold px-3 py-1 rounded-full bg-green-500/20 text-green-300 hover:bg-green-500/30 disabled:opacity-50 transition-colors">
                    Approve
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Feed */}
        {activityFeed.length > 0 && (
          <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] p-5 space-y-3">
            <h2 className="text-sm font-semibold text-white/60 uppercase tracking-wide">Recent Activity</h2>
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {activityFeed.map((a) => {
                const badge = ACTION_BADGES[a.action] ?? { label: a.action, color: "bg-white/10 text-white/40" };
                return (
                  <div key={a.id} className="flex items-center gap-3 text-sm py-1">
                    <span className="text-xs text-white/20 w-14 shrink-0 text-right font-mono">{timeAgo(a.createdAt)}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${badge.color}`}>{badge.label}</span>
                    <span className="text-white/40 text-xs shrink-0">{a.clubName}</span>
                    {a.target && <span className="text-white/60 font-mono text-xs">{a.target}</span>}
                    {a.details && <span className="text-white/30 text-xs truncate">{a.details}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Create from Google Maps (collapsible) */}
        <div className="bg-white/[0.03] rounded-xl border border-emerald-500/20 overflow-hidden">
          <button onClick={() => setShowGoogleForm(!showGoogleForm)} className="w-full px-5 py-3 flex items-center justify-between text-sm font-medium text-emerald-400/70 hover:text-emerald-300 transition-colors">
            <span>🗺️ Create Club from Google Maps</span>
            <svg className={`w-4 h-4 transition-transform ${showGoogleForm ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showGoogleForm && (
            <form onSubmit={handleGoogleCreate} className="px-5 pb-5 space-y-3 border-t border-white/[0.06] pt-4">
              {error && <p className="text-xs text-red-400">{error}</p>}
              {success && <p className="text-xs text-green-400">{success}</p>}
              <p className="text-xs text-white/40">Paste a Google Maps link. Club name, location, and owner account will be created automatically.</p>
              <input
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                placeholder="https://www.google.com/maps/place/..."
                required
                className="w-full rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/30"
              />
              <p className="text-[10px] text-white/30">Owner login: [slug]@osocios.com / q1234567</p>
              <button type="submit" disabled={isPending} className="rounded-lg bg-emerald-600/30 text-emerald-300 px-4 py-2 text-sm font-semibold hover:bg-emerald-600/50 disabled:opacity-50 transition-colors">
                {isPending ? "Creating..." : "Create from Maps"}
              </button>
            </form>
          )}
        </div>

        {/* Create Club (collapsible) */}
        <div className="bg-white/[0.03] rounded-xl border border-white/[0.06] overflow-hidden">
          <button onClick={() => setShowCreateForm(!showCreateForm)} className="w-full px-5 py-3 flex items-center justify-between text-sm font-medium text-white/50 hover:text-white/70 transition-colors">
            <span>Create Unclaimed Club</span>
            <svg className={`w-4 h-4 transition-transform ${showCreateForm ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showCreateForm && (
            <form onSubmit={handleCreate} className="px-5 pb-5 space-y-3 border-t border-white/[0.06] pt-4">
              {error && <p className="text-xs text-red-400">{error}</p>}
              {success && <p className="text-xs text-green-400">{success}</p>}
              <div className="grid grid-cols-2 gap-3">
                <input name="name" value={name} onChange={(e) => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")); }} placeholder="Club name" required className="rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/20" />
                <input name="slug" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="slug" required className="rounded-lg bg-white/[0.05] border border-white/10 px-3 py-2 text-sm text-white font-mono placeholder:text-white/30 focus:outline-none focus:border-white/20" />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <input name="primaryColor" type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-8 h-8 rounded border border-white/10 cursor-pointer" />
                  <span className="text-xs text-white/30 font-mono">{primaryColor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input name="secondaryColor" type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-8 h-8 rounded border border-white/10 cursor-pointer" />
                  <span className="text-xs text-white/30 font-mono">{secondaryColor}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-white/30 block mb-1">Logo</label>
                  <input name="logo" type="file" accept="image/*" className="text-xs text-white/40" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-white/30 block mb-1">Cover</label>
                  <input name="cover" type="file" accept="image/*" className="text-xs text-white/40" />
                </div>
              </div>
              <button type="submit" disabled={isPending} className="rounded-lg bg-white/10 text-white px-4 py-2 text-sm font-semibold hover:bg-white/20 disabled:opacity-50 transition-colors">
                {isPending ? "Creating..." : "Create Club"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${alert ? "bg-amber-500/10 border-amber-500/20" : "bg-white/[0.03] border-white/[0.06]"}`}>
      <p className={`text-xs font-medium uppercase tracking-wide ${alert ? "text-amber-300/60" : "text-white/40"}`}>{label}</p>
      <p className={`mt-1 text-2xl font-bold font-mono ${alert ? "text-amber-300" : "text-white"}`}>{value.toLocaleString()}</p>
    </div>
  );
}

function GrowthColumn({ label, today, week, month, total }: { label: string; today?: number; week: number; month: number; total: number }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-white/50 uppercase tracking-wide">{label}</p>
      <div className="space-y-1 text-sm">
        {today !== undefined && (
          <div className="flex justify-between">
            <span className="text-white/30">Today</span>
            <span className="font-mono text-white/70">{today}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-white/30">This week</span>
          <span className="font-mono text-white/70">{week}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/30">This month</span>
          <span className="font-mono text-white/70">{month}</span>
        </div>
        <div className="flex justify-between border-t border-white/[0.06] pt-1">
          <span className="text-white/40 font-medium">All time</span>
          <span className="font-mono font-bold text-white">{total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
