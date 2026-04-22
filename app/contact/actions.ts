"use server";

import { Resend } from "resend";
import { checkBotId } from "botid/server";

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

  // Silently drop bot submissions: return success without sending email,
  // so operators get no signal to iterate around the check.
  // If BotID throws (missing OIDC token, external outage, etc.), fail open —
  // we'd rather deliver a legitimate email than block the form on a BotID issue.
  try {
    const verification = await checkBotId();
    if (verification.isBot) {
      console.warn("[contact] botid blocked submission", { email });
      return { status: "success" };
    }
  } catch (err) {
    console.error("[contact] botid check threw, proceeding", err);
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
