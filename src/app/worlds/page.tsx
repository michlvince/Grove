"use client";

import React, { useState, useEffect } from "react";
import { useAppState, DEFAULT_WORLDS, World } from "@/context/StateContext";
import {
  Boxes,
  Palette,
  PenTool,
  Music,
  Gamepad2,
  TrendingUp,
  User,
  Trash2,
  ChevronRight,
  Shield,
  Snowflake,
  Activity,
} from "lucide-react";
import Link from "next/link";

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

export default function Worlds() {
  const { creations } = useAppState();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const getWorldHealth = (worldId: string) => {
    // Filter creations in this world
    const worldCreations = creations.filter((c) => c.worldId === worldId);

    if (worldCreations.length === 0) {
      return { status: "Empty", label: "Quiet", className: "text-muted bg-surface/40 border-border", dimmed: false };
    }

    const now = new Date();
    // Check if any creation is active (updated within 30 days)
    const hasActiveCreation = worldCreations.some((c) => {
      // Shipped creations are completed and always count as healthy/non-dormant
      if (c.status === "Shipped") return true;

      const updatedAt = new Date(c.updatedAt);
      const diffTime = Math.abs(now.getTime() - updatedAt.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 30;
    });

    if (hasActiveCreation) {
      return {
        status: "Active",
        label: "Healthy",
        className: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        dimmed: false,
      };
    } else {
      return {
        status: "Frozen",
        label: "Frozen",
        className: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        dimmed: true,
      };
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
        {/* Screen Header */}
        <div className="space-y-1 mt-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>Ecosystem Worlds</span>
          </h2>
          <p className="text-xs text-muted">
            Each idea lives in a dedicated domain. Keep them active to prevent freeze.
          </p>
        </div>

        {/* Worlds Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
          {DEFAULT_WORLDS.map((world) => {
            const worldCreations = creations.filter((c) => c.worldId === world.id);
            const health = getWorldHealth(world.id);
            const Icon = iconMap[world.icon] || Boxes;

            return (
              <Link
                key={world.id}
                href={world.id === "dump" ? "/dump" : `/world/${world.id}`}
                className={`p-4 rounded-xl transition-premium flex items-center justify-between group glass-bezel ${
                  health.dimmed
                    ? "bg-surface/20 border-border text-muted opacity-60 hover:opacity-90 hover:border-border"
                    : "glass hover:bg-surface-hover hover:border-primary/25"
                }`}
              >
                <div className="flex items-center gap-3.5">
                  {/* Icon Frame */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                      health.dimmed
                        ? "bg-background border-border text-muted"
                        : "bg-background border-border text-foreground group-hover:text-primary group-hover:border-primary/25"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Info details */}
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm group-hover:text-foreground transition-colors">
                        {world.name}
                      </span>

                      {/* Health Indicator badge */}
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 border rounded-full flex items-center gap-1 ${health.className}`}
                      >
                        {health.status === "Active" && (
                          <span className="w-1 h-1 bg-emerald-400 rounded-full animate-pulse"></span>
                        )}
                        {health.status === "Frozen" && <Snowflake className="w-2 h-2" />}
                        <span>{health.label}</span>
                      </span>
                    </div>

                    <p className="text-[11px] text-muted leading-relaxed max-w-[220px] truncate">
                      {world.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground block">
                      {worldCreations.length}
                    </span>
                    <span className="text-[9px] text-muted block uppercase tracking-wider font-semibold">
                      {worldCreations.length === 1 ? "idea" : "ideas"}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted group-hover:text-foreground transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
  );
}
