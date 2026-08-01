"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  Check,
  Circle,
  CircleDot,
  CalendarDays,
  ListChecks,
  UserCheck,
  Filter,
  CheckCircle2,
  Clock,
} from "lucide-react";
import type { Task, TaskPriority, TaskStatus } from "@/types/domain";

const PRIORITY_META: Record<TaskPriority, { label: string; className: string }> = {
  low: { label: "Low", className: "text-slate-400 border-slate-500/30 bg-slate-500/10" },
  medium: { label: "Medium", className: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" },
  high: { label: "High", className: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
  urgent: { label: "Urgent", className: "text-red-400 border-red-500/30 bg-red-500/10" },
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

type FilterTab = "all" | "todo" | "in_progress" | "done";

export default function ProductionTab({ creationId }: { creationId: string }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [collaborators, setCollaborators] = useState<CommunityUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

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
  const todoCount = tasks.filter((t) => t.status === "todo").length;
  const inProgressCount = tasks.filter((t) => t.status === "in_progress").length;
  const doneCount = tasks.filter((t) => t.status === "done").length;
  const progress = total ? Math.round((doneCount / total) * 100) : 0;

  const filteredTasks = tasks.filter((t) => {
    if (activeFilter === "all") return true;
    return t.status === activeFilter;
  });

  const fmt = (d: string | null) =>
    d ? new Date(d).toLocaleDateString([], { month: "short", day: "numeric" }) : "";

  return (
    <div className="flex-1 overflow-y-auto py-4 pr-1 space-y-5 no-scrollbar">
      {/* Progress & Overview Card */}
      <div className="p-4 rounded-2xl border border-border bg-surface/50 space-y-3">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ListChecks className="w-4 h-4 text-emerald-500" /> Production Progress & Tracking
          </span>
          <span className="text-xs font-bold text-emerald-400">
            {doneCount}/{total} done ({progress}%)
          </span>
        </div>
        <div className="h-2 rounded-full bg-background overflow-hidden flex">
          <div
            className="h-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
          <div
            className="h-full bg-amber-500/80 transition-all duration-500"
            style={{ width: `${total ? Math.round((inProgressCount / total) * 100) : 0}%` }}
          />
        </div>
        <div className="grid grid-cols-3 gap-2 text-center text-xs pt-1">
          <div className="p-2 rounded-xl bg-background/50 border border-border/50">
            <div className="text-[10px] text-muted uppercase font-bold">To Do</div>
            <div className="text-sm font-bold text-foreground">{todoCount}</div>
          </div>
          <div className="p-2 rounded-xl bg-background/50 border border-border/50">
            <div className="text-[10px] text-amber-400/90 uppercase font-bold">In Progress</div>
            <div className="text-sm font-bold text-amber-400">{inProgressCount}</div>
          </div>
          <div className="p-2 rounded-xl bg-background/50 border border-border/50">
            <div className="text-[10px] text-emerald-400/90 uppercase font-bold">Completed</div>
            <div className="text-sm font-bold text-emerald-400">{doneCount}</div>
          </div>
        </div>
      </div>

      {/* Add Task Form */}
      <form onSubmit={addTask} className="p-4 rounded-2xl border border-border bg-surface/50 space-y-3">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Add a new production task..."
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

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-[10px] uppercase font-bold text-muted px-1 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Filter:
        </span>
        {(["all", "todo", "in_progress", "done"] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-3 py-1 rounded-xl text-xs font-medium capitalize transition-all shrink-0 ${
              activeFilter === tab
                ? "bg-emerald-950/60 text-emerald-400 border border-emerald-500/40 shadow-sm"
                : "text-muted hover:text-foreground bg-surface/40 border border-border/40"
            }`}
          >
            {tab === "all" ? `All (${total})` : tab === "todo" ? `To Do (${todoCount})` : tab === "in_progress" ? `In Progress (${inProgressCount})` : `Done (${doneCount})`}
          </button>
        ))}
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {loading ? (
          <div className="text-center py-6 text-xs text-muted">Loading tasks...</div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted rounded-2xl border border-dashed border-border">
            {activeFilter === "all"
              ? "No tasks created yet for this project."
              : `No tasks in status "${activeFilter.replace("_", " ")}".`}
          </div>
        ) : (
          filteredTasks.map((task) => {
            const meta = PRIORITY_META[task.priority];
            return (
              <div
                key={task.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 text-xs ${
                  task.status === "done"
                    ? "bg-surface/30 border-border/60 opacity-80"
                    : task.status === "in_progress"
                    ? "bg-surface/80 border-amber-500/30"
                    : "bg-surface border-border"
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => patchTask(task.id, { status: nextStatus(task.status) })}
                    title={`Current: ${task.status.replace("_", " ")}. Click to advance status.`}
                    className="shrink-0 text-muted hover:text-emerald-400 transition-colors p-1"
                  >
                    {task.status === "done" ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : task.status === "in_progress" ? (
                      <CircleDot className="w-5 h-5 text-amber-400" />
                    ) : (
                      <Circle className="w-5 h-5" />
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

                      <span
                        className={`px-1.5 py-0.5 rounded font-semibold uppercase text-[9px] ${
                          task.status === "done"
                            ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/30"
                            : task.status === "in_progress"
                            ? "bg-amber-950/40 text-amber-400 border border-amber-500/30"
                            : "bg-surface border border-border text-muted"
                        }`}
                      >
                        {task.status.replace("_", " ")}
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

                      {task.completedAt && (
                        <span className="flex items-center gap-1 text-emerald-400/80">
                          <Clock className="w-3 h-3" /> Done {fmt(task.completedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => removeTask(task.id)}
                  title="Delete task"
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
