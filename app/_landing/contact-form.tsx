"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/i18n/provider";
import { submitContact, type ContactState } from "@/app/contact/actions";

const INITIAL: ContactState = { status: "idle" };

export function ContactForm() {
  const { t } = useLanguage();
  const [state, dispatch, pending] = useActionState(submitContact, INITIAL);
  const [renderedAt] = useState(() => Date.now());

  if (state.status === "success") {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-green-800">
        {t("contact.formSuccess")}
      </div>
    );
  }

  return (
    <form action={dispatch} className="space-y-4">
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute left-[-9999px] h-0 w-0 opacity-0"
      />
      <input type="hidden" name="rendered_at" value={renderedAt} />
      <div className="space-y-1.5">
        <Label htmlFor="name">{t("contact.formName")}</Label>
        <Input id="name" name="name" required autoComplete="name" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">{t("contact.formEmail")}</Label>
        <Input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="club">{t("contact.formClub")}</Label>
        <Input id="club" name="club" autoComplete="organization" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="message">{t("contact.formMessage")}</Label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      {state.status === "error" && (
        <p className="text-sm text-red-600">{t("contact.formError")}</p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t("contact.formSending") : t("contact.formSubmit")}
      </Button>
    </form>
  );
}
