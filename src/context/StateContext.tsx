"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

// --- TYPES ---

export type CreationStatus =
  | "Seed"
  | "Growing"
  | "Thriving"
  | "Frozen"
  | "Launching"
  | "Shipped";

export interface Entry {
  id: string;
  type: "text" | "image" | "link" | "audio";
  content: string;
  timestamp: string; // ISO string
}

export interface Creation {
  id: string;
  title: string;
  worldId: string; // matches WorldId
  originalWorldId?: string; // stores world before it was dumped
  status: CreationStatus;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string (last activity)
  entries: Entry[];
}

export interface DumpItem {
  id: string;
  content: string;
  createdAt: string; // ISO string
}

export interface UserProfile {
  name: string;
  title: string; // default "Traveler"
  joinedAt: string;
  role?: "user" | "admin";
}

export type WorldId =
  | "product"
  | "design"
  | "writing"
  | "music"
  | "games"
  | "business"
  | "personal"
  | "dump";

export interface World {
  id: WorldId;
  name: string;
  icon: string;
  description: string;
}

// --- DEFAULT WORLDS ---

export const DEFAULT_WORLDS: World[] = [
  { id: "product", name: "Product", icon: "Boxes", description: "Apps, services, physical goods, and digital creations." },
  { id: "design", name: "Design", icon: "Palette", description: "UI, layouts, branding, art, and visual concepts." },
  { id: "writing", name: "Writing", icon: "PenTool", description: "Essays, stories, documentation, scripts, and logs." },
  { id: "music", name: "Music", icon: "Music", description: "Beats, lyrics, melodies, soundscapes, and tracks." },
  { id: "games", name: "Games", icon: "Gamepad2", description: "Mechanics, levels, lore, rules, and game ideas." },
  { id: "business", name: "Business", icon: "TrendingUp", description: "Ventures, models, strategies, marketing, and monetization." },
  { id: "personal", name: "Personal", icon: "User", description: "Habits, goals, reminders, journals, and reflections." },
  { id: "dump", name: "The Dump", icon: "Trash2", description: "A fertile soil for uncategorized thoughts and sleeping ideas." },
];

interface StateContextType {
  user: UserProfile | null;
  saveUser: (name: string, title?: string, role?: "user" | "admin") => void;
  creations: Creation[];
  addCreation: (title: string, worldId: string, initialContent?: string) => Creation;
  updateCreationStatus: (id: string, status: CreationStatus) => void;
  addEntry: (creationId: string, type: "text" | "image" | "link" | "audio", content: string) => void;
  deleteCreation: (id: string) => void;
  dumpItems: DumpItem[];
  addDumpItem: (content: string) => void;
  deleteDumpItem: (id: string) => void;
  reviveDumpItem: (id: string, title: string, worldId: string) => Creation;
  reviveDumpCreation: (creationId: string, worldId: string) => void;
  unearthRandom: () => { type: "raw" | "creation"; item: DumpItem | Creation } | null;
  timeTravel: (creationId: string, daysAgo: number) => void;
  seedMockData: () => void;
  adminResetAllData: () => void;
  isLoaded: boolean;
}

const StateContext = createContext<StateContextType | undefined>(undefined);

