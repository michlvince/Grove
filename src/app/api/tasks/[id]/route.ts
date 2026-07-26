import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateTask, deleteTask } from "@/lib/tasks-repository";
import type { TaskPriority, TaskStatus } from "@/types/domain";

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

  const task = await updateTask(session.user.id, id, {
    title: body?.title,
    priority: body?.priority as TaskPriority | undefined,
    status: body?.status as TaskStatus | undefined,
    assigneeId: body?.assigneeId,
    startDate: body?.startDate,
    dueDate: body?.dueDate,
    sortOrder: body?.sortOrder,
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  return NextResponse.json({ task });
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
  await deleteTask(session.user.id, id);
  return NextResponse.json({ ok: true });
}
