"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Check,
  Circle,
  CircleDot,
  Flag,
  CalendarDays,
  ListChecks,
} from "lucide-react";
import type { Task, TaskPriority, TaskStatus } from "@/types/domain";

const PRIORITY_META: Record<TaskPriority, { label: string; className: string; dot: string }> = {
  low: { label: "Low", className: "text-slate-400 border-slate-500/30 bg-slate-500/10", dot: "bg-slate-400" },
  medium: { label: "Medium", className: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", dot: "bg-emerald-400" },
  high: { label: "High", className: "text-amber-400 border-amber-500/30 bg-amber-500/10", dot: "bg-amber-400" },
  urgent: { label: "Urgent", className: "text-red-400 border-red-500/30 bg-red-500/10", dot: "bg-red-400" },
};

const STATUS_ORDER: TaskStatus[] = ["todo", "in_progress", "done"];

function nextStatus(s: TaskStatus): TaskStatus {
  const i = STATUS_ORDER.indexOf(s);
  return STATUS_ORDER[(i + 1) % STATUS_ORDER.length];
}

export default function ProductionTab({ creationId }: { creationId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // New task form
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/tasks?creationId=${encodeURIComponent(creationId)}`, {
      cache: "no-store",
    });
    if (res.ok) setTasks((await res.json()).tasks ?? []);
    setLoading(false);
  }, [creationId]);

  useEffect(() => {
    load();
  }, [load]);

  const addTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setAdding(true);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creationId,
        title: title.trim(),
        priority,
        startDate: startDate || null,
        dueDate: dueDate || null,
      }),
    });
    setAdding(false);
    if (res.ok) {
      const { task } = await res.json();
      setTasks((prev) => [...prev, task]);
      setTitle("");
      setPriority("medium");
      setStartDate("");
      setDueDate("");
    }
  };

  const patchTask = async (id: string, patch: Partial<Task>) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  };

  const removeTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
  };

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "done").length;
  const progress = total ? Math.round((done / total) * 100) : 0;

  // Timeline bounds
  const dated = tasks.filter((t) => t.startDate || t.dueDate);
  const allDates = dated.flatMap((t) => [t.startDate, t.dueDate].filter(Boolean) as string[]);
  const minDate = allDates.length ? new Date(allDates.reduce((a, b) => (a < b ? a : b))) : null;
  const maxDate = allDates.length ? new Date(allDates.reduce((a, b) => (a > b ? a : b))) : null;
  const spanMs = minDate && maxDate ? Math.max(1, maxDate.getTime() - minDate.getTime()) : 1;

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString([], { month: "short", day: "numeric" }) : "";

  return (
    <div className="flex-1 overflow-y-auto py-4 pr-1 space-y-5 no-scrollbar">
      {/* Progress header */}
      <div className="p-4 rounded-2xl border border-border bg-surface/50 space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ListChecks className="w-4 h-4 text-emerald-500" /> Production progress
          </span>
          <span className="text-xs text-muted">
            {done}/{total} done · {progress}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-background overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Add task */}
      <form onSubmit={addTask} className="p-4 rounded-2xl border border-border bg-surface/50 space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task for this project..."
          className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-sm text-foreground placeholder-muted/50 focus:outline-none focus:border-emerald-500/50"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-[9px] uppercase font-bold text-muted tracking-wider">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-emerald-500/50"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] uppercase font-bold text-muted tracking-wider">Start</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-emerald-500/50"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] uppercase font-bold text-muted tracking-wider">Due</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-background border border-border rounded-lg p-2 text-xs text-foreground focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={!title.trim() || adding}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] transition-premium text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Plus className="w-3.5 h-3.5" /> Add task
        </button>
      </form>

      {/* Task list */}
      <div className="space-y-2">
        <h4 className="text-[10px] uppercase font-bold text-muted tracking-wider px-1">To-do list</h4>
        {loading ? (
          <p className="text-xs text-muted text-center py-6">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="text-xs text-muted text-center py-6">No tasks yet. Add your first one above.</p>
        ) : (
          tasks.map((t) => {
            const meta = PRIORITY_META[t.priority];
            return (
              <div
                key={t.id}
                className={`p-3 rounded-xl border bg-surface/50 flex items-start gap-3 group ${
                  t.status === "done" ? "border-border/50 opacity-70" : "border-border"
                }`}
              >
                <button
                  onClick={() => patchTask(t.id, { status: nextStatus(t.status) })}
                  className="mt-0.5 shrink-0"
                  title="Change status"
                >
                  {t.status === "done" ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : t.status === "in_progress" ? (
                    <CircleDot className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted" />
                  )}
                </button>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <p
                    className={`text-xs font-medium break-words ${
                      t.status === "done" ? "line-through text-muted" : "text-foreground"
                    }`}
                  >
                    {t.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <select
                      value={t.priority}
                      onChange={(e) => patchTask(t.id, { priority: e.target.value as TaskPriority })}
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border bg-transparent focus:outline-none cursor-pointer ${meta.className}`}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                    {(t.startDate || t.dueDate) && (
                      <span className="text-[9px] text-muted flex items-center gap-1 border border-border rounded-full px-1.5 py-0.5">
                        <CalendarDays className="w-2.5 h-2.5" />
                        {fmt(t.startDate)}
                        {t.startDate && t.dueDate ? " → " : ""}
                        {fmt(t.dueDate)}
                      </span>
                    )}
                    <span className="text-[9px] uppercase tracking-wide text-muted">
                      {t.status === "in_progress" ? "In progress" : t.status}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => removeTask(t.id)}
                  className="text-muted hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                  title="Delete task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Timeline */}
      {dated.length > 0 && minDate && maxDate && (
        <div className="space-y-2">
          <h4 className="text-[10px] uppercase font-bold text-muted tracking-wider px-1 flex items-center gap-1.5">
            <Flag className="w-3 h-3" /> Production timeline
          </h4>
          <div className="p-4 rounded-2xl border border-border bg-surface/50 space-y-3">
            <div className="flex justify-between text-[9px] text-muted">
              <span>{fmt(minDate.toISOString())}</span>
              <span>{fmt(maxDate.toISOString())}</span>
            </div>
            {dated.map((t) => {
              const start = t.startDate ? new Date(t.startDate) : new Date(t.dueDate!);
              const end = t.dueDate ? new Date(t.dueDate) : new Date(t.startDate!);
              const left = ((start.getTime() - minDate.getTime()) / spanMs) * 100;
              const width = Math.max(4, ((end.getTime() - start.getTime()) / spanMs) * 100);
              const meta = PRIORITY_META[t.priority];
              return (
                <div key={t.id} className="space-y-1">
                  <span className="text-[10px] text-foreground truncate block">{t.title}</span>
                  <div className="relative h-2.5 rounded-full bg-background">
                    <div
                      className={`absolute h-full rounded-full ${meta.dot} ${
                        t.status === "done" ? "opacity-50" : ""
                      }`}
                      style={{ left: `${left}%`, width: `${width}%` }}
                      title={`${fmt(t.startDate)} → ${fmt(t.dueDate)}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
