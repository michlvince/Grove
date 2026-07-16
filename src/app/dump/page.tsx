"use client";

import React, { useState, useEffect } from "react";
import { useAppState, DumpItem, Creation, DEFAULT_WORLDS } from "@/context/StateContext";
import {
  Compass,
  Trash2,
  Sparkles,
  Inbox,
  Calendar,
  AlertCircle,
  Play,
  RotateCcw,
} from "lucide-react";
import UnearthModal from "@/components/features/UnearthModal";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function TheDump() {
  const { dumpItems, creations, deleteDumpItem, deleteCreation, reviveDumpCreation, reviveDumpItem } = useAppState();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"raw" | "creations">("raw");
  const [isUnearthOpen, setIsUnearthOpen] = useState(false);
  
  // Specific item manual revival state
  const [revivingItemId, setRevivingItemId] = useState<string | null>(null);
  const [revivingCreationId, setRevivingCreationId] = useState<string | null>(null);
  const [targetWorldId, setTargetWorldId] = useState("product");
  const [reviveTitle, setReviveTitle] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const dumpedCreations = creations.filter((c) => c.worldId === "dump");
  const targetWorlds = DEFAULT_WORLDS.filter((w) => w.id !== "dump");

  const handleManualReviveItem = (id: string, initialContent: string) => {
    if (!reviveTitle.trim()) return;
    const newCreation = reviveDumpItem(id, reviveTitle.trim(), targetWorldId);
    setRevivingItemId(null);
    setReviveTitle("");
    router.push(`/creation/${newCreation.id}`);
  };

  const handleManualReviveCreation = (id: string) => {
    reviveDumpCreation(id, targetWorldId);
    setRevivingCreationId(null);
    router.push(`/creation/${id}`);
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (e) {
      return "sometime";
    }
  };

  return (
    <div className="space-y-5 animate-fade-in pb-8">
        {/* Screen Header */}
        <div className="space-y-1 mt-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <span>The Dump</span>
          </h2>
          <p className="text-xs text-muted">
            A fertile compost of sleeping projects and quick thoughts waiting to be unearthed.
          </p>
        </div>

        {/* Unearth Trigger Button */}
        <button
          onClick={() => setIsUnearthOpen(true)}
          className="w-full py-5 bg-gradient-to-r from-emerald-950/60 via-[#12241f] to-emerald-950/60 hover:from-emerald-900/60 hover:to-emerald-900/60 active:scale-[0.99] transition-all border border-emerald-500/25 rounded-2xl flex flex-col items-center justify-center gap-2 shadow-lg glow-emerald"
        >
          <span className="text-2xl animate-bounce">🎲</span>
          <span className="text-xs font-bold tracking-wider text-emerald-400 uppercase">
            Unearth Something
          </span>
          <span className="text-[10px] text-emerald-300 font-medium">
            Randomly select an idea to revive or skip
          </span>
        </button>

        {/* Tab Navigation */}
        <div className="flex bg-background p-1 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab("raw")}
            className={`flex-1 py-2 text-center text-xs font-medium rounded-lg transition-all ${
              activeTab === "raw"
                ? "bg-surface text-foreground border border-border"
                : "text-muted hover:text-foreground"
            }`}
          >
            Raw Sparks ({dumpItems.length})
          </button>
          <button
            onClick={() => setActiveTab("creations")}
            className={`flex-1 py-2 text-center text-xs font-medium rounded-lg transition-all ${
              activeTab === "creations"
                ? "bg-surface text-foreground border border-border"
                : "text-muted hover:text-foreground"
            }`}
          >
            Sleeping Creations ({dumpedCreations.length})
          </button>
        </div>

        {/* Tab Contents */}
        {activeTab === "raw" ? (
          <div className="space-y-3">
            {dumpItems.length > 0 ? (
              dumpItems.map((item) => (
                <div
                  key={item.id}
                  className="p-4 bg-surface/50 border border-border rounded-2xl space-y-3 animate-fade-in relative group"
                >
                  <p className="text-xs text-foreground italic leading-relaxed break-words">
                    &ldquo;{item.content}&rdquo;
                  </p>

                  <div className="flex items-center justify-between border-t border-border pt-2.5 text-[10px] text-muted font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDate(item.createdAt)}</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setRevivingItemId(item.id);
                          setReviveTitle(item.content.slice(0, 20) + (item.content.length > 20 ? "..." : ""));
                        }}
                        className="text-emerald-500 hover:text-emerald-400 px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20 transition-colors text-[10px] font-semibold"
                      >
                        Revive
                      </button>
                      <button
                        onClick={() => deleteDumpItem(item.id)}
                        className="text-muted hover:text-red-400 p-1"
                        title="Discard permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Manual inline revive sub-form */}
                  {revivingItemId === item.id && (
                    <div className="mt-3 p-3 bg-surface border border-border rounded-xl space-y-3 animate-scale-in">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-muted">Creation Title</label>
                        <input
                          type="text"
                          value={reviveTitle}
                          onChange={(e) => setReviveTitle(e.target.value)}
                          className="w-full bg-background border border-border rounded-lg py-1 px-2 text-xs text-foreground focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-muted">Assign World</label>
                        <select
                          value={targetWorldId}
                          onChange={(e) => setTargetWorldId(e.target.value)}
                          className="w-full bg-background border border-border rounded-lg py-1 px-2 text-xs text-foreground focus:outline-none"
                        >
                          {targetWorlds.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setRevivingItemId(null)}
                          className="w-1/3 py-1 bg-background border border-border text-[10px] text-muted rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleManualReviveItem(item.id, item.content)}
                          className="flex-1 py-1 bg-emerald-600 text-[10px] text-white font-semibold rounded-lg"
                        >
                          Plant Seed
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="border border-dashed border-border rounded-2xl py-12 text-center space-y-3">
                <Inbox className="w-8 h-8 text-muted mx-auto" />
                <p className="text-xs text-muted">No raw thoughts currently dumped.</p>
                <p className="text-[10px] text-muted max-w-[220px] mx-auto leading-relaxed">
                  When you capture an idea on the Home screen and choose not to categorize it, it stays here.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {dumpedCreations.length > 0 ? (
              dumpedCreations.map((c) => (
                <div
                  key={c.id}
                  className="p-4 bg-surface/50 border border-border rounded-2xl space-y-3 animate-fade-in relative group"
                >
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{c.title}</h4>
                    <p className="text-[11px] text-muted italic mt-1 line-clamp-1">
                      {c.entries[0]?.content || "No text entries."}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-border pt-2.5 text-[10px] text-muted font-medium">
                    <span>{c.entries.length} entries stored</span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setRevivingCreationId(c.id);
                          setTargetWorldId(c.originalWorldId || "personal");
                        }}
                        className="text-emerald-500 hover:text-emerald-400 px-2 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20 transition-colors text-[10px] font-semibold"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => deleteCreation(c.id)}
                        className="text-muted hover:text-red-400 p-1"
                        title="Delete permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Manual inline revive creation sub-form */}
                  {revivingCreationId === c.id && (
                    <div className="mt-3 p-3 bg-surface border border-border rounded-xl space-y-3 animate-scale-in">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-bold text-muted">Restore to World</label>
                        <select
                          value={targetWorldId}
                          onChange={(e) => setTargetWorldId(e.target.value)}
                          className="w-full bg-background border border-border rounded-lg py-1.5 px-2 text-xs text-foreground focus:outline-none"
                        >
                          {targetWorlds.map((w) => (
                            <option key={w.id} value={w.id}>
                              {w.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setRevivingCreationId(null)}
                          className="w-1/3 py-1 bg-background border border-border text-[10px] text-muted rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleManualReviveCreation(c.id)}
                          className="flex-1 py-1 bg-emerald-600 text-[10px] text-white font-semibold rounded-lg"
                        >
                          Restore Creation
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="border border-dashed border-border rounded-2xl py-12 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-muted mx-auto" />
                <p className="text-xs text-muted">No creations are sleeping.</p>
                <p className="text-[10px] text-muted max-w-[220px] mx-auto leading-relaxed">
                  Creations with more than 90 days of inactivity automatically fall asleep and migrate to The Dump to fertilize future thoughts.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Unearth Modal Overlay */}
        <UnearthModal isOpen={isUnearthOpen} onClose={() => setIsUnearthOpen(false)} />
      </div>
  );
}
