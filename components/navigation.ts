import type { Enums } from "@/types/database";

export type Role = Enums<"app_role">;

export type NavItem = {
  href: string;
  label: string;
  // Roles that see the item. Leave out for everyone.
  roles?: readonly Role[];
};

// Main menu, in display order. The role check here only decides what to show:
// pages and Server Actions still check the role on the server (requireRole).
const NAV_ITEMS: readonly NavItem[] = [
  { href: "/", label: "Dashboard" },
  { href: "/machines", label: "Machines" },
  { href: "/alarms", label: "Alarms" },
  { href: "/maintenance", label: "Maintenance" },
  { href: "/users", label: "Users", roles: ["admin"] },
];

export function getNavItems(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.roles || item.roles.includes(role));
}

// A section is active on its own page and on pages below it, e.g. /machines
// is active on /machines/new but /machines2 is not. "/" only matches itself.
export function isActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}
