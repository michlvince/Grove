import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAdminAnalytics } from "@/lib/analytics";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const analytics = await getAdminAnalytics();
  return NextResponse.json(analytics);
}
