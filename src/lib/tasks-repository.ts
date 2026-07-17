import { createAdminClient } from "@/lib/supabase-admin";
import type { Task, TaskPriority, TaskStatus } from "@/types/domain";

interface TaskRow {
  id: string;
  creation_id: string;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  start_date: string | null;
  due_date: string | null;
  sort_order: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    creationId: row.creation_id,
    title: row.title,
    priority: row.priority,
    status: row.status,
    startDate: row.start_date,
    dueDate: row.due_date,
    sortOrder: row.sort_order,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Verify the creation belongs to the user before touching tasks.
async function assertOwnsCreation(userId: string, creationId: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("creations")
    .select("id")
    .eq("id", creationId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

export async function getTasks(userId: string, creationId: string): Promise<Task[]> {
  if (!(await assertOwnsCreation(userId, creationId))) return [];
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .eq("creation_id", creationId)
    .eq("user_id", userId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  return ((data ?? []) as TaskRow[]).map(mapTask);
}

export async function createTask(
  userId: string,
  creationId: string,
  input: {
    title: string;
    priority?: TaskPriority;
    startDate?: string | null;
    dueDate?: string | null;
  }
): Promise<Task | null> {
  if (!(await assertOwnsCreation(userId, creationId))) return null;
  const supabase = createAdminClient();

  const { data: maxRow } = await supabase
    .from("tasks")
    .select("sort_order")
    .eq("creation_id", creationId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (maxRow?.sort_order ?? -1) + 1;

  const { data } = await supabase
    .from("tasks")
    .insert({
      creation_id: creationId,
      user_id: userId,
      title: input.title,
      priority: input.priority ?? "medium",
      start_date: input.startDate ?? null,
      due_date: input.dueDate ?? null,
      sort_order: nextOrder,
    })
    .select("*")
    .single();

  return data ? mapTask(data as TaskRow) : null;
}

export async function updateTask(
  userId: string,
  taskId: string,
  patch: Partial<{
    title: string;
    priority: TaskPriority;
    status: TaskStatus;
    startDate: string | null;
    dueDate: string | null;
    sortOrder: number;
  }>
): Promise<Task | null> {
  const supabase = createAdminClient();

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.priority !== undefined) update.priority = patch.priority;
  if (patch.startDate !== undefined) update.start_date = patch.startDate;
  if (patch.dueDate !== undefined) update.due_date = patch.dueDate;
  if (patch.sortOrder !== undefined) update.sort_order = patch.sortOrder;
  if (patch.status !== undefined) {
    update.status = patch.status;
    update.completed_at = patch.status === "done" ? new Date().toISOString() : null;
  }

  const { data } = await supabase
    .from("tasks")
    .update(update)
    .eq("id", taskId)
    .eq("user_id", userId)
    .select("*")
    .single();

  return data ? mapTask(data as TaskRow) : null;
}

export async function deleteTask(userId: string, taskId: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("tasks").delete().eq("id", taskId).eq("user_id", userId);
}
