import { NextResponse } from "next/server";
import { auth } from "@/auth";
import {
  addEntry,
  updateCreationStatus,
  deleteCreation,
} from "@/lib/repository";
import type { CreationStatus, Entry } from "@/types/domain";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json();

  if (body?.action === "addEntry") {
    const type = body.type as Entry["type"];
    const content = String(body.content ?? "");
    if (!type || !content) {
      return NextResponse.json({ error: "type and content required" }, { status: 400 });
    }
    await addEntry(session.user.id, id, type, content);
    return NextResponse.json({ ok: true });
  }

  if (body?.action === "updateStatus") {
    await updateCreationStatus(session.user.id, id, body.status as CreationStatus);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  await deleteCreation(session.user.id, id);
  return NextResponse.json({ ok: true });
}
