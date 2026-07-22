import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase-admin";

/**
 * Clean and format the `from` email address to guarantee valid Resend RFC 5322 format.
 * Defaults to Resend's onboarding testing sender `onboarding@resend.dev`.
 */
function getSanitizedFromEmail(): string {
  const raw = process.env.EMAIL_FROM;
  if (!raw) {
    return "onboarding@resend.dev";
  }

  // Strip surrounding quotes if present (e.g., "Grove <onboarding@resend.dev>")
  const unquoted = raw.trim().replace(/^["']|["']$/g, "");

  // Verify format matches valid email or "Name <email@domain.com>"
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(unquoted) || /^[^<>]+<[^\s@]+@[^\s@]+\.[^\s@]+>$/.test(unquoted)) {
    return unquoted;
  }

  return "onboarding@resend.dev";
}

/**
 * Send an email via Resend.
 */
export async function sendNoReplyEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = getSanitizedFromEmail();

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY environment variable. Please set it in Vercel / .env.local.");
  }

  const resend = new Resend(apiKey);

  const response = await resend.emails.send({
    from: fromEmail,
    to,
    subject,
    html,
    text,
  });

  if (response.error) {
    throw new Error(response.error.message);
  }

  return response.data;
}

/**
 * Helper to fetch target email addresses for admin broadcast/individual email.
 */
export async function getTargetEmails(target: "all" | string): Promise<string[]> {
  const supabase = createAdminClient();

  if (target === "all") {
    const { data: users, error } = await supabase
      .from("users")
      .select("email");

    if (error || !users) {
      throw new Error("Failed to fetch user emails for broadcast.");
    }

    return users.map((u) => u.email).filter(Boolean);
  } else {
    const { data: user, error } = await supabase
      .from("users")
      .select("email")
      .eq("id", target)
      .single();

    if (error || !user) {
      throw new Error("User not found for email delivery.");
    }

    return [user.email];
  }
}
