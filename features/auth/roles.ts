import type { Enums } from "@/types/database";

export type Role = Enums<"app_role">;

export function hasRole(role: Role, allowed: readonly Role[]): boolean {
  return allowed.includes(role);
}
