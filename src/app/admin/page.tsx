"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Boxes,
  FileText,
  Trash2,
  Send,
  Activity,
  TrendingUp,
  Shield,
  RefreshCw,
  Mail,
  Bell,
} from "lucide-react";
import type { AdminAnalytics } from "@/lib/analytics";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="p-4 rounded-2xl border border-border bg-surface glass-bezel">
      <div className="flex items-center gap-2 text-muted mb-2">
        <Icon className="w-4 h-4 text-emerald-500" />
        <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {sub && <div className="text-[11px] text-muted mt-0.5">{sub}</div>}
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Broadcast mode state: "push" | "email"
  const [mode, setMode] = useState<"push" | "email">("push");

  // Broadcast form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState("all");
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ text: string; error?: boolean } | null>(null);

  const load = async () => {
    setLoading(true);
    const [aRes, uRes] = await Promise.all([
      fetch("/api/admin/analytics", { cache: "no-store" }),
      fetch("/api/admin/users", { cache: "no-store" }),
    ]);
    if (aRes.ok) setData(await aRes.json());
    if (uRes.ok) setUsers((await uRes.json()).users ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSendResult(null);

    const endpoint = mode === "push" ? "/api/admin/push" : "/api/admin/email";
    const payload =
      mode === "push"
        ? { title, body: message, target }
        : { target, subject: title, message };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const json = await res.json().catch(() => ({}));
    setSending(false);

    if (res.ok) {
      const successMsg =
        mode === "push"
          ? `Push sent to ${json.sent} device(s). ${json.failed ? json.failed + " failed." : ""}`
          : `No-reply email sent to ${json.sentCount} recipient(s).`;
      setSendResult({ text: successMsg, error: false });
      setTitle("");
      setMessage("");
    } else {
      setSendResult({ text: json.error || "Failed to send.", error: true });
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted text-sm">
          <RefreshCw className="w-4 h-4 animate-spin" /> Loading analytics...
        </div>
      </div>
    );
  }

  const maxSignup = data ? Math.max(1, ...data.users.signupsByDay.map((d) => d.count)) : 1;
  const maxWorld = data ? Math.max(1, ...data.worlds.map((w) => w.creations)) : 1;

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      <div className="flex items-center justify-between mt-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" />
            <h2 className="text-xl font-bold tracking-tight text-foreground">Admin Analytics</h2>
          </div>
          <p className="text-xs text-muted">Monitor user activity and world statistics across Grove.</p>
        </div>
        <button
          onClick={load}
          className="p-2 rounded-xl border border-border bg-surface text-muted hover:text-foreground transition-premium"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {data && (
        <>
          {/* User stats */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">User statistics</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard icon={Users} label="Total users" value={data.users.total} sub={`${data.users.admins} admin(s)`} />
              <StatCard icon={Activity} label="Active (7d)" value={data.users.activeLast7Days} sub="signed in recently" />
              <StatCard icon={TrendingUp} label="New (7d)" value={data.users.newLast7Days} sub={`${data.users.newLast30Days} in 30d`} />
              <StatCard
                icon={Users}
                label="Sign-in method"
                value={`${data.users.byProvider.google}G / ${data.users.byProvider.credentials}P`}
                sub="Google / Password"
              />
            </div>

            {/* Signups sparkline */}
            <div className="p-4 rounded-2xl border border-border bg-surface">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-3">
                Signups · last 14 days
              </div>
              <div className="flex items-end gap-1 h-24">
                {data.users.signupsByDay.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1" title={`${d.date}: ${d.count}`}>
                    <div
                      className="w-full rounded-t bg-emerald-500/70"
                      style={{ height: `${(d.count / maxSignup) * 100}%`, minHeight: d.count ? "4px" : "0" }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Content stats */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Content statistics</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard icon={Boxes} label="Creations" value={data.content.totalCreations} />
              <StatCard icon={FileText} label="Entries" value={data.content.totalEntries} />
              <StatCard icon={Trash2} label="Dump items" value={data.content.totalDumpItems} />
              <StatCard
                icon={FileText}
                label="Voice notes"
                value={data.content.entryTypes.audio}
                sub={`${data.content.entryTypes.image} images`}
              />
            </div>

            {/* Status breakdown */}
            <div className="p-4 rounded-2xl border border-border bg-surface">
              <div className="text-[10px] font-bold uppercase tracking-wider text-muted mb-3">
                Creation status breakdown
              </div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.content.statusBreakdown).map(([status, count]) => (
                  <span
                    key={status}
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-background text-foreground"
                  >
                    {status}: <span className="font-bold text-emerald-400">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* World stats */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">World statistics</h3>
            <div className="p-4 rounded-2xl border border-border bg-surface space-y-3">
              {data.worlds.map((w) => (
                <div key={w.worldId} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-2">
                      {w.name}
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded-full border ${
                          w.health === "Active"
                            ? "text-emerald-500 border-emerald-500/30 bg-emerald-500/10"
                            : w.health === "Frozen"
                            ? "text-blue-400 border-blue-500/30 bg-blue-500/10"
                            : "text-muted border-border"
                        }`}
                      >
                        {w.health}
                      </span>
                    </span>
                    <span className="text-muted">
                      {w.creations} ideas · {w.entries} entries
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-background overflow-hidden">
                    <div
                      className="h-full bg-emerald-500/70 rounded-full"
                      style={{ width: `${(w.creations / maxWorld) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Top users */}
          <section className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Most active users</h3>
            <div className="rounded-2xl border border-border bg-surface overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-muted border-b border-border">
                    <th className="py-2.5 px-4 font-semibold">User</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Creations</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Entries</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topUsers.map((u) => (
                    <tr key={u.id} className="border-b border-border/50 last:border-0">
                      <td className="py-2.5 px-4">
                        <div className="font-medium text-foreground">{u.name}</div>
                        <div className="text-[10px] text-muted">{u.email}</div>
                      </td>
                      <td className="py-2.5 px-4 text-right text-foreground">{u.creations}</td>
                      <td className="py-2.5 px-4 text-right text-foreground">{u.entries}</td>
                    </tr>
                  ))}
                  {data.topUsers.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-muted">
                        No user activity yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {/* Broadcast Composer (Push Notification or Email) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Broadcast Center</h3>
          <div className="flex bg-background border border-border rounded-xl p-1 gap-1 text-xs">
            <button
              type="button"
              onClick={() => setMode("push")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                mode === "push"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              Push Notification
            </button>
            <button
              type="button"
              onClick={() => setMode("email")}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition-all ${
                mode === "email"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-muted hover:text-foreground"
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              No-Reply Email
            </button>
          </div>
        </div>

        <form onSubmit={handleBroadcast} className="p-5 rounded-2xl border border-border bg-surface space-y-3">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted">Recipient Target</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="w-full bg-background border border-border rounded-xl p-2.5 text-sm text-foreground focus:outline-none focus:border-emerald-500/50"
            >
              <option value="all">All users (broadcast)</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted">
              {mode === "email" ? "Email Subject" : "Notification Title"}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={mode === "email" ? "e.g. Important Update from Grove" : "e.g. New feature available!"}
              className="w-full bg-background border border-border rounded-xl p-2.5 text-sm text-foreground placeholder-muted/50 focus:outline-none focus:border-emerald-500/50"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted">
              {mode === "email" ? "Email Message (HTML / Markdown supported)" : "Notification Message"}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={mode === "email" ? "Write your email message..." : "Write your announcement..."}
              rows={4}
              className="w-full bg-background border border-border rounded-xl p-2.5 text-sm text-foreground placeholder-muted/50 focus:outline-none focus:border-emerald-500/50 resize-none font-sans"
              required
            />
          </div>

          {sendResult && (
            <div
              className={`text-xs p-2.5 rounded-lg border ${
                sendResult.error
                  ? "text-red-400 bg-red-950/20 border-red-900/30"
                  : "text-emerald-400 bg-emerald-950/20 border-emerald-900/30"
              }`}
            >
              {sendResult.text}
            </div>
          )}

          <button
            type="submit"
            disabled={sending}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-premium text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {mode === "email" ? <Mail className="w-4 h-4" /> : <Send className="w-4 h-4" />}
            {sending ? "Sending..." : mode === "email" ? "Send No-Reply Email" : "Send Push Notification"}
          </button>
        </form>
      </section>
    </div>
  );
}
