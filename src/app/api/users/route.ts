import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase-admin";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data: users, error } = await supabase
    .from("users")
    .select("id, name, email, title, role, image")
    .order("name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filter out current logged in user from list of available chat partners
  const otherUsers = (users ?? []).filter((u) => u.id !== session.user.id);

  return NextResponse.json({ users: otherUsers });
}
