import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase-admin";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@grove.app";

  if (!publicKey || !privateKey) {
    throw new Error(
      "Missing VAPID keys. Run `npx web-push generate-vapid-keys` and set NEXT_PUBLIC_VAPID_PUBLIC_KEY + VAPID_PRIVATE_KEY."
    );
  }
  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

interface SubRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

async function sendToRows(rows: SubRow[], payload: PushPayload) {
  ensureConfigured();
  const supabase = createAdminClient();
  const json = JSON.stringify(payload);

  let sent = 0;
  let failed = 0;
  const staleIds: string[] = [];

  await Promise.all(
    rows.map(async (row) => {
      try {
        await webpush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          json
        );
        sent++;
      } catch (err: unknown) {
        failed++;
        // 404/410 => subscription expired; prune it.
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) staleIds.push(row.id);
      }
    })
  );

  if (staleIds.length) {
    await supabase.from("push_subscriptions").delete().in("id", staleIds);
  }

  return { sent, failed, pruned: staleIds.length };
}

/** Send a push to every subscription of a single user. */
export async function sendPushToUser(userId: string, payload: PushPayload) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);
  return sendToRows((data ?? []) as SubRow[], payload);
}

/** Broadcast a push to all subscriptions across all users. */
export async function sendPushToAll(payload: PushPayload) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth");
  return sendToRows((data ?? []) as SubRow[], payload);
}
