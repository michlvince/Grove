"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import type {
  Creation,
  CreationStatus,
  DumpItem,
  Entry,
} from "@/types/domain";

// Re-export shared types + worlds so existing imports keep working.
export type { Creation, CreationStatus, DumpItem, Entry } from "@/types/domain";
export { DEFAULT_WORLDS } from "@/lib/worlds";
export type { World, WorldId } from "@/lib/worlds";

export interface UserProfile {
  name: string;
  title: string;
  joinedAt: string;
  role?: "user" | "admin";
}

interface StateContextType {
  user: UserProfile | null;
  creations: Creation[];
  dumpItems: DumpItem[];
  isLoaded: boolean;
  refresh: () => Promise<void>;
  addCreation: (title: string, worldId: string, initialContent?: string) => Promise<Creation | null>;
  updateCreationStatus: (id: string, status: CreationStatus) => Promise<void>;
  addEntry: (creationId: string, type: Entry["type"], content: string) => Promise<void>;
  deleteCreation: (id: string) => Promise<void>;
  addDumpItem: (content: string) => Promise<void>;
  deleteDumpItem: (id: string) => Promise<void>;
  reviveDumpItem: (id: string, title: string, worldId: string) => Promise<Creation | null>;
  reviveDumpCreation: (creationId: string, worldId: string) => Promise<void>;
  unearthRandom: () => { type: "raw" | "creation"; item: DumpItem | Creation } | null;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

export function StateProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [creations, setCreations] = useState<Creation[]>([]);
  const [dumpItems, setDumpItems] = useState<DumpItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const user: UserProfile | null = session?.user
    ? {
        name: session.user.name ?? "Traveler",
        title: session.user.title ?? "Traveler",
        joinedAt: "",
        role: session.user.role,
      }
    : null;

  const refresh = useCallback(async () => {
    if (status !== "authenticated") return;
    try {
      const res = await fetch("/api/creations", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setCreations(data.creations ?? []);
        setDumpItems(data.dumpItems ?? []);
      }
    } catch (err) {
      console.error("Failed to load Grove data:", err);
    } finally {
      setIsLoaded(true);
    }
  }, [status]);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      setCreations([]);
      setDumpItems([]);
      setIsLoaded(true);
      return;
    }
    refresh();
  }, [status, refresh]);

  const addCreation = async (title: string, worldId: string, initialContent?: string) => {
    const res = await fetch("/api/creations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, worldId, initialContent }),
    });
    if (!res.ok) return null;
    const { creation } = await res.json();
    setCreations((prev) => [creation, ...prev]);
    return creation as Creation;
  };

  const updateCreationStatus = async (id: string, statusValue: CreationStatus) => {
    await fetch(`/api/creations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateStatus", status: statusValue }),
    });
    setCreations((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, status: statusValue, updatedAt: new Date().toISOString() } : c
      )
    );
  };

  const addEntry = async (creationId: string, type: Entry["type"], content: string) => {
    await fetch(`/api/creations/${creationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "addEntry", type, content }),
    });
    // Re-fetch to reflect server-side status/world transitions.
    await refresh();
  };

  const deleteCreation = async (id: string) => {
    await fetch(`/api/creations/${id}`, { method: "DELETE" });
    setCreations((prev) => prev.filter((c) => c.id !== id));
  };

  const addDumpItem = async (content: string) => {
    const res = await fetch("/api/dump", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      const { item } = await res.json();
      setDumpItems((prev) => [item, ...prev]);
    }
  };

  const deleteDumpItem = async (id: string) => {
    await fetch(`/api/dump?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    setDumpItems((prev) => prev.filter((d) => d.id !== id));
  };

  const reviveDumpItem = async (id: string, title: string, worldId: string) => {
    const item = dumpItems.find((d) => d.id === id);
    const created = await addCreation(title, worldId, item?.content ?? "");
    await deleteDumpItem(id);
    return created;
  };

  const reviveDumpCreation = async (creationId: string, worldId: string) => {
    await fetch(`/api/creations/${creationId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateStatus", status: "Seed" }),
    });
    // world change happens on next entry; optimistically reflect status + world
    setCreations((prev) =>
      prev.map((c) =>
        c.id === creationId ? { ...c, worldId, status: "Seed" as CreationStatus } : c
      )
    );
    await refresh();
  };

  const unearthRandom = () => {
    const dumpedCreations = creations.filter((c) => c.worldId === "dump");
    const total = dumpItems.length + dumpedCreations.length;
    if (total === 0) return null;
    const idx = Math.floor(Math.random() * total);
    if (idx < dumpItems.length) {
      return { type: "raw" as const, item: dumpItems[idx] };
    }
    return { type: "creation" as const, item: dumpedCreations[idx - dumpItems.length] };
  };

  return (
    <StateContext.Provider
      value={{
        user,
        creations,
        dumpItems,
        isLoaded,
        refresh,
        addCreation,
        updateCreationStatus,
        addEntry,
        deleteCreation,
        addDumpItem,
        deleteDumpItem,
        reviveDumpItem,
        reviveDumpCreation,
        unearthRandom,
      }}
    >
      {children}
    </StateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(StateContext);
  if (context === undefined) {
    throw new Error("useAppState must be used within a StateProvider");
  }
  return context;
}
