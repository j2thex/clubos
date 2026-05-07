"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, MessageSquare, X, ImagePlus, Sparkles, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { submitFeedback, improveFeedback } from "@/lib/feedback-action";
import { useLanguage } from "@/lib/i18n/provider";

type Category = "bug" | "idea" | "question";
type Step = "compose" | "confirm";

const CATEGORIES: { key: Category; emoji: string; en: string; es: string }[] = [
  { key: "bug", emoji: "🐛", en: "Bug", es: "Error" },
  { key: "idea", emoji: "💡", en: "Idea", es: "Idea" },
  { key: "question", emoji: "❓", en: "Question", es: "Pregunta" },
];

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("compose");
  const [text, setText] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [category, setCategory] = useState<Category>("idea");
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [improving, setImproving] = useState(false);
  const [undoText, setUndoText] = useState<string | null>(null);
  const [aiInstruction, setAiInstruction] = useState("");
  const [showOriginal, setShowOriginal] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { locale } = useLanguage();

  useEffect(() => {
    if (!open) return;
    function onPaste(e: ClipboardEvent) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            handleFile(file);
            return;
          }
        }
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function handleFile(file: File | null) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    if (file) {
      setScreenshot(file);
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      setScreenshot(null);
      setPreviewUrl(null);
    }
  }

  function clearScreenshot() {
    handleFile(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function resetAndClose() {
    setOpen(false);
    setStep("compose");
    setText("");
    setOriginalText("");
    setCategory("idea");
    clearScreenshot();
    setUndoText(null);
    setAiInstruction("");
    setShowOriginal(false);
  }

  async function postToTrello(textToSend: string): Promise<boolean> {
    const formData = new FormData();
    formData.set("text", textToSend);
    formData.set("category", category);
    formData.set("pageUrl", window.location.href);
    formData.set("locale", locale);
    if (screenshot) formData.set("screenshot", screenshot);
    try {
      const result = await submitFeedback(formData);
      if ("error" in result) {
        toast.error(result.error);
        return false;
      }
      return true;
    } catch (err) {
      console.error("Feedback submit error:", err);
      toast.error("Failed to send feedback");
      return false;
    }
  }

  async function handleContinue() {
    if (!text.trim() || improving) return;
    const composed = text;
    setOriginalText(composed);
    setImproving(true);
    try {
      const formData = new FormData();
      formData.set("text", composed);
      formData.set("category", category);
      formData.set("pageUrl", window.location.href);
      formData.set("locale", locale);
      if (screenshot) formData.set("screenshot", screenshot);

      const result = await improveFeedback(formData);
      if ("error" in result) {
        // Fail-soft: send original directly, skip Confirm screen.
        const ok = await postToTrello(composed);
        if (ok) {
          toast.success(locale === "es" ? "Enviado sin pulido" : "Sent without AI polish");
          resetAndClose();
        }
      } else {
        setText(result.improved);
        setUndoText(null);
        setAiInstruction("");
        setShowOriginal(false);
        setStep("confirm");
      }
    } catch (err) {
      console.error("Continue/improve error:", err);
      toast.error(locale === "es" ? "Error al procesar" : "Failed to process");
    } finally {
      setImproving(false);
    }
  }

  async function handleRegenerate() {
    if (improving || text.trim().length < 3) return;
    const previous = text;
    setImproving(true);
    try {
      const formData = new FormData();
      formData.set("text", text);
      formData.set("category", category);
      formData.set("pageUrl", window.location.href);
      formData.set("locale", locale);
      if (aiInstruction.trim()) formData.set("instruction", aiInstruction.trim());
      if (screenshot) formData.set("screenshot", screenshot);

      const result = await improveFeedback(formData);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        setUndoText(previous);
        setText(result.improved);
        setAiInstruction("");
      }
    } catch (err) {
      console.error("Regenerate error:", err);
      toast.error(locale === "es" ? "Error al regenerar" : "Failed to regenerate");
    } finally {
      setImproving(false);
    }
  }

  function handleUndo() {
    if (undoText === null) return;
    setText(undoText);
    setUndoText(null);
  }

  function handleBack() {
    setText(originalText);
    setStep("compose");
    setUndoText(null);
    setAiInstruction("");
    setShowOriginal(false);
  }

  async function handleSubmit() {
    if (!text.trim() || sending || improving) return;
    setSending(true);
    try {
      const ok = await postToTrello(text);
      if (ok) {
        toast.success(locale === "es" ? "¡Gracias por tu feedback!" : "Thanks for your feedback!");
        resetAndClose();
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-20 right-4 z-[998] w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg hover:brightness-110 transition-all flex items-center justify-center"
          aria-label="Send feedback"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      )}

      {/* Modal */}
      {open && (
        <>
          <div className="fixed inset-0 z-[998] bg-black/30" onClick={resetAndClose} />
          <div
            className="fixed bottom-20 right-4 z-[999] w-80 rounded-2xl bg-card text-card-foreground border border-border shadow-2xl overflow-hidden"
            onDragEnter={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              if (!dragging) setDragging(true);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                setDragging(false);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (!file) return;
              if (!file.type.startsWith("image/")) {
                toast.error(locale === "es" ? "Solo imágenes" : "Images only");
                return;
              }
              handleFile(file);
            }}
          >
            {dragging && (
              <div className="pointer-events-none absolute inset-0 z-10 m-2 rounded-xl border-2 border-dashed border-primary bg-primary/5 flex items-center justify-center">
                <span className="text-xs font-medium text-primary">
                  {locale === "es" ? "Suelta la imagen aquí" : "Drop image here"}
                </span>
              </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              {step === "confirm" ? (
                <button
                  onClick={handleBack}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={locale === "es" ? "Atrás" : "Back"}
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              ) : (
                <span className="w-4" />
              )}
              <span className="text-sm font-semibold">
                {step === "confirm"
                  ? (locale === "es" ? "Revisar feedback" : "Review feedback")
                  : (locale === "es" ? "Enviar feedback" : "Send Feedback")}
              </span>
              <button
                onClick={resetAndClose}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            {step === "compose" ? (
              <div className="p-4 space-y-3">
                {/* Category pills */}
                <div className="flex gap-1.5">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => setCategory(c.key)}
                      className={`flex-1 text-xs font-medium py-1.5 rounded-lg transition-colors ${
                        category === c.key
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-accent"
                      }`}
                    >
                      {c.emoji} {locale === "es" ? c.es : c.en}
                    </button>
                  ))}
                </div>

                {/* Textarea */}
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={locale === "es" ? "Cuéntanos qué piensas..." : "Tell us what you think..."}
                  className="w-full h-24 px-3 py-2 text-base sm:text-sm rounded-lg border border-input bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground disabled:opacity-60"
                  disabled={improving}
                  autoFocus
                />

                {/* Attach */}
                <div className="flex items-center justify-between gap-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                  />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ImagePlus className="w-4 h-4" />
                    {locale === "es" ? "Adjuntar, pegar o soltar" : "Attach, paste or drop"}
                  </button>
                </div>

                {/* Screenshot preview */}
                {previewUrl && (
                  <div className="relative inline-block">
                    <img src={previewUrl} alt="Screenshot" className="h-16 rounded-lg border border-border object-cover" />
                    <button
                      onClick={clearScreenshot}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center text-xs"
                    >
                      ×
                    </button>
                  </div>
                )}

                {/* Continue */}
                <button
                  onClick={handleContinue}
                  disabled={improving || !text.trim()}
                  className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5"
                >
                  {improving && <Sparkles className="w-3.5 h-3.5 animate-pulse" />}
                  {improving
                    ? (locale === "es" ? "Mejorando..." : "Improving...")
                    : (locale === "es" ? "Continuar" : "Continue")}
                </button>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {/* Editable improved text */}
                <textarea
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    if (undoText !== null) setUndoText(null);
                  }}
                  className="w-full h-28 px-3 py-2 text-base sm:text-sm rounded-lg border border-input bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground disabled:opacity-60"
                  disabled={improving}
                />

                {/* Show original toggle + Undo */}
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setShowOriginal((v) => !v)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showOriginal
                      ? (locale === "es" ? "Ocultar original" : "Hide original")
                      : (locale === "es" ? "Ver original" : "Show original")}
                  </button>
                  {undoText !== null && (
                    <button
                      type="button"
                      onClick={handleUndo}
                      className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      {locale === "es" ? "Deshacer" : "Undo"}
                    </button>
                  )}
                </div>

                {/* Original preview */}
                {showOriginal && (
                  <div className="rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground whitespace-pre-wrap">
                    {originalText}
                  </div>
                )}

                {/* Tell AI what to change */}
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={aiInstruction}
                    onChange={(e) => setAiInstruction(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleRegenerate();
                      }
                    }}
                    placeholder={locale === "es" ? "Dile a la IA qué cambiar…" : "Tell AI what to change…"}
                    className="flex-1 h-9 px-3 text-base sm:text-sm rounded-lg border border-input bg-background focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground disabled:opacity-60"
                    disabled={improving}
                  />
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    disabled={improving || text.trim().length < 3}
                    className="w-9 h-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all"
                    aria-label={locale === "es" ? "Regenerar" : "Regenerate"}
                  >
                    <Sparkles className={`w-4 h-4 ${improving ? "animate-pulse" : ""}`} />
                  </button>
                </div>

                {/* Screenshot preview */}
                {previewUrl && (
                  <div className="relative inline-block">
                    <img src={previewUrl} alt="Screenshot" className="h-16 rounded-lg border border-border object-cover" />
                  </div>
                )}

                {/* Send */}
                <button
                  onClick={handleSubmit}
                  disabled={sending || improving || !text.trim()}
                  className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 disabled:opacity-50 transition-all"
                >
                  {sending
                    ? (locale === "es" ? "Enviando..." : "Sending...")
                    : (locale === "es" ? "Enviar" : "Send")}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
