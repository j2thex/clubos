"use client";

import { useRef, useState, useTransition } from "react";
import { addQuest, updateQuest, deleteQuest, toggleQuestActive } from "./actions";
import { generateQuestDraftAction, generateQuestImageAction } from "./ai-actions";
import { QUEST_IMAGE_DEFAULT_STYLE } from "./ai-constants";
import { useLanguage } from "@/lib/i18n/provider";
import { t as translate } from "@/lib/i18n";
import { IconPicker } from "@/components/icon-picker";
import { LanguageTabs } from "@/components/language-tabs";
import { DynamicIcon } from "@/components/dynamic-icon";

const CATEGORIES = ["all", "social", "activity", "boost", "level_up"] as const;
type Category = (typeof CATEGORIES)[number];

const CATEGORY_LABELS: Record<Category, string> = {
  all: "All",
  social: "Social",
  activity: "Activity",
  boost: "Boost",
  level_up: "Level Up",
};

interface Quest {
  id: string;
  title: string;
  description: string | null;
  link: string | null;
  image_url: string | null;
  icon: string | null;
  title_es: string | null;
  description_es: string | null;
  reward_spins: number;
  display_order: number;
  completions: number;
  multi_use: boolean;
  is_public: boolean;
  quest_type: string;
  proof_mode: string;
  proof_placeholder: string | null;
  tutorial_steps: string[] | null;
  badge_id: string | null;
  deadline: string | null;
  category: string;
  active: boolean;
}

const TEMPLATES = [
  { titleKey: "admin.quickFollowInstagram", descKey: "admin.quickFollowInstagramDesc", link: "", rewardSpins: 1, questType: "default", icon: "instagram", proofMode: "none", category: "social" as Category },
  { titleKey: "admin.quickFollowTiktok", descKey: "admin.quickFollowTiktokDesc", link: "", rewardSpins: 1, questType: "default", icon: "music-2", proofMode: "none", category: "social" as Category },
  { titleKey: "admin.quickFollowYoutube", descKey: "admin.quickFollowYoutubeDesc", link: "", rewardSpins: 1, questType: "default", icon: "youtube", proofMode: "none", category: "social" as Category },
  { titleKey: "admin.quickJoinWhatsapp", descKey: "admin.quickJoinWhatsappDesc", link: "", rewardSpins: 1, questType: "default", icon: "message-circle", proofMode: "none", category: "social" as Category },
  { titleKey: "admin.quickGoogleReview", descKey: "admin.quickGoogleReviewDesc", link: "", rewardSpins: 2, questType: "default", icon: "star", proofMode: "none", category: "social" as Category },
  { titleKey: "admin.quickPostPhoto", descKey: "admin.quickPostPhotoDesc", link: "", rewardSpins: 1, questType: "default", icon: "camera", proofMode: "optional", category: "social" as Category },
  { titleKey: "admin.quickAttendEvent", descKey: "admin.quickAttendEventDesc", link: "", rewardSpins: 1, questType: "default", icon: "calendar-check", proofMode: "none", category: "activity" as Category },
  { titleKey: "admin.quickCheckIn", descKey: "admin.quickCheckInDesc", link: "", rewardSpins: 1, questType: "default", icon: "map-pin", proofMode: "none", category: "activity" as Category },
  { titleKey: "admin.quickVisitWebsite", descKey: "admin.quickVisitWebsiteDesc", link: "", rewardSpins: 1, questType: "default", icon: "globe", proofMode: "none", category: "social" as Category },
  { titleKey: "admin.quickReferFriend", descKey: "admin.quickReferFriendDesc", link: "", rewardSpins: 2, questType: "referral", icon: "user-plus", proofMode: "none", category: "social" as Category },
  { titleKey: "admin.quickFeedback", descKey: "admin.quickFeedbackDesc", link: "", rewardSpins: 1, questType: "feedback", icon: "message-square", proofMode: "required", category: "level_up" as Category },
  { titleKey: "admin.quickTutorial", descKey: "admin.quickTutorialDesc", link: "", rewardSpins: 1, questType: "tutorial", icon: "book-open", proofMode: "none", category: "level_up" as Category },
  { titleKey: "admin.quickShareEmail", descKey: "admin.quickShareEmailDesc", link: "", rewardSpins: 1, questType: "email_collect", icon: "mail", proofMode: "none", category: "social" as Category },
];

