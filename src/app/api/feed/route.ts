import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const worldId = searchParams.get("worldId");

  const supabase = createAdminClient();

  // Fetch public creations
  let query = supabase
    .from("creations")
    .select(`
      id,
      title,
      world_id,
      status,
      mode,
      created_at,
      updated_at,
      user:users!creations_user_id_fkey(id, name, title, image),
      likes:creation_likes(count),
      comments:creation_comments(count),
      entries:entries(count)
    `)
    .eq("is_public", true)
    .order("created_at", { ascending: false });

  if (worldId && worldId !== "all") {
    query = query.eq("world_id", worldId);
  }

  const { data: rawItems, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fetch current user's liked creations to check hasLiked
  const { data: userLikes } = await supabase
    .from("creation_likes")
    .select("creation_id")
    .eq("user_id", session.user.id);

  const likedSet = new Set((userLikes ?? []).map((l) => l.creation_id));

  const items = (rawItems ?? []).map((item: any) => ({
    id: item.id,
    title: item.title,
    worldId: item.world_id,
    status: item.status,
    mode: item.mode ?? "personal",
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    author: item.user
      ? { id: item.user.id, name: item.user.name, title: item.user.title, image: item.user.image }
      : { id: "", name: "Anonymous", title: "Traveler" },
    likesCount: item.likes?.[0]?.count ?? 0,
    commentsCount: item.comments?.[0]?.count ?? 0,
    entriesCount: item.entries?.[0]?.count ?? 0,
    hasLiked: likedSet.has(item.id),
  }));

  return NextResponse.json({ items });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { action?: "like" | "comment"; creationId?: string; comment?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const creationId = String(body.creationId ?? "").trim();
  const action = body.action;

  if (!creationId || !action) {
    return NextResponse.json({ error: "creationId and action required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (action === "like") {
    // Check if already liked
    const { data: existing } = await supabase
      .from("creation_likes")
      .select("id")
      .eq("creation_id", creationId)
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (existing) {
      // Unlike
      await supabase
        .from("creation_likes")
        .delete()
        .eq("id", existing.id);
      return NextResponse.json({ ok: true, liked: false });
    } else {
      // Like
      await supabase
        .from("creation_likes")
        .insert({ creation_id: creationId, user_id: session.user.id });
      return NextResponse.json({ ok: true, liked: true });
    }
  } else if (action === "comment") {
    const commentText = String(body.comment ?? "").trim();
    if (!commentText) {
      return NextResponse.json({ error: "Comment text required" }, { status: 400 });
    }

    const { data: comment, error } = await supabase
      .from("creation_comments")
      .insert({
        creation_id: creationId,
        user_id: session.user.id,
        comment: commentText,
      })
      .select(`
        id,
        creation_id,
        user_id,
        comment,
        created_at,
        user:users!creation_comments_user_id_fkey(id, name, title, image)
      `)
      .single();

    if (error || !comment) {
      return NextResponse.json({ error: error?.message || "Could not add comment" }, { status: 500 });
    }

    return NextResponse.json({ comment }, { status: 201 });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
