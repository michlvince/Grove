import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase-admin";

// Lightweight user list for the admin push-composer target dropdown.
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("users")
    .select("id, name, email, role")
    .order("name", { ascending: true });

  return NextResponse.json({ users: data ?? [] });
}
