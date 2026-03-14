"use client";

import { useState, useTransition } from "react";
import { addQuest, updateQuest, deleteQuest } from "./actions";
import { useLanguage } from "@/lib/i18n/provider";

interface Quest {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  image_url: string | null;
  reward_spins: number;
  display_order: number;
  completions: number;
  multi_use: boolean;
  is_public: boolean;
  quest_type: string;
  proof_mode: string;
  proof_placeholder: string | null;
  tutorial_steps: string[] | null;
}

const TEMPLATES = [
  { titleKey: "admin.quickFollowInstagram", descKey: "admin.quickFollowInstagramDesc", link: "", rewardSpins: 1, questType: "default" },
  { titleKey: "admin.quickFollowTiktok", descKey: "admin.quickFollowTiktokDesc", link: "", rewardSpins: 1, questType: "default" },
  { titleKey: "admin.quickGoogleReview", descKey: "admin.quickGoogleReviewDesc", link: "", rewardSpins: 2, questType: "default" },
  { titleKey: "admin.quickReferFriend", descKey: "admin.quickReferFriendDesc", link: "", rewardSpins: 2, questType: "referral" },
  { titleKey: "admin.quickFeedback", descKey: "admin.quickFeedbackDesc", link: "", rewardSpins: 1, questType: "feedback" },
  { titleKey: "admin.quickTutorial", descKey: "admin.quickTutorialDesc", link: "", rewardSpins: 1, questType: "tutorial" },
];

