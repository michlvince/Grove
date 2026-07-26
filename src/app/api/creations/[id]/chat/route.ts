import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: creationId } = await params;
  const supabase = createAdminClient();

  const { data: messages, error } = await supabase
    .from("project_chat_messages")
    .select(`
      id,
      creation_id,
      user_id,
      message,
      created_at,
      user:users!project_chat_messages_user_id_fkey(id, name, title, image)
    `)
    .eq("creation_id", creationId)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ messages: messages ?? [] });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: creationId } = await params;
  let body: { message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = String(body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: chatMsg, error } = await supabase
    .from("project_chat_messages")
    .insert({
      creation_id: creationId,
      user_id: session.user.id,
      message,
    })
    .select(`
      id,
      creation_id,
      user_id,
      message,
      created_at,
      user:users!project_chat_messages_user_id_fkey(id, name, title, image)
    `)
    .single();

  if (error || !chatMsg) {
    return NextResponse.json(
      { error: error?.message || "Could not post message" },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: chatMsg }, { status: 201 });
}
