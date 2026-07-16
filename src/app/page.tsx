"use client";

import React, { useEffect, useState } from "react";
import CaptureCard from "@/components/features/CaptureCard";
import { useAppState, Creation, DEFAULT_WORLDS } from "@/context/StateContext";
import { Sparkles, Calendar, ArrowRight, Zap, RefreshCw, Archive, Clock, TrendingUp, Layers } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";


export default function Home() {
  const { user, creations, dumpItems } = useAppState();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    setMounted(true);

    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting("Good Morning");
    } else if (hour >= 12 && hour < 17) {
      setGreeting("Good Afternoon");
    } else {
      setGreeting("Good Evening");
    }
  }, []);

  if (!mounted) {
    return null;
  }

  // Filter out creations that are Shipped or in the Dump
  const activeCreations = creations.filter(
    (c) => c.worldId !== "dump" && c.status !== "Shipped"
  );

  // Continue Building: Sort by updatedAt desc, take top 3
  const continueBuildingList = [...activeCreations]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  // Today's Revival: Find the oldest active creation
  let revivalTarget: { type: "creation" | "dump"; item: Creation | any } | null = null;

  if (activeCreations.length > 0) {
    const oldestCreation = [...activeCreations].sort(
      (a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    )[0];
    revivalTarget = { type: "creation", item: oldestCreation };
  } else if (dumpItems.length > 0) {
    revivalTarget = { type: "dump", item: dumpItems[dumpItems.length - 1] };
  }

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
      if (diffDays < 7) return `${diffDays}d ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
      return `${Math.floor(diffDays / 30)}mo ago`;
    } catch (e) {
      return "recently";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Seed":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
      case "Growing":
        return "bg-emerald-400/10 text-emerald-300 border-emerald-400/20";
      case "Thriving":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "Launching":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "Frozen":
        return "bg-blue-400/10 text-blue-300 border-blue-400/20";
      default:
        return "bg-surface text-muted border-border";
    }
  };

  const getStatusEmoji = (status: string) => {
    switch (status) {
      case "Seed": return "🌱";
      case "Growing": return "🌿";
      case "Thriving": return "🌳";
      case "Launching": return "🚀";
      case "Frozen": return "❄️";
      default: return "✨";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--background)] via-[var(--surface)] to-[var(--surface-hover)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Greeting & Capture Card */}
          <div className="lg:col-span-5 space-y-8 lg:sticky lg:top-8">
            {/* Grove Greeting */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full" />
                <p className="text-[11px] uppercase tracking-[0.3em] text-emerald-400/80 font-medium">
                  Creative Ecosystem
                </p>
              </div>

              <div className="space-y-2">
                <h1 className="text-[44px] md:text-[52px] leading-[1.05] tracking-[-0.04em] font-medium text-foreground">
                  {greeting},
                  <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-emerald-400 to-emerald-300">
                    {user?.name?.split(" ")[0] || ""}
                  </span>
                  <span className="text-foreground/40 ml-2">👋</span>
                </h1>

                <p className="max-w-sm text-[15px] leading-relaxed text-foreground/60 font-light">
                  Continue nurturing your ideas.
                  <br />
                  Every seed deserves a chance to grow.
                </p>
              </div>
            </div>

            {/* Grove Core - Orb Button */}
            <div className="flex justify-center py-6">
              <button 
                className="group relative w-40 h-40 rounded-full animate-orbBreathe transition-transform hover:scale-105 active:scale-95"
                onClick={() => {
                  router.push("/worlds");
                }}
              >
                {/* Outer Glow */}
                <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-3xl animate-pulse" />
                
                {/* Secondary Glow */}
                <div className="absolute inset-2 rounded-full bg-emerald-400/10 blur-2xl animate-pulse delay-700" />

                {/* Orb */}
                <div className="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-[var(--orb-1)] via-[var(--orb-2)] to-[var(--orb-3)] shadow-2xl shadow-emerald-500/5" style={{ border: "1px solid var(--orb-ring)" }}>
                  {/* Animated particles */}
                  <div className="absolute top-6 left-6 w-10 h-10 rounded-full bg-emerald-400/20 blur-2xl animate-ping-slow" />
                  <div className="absolute bottom-8 right-8 w-8 h-8 rounded-full bg-emerald-300/20 blur-xl animate-pulse-slow" />
                  <div className="absolute top-1/2 right-4 w-5 h-5 rounded-full blur-md animate-pulse" style={{ background: "var(--orb-particle)" }} />

                  {/* Glass highlight */}
                  <div className="absolute top-2 left-5 w-24 h-12 rounded-full blur-xl rotate-[-20deg]" style={{ background: "var(--orb-sheen)" }} />

                  {/* Inner border */}
                  <div className="absolute inset-4 rounded-full" style={{ border: "1px solid var(--orb-ring)" }} />

                  {/* Core Icon */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="relative">
                      <Sparkles
                        className="w-10 h-10 text-emerald-400 animate-pulse-slow"
                        strokeWidth={1.5}
                      />
                      <div className="absolute inset-0 blur-2xl bg-emerald-400/20 rounded-full scale-150" />
                    </div>
                  </div>
                </div>

                {/* Tooltip */}
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="text-[10px] text-muted whitespace-nowrap">
                    Explore your worlds ✨
                  </span>
                </div>
              </button>
            </div>

            <CaptureCard />
          </div>

          {/* Right Column: Revival & Main Content */}
          <div className="lg:col-span-7 space-y-10">
            {/* Today's Revival Section */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400/60" />
                <h3 className="text-[11px] font-bold text-muted uppercase tracking-[0.2em]">
                  Today's Revival
                </h3>
              </div>

              {revivalTarget ? (
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 via-emerald-400/10 to-emerald-500/20 rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <div className="relative p-5 bg-gradient-to-br from-surface to-background backdrop-blur-xl rounded-2xl border border-emerald-500/10 hover:border-emerald-500/20 transition-all duration-300">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <Zap className="w-3.5 h-3.5 text-emerald-400" />
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">
                            Frozen Creation
                          </span>
                        </div>
                        <span className="text-[10px] text-muted/80 font-mono">
                          {revivalTarget.type === "creation"
                            ? `Last active ${getRelativeTime(revivalTarget.item.updatedAt)}`
                            : "From the Dump"}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-base font-semibold text-foreground group-hover:text-emerald-300 transition-colors duration-300">
                          {revivalTarget.type === "creation"
                            ? revivalTarget.item.title
                            : "Unprocessed Spark"}
                        </h4>
                        <p className="text-sm text-muted leading-relaxed line-clamp-2 font-light">
                          {revivalTarget.type === "creation"
                            ? revivalTarget.item.entries[revivalTarget.item.entries.length - 1]?.content || "No entries yet."
                            : revivalTarget.item.content}
                        </p>
                      </div>

                      <div className="flex justify-end pt-1">
                        {revivalTarget.type === "creation" ? (
                          <Link
                            href={`/creation/${revivalTarget.item.id}`}
                            className="group/btn inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl text-xs font-medium text-emerald-400 transition-all duration-300"
                          >
                            <span>Tend to creation</span>
                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                          </Link>
                        ) : (
                          <Link
                            href="/dump"
                            className="group/btn inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 hover:border-emerald-500/40 rounded-xl text-xs font-medium text-emerald-400 transition-all duration-300"
                          >
                            <span>Unearth in Dump</span>
                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-0.5" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 border border-dashed border-border rounded-2xl text-center space-y-3 bg-surface">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500/5 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-muted/60" />
                  </div>
                  <p className="text-sm text-muted">Your ecosystem is thriving.</p>
                  <p className="text-xs text-muted/80 font-light">
                    Nothing needs attention right now. Keep building.
                  </p>
                </div>
              )}
            </section>

            {/* Continue Building Section */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400/60" />
                  <h3 className="text-[11px] font-bold text-muted uppercase tracking-[0.2em]">
                    Continue Building
                  </h3>
                </div>
                {activeCreations.length > 3 && (
                  <Link 
                    href="/worlds" 
                    className="text-xs text-muted hover:text-emerald-400 transition-colors duration-300 font-medium"
                  >
                    View all →
                  </Link>
                )}
              </div>

              {continueBuildingList.length > 0 ? (
                <div className="space-y-3">
                  {continueBuildingList.map((c, index) => {
                    const world = DEFAULT_WORLDS.find((w) => w.id === c.worldId);
                    const lastEntry = c.entries[c.entries.length - 1];

                    return (
                      <Link
                        key={c.id}
                        href={`/creation/${c.id}`}
                        className="group block"
                      >
                        <div className="p-5 bg-gradient-to-br from-surface to-background backdrop-blur-xl rounded-xl border border-border hover:border-emerald-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/5 hover:-translate-y-0.5 active:scale-[0.98]">
                          <div className="space-y-3">
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-medium text-muted/80 uppercase tracking-wider">
                                    {world?.name || "Uncategorized"}
                                  </span>
                                  <span className="w-1 h-1 rounded-full bg-muted/10" />
                                  <span className="text-[10px] text-muted/60">
                                    {c.entries.length} {c.entries.length === 1 ? "entry" : "entries"}
                                  </span>
                                </div>
                                <h4 className="text-sm font-semibold text-foreground group-hover:text-emerald-300 transition-colors duration-300">
                                  {c.title}
                                </h4>
                              </div>

                              <span className={`text-[10px] font-medium px-2.5 py-1 border rounded-full flex items-center gap-1 ${getStatusColor(c.status)}`}>
                                <span>{getStatusEmoji(c.status)}</span>
                                <span>{c.status}</span>
                              </span>
                            </div>

                            {lastEntry && (
                              <p className="text-sm text-muted line-clamp-1 font-light">
                                {lastEntry.content}
                              </p>
                            )}

                            <div className="flex items-center justify-between pt-1 text-[10px] text-muted/60">
                              <span className="flex items-center gap-1">
                                <Layers className="w-3 h-3" />
                                Updated {getRelativeTime(c.updatedAt)}
                              </span>
                              <span className="group-hover:text-emerald-400/60 transition-colors duration-300">
                                Continue →
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="p-8 border border-dashed border-border rounded-2xl text-center space-y-3 bg-surface">
                  <div className="w-12 h-12 mx-auto rounded-full bg-surface flex items-center justify-center">
                    <Archive className="w-6 h-6 text-muted/60" />
                  </div>
                  <p className="text-sm text-muted">No creations yet.</p>
                  <p className="text-xs text-muted/80 font-light">
                    Capture your first idea to begin growing your Grove.
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

