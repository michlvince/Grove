"use client";

import React from "react";
import Link from "next/link";
import { TUTORIAL_STEPS } from "@/lib/tutorial";
import { BookOpen, ArrowLeft } from "lucide-react";

export default function HelpPage() {
  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="space-y-1 mt-2">
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-500" />
          <h2 className="text-xl font-bold tracking-tight text-foreground">How to use Grove</h2>
        </div>
        <p className="text-xs text-muted">
          A quick walkthrough of everything you can do once you&apos;re signed in.
        </p>
      </div>

      <div className="grid gap-4">
        {TUTORIAL_STEPS.map((step, i) => {
          const Icon = step.icon;
          return (
            <div
              key={i}
              className="p-5 rounded-2xl border border-border bg-surface glass-bezel flex gap-4"
            >
              <div className="w-11 h-11 shrink-0 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
                <Icon className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-emerald-500">STEP {i + 1}</span>
                  <h3 className="text-sm font-bold text-foreground">{step.title}</h3>
                </div>
                <p className="text-xs text-muted leading-relaxed">{step.body}</p>
                <ul className="space-y-1.5 pt-1">
                  {step.points.map((p, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-foreground/90">
                      <span className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span className="leading-relaxed">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 space-y-2">
        <h3 className="text-sm font-bold text-foreground">Tips</h3>
        <ul className="space-y-1.5 text-xs text-muted">
          <li>• Your data is tied to your account and syncs wherever you sign in.</li>
          <li>• Install Grove to your home screen (via your browser&apos;s &ldquo;Add to Home Screen&rdquo;) for an app-like experience.</li>
          <li>• Allow notifications to get reminders even when Grove is closed.</li>
        </ul>
      </div>

      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-emerald-400 transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to your ecosystem
      </Link>
    </div>
  );
}
