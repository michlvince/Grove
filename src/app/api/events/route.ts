import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase-admin";

/**
 * GET /api/events
 * Optional query params: upcoming (bool), past (bool), userId (for admin to see all)
 * Returns events; if userId provided and user is admin, returns all events.
 */
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const upcoming = searchParams.get("upcoming") === "true";
  const past = searchParams.get("past") === "true";

  let query = supabase.from("events").select(`
    id,
    title,
    description,
    start_date,
    end_date,
    xp_reward,
    created_at,
    updated_at,
    creator:users!events_creator_id_fkey(id, name, title, image)
  `).order("start_date", { ascending: true });

  if (userId) {
    // Only allow if requester is admin (or same user?) For simplicity, allow if requester is admin.
    const { data: requester } = await supabase
      .from("users")
      .select("role")
      .eq("id", session.user.id)
      .single();
    if (requester && requester.role === "admin") {
      query = query.eq("creator_id", userId);
    } else {
      // Non-admin can only see their own events
      query = query.eq("creator_id", session.user.id);
    }
  } else {
    // Default: show events where user is creator or participant? We'll show created by user.
    query = query.eq("creator_id", session.user.id);
  }

  const now = new Date().toISOString();
  if (upcoming && !past) {
    query = query.gte("start_date", now);
  } else if (past && !upcoming) {
    query = query.lt("end_date", now);
  }
  // If both or none, show all.

  const { data: events, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ events });
}

/**
 * POST /api/events
 * Body: { title, description, startDate (ISO), endDate (ISO), xpReward?: number }
 * Creates an event. Only admin users can create events.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Check if user is admin
  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("role")
    .eq("id", session.user.id)
    .single();

  if (userErr || !user || user.role !== "admin") {
    return NextResponse.json({ error: "Only admins can create events" }, { status: 403 });
  }

  let body: { title: string; description?: string; startDate: string; endDate: string; xpReward?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, description, startDate, endDate, xpReward } = body;
  if (!title || !startDate || !endDate) {
    return NextResponse.json({ error: "title, startDate, endDate are required" }, { status: 400 });
  }

  const insertData = {
    creator_id: session.user.id,
    title,
    description: description ?? null,
    start_date: startDate,
    end_date: endDate,
    xp_reward: xpReward ?? 0,
  };

  const { data: event, error } = await supabase
    .from("events")
    .insert(insertData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ event }, { status: 201 });
}