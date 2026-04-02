/**
 * Work domain types and public API.
 * All persistence is delegated to workRepo (lib/db/index.ts).
 */

import { workRepo } from "./db";

export type Priority   = "low" | "medium" | "high" | "critical";
export type WorkStatus = "blocked" | "in-progress" | "done";

export interface Work {
  id: string;
  name: string;
  assignedTo: string; // userId
  priority: Priority;
  progress: number;   // 0–100
  status: WorkStatus;
  dueDate: string;    // ISO date string YYYY-MM-DD
  createdAt: unknown;
  updatedAt: unknown;
}

export type WorkInput = Omit<Work, "id" | "createdAt" | "updatedAt">;

export const subscribeToWorks = (cb: (works: Work[]) => void) =>
  workRepo.subscribe(cb);

export const createWork = (input: WorkInput) =>
  workRepo.create(input);

export const updateWork = (id: string, patch: Partial<WorkInput>) =>
  workRepo.update(id, patch);

export const deleteWork = (id: string) =>
  workRepo.delete(id);
