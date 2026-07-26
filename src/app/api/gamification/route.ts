import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase-admin";

/**
 * GET /api/gamification/profile
 * Returns the logged-in user's XP, level, and earned achievements.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Fetch user XP record
  const { data: xpData, error: xpErr } = await supabase
    .from("user_xp")
    .select("xp, level")
    .eq("user_id", session.user.id)
    .single();

  if (xpErr && xpErr.code !== "PGRST116") {
    // PGRST116 means no rows returned; we'll treat as new user and initialize later
    console.warn("Error fetching user_xp:", xpErr.message);
  }

  // Fetch earned achievements with achievement details
  const { data: userAchievements, error: achErr } = await supabase
    .from("user_achievements")
    .select(`
      earned_at,
      achievement:achievements(id, slug, name, description, icon, xp_reward)
    `)
    .eq("user_id", session.user.id)
    .order("earned_at", { ascending: false });

  if (achErr) {
    return NextResponse.json({ error: achErr.message }, { status: 500 });
  }

  // Initialize XP record if not exists
  let xp = 0;
  let level = 1;
  if (!xpData) {
    const { data: insertData, error: insertErr } = await supabase
      .from("user_xp")
      .insert({ user_id: session.user.id, xp: 0, level: 1 })
      .select()
      .single();
    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }
    xp = insertData.xp;
    level = insertData.level;
  } else {
    xp = xpData.xp;
    level = xpData.level;
  }

  return NextResponse.json({
    xp,
    level,
    achievements: userAchievements ?? [],
  });
}

/**
 * POST /api/gamification/xp
 * Body: { amount: number, reason?: string }
 * Awards XP to the logged-in user (used by other APIs after actions).
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { amount: number; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const amount = Number(body.amount ?? 0);
  if (!amount || amount <= 0) {
    return NextResponse.json({ error: "Valid positive amount required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  // Fetch current XP
  const { data: xpData, error: xpErr } = await supabase
    .from("user_xp")
    .select("xp, level")
    .eq("user_id", session.user.id)
    .single();

  if (xpErr && xpErr.code !== "PGRST116") {
    return NextResponse.json({ error: xpErr.message }, { status: 500 });
  }

  let currentXP = xpData?.xp ?? 0;
  let currentLevel = xpData?.level ?? 1;

  const newXP = currentXP + amount;
  // Simple level formula: every 100 XP = level up (level 1 at 0-99, level 2 at 100-199, etc.)
  const newLevel = Math.floor(newXP / 100) + 1;

// Update XP and level
   const { data: updatedData, error: updErr } = await supabase
     .from("user_xp")
     .upsert(
       { user_id: session.user.id, xp: newXP, level: newLevel, updated_at: new Date().toISOString() },
       { onConflict: "user_id" }
     )
     .select()
     .single();

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  // TODO: Check for any achievements that should be awarded based on new XP/level or other stats.
  // For simplicity, we could have a separate process or trigger that evaluates achievements.
  // We'll leave that to be implemented elsewhere.

  return NextResponse.json({
    xp: newXP,
    level: newLevel,
  });
}