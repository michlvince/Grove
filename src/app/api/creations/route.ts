import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  getCreations,
  getDumpItems,
  createCreation,
} from "@/lib/repository";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [creations, dumpItems] = await Promise.all([
    getCreations(session.user.id),
    getDumpItems(session.user.id),
  ]);

  return NextResponse.json({ creations, dumpItems });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const title = String(body?.title ?? "").trim();
  const worldId = String(body?.worldId ?? "").trim();
  const initialContent = body?.initialContent as string | undefined;

  if (!title || !worldId) {
    return NextResponse.json({ error: "title and worldId required" }, { status: 400 });
  }

  const creation = await createCreation(session.user.id, title, worldId, initialContent);
  return NextResponse.json({ creation }, { status: 201 });
}
