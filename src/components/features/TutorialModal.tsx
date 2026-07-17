"use client";

import React, { useState } from "react";
import Link from "next/link";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { TUTORIAL_STEPS } from "@/lib/tutorial";

export default function TutorialModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const isLast = step === TUTORIAL_STEPS.length - 1;
  const current = TUTORIAL_STEPS[step];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-surface border border-border glass-bezel rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500">
            Getting started · {step + 1}/{TUTORIAL_STEPS.length}
          </span>
          <button onClick={onClose} className="text-muted hover:text-foreground transition-premium">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
            <Icon className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-foreground">{current.title}</h3>
            <p className="text-sm text-muted leading-relaxed">{current.body}</p>
          </div>
          <ul className="space-y-2">
            {current.points.map((p, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-foreground/90">
                <Check className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                <span className="leading-relaxed">{p}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-1.5 pb-2">
          {TUTORIAL_STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-5 bg-emerald-500" : "w-1.5 bg-border"
              }`}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-border">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="py-2 px-3 rounded-xl border border-border text-xs text-muted hover:text-foreground disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 transition-premium"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>

          <div className="flex items-center gap-2">
            <Link
              href="/help"
              onClick={onClose}
              className="text-xs text-muted hover:text-emerald-400 transition-colors"
            >
              Full guide
            </Link>
            {isLast ? (
              <button
                onClick={onClose}
                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-premium active:scale-[0.97]"
              >
                Start creating <Check className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => setStep((s) => Math.min(TUTORIAL_STEPS.length - 1, s + 1))}
                className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-premium active:scale-[0.97]"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
