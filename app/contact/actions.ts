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

  // Honeypot: invisible field real users never see. Bots that fill every
  // input populate it. Stealth success so operators get no signal.
  const website = String(formData.get("website") ?? "").trim();
  if (website) {
    console.warn("[contact] honeypot triggered");
    return { status: "success" };
  }

  // Any submit under 2 s is almost certainly a script.
  const renderedAt = Number(formData.get("rendered_at") ?? 0);
  const elapsed = Date.now() - renderedAt;
  if (!renderedAt || elapsed < 2000) {
    console.warn("[contact] too-fast submit", { elapsed });
    return { status: "success" };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const inbox = process.env.CONTACT_INBOX_EMAIL;
  if (!apiKey || !inbox) {
    console.error("[contact] missing RESEND_API_KEY or CONTACT_INBOX_EMAIL");
    return { status: "error", message: "server-config" };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: "osocios.club <noreply@osocios.club>",
      to: inbox,
      replyTo: email,
      subject: `Contact form: ${name}${club ? ` (${club})` : ""}`,
      text: `From: ${name} <${email}>\nClub: ${club || "—"}\n\n${message}`,
    });
    if (error) {
      console.error("[contact] resend error", error);
      return { status: "error", message: "send-failed" };
    }
    return { status: "success" };
  } catch (err) {
    console.error("[contact] resend threw", err);
    return { status: "error", message: "send-failed" };
  }
}
