import { Resend } from "resend";
import { SignJWT, jwtVerify } from "jose";

const resend = new Resend(process.env.RESEND_API_KEY);
const secret = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  clubName: string,
) {
  await resend.emails.send({
    from: "osocios.club <noreply@osocios.club>",
    to,
    subject: `Reset your password — ${clubName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="font-size: 20px; font-weight: 600; color: #111; margin: 0 0 8px;">Reset your password</h2>
        <p style="font-size: 14px; color: #666; margin: 0 0 24px;">
          You requested a password reset for your <strong>${clubName}</strong> admin account.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background: #111; color: #fff; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-size: 14px; font-weight: 600;">
          Set new password
        </a>
        <p style="font-size: 12px; color: #999; margin: 24px 0 0;">
          This link expires in 1 hour. If you didn't request this, ignore this email.
        </p>
      </div>
    `,
  });
}

export async function sendPreregistrationConfirmation(
  to: string,
  clubName: string,
  visitDate: string,
  numVisitors: number,
  clubAddress?: string | null,
) {
  const addressBlock = clubAddress
    ? `<p style="font-size: 14px; color: #333; margin: 0;"><strong>Address:</strong> ${clubAddress}</p>`
    : "";

  await resend.emails.send({
    from: "osocios.club <noreply@osocios.club>",
    to,
    subject: `Pre-registration confirmed — ${clubName}`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="font-size: 20px; font-weight: 600; color: #111; margin: 0 0 8px;">Pre-registration received</h2>
        <p style="font-size: 14px; color: #666; margin: 0 0 16px;">
          Your visit to <strong>${clubName}</strong> has been pre-registered.
        </p>
        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 0 0 16px;">
          <p style="font-size: 14px; color: #333; margin: 0 0 4px;"><strong>Date:</strong> ${visitDate}</p>
          <p style="font-size: 14px; color: #333; margin: 0 0 4px;"><strong>Visitors:</strong> ${numVisitors}</p>
          ${addressBlock}
        </div>
        <p style="font-size: 13px; color: #b45309; background: #fffbeb; border-radius: 6px; padding: 12px; margin: 0 0 16px;">
          <strong>Important:</strong> Please bring a valid physical ID for all visitors.
        </p>
        <p style="font-size: 12px; color: #999; margin: 0;">
          Please note that pre-registration does not guarantee entry. The club reserves the right to deny access.
        </p>
      </div>
    `,
  });
}

// --- Auto-registration email ---

export async function sendAutoRegistrationEmail(
  to: string,
  clubName: string,
  memberCode: string,
  visitDate: string,
  numVisitors: number,
  clubAddress?: string | null,
) {
  const addressBlock = clubAddress
    ? `<p style="font-size: 14px; color: #333; margin: 0;"><strong>Address:</strong> ${clubAddress}</p>`
    : "";

  await resend.emails.send({
    from: "osocios.club <noreply@osocios.club>",
    to,
    subject: `Welcome to ${clubName} — Your member code`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="font-size: 20px; font-weight: 600; color: #111; margin: 0 0 8px;">Welcome to ${clubName}!</h2>
        <p style="font-size: 14px; color: #666; margin: 0 0 16px;">
          Your visit has been registered and your member account is being set up.
        </p>
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 0 0 16px; text-align: center;">
          <p style="font-size: 12px; color: #666; margin: 0 0 4px; text-transform: uppercase; letter-spacing: 1px;">Your Member Code</p>
          <p style="font-size: 32px; font-weight: 700; color: #111; margin: 0; font-family: monospace; letter-spacing: 4px;">${memberCode}</p>
        </div>
        <div style="background: #f9fafb; border-radius: 8px; padding: 16px; margin: 0 0 16px;">
          <p style="font-size: 14px; color: #333; margin: 0 0 4px;"><strong>Date:</strong> ${visitDate}</p>
          <p style="font-size: 14px; color: #333; margin: 0 0 4px;"><strong>Visitors:</strong> ${numVisitors}</p>
          ${addressBlock}
        </div>
        <p style="font-size: 13px; color: #b45309; background: #fffbeb; border-radius: 6px; padding: 12px; margin: 0 0 16px;">
          Your account is being reviewed and will be activated soon. You'll be able to log in once a staff member approves your registration.
        </p>
        <p style="font-size: 13px; color: #b45309; background: #fffbeb; border-radius: 6px; padding: 12px; margin: 0 0 16px;">
          <strong>Important:</strong> Please bring a valid physical ID for all visitors.
        </p>
        <p style="font-size: 12px; color: #999; margin: 0;">
          Pre-registration does not guarantee entry. The club reserves the right to deny access.
        </p>
      </div>
    `,
  });
}

// --- Unsubscribe tokens ---

export async function generateUnsubscribeToken(
  memberId: string,
  clubId: string,
): Promise<string> {
  return new SignJWT({ member_id: memberId, club_id: clubId, purpose: "unsubscribe" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("90d")
    .sign(secret);
}

export async function verifyUnsubscribeToken(
  token: string,
): Promise<{ member_id: string; club_id: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    if (payload.purpose !== "unsubscribe") return null;
    return {
      member_id: payload.member_id as string,
      club_id: payload.club_id as string,
    };
  } catch {
    return null;
  }
}

// --- Campaign email ---

export async function sendCampaignEmail(
  to: string,
  subject: string,
  bodyHtml: string,
  clubName: string,
  logoUrl: string | null,
  primaryColor: string,
  unsubscribeUrl: string,
): Promise<{ ok: true } | { error: string }> {
  const logoBlock = logoUrl
    ? `<img src="${logoUrl}" alt="${clubName}" style="height: 40px; margin-right: 12px; border-radius: 6px;" />`
    : "";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 0;">
      <div style="background: ${primaryColor}; padding: 20px 24px; border-radius: 8px 8px 0 0;">
        <table cellpadding="0" cellspacing="0" border="0"><tr>
          <td style="vertical-align: middle;">${logoBlock}</td>
          <td style="vertical-align: middle;"><span style="font-size: 18px; font-weight: 700; color: #fff;">${clubName}</span></td>
        </tr></table>
      </div>
      <div style="padding: 32px 24px; background: #ffffff;">
        ${bodyHtml}
      </div>
      <div style="padding: 20px 24px; background: #f9fafb; border-radius: 0 0 8px 8px; border-top: 1px solid #e5e7eb;">
        <p style="font-size: 12px; color: #999; margin: 0 0 8px;">
          You're receiving this because you shared your email with our club.
        </p>
        <a href="${unsubscribeUrl}" style="font-size: 12px; color: #999; text-decoration: underline;">Unsubscribe</a>
      </div>
    </div>
  `;

  try {
    await resend.emails.send({
      from: "osocios.club <noreply@osocios.club>",
      to,
      subject,
      html,
    });
    return { ok: true };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Failed to send email" };
  }
}
