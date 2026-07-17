import { createAdminClient } from "@/lib/supabase-admin";
import { DEFAULT_WORLDS } from "@/lib/worlds";
import type { CreationStatus } from "@/types/domain";

export interface WorldStat {
  worldId: string;
  name: string;
  creations: number;
  entries: number;
  activeCreations: number; // updated within 30 days OR shipped
  health: "Active" | "Frozen" | "Empty";
}

export interface TopUser {
  id: string;
  name: string;
  email: string;
  creations: number;
  entries: number;
  lastLoginAt: string | null;
}

export interface AdminAnalytics {
  users: {
    total: number;
    admins: number;
    byProvider: { credentials: number; google: number; other: number };
    newLast7Days: number;
    newLast30Days: number;
    activeLast7Days: number; // logged in within 7 days
    signupsByDay: { date: string; count: number }[]; // last 14 days
  };
  content: {
    totalCreations: number;
    totalEntries: number;
    totalDumpItems: number;
    entryTypes: { text: number; image: number; link: number; audio: number };
    statusBreakdown: Record<CreationStatus, number>;
  };
  worlds: WorldStat[];
  topUsers: TopUser[];
  generatedAt: string;
}

const STATUSES: CreationStatus[] = [
  "Seed",
  "Growing",
  "Thriving",
  "Frozen",
  "Launching",
  "Shipped",
];

function daysAgo(iso: string | null, now: number): number {
  if (!iso) return Infinity;
  return (now - new Date(iso).getTime()) / (1000 * 60 * 60 * 24);
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const supabase = createAdminClient();
  const now = Date.now();

  const [{ data: users }, { data: creations }, { data: entries }, { data: dump }] =
    await Promise.all([
      supabase
        .from("users")
        .select("id, name, email, role, provider, created_at, last_login_at"),
      supabase
        .from("creations")
        .select("id, user_id, world_id, status, updated_at"),
      supabase.from("entries").select("id, user_id, creation_id, type"),
      supabase.from("dump_items").select("id"),
    ]);

  const userRows = users ?? [];
  const creationRows = creations ?? [];
  const entryRows = entries ?? [];
  const dumpRows = dump ?? [];

  // ── User stats ──────────────────────────────────────────────────────────
  const byProvider = { credentials: 0, google: 0, other: 0 };
  let admins = 0;
  let newLast7 = 0;
  let newLast30 = 0;
  let active7 = 0;
  const signupBuckets = new Map<string, number>();

  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * 86400000).toISOString().slice(0, 10);
    signupBuckets.set(d, 0);
  }

  for (const u of userRows) {
    if (u.role === "admin") admins++;
    if (u.provider === "credentials") byProvider.credentials++;
    else if (u.provider === "google") byProvider.google++;
    else byProvider.other++;

    const created = daysAgo(u.created_at, now);
    if (created <= 7) newLast7++;
    if (created <= 30) newLast30++;
    if (daysAgo(u.last_login_at, now) <= 7) active7++;

    const day = u.created_at?.slice(0, 10);
    if (day && signupBuckets.has(day)) {
      signupBuckets.set(day, (signupBuckets.get(day) ?? 0) + 1);
    }
  }

  // ── Content stats ───────────────────────────────────────────────────────
  const entryTypes = { text: 0, image: 0, link: 0, audio: 0 };
  const entriesByUser = new Map<string, number>();
  const entriesByWorld = new Map<string, number>();
  const creationWorld = new Map<string, string>();

  const statusBreakdown = Object.fromEntries(
    STATUSES.map((s) => [s, 0])
  ) as Record<CreationStatus, number>;

  const worldCreations = new Map<string, number>();
  const worldActive = new Map<string, number>();
  const creationsByUser = new Map<string, number>();

  for (const c of creationRows) {
    creationWorld.set(c.id, c.world_id);
    worldCreations.set(c.world_id, (worldCreations.get(c.world_id) ?? 0) + 1);
    creationsByUser.set(c.user_id, (creationsByUser.get(c.user_id) ?? 0) + 1);

    const st = (c.status as CreationStatus) ?? "Seed";
    if (st in statusBreakdown) statusBreakdown[st]++;

    const isActive = c.status === "Shipped" || daysAgo(c.updated_at, now) <= 30;
    if (isActive) worldActive.set(c.world_id, (worldActive.get(c.world_id) ?? 0) + 1);
  }

  for (const e of entryRows) {
    const t = e.type as keyof typeof entryTypes;
    if (t in entryTypes) entryTypes[t]++;
    entriesByUser.set(e.user_id, (entriesByUser.get(e.user_id) ?? 0) + 1);
    const world = creationWorld.get(e.creation_id);
    if (world) entriesByWorld.set(world, (entriesByWorld.get(world) ?? 0) + 1);
  }

  // ── World stats ─────────────────────────────────────────────────────────
  const worlds: WorldStat[] = DEFAULT_WORLDS.map((w) => {
    const count = worldCreations.get(w.id) ?? 0;
    const active = worldActive.get(w.id) ?? 0;
    let health: WorldStat["health"] = "Empty";
    if (count > 0) health = active > 0 ? "Active" : "Frozen";
    return {
      worldId: w.id,
      name: w.name,
      creations: count,
      entries: entriesByWorld.get(w.id) ?? 0,
      activeCreations: active,
      health,
    };
  });

  // ── Top users by activity ────────────────────────────────────────────────
  const topUsers: TopUser[] = userRows
    .map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      creations: creationsByUser.get(u.id) ?? 0,
      entries: entriesByUser.get(u.id) ?? 0,
      lastLoginAt: u.last_login_at ?? null,
    }))
    .sort((a, b) => b.creations + b.entries - (a.creations + a.entries))
    .slice(0, 10);

  return {
    users: {
      total: userRows.length,
      admins,
      byProvider,
      newLast7Days: newLast7,
      newLast30Days: newLast30,
      activeLast7Days: active7,
      signupsByDay: Array.from(signupBuckets, ([date, count]) => ({ date, count })),
    },
    content: {
      totalCreations: creationRows.length,
      totalEntries: entryRows.length,
      totalDumpItems: dumpRows.length,
      entryTypes,
      statusBreakdown,
    },
    worlds,
    topUsers,
    generatedAt: new Date().toISOString(),
  };
}
