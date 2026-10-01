import { isWorkerRole, type Role } from "@/features/auth/roles";
import { Constants, type Enums } from "@/types/database";

export type MaintenanceStatus = Enums<"maintenance_status">;
export type MaintenanceType = Enums<"maintenance_type">;

export const MAINTENANCE_STATUSES = Constants.public.Enums.maintenance_status;
export const MAINTENANCE_TYPES = Constants.public.Enums.maintenance_type;

type User = { id: string; role: Role };

// BR-MNT-01 / OQ-02: admins edit every record, technicians only the records
// they are responsible for. RLS enforces the same rule in the database.
export function canEditMaintenance(technicianId: string, user: User): boolean {
  return (
    user.role === "admin" ||
    (user.role === "technician" && technicianId === user.id)
  );
}

// Technicians always create and keep records under their own name; only
// admins choose or change the responsible technician.
export function responsibleTechnician(submittedId: string, user: User): string {
  return user.role === "admin" ? submittedId : user.id;
}

type Person = { id: string; full_name: string; role: Role };

// Choices for the responsible technician an admin picks. Only admins and
// technicians can be responsible (the database trigger
// enforce_maintenance_assignee_role refuses anyone else), so viewers are left
// out. The person already on the record stays, even if their role changed since.
export function technicianOptions(people: readonly Person[], currentId: string) {
  return people
    .filter((person) => isWorkerRole(person.role) || person.id === currentId)
    .map((person) => ({
      value: person.id,
      label:
        person.role === "technician" ? person.full_name : `${person.full_name} (${person.role})`,
    }));
}
