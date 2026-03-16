import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
  clubName: string,
) {
  await resend.emails.send({
    from: "osocios.club <onboarding@resend.dev>",
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
