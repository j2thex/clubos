"use client";

import { useState, useTransition } from "react";
import { createUnclaimedClub, createClubFromGoogleMaps, approveCustomOffer, approveClub, rejectClub, setClubVisibility, loginAsClubAdmin, setupStandardContent, bulkImportQuests, unlockClubFromPlatform } from "./actions";
import { PartnersManager } from "./partners-manager";

type ClubVisibility = "public" | "unlisted" | "private";

interface Partner {
  id: string;
  name: string;
  logoUrl: string;
  websiteUrl: string;
  displayOrder: number;
  active: boolean;
}

interface ClubInfo {
  id: string;
  name: string;
  slug: string;
  approved: boolean;
  visibility: ClubVisibility;
  requestedVisibility: ClubVisibility;
  claimed: boolean;
  inviteOnly: boolean;
  locked: boolean;
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
  member_created: { label: "New member", color: "bg-green-100 text-green-700" },
  spin_performed: { label: "Spin", color: "bg-purple-100 text-purple-700" },
  quest_validated: { label: "Quest", color: "bg-blue-100 text-blue-700" },
  quest_approved: { label: "Quest", color: "bg-blue-100 text-blue-700" },
  checkin: { label: "Check-in", color: "bg-green-100 text-green-700" },
  order_fulfilled: { label: "Order", color: "bg-amber-100 text-amber-700" },
  offer_order_fulfilled: { label: "Order", color: "bg-amber-100 text-amber-700" },
  offer_walkin_order: { label: "Walk-in", color: "bg-amber-100 text-amber-700" },
  role_assigned: { label: "Role", color: "bg-blue-100 text-blue-700" },
  validity_updated: { label: "Validity", color: "bg-cyan-100 text-cyan-700" },
  email_collected: { label: "Email", color: "bg-indigo-100 text-indigo-700" },
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

interface ParsedQuest {
  title: string;
  description: string;
  icon: string;
  link: string | null;
  reward_spins: number;
  active: boolean;
  multi_use: boolean;
  is_public: boolean;
  proof_mode: string;
  quest_type: string;
  deadline: string | null;
  create_badge: boolean;
  category: string;
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') { current += '"'; i++; }
      else if (ch === '"') { inQuotes = false; }
      else { current += ch; }
    } else {
      if (ch === '"') { inQuotes = true; }
      else if (ch === ',') { fields.push(current.trim()); current = ""; }
      else { current += ch; }
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseQuestCsv(raw: string): { quests: ParsedQuest[]; error: string | null } {
  const lines = raw.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { quests: [], error: "CSV must have a header row and at least one data row" };

  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
  const col = (name: string) => headers.indexOf(name);

  // Find column indices
  const iTitle = col("title");
  const iDesc = col("description");
  const iIcon = col("icon");
  const iLink = headers.findIndex((h) => h.includes("link (optional)") || h === "link");
  const iSpins = col("spins");
  const iActive = col("on/off");
  const iType = col("quest type");
  const iRepeat = headers.findIndex((h) => h.startsWith("repeatable"));
  const iPublic = headers.findIndex((h) => h.includes("public profile"));
  const iProof = headers.findIndex((h) => h.includes("proof"));
  const iBadge = col("badge");
  const iDeadline = col("deadline");
  const iCategory = col("category");

  if (iTitle === -1) return { quests: [], error: "Missing 'Title' column" };

  const quests: ParsedQuest[] = [];
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCsvLine(lines[i]);
    const title = fields[iTitle]?.trim();
    if (!title) continue; // skip empty rows

    const rawType = (fields[iType] || "default").toLowerCase().trim();
    const questType = (rawType === "system" || rawType === "seasonal") ? "default" : rawType;

    const rawProof = (fields[iProof] || "none").toLowerCase().trim();
    const proofMode = rawProof === "not needed" ? "none" : (rawProof === "optional" || rawProof === "required" ? rawProof : "none");

    const deadlineRaw = fields[iDeadline]?.trim();
    let deadline: string | null = null;
    if (deadlineRaw) {
      const d = new Date(deadlineRaw);
      if (!isNaN(d.getTime())) deadline = d.toISOString();
    }

    quests.push({
      title,
      description: fields[iDesc]?.trim() || "",
      icon: fields[iIcon]?.trim() || "",
      link: fields[iLink]?.trim() || null,
      reward_spins: parseFloat(fields[iSpins] || "0") || 0,
      active: (fields[iActive] || "TRUE").toUpperCase() === "TRUE",
      multi_use: (fields[iRepeat] || "No").toLowerCase() === "yes",
      is_public: (fields[iPublic] || "FALSE").toUpperCase() === "TRUE",
      proof_mode: proofMode,
      quest_type: questType,
      deadline,
      create_badge: (fields[iBadge] || "No").toLowerCase() === "yes",
      category: fields[iCategory]?.trim() || "",
    });
  }

  return { quests, error: null };
}

export function PlatformAdminClient({
  secret,
  stats,
  growth,
  clubs,
  activityFeed,
  inviteRequests,
  unapprovedOffers,
  partners,
}: {
  secret: string;
  stats: Stats;
  growth: Growth;
  clubs: ClubInfo[];
  activityFeed: ActivityEntry[];
  inviteRequests: InviteRequest[];
  unapprovedOffers: UnapprovedOffer[];
  partners: Partner[];
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
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkClubId, setBulkClubId] = useState("");
  const [csvText, setCsvText] = useState("");
  const [parsedQuests, setParsedQuests] = useState<ParsedQuest[] | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

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

  function handleParseCsv() {
    setParseError(null);
    const { quests, error: err } = parseQuestCsv(csvText);
    if (err) { setParseError(err); setParsedQuests(null); return; }
    if (quests.length === 0) { setParseError("No valid quest rows found"); setParsedQuests(null); return; }
    setParsedQuests(quests);
  }

  function handleBulkImport() {
    if (!bulkClubId || !parsedQuests?.length) return;
    startTransition(async () => {
      const res = await bulkImportQuests(bulkClubId, parsedQuests, secret);
      if ("error" in res) setError(res.error);
      else {
        setSuccess(`Imported ${res.questCount} quests, ${res.badgeCount} badges`);
        setParsedQuests(null);
        setCsvText("");
        setTimeout(() => setSuccess(null), 5000);
      }
    });
  }

  const pendingTotal = stats.pendingInvites + stats.pendingQuests + stats.expiringMembers;

  return (
    <div className="min-h-screen landing-dark">
      <div className="w-full px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">osocios tower</h1>
            <p className="text-sm text-landing-text-tertiary font-mono mt-1">platform dashboard</p>
          </div>
          <div className="flex items-center gap-4">
            <a
              href={`/platform-admin/ai-prompts?secret=${encodeURIComponent(secret)}`}
              className="text-xs text-landing-text-tertiary hover:text-landing-text-secondary transition-colors"
            >
              ✨ AI Prompts
            </a>
            <a href="/" className="text-xs text-landing-text-tertiary hover:text-landing-text-secondary transition-colors">
              Back to site
            </a>
          </div>
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
        <div className="bg-landing-surface rounded-xl border border-landing-border-subtle p-5">
          <h2 className="text-sm font-semibold text-landing-text-secondary uppercase tracking-wide mb-4">Growth</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <GrowthColumn label="Members" today={growth.membersToday} week={growth.membersThisWeek} month={growth.membersThisMonth} total={growth.membersAllTime} />
            <GrowthColumn label="Spins" today={growth.spinsToday} week={growth.spinsThisWeek} month={growth.spinsThisMonth} total={growth.spinsAllTime} />
            <GrowthColumn label="Clubs" week={growth.clubsThisWeek} month={growth.clubsThisMonth} total={growth.clubsAllTime} />
          </div>
        </div>

        {/* Operational Alerts */}
        {pendingTotal > 0 && (
          <div className="bg-amber-50 rounded-xl border border-amber-200 p-5 space-y-3">
            <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wide">Alerts</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              {stats.pendingQuests > 0 && (
                <div className="text-amber-800">
                  <span className="font-mono text-lg font-bold">{stats.pendingQuests}</span> pending quest verifications
                </div>
              )}
              {stats.pendingInvites > 0 && (
                <div className="text-amber-800">
                  <span className="font-mono text-lg font-bold">{stats.pendingInvites}</span> invite requests
                </div>
              )}
              {stats.expiringMembers > 0 && (
                <div className="text-amber-800">
                  <span className="font-mono text-lg font-bold">{stats.expiringMembers}</span> members expiring this week
                </div>
              )}
            </div>
          </div>
        )}