// Templates that get bulk-created with "Add All Common"
const COMMON_TEMPLATE_KEYS = [
  "admin.quickFollowInstagram",
  "admin.quickFollowTiktok",
  "admin.quickGoogleReview",
  "admin.quickReferFriend",
  "admin.quickFeedback",
];

export function QuestManager({
  quests,
  clubId,
  clubSlug,
  googleReviewUrl,
  spinDisplayDecimals,
}: {
  quests: Quest[];
  clubId: string;
  clubSlug: string;
  googleReviewUrl?: string | null;
  spinDisplayDecimals: number;
}) {
  const spinStep = spinDisplayDecimals === 0 ? 1 : 0.1;
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editLink, setEditLink] = useState("");
  const [editReward, setEditReward] = useState("0");
  const [editMultiUse, setEditMultiUse] = useState(false);
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [editImage, setEditImage] = useState<File | null>(null);
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editQuestType, setEditQuestType] = useState("default");
  const [editProofMode, setEditProofMode] = useState("none");
  const [editProofPlaceholder, setEditProofPlaceholder] = useState("");
  const [editTutorialSteps, setEditTutorialSteps] = useState<string[]>([]);
  const [editIcon, setEditIcon] = useState<string | null>(null);
  const [editAwardBadge, setEditAwardBadge] = useState(false);
  const [editLang, setEditLang] = useState<"en" | "es">("en");
  const [editTitleEs, setEditTitleEs] = useState("");
  const [editDescEs, setEditDescEs] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editCategory, setEditCategory] = useState<Category>("social");

  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newLink, setNewLink] = useState("");
  const [newReward, setNewReward] = useState("0");
  const [newMultiUse, setNewMultiUse] = useState(false);
  const [newIsPublic, setNewIsPublic] = useState(false);
  const [newImage, setNewImage] = useState<File | null>(null);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newQuestType, setNewQuestType] = useState("default");
  const [newProofMode, setNewProofMode] = useState("none");
  const [newProofPlaceholder, setNewProofPlaceholder] = useState("");
  const [newTutorialSteps, setNewTutorialSteps] = useState<string[]>([]);
  const [newIcon, setNewIcon] = useState<string | null>(null);
  const [newAwardBadge, setNewAwardBadge] = useState(false);
  const [newLang, setNewLang] = useState<"en" | "es">("en");
  const [newTitleEs, setNewTitleEs] = useState("");
  const [newDescEs, setNewDescEs] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [newCategory, setNewCategory] = useState<Category>("social");

  const [activeTab, setActiveTab] = useState<Category>("all");
  const [showForm, setShowForm] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { t } = useLanguage();

  // AI assist modal (text draft)
  const [aiOpen, setAiOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiDraftBanner, setAiDraftBanner] = useState(false);
  const formRef = useRef<HTMLDivElement | null>(null);

  // AI image generation — separate state per form (new vs edit) so they
  // don't trample each other. Each targets the existing newImageUrl /
  // editImageUrl state so the submit path stays unchanged.
  const [newAiImageLoading, setNewAiImageLoading] = useState(false);
  const [newAiImageError, setNewAiImageError] = useState<string | null>(null);
  const [newImageStyle, setNewImageStyle] = useState("");
  const [editAiImageLoading, setEditAiImageLoading] = useState(false);
  const [editAiImageError, setEditAiImageError] = useState<string | null>(null);
  const [editImageStyle, setEditImageStyle] = useState("");

  async function runNewAiImageGen() {
    if (newAiImageLoading) return;
    setNewAiImageError(null);
    setNewAiImageLoading(true);
    try {
      const result = await generateQuestImageAction(clubId, newTitle, newDesc, newImageStyle);
      if ("error" in result) {
        setNewAiImageError(result.error);
        return;
      }
      setNewImageUrl(result.url);
      setNewImage(null);
    } catch (err) {
      setNewAiImageError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setNewAiImageLoading(false);
    }
  }

  async function runEditAiImageGen() {
    if (editAiImageLoading) return;
    setEditAiImageError(null);
    setEditAiImageLoading(true);
    try {
      const result = await generateQuestImageAction(clubId, editTitle, editDesc, editImageStyle);
      if ("error" in result) {
        setEditAiImageError(result.error);
        return;
      }
      setEditImageUrl(result.url);
      setEditImage(null);
    } catch (err) {
      setEditAiImageError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setEditAiImageLoading(false);
    }
  }

  function openAiModal() {
    setAiError(null);
    setAiPrompt("");
    setAiOpen(true);
  }

  async function runAiAssist() {
    if (aiLoading) return;
    setAiError(null);
    setAiLoading(true);
    try {
      const result = await generateQuestDraftAction(clubId, aiPrompt);
      if ("error" in result) {
        setAiError(result.error);
        return;
      }
      const d = result.draft;
      // Prefill the "new quest" form from the draft. Leave image/link URL
      // alone — admin picks their own link and uploads their own image.
      setNewTitle(d.title ?? "");
      setNewTitleEs(d.title_es ?? "");
      setNewDesc(d.description ?? "");
      setNewDescEs(d.description_es ?? "");
      setNewLink(d.link ?? "");
      setNewReward(String(d.reward_spins ?? 1));
      setNewCategory((d.category ?? "social") as Category);
      setNewQuestType(d.quest_type ?? "default");
      setNewProofMode(d.proof_mode ?? "none");
      setNewMultiUse(Boolean(d.multi_use));
      setNewIcon(d.icon ?? null);
      setNewTutorialSteps(d.tutorial_steps ?? []);
      setNewProofPlaceholder("");
      setNewImage(null);
      setNewImageUrl("");
      setNewDeadline("");
      setNewAwardBadge(false);
      setNewLang("en");
      setShowForm(true);
      setAiOpen(false);
      setAiDraftBanner(true);
      // Scroll the form into view so the admin sees the prefilled fields.
      // setTimeout lets React render the form first before we scroll.
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
      setTimeout(() => setAiDraftBanner(false), 8000);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setAiLoading(false);
    }
  }

  function applyTemplate(tmpl: typeof TEMPLATES[number]) {
    // Auto-fill both languages from dictionaries
    setNewTitle(translate("en", tmpl.titleKey));
    setNewDesc(translate("en", tmpl.descKey));
    setNewTitleEs(translate("es", tmpl.titleKey));
    setNewDescEs(translate("es", tmpl.descKey));
    setNewLink(tmpl.link);
    setNewReward(String(tmpl.rewardSpins));
    setNewQuestType(tmpl.questType);
    setNewIcon(tmpl.icon);
    setNewProofMode(tmpl.proofMode);
    setNewCategory(tmpl.category);
    // Auto-fill Google Review link if available
    if (tmpl.titleKey === "admin.quickGoogleReview" && googleReviewUrl) {
      setNewLink(googleReviewUrl);
    }
    if (tmpl.questType === "feedback") {
      setNewMultiUse(true);
      setNewProofPlaceholder("");
      setNewTutorialSteps([]);
    } else if (tmpl.questType === "tutorial") {
      setNewMultiUse(false);
      setNewTutorialSteps([""]);
      setNewProofPlaceholder("");
    } else {
      setNewMultiUse(false);
      setNewTutorialSteps([]);
      setNewProofPlaceholder("");
    }
    setShowForm(true);
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
    setEditIcon(q.icon);
    setEditAwardBadge(q.badge_id != null);
    setEditTitleEs(q.title_es ?? "");
    setEditDescEs(q.description_es ?? "");
    setEditDeadline(q.deadline ? q.deadline.slice(0, 16) : "");
    setEditCategory((q.category ?? "social") as Category);
    setEditLang("en");
    setEditImage(null);
    setEditImageUrl(q.image_url ?? "");
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
      if (editIcon) fd.set("icon", editIcon);
      fd.set("award_badge", editAwardBadge ? "1" : "0");
      fd.set("title_es", editTitleEs);
      fd.set("description_es", editDescEs);
      fd.set("deadline", editDeadline);
      fd.set("category", editCategory);
      if (editImage) fd.set("image", editImage);
      fd.set("image_url", editImageUrl);

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

  function handleToggleActive(questId: string, active: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await toggleQuestActive(questId, active, clubSlug);
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
      if (newIcon) fd.set("icon", newIcon);
      fd.set("award_badge", newAwardBadge ? "1" : "0");
      fd.set("title_es", newTitleEs);
      fd.set("description_es", newDescEs);
      fd.set("deadline", newDeadline);
      fd.set("category", newCategory);
      if (newImage) fd.set("image", newImage);
      fd.set("image_url", newImageUrl);

      const result = await addQuest(clubId, fd, clubSlug);
      if ("error" in result) {
        setError(result.error);
      } else {
        const createdTitle = newTitle;
        setNewTitle("");
        setNewDesc("");
        setNewLink("");
        setNewReward("0");
        setNewMultiUse(false);
        setNewIsPublic(false);
        setNewQuestType("default");
        setNewProofMode("none");
        setNewProofPlaceholder("");
        setNewTutorialSteps([]);
        setNewIcon(null);
        setNewAwardBadge(false);
        setNewImage(null);
        setNewImageUrl("");
        setNewTitleEs("");
        setNewDescEs("");
        setNewDeadline("");
        setNewCategory("social");
        setNewLang("en");
        setSuccessMsg(t("admin.questCreated", { title: createdTitle }));
        setShowForm(false);
        setTimeout(() => setSuccessMsg(null), 4000);
      }
    });
  }

  function handleAddAllCommon() {
    setError(null);
    startTransition(async () => {
      const commonTemplates = TEMPLATES.filter(tmpl => COMMON_TEMPLATE_KEYS.includes(tmpl.titleKey));
      const existingTitles = new Set(quests.map(q => q.title.toLowerCase()));
      const toCreate = commonTemplates.filter(tmpl => !existingTitles.has(translate("en", tmpl.titleKey).toLowerCase()));

      if (toCreate.length === 0) {
        setSuccessMsg(t("admin.questCreated", { title: "All common quests already exist" }));
        setTimeout(() => setSuccessMsg(null), 4000);
        return;
      }

      for (const tmpl of toCreate) {
        const fd = new FormData();
        fd.set("title", translate("en", tmpl.titleKey));
        fd.set("description", translate("en", tmpl.descKey));
        fd.set("title_es", translate("es", tmpl.titleKey));
        fd.set("description_es", translate("es", tmpl.descKey));
        fd.set("link", tmpl.titleKey === "admin.quickGoogleReview" && googleReviewUrl ? googleReviewUrl : tmpl.link);
        fd.set("reward_spins", String(tmpl.rewardSpins));
        fd.set("quest_type", tmpl.questType);
        fd.set("proof_mode", tmpl.proofMode);
        fd.set("multi_use", tmpl.questType === "feedback" ? "1" : "0");
        fd.set("is_public", "0");
        fd.set("icon", tmpl.icon);
        fd.set("award_badge", "0");
        fd.set("proof_placeholder", "");
        fd.set("category", tmpl.category);
        const result = await addQuest(clubId, fd, clubSlug);
        if ("error" in result) {
          setError(result.error);
          return;
        }
      }
      setSuccessMsg(t("admin.questCreated", { title: `${toCreate.length} quests` }));
      setTimeout(() => setSuccessMsg(null), 4000);
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
        <button
          type="button"
          onClick={openAiModal}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900 px-2 py-1 rounded-md bg-gradient-to-r from-emerald-50 to-sky-50 hover:from-emerald-100 hover:to-sky-100 border border-gray-200 transition-colors"
        >
          ✨ AI assist
        </button>
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

        {/* Category tabs */}
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 overflow-x-auto">
            {CATEGORIES.map((cat) => {
              const count = cat === "all" ? quests.length : quests.filter((q) => q.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => { setActiveTab(cat); setEditingId(null); }}
                  className={`shrink-0 px-3 py-1 text-xs font-semibold rounded-md transition-colors ${
                    activeTab === cat
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {CATEGORY_LABELS[cat]} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Quest list */}
        {quests.filter((q) => activeTab === "all" || q.category === activeTab).length > 0 && (
          <div className="divide-y divide-gray-100">
            {quests
              .filter((q) => activeTab === "all" || q.category === activeTab)
              .toSorted((a, b) => {
                const aFeedback = a.quest_type === "feedback" ? 1 : 0;
                const bFeedback = b.quest_type === "feedback" ? 1 : 0;
                return aFeedback - bFeedback;
              })
              .map((q) => (
              <div key={q.id}>
                {editingId === q.id ? (
                  <div className="px-5 py-3 space-y-3 bg-gray-50">
                    <LanguageTabs value={editLang} onChange={setEditLang} />
                    {editLang === "en" ? (
                      <>
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
                          <textarea
                            rows={3}
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition resize-none"
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">{t("admin.questTitle")} (ES)</label>
                          <input
                            type="text"
                            value={editTitleEs}
                            onChange={(e) => setEditTitleEs(e.target.value)}
                            placeholder={editTitle || t("admin.questTitlePlaceholder")}
                            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">{t("admin.questDescription")} (ES)</label>
                          <textarea
                            rows={3}
                            value={editDescEs}
                            onChange={(e) => setEditDescEs(e.target.value)}
                            placeholder={editDesc || t("admin.questDescPlaceholder")}
                            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition resize-none"
                          />
                        </div>
                      </>
                    )}
                    <IconPicker value={editIcon} onChange={setEditIcon} />
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
                          step={spinStep}
                          value={editReward}
                          onChange={(e) => setEditReward(e.target.value)}
                          className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">{t("admin.questImage")}</label>
                      {editImageUrl && (
                        <div className="mb-2 p-2 bg-white rounded-lg border border-gray-200 flex items-center gap-3">
                          <a
                            href={editImageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open full size in new tab"
                            className="shrink-0 group"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={editImageUrl}
                              alt="Quest image preview"
                              className="w-20 h-20 rounded-lg object-cover border border-gray-200 group-hover:ring-2 group-hover:ring-emerald-300 transition"
                            />
                          </a>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] text-gray-400 truncate">{editImageUrl}</p>
                            <p className="text-[10px] text-gray-400">Click preview to view full size</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditImageUrl("");
                              setEditAiImageError(null);
                            }}
                            className="text-xs text-red-500 hover:text-red-700 transition-colors shrink-0"
                          >
                            Clear
                          </button>
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-1">
                        <input
                          type="text"
                          value={editImageStyle}
                          onChange={(e) => setEditImageStyle(e.target.value)}
                          placeholder={QUEST_IMAGE_DEFAULT_STYLE}
                          className="flex-1 min-w-0 rounded-md border border-gray-200 px-2 py-1.5 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
                        />
                        <button
                          type="button"
                          onClick={runEditAiImageGen}
                          disabled={editAiImageLoading || !editTitle.trim()}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-md bg-gradient-to-r from-emerald-50 to-sky-50 hover:from-emerald-100 hover:to-sky-100 border border-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                        >
                          {editAiImageLoading
                            ? "Generating…"
                            : editImageUrl
                              ? "✨ Regen"
                              : "✨ Generate"}
                        </button>
                      </div>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={editImageUrl}
                        onChange={(e) => { setEditImageUrl(e.target.value); if (e.target.value) setEditImage(null); }}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition mb-1"
                      />
                      <span className="block text-xs text-gray-400 text-center mb-1">or</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={(e) => { setEditImage(e.target.files?.[0] ?? null); if (e.target.files?.[0]) setEditImageUrl(""); }}
                        className="w-full text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
                      />
                      {editAiImageError && (
                        <p className="mt-1 text-xs text-red-600">{editAiImageError}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 mb-1">Deadline</label>
                      <input
                        type="datetime-local"
                        value={editDeadline}
                        onChange={(e) => setEditDeadline(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                      />
                      {editDeadline && (
                        <button type="button" onClick={() => setEditDeadline("")} className="text-xs text-gray-400 hover:text-gray-600 mt-1">Clear deadline</button>
                      )}
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
                    <div className="grid grid-cols-2 gap-3">
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
                      <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value as Category)}
                          className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                        >
                          {CATEGORIES.filter((c) => c !== "all").map((c) => (
                            <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    {renderQuestTypeFields(editQuestType, editProofMode, setEditProofMode, editProofPlaceholder, setEditProofPlaceholder, editTutorialSteps, setEditTutorialSteps)}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editAwardBadge}
                        onChange={(e) => setEditAwardBadge(e.target.checked)}
                        className="rounded border-gray-300 text-gray-800 focus:ring-gray-400"
                      />
                      <span className="text-xs text-gray-600">Award badge on completion</span>
                    </label>
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
                  <div className={`px-5 py-3 flex items-center gap-3 ${q.active ? "" : "opacity-50"}`}>
                    {q.icon && !q.image_url && (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        <DynamicIcon name={q.icon} className="w-5 h-5 text-gray-500" />
                      </div>
                    )}
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
                        {q.deadline && (
                          <span className="text-[10px] text-gray-400">
                            ⏰ {new Date(q.deadline).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={q.active}
                        aria-label={q.active ? "Disable quest" : "Enable quest"}
                        disabled={isPending}
                        onClick={() => handleToggleActive(q.id, !q.active)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 disabled:opacity-50 ${
                          q.active ? "bg-gray-800" : "bg-gray-200"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            q.active ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
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
        <div ref={formRef}>
          {aiDraftBanner && (
            <div className="px-5 py-3 bg-gradient-to-r from-emerald-50 to-sky-50 border-t border-emerald-100 flex items-start gap-2">
              <span className="text-base leading-none pt-0.5">✨</span>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-800">AI draft ready</p>
                <p className="text-xs text-gray-600 mt-0.5">
                  The form below has been prefilled. Review every field — the admin (you) is still responsible for the final content. Click <strong>Add quest</strong> at the bottom to save.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAiDraftBanner(false)}
                className="text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            </div>
          )}
          {/* Templates */}
          <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{t("admin.quickAdd")}</p>
              <button
                type="button"
                onClick={handleAddAllCommon}
                disabled={isPending}
                className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors disabled:opacity-50"
              >
                {t("admin.addAllCommon")}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((tmpl) => (
                <button
                  key={tmpl.titleKey}
                  type="button"
                  onClick={() => applyTemplate(tmpl)}
                  className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:bg-white hover:border-gray-300 transition-colors"
                >
                  <DynamicIcon name={tmpl.icon} size={14} />
                  {t(tmpl.titleKey)}
                </button>
              ))}
            </div>
          </div>
        <form onSubmit={handleAdd} className="px-5 py-4 border-t border-gray-100 space-y-3 bg-gray-50">
          <LanguageTabs value={newLang} onChange={setNewLang} />
          {newLang === "en" ? (
            <>
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
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder={t("admin.questDescPlaceholder")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition resize-none"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t("admin.questTitle")} (ES)</label>
                <input
                  type="text"
                  value={newTitleEs}
                  onChange={(e) => setNewTitleEs(e.target.value)}
                  placeholder={newTitle || t("admin.questTitlePlaceholder")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">{t("admin.questDescOptional")} (ES)</label>
                <textarea
                  rows={3}
                  value={newDescEs}
                  onChange={(e) => setNewDescEs(e.target.value)}
                  placeholder={newDesc || t("admin.questDescPlaceholder")}
                  className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 transition resize-none"
                />
              </div>
            </>
          )}
          <IconPicker value={newIcon} onChange={setNewIcon} />
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
                step={spinStep}
                value={newReward}
                onChange={(e) => setNewReward(e.target.value)}
                required
                className="w-16 rounded-lg border border-gray-300 px-2 py-1.5 text-sm text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">{t("admin.questImage")}</label>
            {newImageUrl && (
              <div className="mb-2 p-2 bg-white rounded-lg border border-gray-200 flex items-center gap-3">
                <a
                  href={newImageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open full size in new tab"
                  className="shrink-0 group"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={newImageUrl}
                    alt="Quest image preview"
                    className="w-20 h-20 rounded-lg object-cover border border-gray-200 group-hover:ring-2 group-hover:ring-emerald-300 transition"
                  />
                </a>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] text-gray-400 truncate">{newImageUrl}</p>
                  <p className="text-[10px] text-gray-400">Click preview to view full size</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewImageUrl("");
                    setNewAiImageError(null);
                  }}
                  className="text-xs text-red-500 hover:text-red-700 transition-colors shrink-0"
                >
                  Clear
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 mb-1">
              <input
                type="text"
                value={newImageStyle}
                onChange={(e) => setNewImageStyle(e.target.value)}
                placeholder={QUEST_IMAGE_DEFAULT_STYLE}
                className="flex-1 min-w-0 rounded-md border border-gray-200 px-2 py-1.5 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
              />
              <button
                type="button"
                onClick={runNewAiImageGen}
                disabled={newAiImageLoading || !newTitle.trim()}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 hover:text-gray-900 px-3 py-1.5 rounded-md bg-gradient-to-r from-emerald-50 to-sky-50 hover:from-emerald-100 hover:to-sky-100 border border-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                {newAiImageLoading
                  ? "Generating…"
                  : newImageUrl
                    ? "✨ Regen"
                    : "✨ Generate"}
              </button>
            </div>
            <input
              type="url"
              placeholder="https://..."
              value={newImageUrl}
              onChange={(e) => { setNewImageUrl(e.target.value); if (e.target.value) setNewImage(null); }}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition mb-1"
            />
            <span className="block text-xs text-gray-400 text-center mb-1">or</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => { setNewImage(e.target.files?.[0] ?? null); if (e.target.files?.[0]) setNewImageUrl(""); }}
              className="w-full text-sm text-gray-500 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200"
            />
            {newAiImageError && (
              <p className="mt-1 text-xs text-red-600">{newAiImageError}</p>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Deadline</label>
            <input
              type="datetime-local"
              value={newDeadline}
              onChange={(e) => setNewDeadline(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
            />
            {newDeadline && (
              <button type="button" onClick={() => setNewDeadline("")} className="text-xs text-gray-400 hover:text-gray-600 mt-1">Clear deadline</button>
            )}
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
          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as Category)}
                className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 transition"
              >
                {CATEGORIES.filter((c) => c !== "all").map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </div>
          </div>
          {renderQuestTypeFields(newQuestType, newProofMode, setNewProofMode, newProofPlaceholder, setNewProofPlaceholder, newTutorialSteps, setNewTutorialSteps)}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={newAwardBadge}
              onChange={(e) => setNewAwardBadge(e.target.checked)}
              className="rounded border-gray-300 text-gray-800 focus:ring-gray-400"
            />
            <span className="text-xs text-gray-600">Award badge on completion</span>
          </label>
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

      {/* AI assist modal */}
      {aiOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
          onClick={() => !aiLoading && setAiOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                ✨ AI quest assist
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Describe the quest in plain English or Spanish. The AI will fill
                in the form with both languages, a suggested icon, category, and
                reward — you review and save.
              </p>
            </div>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="e.g. Follow us on Instagram for 2 spins. It's a social quest — one-time only."
              rows={5}
              disabled={aiLoading}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 resize-none disabled:opacity-50"
            />
            {aiError && (
              <div className="px-3 py-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg">
                {aiError}
              </div>
            )}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setAiOpen(false)}
                disabled={aiLoading}
                className="rounded-lg border border-gray-300 px-4 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                {t("common.cancel")}
              </button>
              <button
                type="button"
                onClick={runAiAssist}
                disabled={aiLoading || aiPrompt.trim().length < 3}
                className="rounded-lg bg-gray-800 text-white px-4 py-1.5 text-xs font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {aiLoading ? "Generating…" : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
