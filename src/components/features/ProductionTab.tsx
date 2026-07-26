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
  UserCheck,
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

interface CommunityUser {
  id: string;
  name: string;
  email: string;
}

export default function ProductionTab({ creationId }: { creationId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [collaborators, setCollaborators] = useState<CommunityUser[]>([]);
  const [loading, setLoading] = useState(true);

  // New task form
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [adding, setAdding] = useState(false);

  const load = useCallback(async () => {
    const [tRes, mRes] = await Promise.all([
      fetch(`/api/tasks?creationId=${encodeURIComponent(creationId)}`, { cache: "no-store" }),
      fetch(`/api/creations/${encodeURIComponent(creationId)}/members`, { cache: "no-store" }),
    ]);

    if (tRes.ok) setTasks((await tRes.json()).tasks ?? []);
    if (mRes.ok) {
      const data = await mRes.json();
      const usersList = (data.members ?? []).map((m: any) => ({
        id: m.user.id,
        name: m.user.name,
        email: m.user.email,
      }));
      setCollaborators(usersList);
    }
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
        assigneeId: assigneeId || null,
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
      setAssigneeId("");
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

      {/* Add task form */}
      <form onSubmit={addTask} className="p-4 rounded-2xl border border-border bg-surface/50 space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a task for this project..."
          className="w-full bg-background border border-border rounded-xl py-2.5 px-3 text-sm text-foreground placeholder-muted/50 focus:outline-none focus:border-emerald-500/50"
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="space-y-1">
            <label className="text-[9px] uppercase font-bold text-muted tracking-wider">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="w-full bg-background border border-border rounded-xl py-1.5 px-2.5 text-xs text-foreground focus:outline-none focus:border-emerald-500/50"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] uppercase font-bold text-muted tracking-wider">Assignee</label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full bg-background border border-border rounded-xl py-1.5 px-2.5 text-xs text-foreground focus:outline-none focus:border-emerald-500/50"
            >
              <option value="">Unassigned</option>
              {collaborators.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[9px] uppercase font-bold text-muted tracking-wider">Start date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-background border border-border rounded-xl py-1.5 px-2 text-xs text-foreground focus:outline-none focus:border-emerald-500/50"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[9px] uppercase font-bold text-muted tracking-wider">Due date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-background border border-border rounded-xl py-1.5 px-2 text-xs text-foreground focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={adding || !title.trim()}
          className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Add Task
        </button>
      </form>

      {/* Task list */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-6 text-xs text-muted">Loading production tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted rounded-2xl border border-dashed border-border">
            No tasks created yet for this project.
          </div>
        ) : (
          tasks.map((task) => {
            const meta = PRIORITY_META[task.priority];
            return (
              <div
                key={task.id}
                className="p-3.5 rounded-2xl border border-border bg-surface flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => patchTask(task.id, { status: nextStatus(task.status) })}
                    className="shrink-0 text-muted hover:text-emerald-400 transition-colors"
                  >
                    {task.status === "done" ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : task.status === "in_progress" ? (
                      <CircleDot className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Circle className="w-4 h-4" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div
                      className={`font-medium truncate ${
                        task.status === "done" ? "line-through text-muted" : "text-foreground"
                      }`}
                    >
                      {task.title}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted">
                      <span className={`px-1.5 py-0.5 rounded border font-semibold ${meta.className}`}>
                        {meta.label}
                      </span>

                      {task.assignee && (
                        <span className="flex items-center gap-1 text-emerald-400 font-semibold bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          <UserCheck className="w-3 h-3" /> {task.assignee.name}
                        </span>
                      )}

                      {(task.startDate || task.dueDate) && (
                        <span className="flex items-center gap-1">
                          <CalendarDays className="w-3 h-3 text-muted" />
                          {fmt(task.startDate)} {task.dueDate ? `→ ${fmt(task.dueDate)}` : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => removeTask(task.id)}
                  className="p-1.5 text-muted hover:text-red-400 transition-colors shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
