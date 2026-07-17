"use client";

import React, { use, useState, useEffect } from "react";
import { useAppState, DEFAULT_WORLDS, Creation } from "@/context/StateContext";
import {
  Boxes,
  Palette,
  PenTool,
  Music,
  Gamepad2,
  TrendingUp,
  User,
  Trash2,
  ArrowLeft,
  Plus,
  Compass,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Map lucide icons
const iconMap: Record<string, React.ComponentType<any>> = {
  Boxes,
  Palette,
  PenTool,
  Music,
  Gamepad2,
  TrendingUp,
  User,
  Trash2,
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function WorldDetails({ params }: PageProps) {
  const resolvedParams = use(params);
  const worldId = resolvedParams.id;
  const router = useRouter();

  const { creations, addCreation } = useAppState();
  const [mounted, setMounted] = useState(false);
  const [quickTitle, setQuickTitle] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const world = DEFAULT_WORLDS.find((w) => w.id === worldId);

  if (!world || worldId === "dump") {
    return (
      <div className="py-8 text-center space-y-4">
        <p className="text-sm text-slate-400">World not found in this ecosystem.</p>
        <Link
          href="/worlds"
          className="px-4 py-2 bg-surface border border-border text-xs text-muted rounded-xl"
        >
          Back to Worlds
        </Link>
      </div>
    );
  }

  const worldCreations = creations.filter((c) => c.worldId === worldId);
  const Icon = iconMap[world.icon] || Boxes;

  const handleQuickPlant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    // Add creation directly to this world
    const newCreation = await addCreation(quickTitle.trim(), worldId);
    setQuickTitle("");
    if (!newCreation) return;

    // Redirect to the new creation detail page
    router.push(`/creation/${newCreation.id}`);
  };

  const getRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return "yesterday";
      return `${diffDays}d ago`;
    } catch (e) {
      return "recently";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Seed":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "Growing":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "Thriving":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "Launching":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "Shipped":
        return "bg-surface text-muted border-border";
      default:
        return "bg-surface text-muted border-border";
    }
  };

  return (
    <div className="space-y-5 animate-fade-in pb-8">
        {/* Navigation / Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/worlds"
            className="p-2 bg-surface border border-border text-muted hover:text-foreground rounded-full transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-foreground">{world.name}</h2>
          </div>
        </div>

        {/* World Bio Card */}
        <div className="glass rounded-xl p-5 space-y-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-[#7FE08A]/5 rounded-full blur-xl pointer-events-none"></div>
          <p className="text-xs text-muted leading-relaxed">{world.description}</p>
          <span className="text-[10px] text-muted font-medium block">
            Contains {worldCreations.length} active {worldCreations.length === 1 ? "creation" : "creations"}
          </span>
        </div>

        {/* Quick Plant Input */}
        <form
          onSubmit={handleQuickPlant}
          className="glass glass-bezel rounded-xl p-2 flex gap-2"
        >
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder={`Plant a new seed in ${world.name}...`}
            className="flex-1 bg-background border border-border focus:border-primary/40 focus:ring-4 focus:ring-emerald-500/10 rounded-lg py-2 px-3.5 text-foreground text-xs focus:outline-none transition-premium"
          />
          <button
            type="submit"
            disabled={!quickTitle.trim()}
            className="p-2.5 bg-primary hover:bg-[#7FE08A]/90 hover:scale-[1.02] active:scale-95 disabled:opacity-40 disabled:pointer-events-none text-[#0F1115] rounded-lg flex items-center justify-center transition-premium shadow-md shadow-emerald-950/20"
          >
            <Plus className="w-4 h-4" />
          </button>
        </form>

        {/* Creations List */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-foreground/80">
            Growing Here
          </h3>

          {worldCreations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {worldCreations.map((c) => {
                const lastEntry = c.entries[c.entries.length - 1];

                return (
                  <Link
                    key={c.id}
                    href={`/creation/${c.id}`}
                    className="p-4 glass glass-bezel hover:bg-surface-hover hover:border-primary/25 rounded-xl transition-premium hover:-translate-y-0.5 active:scale-[0.98] flex flex-col gap-2 group shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {c.title}
                      </h4>
                      <span className={`text-[9px] font-semibold px-2 py-0.5 border rounded-full ${getStatusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </div>

                    <p className="text-xs text-muted truncate leading-relaxed">
                      {lastEntry ? lastEntry.content : "Empty creation timeline."}
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[10px] text-muted">
                      <span>{c.entries.length} {c.entries.length === 1 ? "entry" : "entries"}</span>
                      <span>Active {getRelativeTime(c.updatedAt)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="border border-dashed border-border rounded-2xl py-12 text-center space-y-3">
              <Compass className="w-8 h-8 text-muted mx-auto" />
              <p className="text-xs text-muted">No creations in this world yet.</p>
              <p className="text-[10px] text-muted max-w-[200px] mx-auto leading-relaxed">
                Use the Quick Plant bar above to start seeding this world.
              </p>
            </div>
          )}
        </div>
      </div>
  );
}
