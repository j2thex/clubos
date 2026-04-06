"use client";

import { useState, useTransition } from "react";
import { MessageSquare, X } from "lucide-react";
import { toast } from "sonner";
import { submitFeedback } from "@/lib/feedback-action";
import { useLanguage } from "@/lib/i18n/provider";

type Category = "bug" | "idea" | "question";

const CATEGORIES: { key: Category; emoji: string; en: string; es: string }[] = [
  { key: "bug", emoji: "🐛", en: "Bug", es: "Error" },
  { key: "idea", emoji: "💡", en: "Idea", es: "Idea" },
  { key: "question", emoji: "❓", en: "Question", es: "Pregunta" },
];

export function FeedbackWidget() {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [category, setCategory] = useState<Category>("idea");
  const [isPending, startTransition] = useTransition();
  const { locale } = useLanguage();

  function handleSubmit() {
    if (!text.trim()) return;
    startTransition(async () => {
      const result = await submitFeedback(text, category, window.location.href);
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(locale === "es" ? "¡Gracias por tu feedback!" : "Thanks for your feedback!");
        setText("");
        setCategory("idea");
        setOpen(false);
      }
    });
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
          <div className="fixed inset-0 z-[998] bg-black/30" onClick={() => setOpen(false)} />
          <div className="fixed bottom-20 right-4 z-[999] w-80 rounded-2xl bg-card text-card-foreground border border-border shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <span className="text-sm font-semibold">
                {locale === "es" ? "Enviar feedback" : "Send Feedback"}
              </span>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
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
                className="w-full h-24 px-3 py-2 text-sm rounded-lg border border-input bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
                autoFocus
              />

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={isPending || !text.trim()}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 disabled:opacity-50 transition-all"
              >
                {isPending
                  ? (locale === "es" ? "Enviando..." : "Sending...")
                  : (locale === "es" ? "Enviar" : "Send")}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
