"use client";

import React, { useState } from "react";
import { useAppState, DEFAULT_WORLDS } from "@/context/StateContext";
import { X, Sparkles, Inbox, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";

interface CreateCreationModalProps {
  ideaContent: string;
  isOpen: boolean;
  onClose: () => void;
  onClearInput: () => void;
}

export default function CreateCreationModal({
  ideaContent,
  isOpen,
  onClose,
  onClearInput,
}: CreateCreationModalProps) {
  const { addCreation, addDumpItem } = useAppState();
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [worldId, setWorldId] = useState("product");

  if (!isOpen) return null;

  // Filter out 'The Dump' from target worlds when creating a new idea
  const targetWorlds = DEFAULT_WORLDS.filter((w) => w.id !== "dump");

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Create creation in the database
    const newCreation = await addCreation(title.trim(), worldId, ideaContent);
    if (!newCreation) return;

    // Reset, clear, redirect
    setTitle("");
    onClearInput();
    onClose();
    router.push(`/creation/${newCreation.id}`);
  };

  const handleSendToDump = async () => {
    await addDumpItem(ideaContent);
    onClearInput();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-fade-in">
      {/* Modal Card */}
      <div className="w-full max-w-sm bg-surface border border-border glass-bezel rounded-2xl p-5 shadow-2xl flex flex-col gap-4 animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-1.5 text-foreground font-semibold text-sm">
            <HelpCircle className="w-4 h-4 text-emerald-500" />
            <span>Plant this seed?</span>
          </div>
          <button onClick={onClose} className="text-muted hover:text-foreground transition-premium">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thought Preview */}
        <div className="bg-background border border-border p-3 rounded-xl max-h-24 overflow-y-auto">
          <p className="text-xs text-muted italic leading-relaxed">
            &ldquo;{ideaContent}&rdquo;
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleCreate} className="space-y-4">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted tracking-wider">
              Name Your Creation
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Smart Gardening App"
              className="w-full bg-background border border-border focus:border-primary/40 focus:ring-4 focus:ring-emerald-500/10 rounded-xl py-2.5 px-3 text-foreground text-xs focus:outline-none transition-premium"
              required
              autoFocus
            />
          </div>

          {/* Target World */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-muted tracking-wider">
              Choose a World
            </label>
            <select
              value={worldId}
              onChange={(e) => setWorldId(e.target.value)}
              className="w-full bg-background border border-border focus:border-primary/40 focus:ring-4 focus:ring-emerald-500/10 rounded-xl py-2.5 px-3 text-foreground text-xs focus:outline-none transition-premium appearance-none"
            >
              {targetWorlds.map((w) => (
                <option key={w.id} value={w.id} className="bg-surface">
                  {w.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="submit"
              disabled={!title.trim()}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-premium text-white rounded-xl text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none shadow-[0_4px_20px_rgba(16,185,129,0.15)]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create & Open</span>
            </button>

            <button
              type="button"
              onClick={handleSendToDump}
              className="w-full py-2.5 bg-background hover:bg-surface-hover border border-border active:scale-[0.98] transition-premium text-muted hover:text-foreground rounded-xl text-xs font-semibold tracking-wide flex items-center justify-center gap-1.5"
            >
              <Inbox className="w-3.5 h-3.5" />
              <span>Skip for now (Add to Dump)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