        {/* Per-Club Breakdown */}
        <div className="bg-landing-surface rounded-xl border border-landing-border-subtle overflow-hidden">
          <div className="px-5 py-3 border-b border-landing-border-subtle">
            <h2 className="text-sm font-semibold text-landing-text-secondary uppercase tracking-wide">Clubs ({clubs.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-landing-text-tertiary text-xs uppercase tracking-wide">
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
              <tbody className="divide-y divide-landing-border-subtle">
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
                          <a href={`/${c.slug}/admin`} className="font-medium text-landing-text hover:underline">{c.name}</a>
                          <p className="text-xs text-landing-text-tertiary font-mono">{c.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      {c.ownerEmail ? (
                        <span className="text-xs text-gray-500 font-mono truncate block max-w-[180px]">{c.ownerEmail}</span>
                      ) : (
                        <span className="text-xs text-landing-text-tertiary">—</span>
                      )}
                    </td>
                    <td className="text-right px-3 py-3 font-mono text-landing-text">{c.members}</td>
                    <td className="text-right px-3 py-3 font-mono text-landing-text">{c.spins}</td>
                    <td className="text-right px-3 py-3 font-mono text-landing-text">{c.events}</td>
                    <td className="text-right px-3 py-3 font-mono text-landing-text">{c.offers}</td>
                    <td className="text-right px-3 py-3">
                      <div className="flex gap-1 justify-end">
                        {!c.approved ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300">Pending</span>
                        ) : c.approved && !c.claimed ? (
                          <>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-300">Live</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">unclaimed</span>
                          </>
                        ) : (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-300">Live</span>
                        )}
                        {c.inviteOnly && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300">invite-only</span>}
                        {c.locked && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/30 text-red-300 font-semibold">🔒 locked</span>}
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            c.visibility === "public"
                              ? "bg-blue-500/20 text-blue-300"
                              : c.visibility === "unlisted"
                                ? "bg-orange-500/20 text-orange-300"
                                : "bg-red-500/20 text-red-300"
                          }`}
                        >
                          {c.visibility}
                        </span>
                        {c.requestedVisibility !== c.visibility && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300">
                            req: {c.requestedVisibility}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-right px-3 py-3">
                      <div className="flex gap-1 justify-end items-center">
                        <select
                          value={c.visibility}
                          disabled={isPending}
                          onChange={(e) => {
                            const next = e.target.value as ClubVisibility;
                            startTransition(async () => {
                              const res = await setClubVisibility(c.id, next);
                              if ("error" in res) setError(res.error);
                            });
                          }}
                          className="text-[10px] bg-landing-surface-hover text-landing-text rounded px-1 py-0.5 border border-landing-border"
                          title="Force visibility"
                        >
                          <option value="public">public</option>
                          <option value="unlisted">unlisted</option>
                          <option value="private">private</option>
                        </select>
                        {!c.approved ? (
                          <button
                            onClick={() => startTransition(async () => { await approveClub(c.id, c.requestedVisibility); })}
                            disabled={isPending}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 transition-colors"
                          >
                            Approve
                          </button>
                        ) : (
                          <button
                            onClick={() => startTransition(async () => { await rejectClub(c.id); })}
                            disabled={isPending}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-50 transition-colors"
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
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 transition-colors"
                        >
                          Admin ↗
                        </button>
                        {c.locked && (
                          <button
                            onClick={() => {
                              if (!window.confirm(`Unlock ${c.name}?`)) return;
                              startTransition(async () => {
                                const res = await unlockClubFromPlatform(c.id, c.slug, secret);
                                if ("error" in res) setError(res.error);
                                else setSuccess(`Unlocked ${c.name}`);
                              });
                            }}
                            disabled={isPending}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-200 text-red-800 hover:bg-red-300 disabled:opacity-50 transition-colors"
                          >
                            Unlock
                          </button>
                        )}
                        {setupClubId === c.id ? (
                          <span className="flex items-center gap-1">
                            <select
                              value={setupType}
                              onChange={(e) => setSetupType(e.target.value)}
                              className="text-[10px] bg-landing-surface-hover text-landing-text rounded px-1 py-0.5 border border-landing-border"
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
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50"
                            >
                              Go
                            </button>
                            <button onClick={() => setSetupClubId(null)} className="text-[10px] text-landing-text-tertiary hover:text-landing-text-secondary">✕</button>
                          </span>
                        ) : (
                          <button
                            onClick={() => { setSetupClubId(c.id); setSetupType("general"); }}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors"
                          >
                            Setup
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="text-right px-5 py-3 text-xs text-landing-text-tertiary">{timeAgo(c.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Invite Requests */}
        {inviteRequests.length > 0 && (
          <div className="bg-landing-surface rounded-xl border border-landing-border-subtle p-5 space-y-3">
            <h2 className="text-sm font-semibold text-landing-text-secondary uppercase tracking-wide">Recent Invite Requests</h2>
            <div className="space-y-2">
              {inviteRequests.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-landing-text">{r.name}</span>
                    <span className="text-landing-text-tertiary mx-2">&middot;</span>
                    <span className="text-landing-text-tertiary font-mono text-xs">{r.contact}</span>
                    <span className="text-landing-text-tertiary mx-2">&rarr;</span>
                    <span className="text-landing-text-secondary">{r.clubName}</span>
                  </div>
                  <span className="text-xs text-landing-text-tertiary">{timeAgo(r.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unapproved Custom Offers */}
        {unapprovedOffers.length > 0 && (
          <div className="bg-landing-surface rounded-xl border border-landing-border-subtle p-5 space-y-3">
            <h2 className="text-sm font-semibold text-landing-text-secondary uppercase tracking-wide">Custom Offers Awaiting Approval ({unapprovedOffers.length})</h2>
            <div className="space-y-2">
              {unapprovedOffers.map((o) => (
                <div key={o.id} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="text-landing-text">{o.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-landing-surface-hover text-landing-text-tertiary ml-2">{o.subtype}</span>
                    <span className="text-landing-text-tertiary mx-2">from</span>
                    <span className="text-landing-text-secondary">{o.clubName}</span>
                  </div>
                  <button onClick={() => handleApproveOffer(o.id)} disabled={isPending} className="text-xs font-semibold px-3 py-1 rounded-full bg-green-100 text-green-700 hover:bg-green-200 disabled:opacity-50 transition-colors">
                    Approve
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Platform Partners */}
        <PartnersManager partners={partners} secret={secret} />

        {/* Activity Feed */}
        {activityFeed.length > 0 && (
          <div className="bg-landing-surface rounded-xl border border-landing-border-subtle p-5 space-y-3">
            <h2 className="text-sm font-semibold text-landing-text-secondary uppercase tracking-wide">Recent Activity</h2>
            <div className="space-y-1.5 max-h-80 overflow-y-auto">
              {activityFeed.map((a) => {
                const badge = ACTION_BADGES[a.action] ?? { label: a.action, color: "bg-landing-surface-hover text-landing-text-tertiary" };
                return (
                  <div key={a.id} className="flex items-center gap-3 text-sm py-1">
                    <span className="text-xs text-landing-text-tertiary w-14 shrink-0 text-right font-mono">{timeAgo(a.createdAt)}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${badge.color}`}>{badge.label}</span>
                    <span className="text-landing-text-tertiary text-xs shrink-0">{a.clubName}</span>
                    {a.target && <span className="text-landing-text-secondary font-mono text-xs">{a.target}</span>}
                    {a.details && <span className="text-landing-text-tertiary text-xs truncate">{a.details}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Create from Google Maps (collapsible) */}
        <div className="bg-landing-surface rounded-xl border border-emerald-200 overflow-hidden">
          <button onClick={() => setShowGoogleForm(!showGoogleForm)} className="w-full px-5 py-3 flex items-center justify-between text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors">
            <span>🗺️ Create Club from Google Maps</span>
            <svg className={`w-4 h-4 transition-transform ${showGoogleForm ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showGoogleForm && (
            <form onSubmit={handleGoogleCreate} className="px-5 pb-5 space-y-3 border-t border-landing-border-subtle pt-4">
              {error && <p className="text-xs text-red-600">{error}</p>}
              {success && <p className="text-xs text-green-600">{success}</p>}
              <p className="text-xs text-landing-text-tertiary">Paste a Google Maps link. Club name, location, and owner account will be created automatically.</p>
              <input
                value={googleMapsUrl}
                onChange={(e) => setGoogleMapsUrl(e.target.value)}
                placeholder="https://www.google.com/maps/place/..."
                required
                className="w-full rounded-lg bg-landing-surface border border-landing-border px-3 py-2 text-sm text-landing-text placeholder:text-landing-text-tertiary focus:outline-none focus:border-emerald-500/30"
              />
              <p className="text-[10px] text-landing-text-tertiary">Owner login: [slug]@osocios.club / q1234567</p>
              <button type="submit" disabled={isPending} className="rounded-lg bg-emerald-100 text-emerald-700 px-4 py-2 text-sm font-semibold hover:bg-emerald-200 disabled:opacity-50 transition-colors">
                {isPending ? "Creating..." : "Create from Maps"}
              </button>
            </form>
          )}
        </div>

        {/* Bulk Import Quests (collapsible) */}
        <div className="bg-landing-surface rounded-xl border border-blue-200 overflow-hidden">
          <button onClick={() => setShowBulkImport(!showBulkImport)} className="w-full px-5 py-3 flex items-center justify-between text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors">
            <span>📋 Bulk Import Quests from CSV</span>
            <svg className={`w-4 h-4 transition-transform ${showBulkImport ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showBulkImport && (
            <div className="px-5 pb-5 space-y-3 border-t border-landing-border-subtle pt-4">
              {error && <p className="text-xs text-red-600">{error}</p>}
              {success && <p className="text-xs text-green-600">{success}</p>}

              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <label className="text-xs text-landing-text-tertiary block mb-1">Target Club</label>
                  <select
                    value={bulkClubId}
                    onChange={(e) => setBulkClubId(e.target.value)}
                    className="w-full rounded-lg bg-landing-surface border border-landing-border px-3 py-2 text-sm text-landing-text focus:outline-none focus:border-blue-500/30"
                  >
                    <option value="">Select a club...</option>
                    {clubs.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({c.slug})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-landing-text-tertiary block mb-1">Paste CSV data</label>
                <textarea
                  value={csvText}
                  onChange={(e) => { setCsvText(e.target.value); setParsedQuests(null); setParseError(null); }}
                  rows={6}
                  placeholder="ID,Category,Quest Type,automatization,Title,on/off,Description,Icon,Link (optional),Spins,..."
                  className="w-full rounded-lg bg-landing-surface border border-landing-border px-3 py-2 text-xs text-landing-text font-mono placeholder:text-landing-text-tertiary focus:outline-none focus:border-blue-500/30"
                />
              </div>

              {parseError && <p className="text-xs text-red-500">{parseError}</p>}

              <button onClick={handleParseCsv} disabled={!csvText.trim()} className="rounded-lg bg-blue-100 text-blue-700 px-4 py-2 text-sm font-semibold hover:bg-blue-200 disabled:opacity-50 transition-colors">
                Parse CSV
              </button>

              {parsedQuests && (
                <div className="space-y-3">
                  <p className="text-xs text-landing-text-secondary">
                    {parsedQuests.length} quests parsed ({parsedQuests.filter((q) => q.active).length} active, {parsedQuests.filter((q) => !q.active).length} inactive, {parsedQuests.filter((q) => q.create_badge).length} with badges)
                  </p>
                  <div className="max-h-60 overflow-y-auto rounded-lg border border-landing-border-subtle">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-landing-text-tertiary uppercase tracking-wide sticky top-0 bg-landing-surface">
                          <th className="text-left px-2 py-1">#</th>
                          <th className="text-left px-2 py-1">Title</th>
                          <th className="text-left px-2 py-1">Cat</th>
                          <th className="text-left px-2 py-1">Type</th>
                          <th className="text-right px-2 py-1">Spins</th>
                          <th className="text-center px-2 py-1">Badge</th>
                          <th className="text-center px-2 py-1">Proof</th>
                          <th className="text-center px-2 py-1">Active</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-landing-border-subtle">
                        {parsedQuests.map((q, i) => (
                          <tr key={i} className={q.active ? "" : "opacity-40"}>
                            <td className="px-2 py-1 text-landing-text-tertiary">{i + 1}</td>
                            <td className="px-2 py-1 text-landing-text">{q.icon} {q.title}</td>
                            <td className="px-2 py-1 text-landing-text-tertiary">{q.category}</td>
                            <td className="px-2 py-1 text-landing-text-tertiary">{q.quest_type}</td>
                            <td className="px-2 py-1 text-right font-mono text-landing-text">{q.reward_spins}</td>
                            <td className="px-2 py-1 text-center">{q.create_badge ? "🏅" : ""}</td>
                            <td className="px-2 py-1 text-center text-landing-text-tertiary">{q.proof_mode}</td>
                            <td className="px-2 py-1 text-center">{q.active ? "✓" : "✗"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    onClick={handleBulkImport}
                    disabled={isPending || !bulkClubId}
                    className="rounded-lg bg-green-100 text-green-700 px-4 py-2 text-sm font-semibold hover:bg-green-200 disabled:opacity-50 transition-colors"
                  >
                    {isPending ? "Importing..." : `Import ${parsedQuests.length} Quests`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Create Club (collapsible) */}
        <div className="bg-landing-surface rounded-xl border border-landing-border-subtle overflow-hidden">
          <button onClick={() => setShowCreateForm(!showCreateForm)} className="w-full px-5 py-3 flex items-center justify-between text-sm font-medium text-landing-text-secondary hover:text-landing-text transition-colors">
            <span>Create Unclaimed Club</span>
            <svg className={`w-4 h-4 transition-transform ${showCreateForm ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {showCreateForm && (
            <form onSubmit={handleCreate} className="px-5 pb-5 space-y-3 border-t border-landing-border-subtle pt-4">
              {error && <p className="text-xs text-red-600">{error}</p>}
              {success && <p className="text-xs text-green-600">{success}</p>}
              <div className="grid grid-cols-2 gap-3">
                <input name="name" value={name} onChange={(e) => { setName(e.target.value); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")); }} placeholder="Club name" required className="rounded-lg bg-landing-surface border border-landing-border px-3 py-2 text-sm text-landing-text placeholder:text-landing-text-tertiary focus:outline-none focus:border-white/20" />
                <input name="slug" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} placeholder="slug" required className="rounded-lg bg-landing-surface border border-landing-border px-3 py-2 text-sm text-landing-text font-mono placeholder:text-landing-text-tertiary focus:outline-none focus:border-white/20" />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <input name="primaryColor" type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} className="w-8 h-8 rounded border border-landing-border cursor-pointer" />
                  <span className="text-xs text-landing-text-tertiary font-mono">{primaryColor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input name="secondaryColor" type="color" value={secondaryColor} onChange={(e) => setSecondaryColor(e.target.value)} className="w-8 h-8 rounded border border-landing-border cursor-pointer" />
                  <span className="text-xs text-landing-text-tertiary font-mono">{secondaryColor}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-landing-text-tertiary block mb-1">Logo</label>
                  <input name="logo" type="file" accept="image/*" className="text-xs text-landing-text-tertiary" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-landing-text-tertiary block mb-1">Cover</label>
                  <input name="cover" type="file" accept="image/*" className="text-xs text-landing-text-tertiary" />
                </div>
              </div>
              <button type="submit" disabled={isPending} className="rounded-lg bg-landing-surface-hover text-landing-text px-4 py-2 text-sm font-semibold hover:bg-white/20 disabled:opacity-50 transition-colors">
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
    <div className={`rounded-xl border p-4 ${alert ? "bg-amber-50 border-amber-200" : "bg-landing-surface border-landing-border-subtle"}`}>
      <p className={`text-xs font-medium uppercase tracking-wide ${alert ? "text-amber-600" : "text-landing-text-tertiary"}`}>{label}</p>
      <p className={`mt-1 text-2xl font-bold font-mono ${alert ? "text-amber-700" : "text-landing-text"}`}>{value.toLocaleString()}</p>
    </div>
  );
}

function GrowthColumn({ label, today, week, month, total }: { label: string; today?: number; week: number; month: number; total: number }) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold text-landing-text-secondary uppercase tracking-wide">{label}</p>
      <div className="space-y-1 text-sm">
        {today !== undefined && (
          <div className="flex justify-between">
            <span className="text-landing-text-tertiary">Today</span>
            <span className="font-mono text-landing-text">{today}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span className="text-landing-text-tertiary">This week</span>
          <span className="font-mono text-landing-text">{week}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-landing-text-tertiary">This month</span>
          <span className="font-mono text-landing-text">{month}</span>
        </div>
        <div className="flex justify-between border-t border-landing-border-subtle pt-1">
          <span className="text-landing-text-tertiary font-medium">All time</span>
          <span className="font-mono font-bold text-landing-text">{total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