export function StateProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [creations, setCreations] = useState<Creation[]>([]);
  const [dumpItems, setDumpItems] = useState<DumpItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load state on mount
  useEffect(() => {
    const localUser = localStorage.getItem("grove_user");
    const localCreations = localStorage.getItem("grove_creations");
    const localDump = localStorage.getItem("grove_dump_items");

    if (localUser) setUser(JSON.parse(localUser));
    if (localCreations) {
      const parsedCreations: Creation[] = JSON.parse(localCreations);
      setCreations(parsedCreations);
    }
    if (localDump) setDumpItems(JSON.parse(localDump));

    setIsLoaded(true);
  }, []);

  // Run dormancy checks when creations or time changes (runs on load and updates)
  useEffect(() => {
    if (!isLoaded) return;

    let changed = false;
    const now = new Date();

    const checkedCreations = creations.map((c) => {
      // Shipped items don't freeze or dump - they are completed
      if (c.status === "Shipped") return c;

      const updatedAt = new Date(c.updatedAt);
      const diffTime = Math.abs(now.getTime() - updatedAt.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      

      // 90 days: move to dump if not already in dump
      if (diffDays >= 90 && c.worldId !== "dump") {
        changed = true;
        return {
          ...c,
          originalWorldId: c.worldId, // save where it came from
          worldId: "dump",
          updatedAt: now.toISOString(), // reset updated to avoid immediate double process
        };
      }

      return c;
    });

    if (changed) {
      setCreations(checkedCreations);
      localStorage.setItem("grove_creations", JSON.stringify(checkedCreations));
    }
  }, [creations, isLoaded]);

  // Save state helpers
  const saveUser = (name: string, title: string = "Traveler", role: "user" | "admin" = "user") => {
    const newUser: UserProfile = {
      name,
      title: role === "admin" ? "Administrator" : title,
      joinedAt: new Date().toISOString(),
      role,
    };
    setUser(newUser);
    localStorage.setItem("grove_user", JSON.stringify(newUser));
  };

  const saveCreationsToLocalStorage = (updated: Creation[]) => {
    setCreations(updated);
    localStorage.setItem("grove_creations", JSON.stringify(updated));
  };

  const saveDumpToLocalStorage = (updated: DumpItem[]) => {
    setDumpItems(updated);
    localStorage.setItem("grove_dump_items", JSON.stringify(updated));
  };

  // --- ACTIONS ---

  const addCreation = (title: string, worldId: string, initialContent?: string) => {
    const now = new Date().toISOString();
    const newCreation: Creation = {
      id: "creation_" + Math.random().toString(36).substr(2, 9),
      title,
      worldId,
      status: "Seed",
      createdAt: now,
      updatedAt: now,
      entries: initialContent
        ? [
            {
              id: "entry_" + Math.random().toString(36).substr(2, 9),
              type: "text",
              content: initialContent,
              timestamp: now,
            },
          ]
        : [],
    };

    const updated = [newCreation, ...creations];
    saveCreationsToLocalStorage(updated);
    return newCreation;
  };

  const updateCreationStatus = (id: string, status: CreationStatus) => {
    const updated = creations.map((c) => {
      if (c.id === id) {
        return {
          ...c,
          status,
          updatedAt: new Date().toISOString(),
        };
      }
      return c;
    });
    saveCreationsToLocalStorage(updated);
  };

  const addEntry = (creationId: string, type: "text" | "image" | "link" | "audio", content: string) => {
    const now = new Date().toISOString();
    const newEntry: Entry = {
      id: "entry_" + Math.random().toString(36).substr(2, 9),
      type,
      content,
      timestamp: now,
    };

    const updated = creations.map((c) => {
      if (c.id === creationId) {
        // If it was in the dump and user adds a new entry, we restore it to its original world (or general)
        let worldId = c.worldId;
        if (worldId === "dump") {
          worldId = c.originalWorldId || "personal";
        }
        
        // Auto progress status to "Growing" if it's currently "Seed"
       let nextStatus = c.status;

if (
  c.status === "Seed" ||
  c.status === "Frozen"
) {
  nextStatus = "Growing";
}

        return {
          ...c,
          worldId,
          status: nextStatus as CreationStatus,
          updatedAt: now,
          entries: [...c.entries, newEntry],
        };
      }
      return c;
    });
    saveCreationsToLocalStorage(updated);
  };

  const deleteCreation = (id: string) => {
    const updated = creations.filter((c) => c.id !== id);
    saveCreationsToLocalStorage(updated);
  };

  const addDumpItem = (content: string) => {
    const newItem: DumpItem = {
      id: "dump_" + Math.random().toString(36).substr(2, 9),
      content,
      createdAt: new Date().toISOString(),
    };
    const updated = [newItem, ...dumpItems];
    saveDumpToLocalStorage(updated);
  };

  const deleteDumpItem = (id: string) => {
    const updated = dumpItems.filter((item) => item.id !== id);
    saveDumpToLocalStorage(updated);
  };

  const reviveDumpItem = (id: string, title: string, worldId: string) => {
    const item = dumpItems.find((d) => d.id === id);
    const content = item ? item.content : "";
    
    // Create new creation
    const newCreation = addCreation(title, worldId, content);
    
    // Remove from dump list
    deleteDumpItem(id);
    return newCreation;
  };

  const reviveDumpCreation = (creationId: string, worldId: string) => {
    const updated = creations.map((c) => {
      if (c.id === creationId) {
        return {
          ...c,
          worldId,
          updatedAt: new Date().toISOString(),
          status: "Seed" as CreationStatus, // reset to Seed
        };
      }
      return c;
    });
    saveCreationsToLocalStorage(updated);
  };

  const unearthRandom = (): { type: "raw" | "creation"; item: DumpItem | Creation } | null => {
    const totalItems = dumpItems.length;
    const dumpedCreations = creations.filter((c) => c.worldId === "dump");
    const totalCreations = dumpedCreations.length;
    const total = totalItems + totalCreations;

    if (total === 0) return null;

    const randomIndex = Math.floor(Math.random() * total);

    if (randomIndex < totalItems) {
      return { type: "raw" as const, item: dumpItems[randomIndex] };
    } else {
      return { type: "creation" as const, item: dumpedCreations[randomIndex - totalItems] };
    }
  };

  // Time travel function to mock the date for dormancy testing
  const timeTravel = (creationId: string, daysAgo: number) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    const updated = creations.map((c) => {
      if (c.id === creationId) {
        return {
          ...c,
          updatedAt: date.toISOString(),
        };
      }
      return c;
    });
    
    // Update local state directly so it recalculates instantly
    setCreations(updated);
    localStorage.setItem("grove_creations", JSON.stringify(updated));
  };

  const seedMockData = () => {
    const now = new Date();
    const makeId = (prefix: string) => prefix + "_" + Math.random().toString(36).substr(2, 9);
    
    const mockCreations: Creation[] = [
      {
        id: makeId("creation"),
        title: "Grove Creative Dashboard",
        worldId: "product",
        status: "Growing",
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        entries: [
          {
            id: makeId("entry"),
            type: "text",
            content: "Initial idea: Create a virtual garden for tracking half-baked thoughts and creations, with worlds representing categories.",
            timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: makeId("entry"),
            type: "text",
            content: "Added local storage persistence and built the side panel navigation layout.",
            timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      },
      {
        id: makeId("creation"),
        title: "Ethereal Glass Design Tokens",
        worldId: "design",
        status: "Thriving",
        createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 12 * 60 * 60 * 1000).toISOString(),
        entries: [
          {
            id: makeId("entry"),
            type: "text",
            content: "Exploring frosted borders, dark background glows, and emerald themes for premium aesthetic feel.",
            timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      },
      {
        id: makeId("creation"),
        title: "Ecosystem Simulator Engine",
        worldId: "games",
        status: "Seed",
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        entries: [
          {
            id: makeId("entry"),
            type: "text",
            content: "A text-based simulation where creations grow organically like trees based on writing frequency.",
            timestamp: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      },
      {
        id: makeId("creation"),
        title: "Daily Habit Reflections",
        worldId: "personal",
        status: "Frozen",
        createdAt: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString(),
        entries: [
          {
            id: makeId("entry"),
            type: "text",
            content: "Reflecting on creative output and consistency. Need to build a routine around small captures.",
            timestamp: new Date(now.getTime() - 40 * 24 * 60 * 60 * 1000).toISOString()
          }
        ]
      }
    ];

    const mockDumpItems: DumpItem[] = [
      {
        id: makeId("dump"),
        content: "Random thought: What if music playlists had seasonal decay where songs fade unless re-listened?",
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: makeId("dump"),
        content: "SaaS idea: A newsletter platform where subscribers can vote on the next article topic directly from the email client.",
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    saveCreationsToLocalStorage(mockCreations);
    saveDumpToLocalStorage(mockDumpItems);
  };

  const adminResetAllData = () => {
    setUser(null);
    setCreations([]);
    setDumpItems([]);
    localStorage.removeItem("grove_user");
    localStorage.removeItem("grove_creations");
    localStorage.removeItem("grove_dump_items");
    localStorage.removeItem("grove_notifications_enabled");
    localStorage.removeItem("grove_notifications_interval");
  };

  return (
    <StateContext.Provider
      value={{
        user,
        saveUser,
        creations,
        addCreation,
        updateCreationStatus,
        addEntry,
        deleteCreation,
        dumpItems,
        addDumpItem,
        deleteDumpItem,
        reviveDumpItem,
        reviveDumpCreation,
        unearthRandom,
        timeTravel,
        seedMockData,
        adminResetAllData,
        isLoaded,
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
