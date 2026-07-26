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
  { params }: { params: Promise<{ id: string>} }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: creationId } = await params;
  const supabase = createAdminClient();

  // Verify that the requester is the creator of the creation
  const { data: creation, error: fetchErr } = await supabase
    .from("creations")
    .select("user_id")
    .eq("id", creationId)
    .single();

  if (fetchErr || !creation) {
    return NextResponse.json({ error: "Creation not found" }, { status: 404 });
  }
  if (creation.user_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch members
  const { data: members, error } = await supabase
    .from("creation_members")
    .select(`
      id,
      role,
      deadline,
      reward_xp,
      reward_text,
      user:users!creation_members_user_id_fkey(id, name, title, image)
    `)
    .eq("creation_id", creationId)
    .order("created_at");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ members });
}

/**
 * POST /api/creations/[creationId]/members
 * Body: { userId: string, role: "owner"|"admin"|"member", deadline?: string (ISO date), rewardXp?: number, rewardText?: string }
 * Assigns or updates a member's role for the creation.
 * Only the creator can assign roles.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string>} }
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
    .single();

  if (fetchErr || !creation) {
    return NextResponse.json({ error: "Creation not found" }, { status: 404 });
  }
  if (creation.user_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
    .single();

  if (userErr || !targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check if already a member (to upsert)
  const { data: existingMember, error: existErr } = await supabase
    .from("creation_members")
    .select("id")
    .eq("creation_id", creationId)
    .eq("user_id", userId)
    .single();

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
  if (existingMember) {
    // Update existing
    const { data: updated, error: updErr } = await supabase
      .from("creation_members")
      .update(upsertData)
      .eq("id", existingMember.id)
      .select()
      .single();

    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }
    result = updated;
  } else {
    // Insert new
    insertData = {
      ...upsertData,
      created_at: new Date().toISOString(),
    };
    const { data: inserted, error: insErr } = await supabase
      .from("creation_members")
      .insert(insertData)
      .select()
      .single();

    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }
    result = inserted;
  }

  return NextResponse.json({ member: result }, { status: 201 });
}

/**
 * PATCH /api/creations/[creationId]/members/[memberId]
 * Body: { role?: string, deadline?: string, rewardXp?: number, rewardText?: string }
 * Updates a member's role, deadline, reward.
 * Only creator can modify.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: creationId, memberId } = await params;
  const supabase = createAdminClient();

  // Verify creator
  const { data: creation, error: fetchErr } = await supabase
    .from("creations")
    .select("user_id")
    .eq("id", creationId)
    .single();

  if (fetchErr || !creation) {
    return NextResponse.json({ error: "Creation not found" }, { status: 404 });
  }
  if (creation.user_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { role?: "owner" | "admin" | "member"; deadline?: string; rewardXp?: number; rewardText?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { role, deadline, rewardXp, rewardText } = body;

  // Build update object
  const updateData: any = { updated_at: new Date().toISOString() };
  if (role !== undefined) {
    if (!["owner", "admin", "member"].includes(role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    }
    updateData.role = role;
  }
  if (deadline !== undefined) {
    // deadline can be null to clear
    updateData.deadline = deadline ?? null;
  }
  if (rewardXp !== undefined) {
    updateData.reward_xp = rewardXp;
  }
  if (rewardText !== undefined) {
    updateData.reward_text = rewardText ?? null;
  }

  if (Object.keys(updateData).length === 1 && updateData.updated_at) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data: updatedMember, error: updErr } = await supabase
    .from("creation_members")
    .update(updateData)
    .eq("id", memberId)
    .eq("creation_id", creationId) // extra safety
    .select()
    .single();

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }
  if (!updatedMember) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  return NextResponse.json({ member: updatedMember });
}

/**
 * DELETE /api/creations/[creationId]/members/[memberId]
 * Removes a member from the creation.
 * Only creator can delete.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; memberId: string>} }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: creationId, memberId } = await params;
  const supabase = createAdminClient();

  // Verify creator
  const { data: creation, error: fetchErr } = await supabase
    .from("creations")
    .select("user_id")
    .eq("id", creationId)
    .single();

  if (fetchErr || !creation) {
    return NextResponse.json({ error: "Creation not found" }, { status: 404 });
  }
  if (creation.user_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error: delErr } = await supabase
    .from("creation_members")
    .delete()
    .eq("id", memberId)
    .eq("creation_id", creationId);

  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}