import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase-admin";

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

export async function DELETE(
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