// Shared domain types used by both server (repository/API) and client (context).

export type CreationStatus =
  | "Seed"
  | "Growing"
  | "Thriving"
  | "Frozen"
  | "Launching"
  | "Shipped";

export interface Entry {
  id: string;
  type: "text" | "image" | "link" | "audio";
  content: string;
  timestamp: string; // ISO string
}

export interface Creation {
  id: string;
  title: string;
  worldId: string;
  originalWorldId?: string;
  status: CreationStatus;
  mode?: "personal" | "team";
  isPublic?: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  entries: Entry[];
}

export interface DumpItem {
  id: string;
  content: string;
  createdAt: string; // ISO string
}

export type TaskPriority = "low" | "medium" | "high" | "urgent";
export type TaskStatus = "todo" | "in_progress" | "done";

export interface Task {
  id: string;
  creationId: string;
  title: string;
  priority: TaskPriority;
  status: TaskStatus;
  assigneeId?: string | null;
  assignee?: {
    id: string;
    name: string;
    email: string;
  } | null;
  startDate: string | null; // YYYY-MM-DD
  dueDate: string | null; // YYYY-MM-DD
  sortOrder: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

