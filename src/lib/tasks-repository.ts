import { createAdminClient } from "@/lib/supabase-admin";
import type { Task, TaskPriority, TaskStatus } from "@/types/domain";

interface TaskRow {
  id: string;
  creation_id: string;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignee_id?: string | null;
  start_date: string | null;
  due_date: string | null;
  sort_order: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

function mapTask(row: TaskRow): Task {
  return {
    id: row.id,
    creationId: row.creation_id,
    title: row.title,
    priority: row.priority,
    status: row.status,
    assigneeId: row.assignee_id ?? null,
    assignee: row.assignee
      ? { id: row.assignee.id, name: row.assignee.name, email: row.assignee.email }
      : null,
    startDate: row.start_date,
    dueDate: row.due_date,
    sortOrder: row.sort_order,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getTasks(userId: string, creationId: string): Promise<Task[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("creation_id", creationId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error || !data) return [];

  // Fetch assignees manually for any task with assignee_id
  const assigneeIds = Array.from(new Set(data.map((t) => t.assignee_id).filter(Boolean)));
  let usersMap: Record<string, { id: string; name: string; email: string }> = {};

  if (assigneeIds.length > 0) {
    const { data: usersData } = await supabase
      .from("users")
      .select("id, name, email")
      .in("id", assigneeIds);

    if (usersData) {
      for (const u of usersData) {
        usersMap[u.id] = u;
      }
    }
  }

  return data.map((t) => mapTask({ ...t, assignee: t.assignee_id ? usersMap[t.assignee_id] ?? null : null }));
}

export async function createTask(
  userId: string,
  creationId: string,
  input: {
    title: string;
    priority?: TaskPriority;
    assigneeId?: string | null;
    startDate?: string | null;
    dueDate?: string | null;
  }
): Promise<Task | null> {
  const supabase = createAdminClient();

  const { data: maxRow } = await supabase
    .from("tasks")
    .select("sort_order")
    .eq("creation_id", creationId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (maxRow?.sort_order ?? -1) + 1;

  const payload: Record<string, any> = {
    creation_id: creationId,
    user_id: userId,
    title: input.title,
    priority: input.priority ?? "medium",
    start_date: input.startDate ?? null,
    due_date: input.dueDate ?? null,
    sort_order: nextOrder,
  };

  if (input.assigneeId) {
    payload.assignee_id = input.assigneeId;
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert(payload)
    .select()
    .single();

  if (error || !data) {
    console.error("[tasks-repository] createTask insert error:", error);
    return null;
  }

  let assignee = null;
  if (data.assignee_id) {
    const { data: userData } = await supabase
      .from("users")
      .select("id, name, email")
      .eq("id", data.assignee_id)
      .single();
    if (userData) assignee = userData;
  }

  return mapTask({ ...(data as any), assignee });
}

export async function updateTask(
  userId: string,
  taskId: string,
  patch: Partial<{
    title: string;
    priority: TaskPriority;
    status: TaskStatus;
    assigneeId: string | null;
    startDate: string | null;
    dueDate: string | null;
    sortOrder: number;
  }>
): Promise<Task | null> {
  const supabase = createAdminClient();

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.priority !== undefined) update.priority = patch.priority;
  if (patch.assigneeId !== undefined) update.assignee_id = patch.assigneeId;
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
    .select(`
      *,
      assignee:users!tasks_assignee_id_fkey(id, name, email)
    `)
    .single();

  return data ? mapTask(data as TaskRow) : null;
}

export async function deleteTask(userId: string, taskId: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("tasks").delete().eq("id", taskId);
}
