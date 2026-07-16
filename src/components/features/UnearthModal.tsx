"use client";

import React, { useState, useEffect } from "react";
import { useAppState, DEFAULT_WORLDS, Creation, DumpItem } from "@/context/StateContext";
import { X, Sparkles, AlertCircle, RefreshCw, Undo, Compass } from "lucide-react";
import { useRouter } from "next/navigation";

interface UnearthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UnearthModal({ isOpen, onClose }: UnearthModalProps) {
  const { unearthRandom, reviveDumpItem, reviveDumpCreation, dumpItems, creations } = useAppState();
  const router = useRouter();

  const [activeItem, setActiveItem] = useState<{
    type: "raw" | "creation";
    item: DumpItem | Creation;
  } | null>(null);

  const [showReviveForm, setShowReviveForm] = useState(false);
  const [title, setTitle] = useState("");
  const [worldId, setWorldId] = useState("product");

  // Load a random item on open
  useEffect(() => {
    if (isOpen) {
      handleNext();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    setShowReviveForm(false);
    setTitle("");
    const random = unearthRandom();
    setActiveItem(random);
    
    // If it's a creation, prefill the world
    if (random && random.type === "creation") {
      const creation = random.item as Creation;
      setWorldId(creation.originalWorldId || "personal");
      setTitle(creation.title);
    }
  };

  const handleReviveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return;

    if (activeItem.type === "raw") {
      if (!title.trim()) return;
      const newCreation = reviveDumpItem(activeItem.item.id, title.trim(), worldId);
      onClose();
      router.push(`/creation/${newCreation.id}`);
    } else {
      // Creation
      reviveDumpCreation(activeItem.item.id, worldId);
      onClose();
      router.push(`/creation/${activeItem.item.id}`);
    }
  };

  const targetWorlds = DEFAULT_WORLDS.filter((w) => w.id !== "dump");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-sm bg-surface border border-border rounded-2xl p-5 shadow-2xl flex flex-col gap-4 animate-scale-in relative overflow-hidden">
        {/* Sparkles glow in background */}
        <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-1.5 text-foreground font-semibold text-sm">
            <Compass className="w-4 h-4 text-emerald-400" />
            <span>Unearth Something</span>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        {!activeItem ? (
          <div className="py-8 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-muted mx-auto" />
            <p className="text-sm text-muted">The Dump is currently empty.</p>
            <p className="text-xs text-muted">Uncategorized ideas or sleeping creations will appear here.</p>
            <button
              onClick={onClose}
              className="mt-2 px-4 py-1.5 bg-background hover:bg-surface-hover text-foreground border border-border rounded-lg transition-all"
            >
              Close
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* The Unearthed Box */}
            <div className="space-y-2">
              <span className="text-[10px] tracking-widest font-bold uppercase py-0.5 px-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full inline-block">
                {activeItem.type === "raw" ? "Raw Idea" : "Sleeping Creation"}
              </span>

              <div className="bg-background border border-border p-4 rounded-xl max-h-[140px] overflow-y-auto no-scrollbar shadow-inner">
                {activeItem.type === "raw" ? (
                  <p className="text-sm text-foreground italic leading-relaxed">
                    &ldquo;{(activeItem.item as DumpItem).content}&rdquo;
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-semibold text-foreground">
                      {(activeItem.item as Creation).title}
                    </h4>
                    <p className="text-xs text-muted leading-relaxed italic">
                      {(activeItem.item as Creation).entries[0]?.content || "No entries found."}
                    </p>
                    <span className="text-[10px] text-muted block">
                      Inactive for 90+ days
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Revive Form Toggle Section */}
            {showReviveForm ? (
              <form onSubmit={handleReviveSubmit} className="space-y-3 p-3 bg-background/40 border border-border rounded-xl animate-fade-in">
                {activeItem.type === "raw" && (
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-muted">
                      Creation Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Give it a title..."
                      className="w-full bg-background border border-border rounded-lg py-1.5 px-2 text-xs text-foreground focus:outline-none focus:border-primary/50"
                      required
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[9px] uppercase font-bold text-muted">
                    Assign World
                  </label>
                  <select
                    value={worldId}
                    onChange={(e) => setWorldId(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg py-1.5 px-2 text-xs text-foreground focus:outline-none focus:border-primary/50"
                  >
                    {targetWorlds.map((w) => (
                      <option key={w.id} value={w.id} className="bg-surface text-foreground">
                        {w.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowReviveForm(false)}
                    className="w-1/3 py-1.5 bg-background border border-border hover:bg-surface-hover text-[10px] text-muted rounded-lg"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-[10px] text-white font-semibold rounded-lg flex items-center justify-center gap-1 shadow-md shadow-emerald-950/20"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Bring to Life</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setShowReviveForm(true)}
                    className="py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-all text-white rounded-xl text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5 shadow-md shadow-emerald-950/20"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Revive Idea</span>
                  </button>
                  <button
                    onClick={handleNext}
                    className="py-2.5 bg-background hover:bg-surface-hover border border-border active:scale-[0.98] transition-all text-muted hover:text-foreground rounded-xl text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Skip Idea</span>
                  </button>
                </div>
                <button
                  onClick={onClose}
                  className="w-full py-1.5 text-center text-[11px] text-muted hover:text-foreground transition-colors"
                >
                  Return to Ecosystem
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
