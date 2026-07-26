"use client";

import React, { useEffect, useState } from "react";
import { DEFAULT_WORLDS } from "@/lib/worlds";
import type { FeedItem } from "@/types/collaboration";
import { Heart, MessageSquare, Users, Sparkles, Globe, User, RefreshCw, Send, Lock } from "lucide-react";
import Link from "next/link";

export default function FeedPage() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [selectedWorld, setSelectedWorld] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // Active comments modal state
  const [activeItem, setActiveItem] = useState<FeedItem | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchFeed = async () => {
    setLoading(true);
    const url = `/api/feed${selectedWorld !== "all" ? `?worldId=${selectedWorld}` : ""}`;
    const res = await fetch(url, { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      setItems(data.items ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchFeed();
  }, [selectedWorld]);

  const toggleLike = async (itemId: string) => {
    // Optimistic UI update
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return {
            ...item,
            hasLiked: !item.hasLiked,
            likesCount: item.hasLiked ? item.likesCount - 1 : item.likesCount + 1,
          };
        }
        return item;
      })
    );

    await fetch("/api/feed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "like", creationId: itemId }),
    });
  };

  const openComments = async (item: FeedItem) => {
    setActiveItem(item);
    setComments([]);
    // Fetch creation entries / comments if needed
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem || !newComment.trim()) return;

    setSubmittingComment(true);
    const res = await fetch("/api/feed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "comment",
        creationId: activeItem.id,
        comment: newComment.trim(),
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setComments((prev) => [...prev, data.comment]);
      setNewComment("");
      setItems((prev) =>
        prev.map((i) => (i.id === activeItem.id ? { ...i, commentsCount: i.commentsCount + 1 } : i))
      );
    }
    setSubmittingComment(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Community Ecosystem Feed</h1>
          </div>
          <p className="text-xs text-muted mt-1">Explore live creations, ideas, and milestones across the Grove network.</p>
        </div>

        <button
          onClick={fetchFeed}
          className="self-start sm:self-auto p-2.5 rounded-xl border border-border bg-surface text-muted hover:text-foreground transition-premium flex items-center gap-2 text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Feed
        </button>
      </div>

      {/* World Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedWorld("all")}
          className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-premium whitespace-nowrap ${
            selectedWorld === "all"
              ? "bg-emerald-500 text-white border-emerald-400 shadow-sm"
              : "bg-surface border-border text-muted hover:text-foreground"
          }`}
        >
          All Worlds
        </button>
        {DEFAULT_WORLDS.map((world) => (
          <button
            key={world.id}
            onClick={() => setSelectedWorld(world.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium border transition-premium whitespace-nowrap ${
              selectedWorld === world.id
                ? "bg-emerald-500 text-white border-emerald-400 shadow-sm"
                : "bg-surface border-border text-muted hover:text-foreground"
            }`}
          >
            {world.name}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {loading && items.length === 0 && (
        <div className="min-h-[40vh] flex flex-col items-center justify-center gap-3 text-muted text-sm">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
          <span>Loading ecosystem activity stream...</span>
        </div>
      )}

      {/* Feed Stream */}
      {!loading && items.length === 0 && (
        <div className="p-12 rounded-3xl border border-border bg-surface text-center space-y-3">
          <Sparkles className="w-8 h-8 text-emerald-400 mx-auto opacity-80" />
          <h3 className="text-base font-bold text-foreground">No public creations yet</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            Be the first creator to plant a public seed in the Grove community feed!
          </p>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item) => {
          const world = DEFAULT_WORLDS.find((w) => w.id === item.worldId);
          return (
            <div
              key={item.id}
              className="p-5 rounded-2xl border border-border bg-surface glass-bezel hover:border-border/80 transition-premium space-y-4"
            >
              {/* Author & World Bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-950/60 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
                    {item.author.name ? item.author.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                      {item.author.name}
                      <span className="text-[10px] text-muted font-normal">• {item.author.title}</span>
                    </div>
                    <div className="text-[10px] text-muted">
                      {new Date(item.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {item.mode === "team" && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-violet-500/30 bg-violet-950/30 text-violet-300 flex items-center gap-1 font-semibold">
                      <Users className="w-3 h-3" /> Team Mode
                    </span>
                  )}
                  <span className="text-[10px] px-2.5 py-1 rounded-full border border-border bg-background text-muted font-medium">
                    {world ? world.name : item.worldId}
                  </span>
                </div>
              </div>

              {/* Title & Link */}
              <div className="space-y-1">
                <Link
                  href={`/creation/${item.id}`}
                  className="text-lg font-bold text-foreground hover:text-emerald-400 transition-colors block"
                >
                  {item.title}
                </Link>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900/50">
                    {item.status}
                  </span>
                  <span className="text-xs text-muted">{item.entriesCount} entries captured</span>
                </div>
              </div>

              {/* Like / Comment Actions */}
              <div className="pt-3 border-t border-border/50 flex items-center gap-4 text-xs">
                <button
                  onClick={() => toggleLike(item.id)}
                  className={`flex items-center gap-1.5 py-1 px-3 rounded-lg border transition-premium ${
                    item.hasLiked
                      ? "bg-rose-950/40 border-rose-500/40 text-rose-400"
                      : "bg-background border-border text-muted hover:text-foreground"
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${item.hasLiked ? "fill-rose-400 text-rose-400" : ""}`} />
                  <span>{item.likesCount}</span>
                </button>

                <button
                  onClick={() => openComments(item)}
                  className="flex items-center gap-1.5 py-1 px-3 rounded-lg border border-border bg-background text-muted hover:text-foreground transition-premium"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{item.commentsCount} Comments</span>
                </button>

                <Link
                  href={`/creation/${item.id}`}
                  className="ml-auto text-xs font-semibold text-emerald-400 hover:underline"
                >
                  View Creation →
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comments Drawer / Modal */}
      {activeItem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="font-bold text-foreground text-sm">Comments</h3>
                <p className="text-xs text-muted truncate max-w-xs">{activeItem.title}</p>
              </div>
              <button
                onClick={() => setActiveItem(null)}
                className="text-muted hover:text-foreground text-xs p-1"
              >
                Close ✕
              </button>
            </div>

            <form onSubmit={handlePostComment} className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="flex-1 bg-background border border-border rounded-xl px-3 py-2 text-xs text-foreground focus:outline-none focus:border-emerald-500/50"
              />
              <button
                type="submit"
                disabled={submittingComment || !newComment.trim()}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
                Send
              </button>
            </form>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {comments.length === 0 ? (
                <p className="text-xs text-muted text-center py-4">No comments yet. Start the conversation!</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-background border border-border/50 text-xs space-y-1">
                    <div className="font-semibold text-emerald-400">{c.user?.name || "Community Member"}</div>
                    <div className="text-foreground">{c.comment}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
