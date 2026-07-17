import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { addDumpItem, deleteDumpItem } from "@/lib/repository";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const content = String(body?.content ?? "").trim();
  if (!content) {
    return NextResponse.json({ error: "content required" }, { status: 400 });
  }
  const item = await addDumpItem(session.user.id, content);
  return NextResponse.json({ item }, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  await deleteDumpItem(session.user.id, id);
  return NextResponse.json({ ok: true });
}
