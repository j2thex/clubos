"use server";

import { Resend } from "resend";

export type ContactState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export async function submitContact(
  _prev: ContactState,
  formData: FormData
): Promise<ContactState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const club = String(formData.get("club") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name || !email || !message) {
    return { status: "error", message: "missing" };
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { status: "error", message: "invalid-email" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const inbox = process.env.CONTACT_INBOX_EMAIL;
  if (!apiKey || !inbox) {
    console.error("[contact] missing RESEND_API_KEY or CONTACT_INBOX_EMAIL");
    return { status: "error", message: "server-config" };
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: "osocios.club <no-reply@osocios.club>",
      to: inbox,
      replyTo: email,
      subject: `Contact form: ${name}${club ? ` (${club})` : ""}`,
      text: `From: ${name} <${email}>\nClub: ${club || "—"}\n\n${message}`,
    });
    return { status: "success" };
  } catch (err) {
    console.error("[contact] resend failed", err);
    return { status: "error", message: "send-failed" };
  }
}
