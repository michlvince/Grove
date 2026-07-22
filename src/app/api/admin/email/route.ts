import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendNoReplyEmail, getTargetEmails } from "@/lib/email";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden. Admin access required." }, { status: 403 });
  }

  let body: { target?: string; subject?: string; message?: string; isHtml?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const target = String(body.target ?? "all"); // "all" | userId
  const subject = String(body.subject ?? "").trim();
  const message = String(body.message ?? "").trim();

  if (!subject || !message) {
    return NextResponse.json({ error: "Subject and Message are required." }, { status: 400 });
  }

  try {
    const emails = await getTargetEmails(target);

    if (emails.length === 0) {
      return NextResponse.json({ error: "No target email addresses found." }, { status: 404 });
    }

    // Format simple text message into styled HTML email template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0c0d0e; color: #f3f4f6; margin: 0; padding: 32px 16px; }
            .container { max-width: 580px; margin: 0 auto; background: #16181a; border: 1px solid #272a2e; border-radius: 16px; padding: 32px; }
            .logo { font-size: 20px; font-weight: bold; color: #10b981; margin-bottom: 24px; display: flex; items-center; gap: 8px; }
            .dot { width: 10px; height: 10px; background-color: #10b981; border-radius: 50%; display: inline-block; }
            h1 { font-size: 20px; font-weight: 700; color: #ffffff; margin-top: 0; margin-bottom: 16px; }
            .content { font-size: 15px; line-height: 1.6; color: #d1d5db; white-space: pre-wrap; margin-bottom: 32px; }
            .footer { border-top: 1px solid #272a2e; padding-top: 20px; font-size: 12px; color: #6b7280; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="logo"><span class="dot"></span> Grove</div>
            <h1>${subject}</h1>
            <div class="content">${message}</div>
            <div class="footer">
              This is an automated announcement from Grove. Please do not reply directly to this email.
            </div>
          </div>
        </body>
      </html>
    `;

    // Send emails via Resend
    await sendNoReplyEmail({
      to: emails,
      subject,
      html: htmlContent,
      text: message,
    });

    return NextResponse.json({
      ok: true,
      sentCount: emails.length,
      recipient: target === "all" ? "all users" : emails[0],
    });
  } catch (err) {
    console.error("[admin email] failed:", err);
    const msg = err instanceof Error ? err.message : "Failed to send email.";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
