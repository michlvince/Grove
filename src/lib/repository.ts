import { createAdminClient } from "@/lib/supabase-admin";
import type {
  Creation,
  CreationStatus,
  DumpItem,
  Entry,
} from "@/types/domain";

/**
 * Server-side data access for a single user's Grove data.
 * All functions are scoped by userId and run with the service-role client.
 */

type CreationRow = {
  id: string;
  title: string;
  world_id: string;
  original_world_id: string | null;
  status: CreationStatus;
  created_at: string;
  updated_at: string;
};

type EntryRow = {
  id: string;
  creation_id: string;
  type: Entry["type"];
  content: string;
  created_at: string;
};

function mapEntry(row: EntryRow): Entry {
  return {
    id: row.id,
    type: row.type,
    content: row.content,
    timestamp: row.created_at,
  };
}

function mapCreation(row: CreationRow, entries: Entry[]): Creation {
  return {
    id: row.id,
    title: row.title,
    worldId: row.world_id,
    originalWorldId: row.original_world_id ?? undefined,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    entries,
  };
}

export async function getCreations(userId: string): Promise<Creation[]> {
  const supabase = createAdminClient();

  const { data: creationRows } = await supabase
    .from("creations")
    .select("id, title, world_id, original_world_id, status, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });

  const creations = (creationRows ?? []) as CreationRow[];
  if (creations.length === 0) return [];

  const { data: entryRows } = await supabase
    .from("entries")
    .select("id, creation_id, type, content, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });

  const entriesByCreation = new Map<string, Entry[]>();
  for (const row of (entryRows ?? []) as EntryRow[]) {
    const list = entriesByCreation.get(row.creation_id) ?? [];
    list.push(mapEntry(row));
    entriesByCreation.set(row.creation_id, list);
  }

  return creations.map((c) => mapCreation(c, entriesByCreation.get(c.id) ?? []));
}

export async function getDumpItems(userId: string): Promise<DumpItem[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("dump_items")
    .select("id, content, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((d) => ({
    id: d.id,
    content: d.content,
    createdAt: d.created_at,
  }));
}

export async function createCreation(
  userId: string,
  title: string,
  worldId: string,
  initialContent?: string
): Promise<Creation> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const { data: created, error } = await supabase
    .from("creations")
    .insert({
      user_id: userId,
      title,
      world_id: worldId,
      status: "Seed",
      created_at: now,
      updated_at: now,
    })
    .select("id, title, world_id, original_world_id, status, created_at, updated_at")
    .single();

  if (error || !created) throw new Error("Failed to create creation");

  let entries: Entry[] = [];
  if (initialContent && initialContent.trim()) {
    const { data: entry } = await supabase
      .from("entries")
      .insert({
        creation_id: created.id,
        user_id: userId,
        type: "text",
        content: initialContent,
        created_at: now,
      })
      .select("id, creation_id, type, content, created_at")
      .single();
    if (entry) entries = [mapEntry(entry as EntryRow)];
  }

  return mapCreation(created as CreationRow, entries);
}

export async function addEntry(
  userId: string,
  creationId: string,
  type: Entry["type"],
  content: string
): Promise<void> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  await supabase.from("entries").insert({
    creation_id: creationId,
    user_id: userId,
    type,
    content,
    created_at: now,
  });

  // Restore from dump + auto-advance status, mirroring old client logic.
  const { data: creation } = await supabase
    .from("creations")
    .select("world_id, original_world_id, status")
    .eq("id", creationId)
    .eq("user_id", userId)
    .single();

  if (creation) {
    let worldId = creation.world_id as string;
    if (worldId === "dump") worldId = creation.original_world_id || "personal";

    let status = creation.status as CreationStatus;
    if (status === "Seed" || status === "Frozen") status = "Growing";

    await supabase
      .from("creations")
      .update({ world_id: worldId, status, updated_at: now })
      .eq("id", creationId)
      .eq("user_id", userId);
  }
}

export async function updateCreationStatus(
  userId: string,
  creationId: string,
  status: CreationStatus
): Promise<void> {
  const supabase = createAdminClient();
  await supabase
    .from("creations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", creationId)
    .eq("user_id", userId);
}

export async function deleteCreation(userId: string, creationId: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("creations").delete().eq("id", creationId).eq("user_id", userId);
}

export async function addDumpItem(userId: string, content: string): Promise<DumpItem> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();
  const { data } = await supabase
    .from("dump_items")
    .insert({ user_id: userId, content, created_at: now })
    .select("id, content, created_at")
    .single();

  return {
    id: data!.id,
    content: data!.content,
    createdAt: data!.created_at,
  };
}

export async function deleteDumpItem(userId: string, id: string): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("dump_items").delete().eq("id", id).eq("user_id", userId);
}
