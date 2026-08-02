import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase-admin";

/**
 * GET /api/creations/[creationId]/members
 * Returns list of members with their roles, deadline, reward for a creation.
 * Only accessible by the creation's creator.
 */
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

  // Check if creation exists
  const { data: creation, error: fetchErr } = await supabase
    .from("creations")
    .select("user_id")
    .eq("id", creationId)
    .single();

  if (fetchErr || !creation) {
    return NextResponse.json({ error: "Creation not found" }, { status: 404 });
  }

  // Fetch members
  const { data: members, error } = await supabase
    .from("creation_members")
    .select("*")
    .eq("creation_id", creationId)
    .order("created_at");

  if (error) {
    console.error("[members route] error:", error);
    return NextResponse.json({ members: [] });
  }

  if (!members || members.length === 0) {
    return NextResponse.json({ members: [] });
  }

  // Map users manually
  const userIds = Array.from(new Set(members.map((m) => m.user_id).filter(Boolean)));
  let usersMap: Record<string, any> = {};

  if (userIds.length > 0) {
    const { data: usersData } = await supabase
      .from("users")
      .select("id, name, title, image, email")
      .in("id", userIds);

    if (usersData) {
      for (const u of usersData) {
        usersMap[u.id] = u;
      }
    }
  }

  const mappedMembers = members.map((m) => ({
    id: m.id,
    role: m.role,
    deadline: m.deadline,
    reward_xp: m.reward_xp,
    reward_text: m.reward_text,
    user: usersMap[m.user_id] ?? { id: m.user_id, name: "Member", title: "", image: null, email: "" },
  }));

  return NextResponse.json({ members: mappedMembers });
}

/**
 * POST /api/creations/[creationId]/members
 * Body: { userId: string, role: "owner"|"admin"|"member", deadline?: string (ISO date), rewardXp?: number, rewardText?: string }
 * Assigns or updates a member's role for the creation.
 * Only the creator can assign roles.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: creationId } = await params;
  const supabase = createAdminClient();

  // Verify creator
  const { data: creation, error: fetchErr } = await supabase
    .from("creations")
    .select("user_id")
    .eq("id", creationId)
    .maybeSingle();

  if (fetchErr || !creation) {
    console.error("[members POST] Creation fetch error:", fetchErr);
    return NextResponse.json({ error: "Creation not found" }, { status: 404 });
  }
  if (creation.user_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden. Only creation owner can assign roles." }, { status: 403 });
  }

  let body: { userId: string; role: "owner" | "admin" | "member"; deadline?: string; rewardXp?: number; rewardText?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { userId, role, deadline, rewardXp, rewardText } = body;
  if (!userId || !role) {
    return NextResponse.json({ error: "userId and role are required" }, { status: 400 });
  }
  // Validate role
  if (!["owner", "admin", "member"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Ensure the target user exists
  const { data: targetUser, error: userErr } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (userErr || !targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check if already a member (to upsert)
  const { data: existingMember } = await supabase
    .from("creation_members")
    .select("id")
    .eq("creation_id", creationId)
    .eq("user_id", userId)
    .maybeSingle();

  let upsertData: any = {
    creation_id: creationId,
    user_id: userId,
    role,
    deadline: deadline ?? null,
    reward_xp: rewardXp ?? 0,
    reward_text: rewardText ?? null,
    updated_at: new Date().toISOString(),
  };

  let result;
  try {
    if (existingMember) {
      const { data: updated, error: updErr } = await supabase
        .from("creation_members")
        .update(upsertData)
        .eq("id", existingMember.id)
        .select();

      if (updErr) {
        console.error("[members POST] Update error:", updErr);
        return NextResponse.json({ error: updErr.message }, { status: 500 });
      }
      result = updated?.[0];
    } else {
      const insertData = {
        ...upsertData,
        created_at: new Date().toISOString(),
      };
      const { data: inserted, error: insErr } = await supabase
        .from("creation_members")
        .insert(insertData)
        .select();

      if (insErr) {
        console.error("[members POST] Insert error:", insErr);
        // Fallback: try essential columns insert if schema lacks extended columns
        const basicData = {
          creation_id: creationId,
          user_id: userId,
          role,
        };
        const { data: fallback, error: fbErr } = await supabase
          .from("creation_members")
          .insert(basicData)
          .select();

        if (fbErr) {
          console.error("[members POST] Fallback insert error:", fbErr);
          return NextResponse.json({ error: fbErr.message }, { status: 500 });
        }
        result = fallback?.[0];
      } else {
        result = inserted?.[0];
      }
    }

    // Send automatic Push Notification to assigned member (if VAPID configured)
    try {
      const { sendPushToUser } = await import("@/lib/web-push");
      const { data: creationData } = await supabase
        .from("creations")
        .select("title")
        .eq("id", creationId)
        .maybeSingle();

      const projTitle = creationData?.title ?? "a project";
      await sendPushToUser(userId, {
        title: "You were assigned to a project! 🚀",
        body: `You've been assigned as ${role} on "${projTitle}".`,
        url: `/creation/${creationId}`,
        tag: `member-assigned-${creationId}`,
      });
    } catch (pushErr) {
      // Don't fail the API call if web push keys aren't configured yet
      console.log("[members POST] Push notification skipped or unconfigured:", pushErr);
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to save member" }, { status: 500 });
  }

  return NextResponse.json({ member: result }, { status: 201 });
}