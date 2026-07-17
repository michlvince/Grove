import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getTasks, createTask } from "@/lib/tasks-repository";
import type { TaskPriority } from "@/types/domain";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const creationId = searchParams.get("creationId");
  if (!creationId) {
    return NextResponse.json({ error: "creationId required" }, { status: 400 });
  }
  const tasks = await getTasks(session.user.id, creationId);
  return NextResponse.json({ tasks });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const creationId = String(body?.creationId ?? "");
  const title = String(body?.title ?? "").trim();
  if (!creationId || !title) {
    return NextResponse.json({ error: "creationId and title required" }, { status: 400 });
  }

  const task = await createTask(session.user.id, creationId, {
    title,
    priority: body?.priority as TaskPriority | undefined,
    startDate: body?.startDate ?? null,
    dueDate: body?.dueDate ?? null,
  });

  if (!task) {
    return NextResponse.json({ error: "Creation not found" }, { status: 404 });
  }
  return NextResponse.json({ task }, { status: 201 });
}
