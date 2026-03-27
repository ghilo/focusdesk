export type Priority = "high" | "medium" | "low";
export type Status = "active" | "done";

export interface Task {
  id: string; // UUID v4
  title: string; // max 120 chars
  notes?: string;
  priority: Priority;
  status: Status;
  dueDate: string | null; // ISO string
  projectId: string | null;
  clientId: string | null;
  order: number;
  createdAt: string; // ISO string
  completedAt: string | null; // ISO string
}

export interface Project {
  id: string;
  name: string;
  clientId: string | null;
  createdAt: string; // ISO string
}

export interface Client {
  id: string;
  name: string;
  createdAt: string; // ISO string
  archived?: boolean;
}