export function QuestManager({
  quests,
  clubId,
  clubSlug,
}: {
  quests: Quest[];
  clubId: string;
  clubSlug: string;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editLink, setEditLink] = useState("");
  const [editReward, setEditReward] = useState("1");
  const [editMultiUse, setEditMultiUse] = useState(false);
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editQuestType, setEditQuestType] = useState("default");
  const [editProofMode, setEditProofMode] = useState("none");
  const [editProofPlaceholder, setEditProofPlaceholder] = useState("");
  const [editTutorialSteps, setEditTutorialSteps] = useState<string[]>([]);

  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newReward, setNewReward] = useState("1");
  const [newMultiUse, setNewMultiUse] = useState(false);
  const [newIsPublic, setNewIsPublic] = useState(false);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newQuestType, setNewQuestType] = useState("default");
  const [newProofMode, setNewProofMode] = useState("none");
  const [newProofPlaceholder, setNewProofPlaceholder] = useState("");
  const [newTutorialSteps, setNewTutorialSteps] = useState<string[]>([]);

  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { t } = useLanguage();

  function applyTemplate(tmpl: typeof TEMPLATES[number]) {
    setNewTitle(t(tmpl.titleKey));
    setNewDesc(t(tmpl.descKey));
    setNewLink(tmpl.link);
    setNewReward(String(tmpl.rewardSpins));
    setNewQuestType(tmpl.questType);
    if (tmpl.questType === "feedback") {
      setNewMultiUse(true);
      setNewProofMode("required");
      setNewProofPlaceholder("");
      setNewTutorialSteps([]);
    } else if (tmpl.questType === "tutorial") {
      setNewMultiUse(false);
      setNewProofMode("none");
      setNewTutorialSteps([""]);
      setNewProofPlaceholder("");
    } else {
      setNewTutorialSteps([]);
    }
  }

  function handleNewQuestTypeChange(type: string) {
    setNewQuestType(type);
    if (type === "feedback") {
      setNewMultiUse(true);
      setNewProofMode("required");
      setNewTutorialSteps([]);
    } else if (type === "tutorial") {
      setNewMultiUse(false);
      setNewProofMode("none");
      setNewTutorialSteps([""]);
    } else {
      setNewTutorialSteps([]);
    }
  }

  function handleEditQuestTypeChange(type: string) {
    setEditQuestType(type);
    if (type === "feedback") {
      setEditMultiUse(true);
      setEditProofMode("required");
      setEditTutorialSteps([]);
    } else if (type === "tutorial") {
      setEditMultiUse(false);
      setEditProofMode("none");
      setEditTutorialSteps([""]);
    } else {
      setEditTutorialSteps([]);
    }
  }

  function startEdit(q: Quest) {
    setEditingId(q.id);
    setEditTitle(q.title);
    setEditDesc(q.description ?? "");
    setEditLink(q.link ?? "");
    setEditReward(String(q.reward_spins));
    setEditMultiUse(q.multi_use);
    setEditIsPublic(q.is_public);
    setEditQuestType(q.quest_type ?? "default");
    setEditProofMode(q.proof_mode ?? "none");
    setEditProofPlaceholder(q.proof_placeholder ?? "");
    setEditTutorialSteps(q.tutorial_steps ?? []);
    setEditImage(null);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setError(null);
  }

  function handleSaveEdit(questId: string) {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("title", editTitle);
      fd.set("description", editDesc);
      fd.set("link", editLink);
      fd.set("reward_spins", editReward);
      fd.set("multi_use", editMultiUse ? "1" : "0");
      fd.set("is_public", editIsPublic ? "1" : "0");
      fd.set("quest_type", editQuestType);
      fd.set("proof_mode", editProofMode);
      fd.set("proof_placeholder", editProofPlaceholder);
      if (editQuestType === "tutorial") {
        fd.set("tutorial_steps", JSON.stringify(editTutorialSteps.filter(s => s.trim())));
      }
      if (editImage) fd.set("image", editImage);

      const result = await updateQuest(questId, fd, clubSlug);
      if ("error" in result) {
        setError(result.error);
      } else {
        setEditingId(null);
      }
    });
  }

  function handleDelete(questId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteQuest(questId, clubSlug);
      if ("error" in result) setError(result.error);
    });
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("title", newTitle);
      fd.set("description", newDesc);
      fd.set("link", newLink);
      fd.set("reward_spins", newReward);
      fd.set("multi_use", newMultiUse ? "1" : "0");
      fd.set("is_public", newIsPublic ? "1" : "0");
      fd.set("quest_type", newQuestType);
      fd.set("proof_mode", newProofMode);
      fd.set("proof_placeholder", newProofPlaceholder);
      if (newQuestType === "tutorial") {
        fd.set("tutorial_steps", JSON.stringify(newTutorialSteps.filter(s => s.trim())));
      }
      if (newImage) fd.set("image", newImage);

      const result = await addQuest(clubId, fd, clubSlug);
      if ("error" in result) {
        setError(result.error);
      } else {
        const createdTitle = newTitle;
        setNewTitle("");
        setNewDesc("");
        setNewLink("");
        setNewReward("1");
        setNewMultiUse(false);
        setNewIsPublic(false);
        setNewQuestType("default");
        setNewProofMode("none");
        setNewProofPlaceholder("");
        setNewTutorialSteps([]);
        setNewImage(null);
        setSuccessMsg(t("admin.questCreated", { title: createdTitle }));
        setShowForm(false);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    });
  }

  function renderQuestTypeFields(
    questType: string,
    proofMode: string,
    setProofMode: (v: string) => void,
    proofPlaceholder: string,
    setProofPlaceholder: (v: string) => void,
    tutorialSteps: string[],
    setTutorialSteps: (v: string[]) => void,
  ) {
    if (questType === "feedback") {
      return (
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">{t("admin.feedbackPrompt")}</label>
          <input
            type="text"
            value={proofPlaceholder}
            onChange={(e) => setProofPlaceholder(e.target.value)}
            placeholder={t("admin.feedbackPromptHint")}
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
          />
        </div>
      );
    }
    if (questType === "tutorial") {
      return (
        <div className="space-y-2">
          <label className="block text-xs font-medium text-gray-500 mb-1">{t("admin.tutorialSteps")}</label>
          {tutorialSteps.map((step, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-xs text-gray-400 pt-2 shrink-0">{i + 1}.</span>
              <input
                type="text"
                value={step}
                onChange={(e) => {
                  const next = [...tutorialSteps];
                  next[i] = e.target.value;
                  setTutorialSteps(next);
                }}
                placeholder={t("admin.stepPlaceholder")}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              />
              {tutorialSteps.length > 1 && (
                <button
                  type="button"
                  onClick={() => setTutorialSteps(tutorialSteps.filter((_, j) => j !== i))}
                  className="text-xs text-red-500 hover:text-red-700 shrink-0"
                >
                  {t("admin.removeStep")}
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setTutorialSteps([...tutorialSteps, ""])}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            + {t("admin.addStep")}
          </button>
        </div>
      );
    }
    if (questType === "default") {
      return (
        <div className="space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("admin.proofLink")}</label>
            <select
              value={proofMode}
              onChange={(e) => setProofMode(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
            >
              <option value="none">{t("admin.proofNotNeeded")}</option>
              <option value="optional">{t("admin.proofOptional")}</option>
              <option value="required">{t("admin.proofRequired")}</option>
            </select>
          </div>
          {proofMode !== "none" && (
            <input
              type="text"
              value={proofPlaceholder}
              onChange={(e) => setProofPlaceholder(e.target.value)}
              placeholder={t("admin.proofPlaceholderHint")}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
            />
          )}
        </div>
      );
    }
    return null;
  }

  function renderQuestTypeBadge(questType: string) {
    if (questType === "feedback") {
      return <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full shrink-0">{t("admin.questTypeFeedback")}</span>;
    }
    if (questType === "tutorial") {
      return <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full shrink-0">{t("admin.questTypeTutorial")}</span>;
    }
    if (questType === "referral") {
      return <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full shrink-0">{t("admin.questTypeReferral")}</span>;
    }
    return null;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
          {t("admin.questsCount", { count: quests.length })}
        </h2>
      </div>

      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {successMsg && (
          <div className="px-5 py-2.5 bg-green-50 border-b border-green-100 flex items-center gap-2">
            <svg className="w-4 h-4 text-green-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-sm font-medium text-green-700">{successMsg}</span>
          </div>
        )}

        <div className="px-5 py-2 bg-gray-50 border-b border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {t("admin.activeQuestsCount", { count: quests.length })}
          </p>
        </div>

        {/* Quest list */}
        {quests.length > 0 && (
          <div className="divide-y divide-gray-100">
            {quests.map((q) => (
              <div key={q.id}>
                {editingId === q.id ? (
                  <div className="px-5 py-3 space-y-3 bg-gray-50">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">{t("admin.questTitle")}</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">{t("admin.questDescription")}</label>
                      <input
                        type="text"
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                      />
                    </div>
                    <div className="grid grid-cols-[1fr_auto] gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">{t("admin.questLink")}</label>
                        <input
                          type="text"
                          value={editLink}
                          onChange={(e) => setEditLink(e.target.value)}
                          placeholder="https://..."
                          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">{t("admin.questSpins")}</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editReward}
                          onChange={(e) => setEditReward(e.target.value)}
                          className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">{t("admin.questImage")}</label>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={(e) => setEditImage(e.target.files?.[0] ?? null)}
                        className="w-full text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                      />
                    </div>
                    <label className={`flex items-center gap-2 ${editQuestType === "feedback" || editQuestType === "tutorial" ? "opacity-50" : "cursor-pointer"}`}>
                      <input
                        type="checkbox"
                        checked={editMultiUse}
                        onChange={(e) => setEditMultiUse(e.target.checked)}
                        disabled={editQuestType === "feedback" || editQuestType === "tutorial"}
                        className="rounded border-gray-300 text-gray-800 focus:ring-gray-400"
                      />
                      <span className="text-xs text-gray-600">{t("admin.questRepeatable")}</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editIsPublic}
                        onChange={(e) => setEditIsPublic(e.target.checked)}
                        className="rounded border-gray-300 text-gray-800 focus:ring-gray-400"
                      />
                      <span className="text-xs text-gray-600">{t("admin.questShowPublic")}</span>
                    </label>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">{t("admin.questType")}</label>
                      <select
                        value={editQuestType}
                        onChange={(e) => handleEditQuestTypeChange(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                      >
                        <option value="default">{t("admin.questTypeDefault")}</option>
                        <option value="referral">{t("admin.questTypeReferral")}</option>
                        <option value="feedback">{t("admin.questTypeFeedback")}</option>
                        <option value="tutorial">{t("admin.questTypeTutorial")}</option>
                      </select>
                    </div>
                    {renderQuestTypeFields(editQuestType, editProofMode, setEditProofMode, editProofPlaceholder, setEditProofPlaceholder, editTutorialSteps, setEditTutorialSteps)}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveEdit(q.id)}
                        disabled={isPending}
                        className="rounded-lg bg-gray-800 text-white px-4 py-1.5 text-xs font-semibold hover:bg-gray-700 disabled:opacity-50 transition-colors"
                      >
                        {t("common.save")}
                      </button>
                      <button
                        onClick={cancelEdit}
                        className="rounded-lg border border-gray-300 px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        {t("common.cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="px-5 py-3 flex items-center gap-3">
                    {q.image_url && (
                      <img src={q.image_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-gray-900 truncate">{q.title}</p>
                        {renderQuestTypeBadge(q.quest_type)}
                        {q.multi_use && (
                          <span className="text-[10px] font-medium text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded-full shrink-0">{t("common.repeatable")}</span>
                        )}
                        {q.is_public && (
                          <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full shrink-0">{t("common.public")}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-gray-400">
                          {q.reward_spins} {q.reward_spins === 1 ? t("common.spin") : t("common.spinsLabel")}
                        </span>
                        {q.link && (
                          <span className="text-xs text-blue-500 truncate max-w-[150px]">{q.link}</span>
                        )}
                        <span className="text-xs text-gray-300">
                          {q.completions} {t("admin.questDoneCount")}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => startEdit(q)}
                        className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        {t("common.edit")}
                      </button>
                      <button
                        onClick={() => handleDelete(q.id)}
                        disabled={isPending}
                        className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50 transition-colors"
                      >
                        {t("common.remove")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Toggle button */}
        <button
          onClick={() => { setShowForm(!showForm); setSuccessMsg(null); }}
          className="w-full px-5 py-3 border-t border-gray-100 flex items-center justify-between text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <span>{showForm ? t("common.cancel") : t("admin.addNewQuest")}</span>
          <svg className={`w-4 h-4 transition-transform ${showForm ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Add new quest */}
        {showForm && (
        <div>
          {/* Templates */}
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">{t("admin.quickAdd")}</p>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.titleKey}
                  type="button"
                  onClick={() => applyTemplate(tmpl)}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                  {t(tmpl.titleKey)}
                </button>
              ))}
            </div>
          </div>
        <form onSubmit={handleAdd} className="px-5 py-4 border-t border-gray-100 space-y-3 bg-gray-50">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("admin.questTitle")}</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder={t("admin.questTitlePlaceholder")}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("admin.questDescOptional")}</label>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder={t("admin.questDescPlaceholder")}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
            />
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t("admin.questLink")}</label>
              <input
                type="text"
                value={newLink}
                onChange={(e) => setNewLink(e.target.value)}
                placeholder={t("admin.questLinkPlaceholder")}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">{t("admin.questSpins")}</label>
              <input
                type="number"
                min="0"
                max="100"
                value={newReward}
                onChange={(e) => setNewReward(e.target.value)}
                required
                className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("admin.questImage")}</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => setNewImage(e.target.files?.[0] ?? null)}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
          </div>
          <label className={`flex items-center gap-2 ${newQuestType === "feedback" || newQuestType === "tutorial" ? "opacity-50" : "cursor-pointer"}`}>
            <input
              type="checkbox"
              checked={newMultiUse}
              onChange={(e) => setNewMultiUse(e.target.checked)}
              disabled={newQuestType === "feedback" || newQuestType === "tutorial"}
              className="rounded border-gray-300 text-gray-800 focus:ring-gray-400"
            />
            <span className="text-xs text-gray-600">{t("admin.questRepeatable")}</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={newIsPublic}
              onChange={(e) => setNewIsPublic(e.target.checked)}
              className="rounded border-gray-300 text-gray-800 focus:ring-gray-400"
            />
            <span className="text-xs text-gray-600">{t("admin.questShowPublic")}</span>
          </label>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("admin.questType")}</label>
            <select
              value={newQuestType}
              onChange={(e) => handleNewQuestTypeChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
            >
              <option value="default">{t("admin.questTypeDefault")}</option>
              <option value="referral">{t("admin.questTypeReferral")}</option>
              <option value="feedback">{t("admin.questTypeFeedback")}</option>
              <option value="tutorial">{t("admin.questTypeTutorial")}</option>
            </select>
          </div>
          {renderQuestTypeFields(newQuestType, newProofMode, setNewProofMode, newProofPlaceholder, setNewProofPlaceholder, newTutorialSteps, setNewTutorialSteps)}
          <button
            type="submit"
            disabled={isPending || !newTitle.trim()}
            className="w-full rounded-lg bg-gray-800 text-white px-4 py-2 text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? t("admin.adding") : t("admin.addQuest")}
          </button>
        </form>
        </div>
        )}

        {error && (
          <div className="px-5 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
