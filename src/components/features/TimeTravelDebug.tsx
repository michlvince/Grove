"use client";

import React, { useState } from "react";
import { useAppState } from "@/context/StateContext";
import { Clock, Zap, Check, AlertCircle, X } from "lucide-react";

interface TimeTravelDebugProps {
  onClose: () => void;
}

export default function TimeTravelDebug({ onClose }: TimeTravelDebugProps) {
  const { creations, timeTravel } = useAppState();
  const [selectedId, setSelectedId] = useState("");
  const [days, setDays] = useState(35);
  const [successMsg, setSuccessMsg] = useState("");

  const activeCreations = creations.filter((c) => c.worldId !== "dump" && c.status !== "Shipped");

  const handleTimeTravel = (customDays?: number) => {
    if (!selectedId) return;
    const targetDays = customDays !== undefined ? customDays : days;
    timeTravel(selectedId, targetDays);

    const creation = creations.find((c) => c.id === selectedId);
    setSuccessMsg(`Backdated "${creation?.title}" by ${targetDays} days!`);

    setTimeout(() => {
      setSuccessMsg("");
      onClose();
    }, 1500);
  };

  return (
    <div className="p-4 bg-surface border-b border-border relative">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold tracking-wider uppercase">
          <Clock className="w-3.5 h-3.5" />
          <span>Ecosystem Time Travel (Debug)</span>
        </div>
        <button onClick={onClose} className="text-muted hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-[11px] text-muted mb-3 leading-relaxed">
        Select a creation and shift its last-active date back in time to test dormancy rules.
        <br />
        <span className="text-muted/80">• &gt; 30 days = Frozen (Dimmed in World View)</span>
        <br />
        <span className="text-muted/80">• &gt; 90 days = Dumped (Automatically moved to The Dump)</span>
      </p>

      {activeCreations.length === 0 ? (
        <div className="flex items-center gap-2 p-2 border border-dashed border-border rounded-lg text-xs text-muted">
          <AlertCircle className="w-4 h-4" />
          <span>No active creations available to backdate. Create one first!</span>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-muted">Select Creation</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="bg-background border border-border rounded-lg py-1.5 px-2 text-xs text-foreground focus:outline-none focus:border-primary/50"
            >
              <option value="" className="bg-surface">-- Choose creation --</option>
              {activeCreations.map((c) => (
                <option key={c.id} value={c.id} className="bg-surface">
                  {c.title} ({c.status})
                </option>
              ))}
            </select>
          </div>

          {selectedId && (
            <div className="flex flex-col gap-2 animate-fade-in">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleTimeTravel(35)}
                  className="py-2 bg-[#12221b] hover:bg-[#1a382c] border border-emerald-900/40 rounded-lg text-[11px] font-semibold text-emerald-300 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>35 Days (Freeze)</span>
                </button>
                <button
                  onClick={() => handleTimeTravel(95)}
                  className="py-2 bg-[#2d1217] hover:bg-[#471b23] border border-red-900/40 rounded-lg text-[11px] font-semibold text-red-300 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>95 Days (Dump)</span>
                </button>
              </div>

              <div className="flex items-center gap-2 border-t border-border pt-2 mt-1">
                <input
                  type="number"
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  placeholder="Custom Days"
                  className="w-16 bg-background border border-border rounded-lg py-1 px-2 text-xs text-foreground focus:outline-none focus:border-primary/50"
                />
                <button
                  onClick={() => handleTimeTravel()}
                  className="flex-1 py-1.5 bg-surface-hover hover:bg-surface text-xs text-foreground border border-border rounded-lg transition-colors font-medium"
                >
                  Shift Custom Days
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {successMsg && (
        <div className="absolute inset-0 bg-surface flex items-center justify-center gap-2 animate-scale-in">
          <div className="w-8 h-8 rounded-full bg-emerald-950 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Check className="w-4 h-4" />
          </div>
          <span className="text-xs font-medium text-foreground">{successMsg}</span>
        </div>
      )}
    </div>
  );
}
