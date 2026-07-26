import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase-admin";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: eventId } = await params;
  const supabase = createAdminClient();

  // Verify event exists and user is creator (admin)
  const { data: event, error: fetchErr } = await supabase
    .from("events")
    .select("creator_id")
    .eq("id", eventId)
    .single();

  if (fetchErr || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  if (event.creator_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: { title?: string; description?: string; startDate?: string; endDate?: string; xpReward?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { title, description, startDate, endDate, xpReward } = body;
  const updateData: any = { updated_at: new Date().toISOString() };
  if (title !== undefined) updateData.title = title;
  if (description !== undefined) updateData.description = description ?? null;
  if (startDate !== undefined) updateData.start_date = startDate;
  if (endDate !== undefined) updateData.end_date = endDate;
  if (xpReward !== undefined) updateData.xp_reward = xpReward;

  if (Object.keys(updateData).length === 1 && updateData.updated_at) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data: updatedEvent, error: updErr } = await supabase
    .from("events")
    .update(updateData)
    .eq("id", eventId)
    .select()
    .single();

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }
  if (!updatedEvent) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  return NextResponse.json({ event: updatedEvent });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: eventId } = await params;
  const supabase = createAdminClient();

  // Verify ownership
  const { data: event, error: fetchErr } = await supabase
    .from("events")
    .select("creator_id")
    .eq("id", eventId)
    .single();

  if (fetchErr || !event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  if (event.creator_id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error: delErr } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId);

  if (delErr) {
    return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}