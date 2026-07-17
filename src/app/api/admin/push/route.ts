import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sendPushToAll, sendPushToUser } from "@/lib/web-push";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const title = String(body?.title ?? "").trim();
  const message = String(body?.body ?? "").trim();
  const url = body?.url ? String(body.url) : "/";
  const target = String(body?.target ?? "all"); // "all" | userId

  if (!title || !message) {
    return NextResponse.json({ error: "title and body are required" }, { status: 400 });
  }

  const payload = { title, body: message, url, tag: "grove-admin" };

  try {
    const result =
      target === "all"
        ? await sendPushToAll(payload)
        : await sendPushToUser(target, payload);
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to send push";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
