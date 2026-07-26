import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: user, error } = await supabase
    .from("users")
    .select("id, name, email, title, role, image")
    .eq("id", session.user.id)
    .single();

  if (error || !user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { image?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { image } = body;
  if (image === undefined) {
    return NextResponse.json({ error: "image field required" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { error: updateError } = await supabase
    .from("users")
    .update({ image })
    .eq("id", session.user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Fetch updated user to return
  const { data: user, error: fetchError } = await supabase
    .from("users")
    .select("id, name, email, title, role, image")
    .eq("id", session.user.id)
    .single();

  if (fetchError || !user) {
    return NextResponse.json({ error: "Failed to fetch updated user" }, { status: 500 });
  }

  return NextResponse.json({ user });
}