import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase-admin";

/**
 * Send an email from no-reply@grove.app (or custom domain) via Resend.
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
  const fromEmail = process.env.EMAIL_FROM || "Grove <no-reply@resend.dev>";

  if (!apiKey) {
    throw new Error("Missing RESEND_API_KEY environment variable.");
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
