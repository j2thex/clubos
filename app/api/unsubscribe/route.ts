import { NextRequest, NextResponse } from "next/server";
import { verifyUnsubscribeToken } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

function htmlResponse(body: string, status = 200) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Unsubscribe</title>
</head>
<body style="margin: 0; padding: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #fafafa;">
  <div style="text-align: center; max-width: 400px; padding: 40px 24px;">
    ${body}
  </div>
</body>
</html>`;
  return new NextResponse(html, {
    status,
    headers: { "Content-Type": "text/html" },
  });
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return htmlResponse(
      `<h1 style="font-size: 22px; font-weight: 600; color: #111; margin: 0 0 12px;">Invalid link</h1>
       <p style="font-size: 14px; color: #666; margin: 0;">No token was provided.</p>`,
      400,
    );
  }

  const payload = await verifyUnsubscribeToken(token);

  if (!payload) {
    return htmlResponse(
      `<h1 style="font-size: 22px; font-weight: 600; color: #111; margin: 0 0 12px;">Invalid or expired link</h1>
       <p style="font-size: 14px; color: #666; margin: 0;">This unsubscribe link is no longer valid. Please contact the club directly if you wish to unsubscribe.</p>`,
      400,
    );
  }

  const supabase = createAdminClient();
  await supabase
    .from("members")
    .update({ email_opt_out: true })
    .eq("id", payload.member_id)
    .eq("club_id", payload.club_id);

  return htmlResponse(
    `<h1 style="font-size: 22px; font-weight: 600; color: #111; margin: 0 0 12px;">You've been unsubscribed</h1>
     <p style="font-size: 14px; color: #666; margin: 0;">You will no longer receive email campaigns from this club.</p>`,
  );
}
