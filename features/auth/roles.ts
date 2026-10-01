import type { Enums } from "@/types/database";

export type Role = Enums<"app_role">;

export function hasRole(role: Role, allowed: readonly Role[]): boolean {
  return allowed.includes(role);
}

// Roles that do the work: they change alarm status and record maintenance, and
// only they can be responsible for a maintenance record. A viewer only reads
// (REQ-AUTH-08); RLS and triggers refuse a viewer's writes in the database too.
export const WORKER_ROLES = ["admin", "technician"] as const satisfies readonly Role[];

export function isWorkerRole(role: Role): boolean {
  return hasRole(role, WORKER_ROLES);
}
