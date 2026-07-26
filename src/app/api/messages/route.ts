import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const partnerId = searchParams.get("partnerId");

  const supabase = createAdminClient();

  if (partnerId) {
    // Fetch conversation messages with a specific partner
    const { data: messages, error } = await supabase
      .from("direct_messages")
      .select(`
        id,
        sender_id,
        receiver_id,
        message,
        read,
        created_at,
        sender:users!direct_messages_sender_id_fkey(id, name, title, image)
      `)
      .or(
        `and(sender_id.eq.${session.user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${session.user.id})`
      )
      .order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Mark received messages as read
    await supabase
      .from("direct_messages")
      .update({ read: true })
      .eq("sender_id", partnerId)
      .eq("receiver_id", session.user.id)
      .eq("read", false);

    return NextResponse.json({ messages: messages ?? [] });
  } else {
    // Fetch list of recent DM partners with unread counts
    const { data: rawMessages, error } = await supabase
      .from("direct_messages")
      .select("sender_id, receiver_id, read, created_at")
      .or(`sender_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const partnerIds = new Set<string>();
    const unreadCounts: Record<string, number> = {};

    (rawMessages ?? []).forEach((msg) => {
      const partner = msg.sender_id === session.user.id ? msg.receiver_id : msg.sender_id;
      partnerIds.add(partner);
      if (msg.receiver_id === session.user.id && !msg.read) {
        unreadCounts[partner] = (unreadCounts[partner] || 0) + 1;
      }
    });

    return NextResponse.json({ partnerIds: Array.from(partnerIds), unreadCounts });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { receiverId?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const receiverId = String(body.receiverId ?? "").trim();
  const message = String(body.message ?? "").trim();

  if (!receiverId || !message) {
    return NextResponse.json({ error: "Receiver ID and message required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: dm, error } = await supabase
    .from("direct_messages")
    .insert({
      sender_id: session.user.id,
      receiver_id: receiverId,
      message,
    })
    .select(`
      id,
      sender_id,
      receiver_id,
      message,
      read,
      created_at,
      sender:users!direct_messages_sender_id_fkey(id, name, title, image)
    `)
    .single();

  if (error || !dm) {
    return NextResponse.json({ error: error?.message || "Could not send message" }, { status: 500 });
  }

  return NextResponse.json({ message: dm }, { status: 201 });
}
