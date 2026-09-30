"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/features/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  MAINTENANCE_NOT_FOUND,
  MAINTENANCE_NO_PERMISSION,
  maintenanceSaveError,
  type MaintenanceFormState,
} from "./errors";
import { canEditMaintenance, responsibleTechnician } from "./rules";
import { maintenanceFormValues, maintenanceSchema, type MaintenanceInput } from "./schema";

function toRow(input: MaintenanceInput, technicianId: string) {
  return {
    machine_id: input.machineId,
    alarm_id: input.alarmId || null,
    technician_id: technicianId,
    type: input.type,
    problem: input.problem,
    action_taken: input.actionTaken || null,
    status: input.status,
    start_date: input.startDate,
    end_date: input.endDate || null,
  };
}

// REQ-MNT-01: admins and technicians record maintenance work. A technician is
// always recorded as the responsible technician (BR-MNT-01); created_by is
// filled in by the database.
export async function createMaintenance(
  _prevState: MaintenanceFormState,
  formData: FormData,
): Promise<MaintenanceFormState> {
  const user = await requireRole("admin", "technician");

  const values = maintenanceFormValues(formData);
  values.technicianId = responsibleTechnician(values.technicianId, user);
  const parsed = maintenanceSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("maintenance_records")
    .insert(toRow(parsed.data, parsed.data.technicianId))
    .select("id")
    .single();
  if (error) return { ...maintenanceSaveError(error), values };

  revalidatePath("/maintenance");
  redirect(`/maintenance/${data.id}`);
}

// REQ-MNT-05: admins edit every record, technicians only their own, and a
// technician cannot hand a record to someone else. Bound to the record id.
export async function updateMaintenance(
  id: string,
  _prevState: MaintenanceFormState,
  formData: FormData,
): Promise<MaintenanceFormState> {
  const user = await requireRole("admin", "technician");

  const supabase = await createClient();
  const { data: current, error: readError } = await supabase
    .from("maintenance_records")
    .select("technician_id")
    .eq("id", id)
    .maybeSingle();
  if (readError) return maintenanceSaveError(readError);
  if (!current) return { formError: MAINTENANCE_NOT_FOUND };
  if (!canEditMaintenance(current.technician_id, user)) {
    return { formError: MAINTENANCE_NO_PERMISSION };
  }

  const values = maintenanceFormValues(formData);
  values.technicianId = responsibleTechnician(values.technicianId, user);
  const parsed = maintenanceSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const { data, error } = await supabase
    .from("maintenance_records")
    .update(toRow(parsed.data, parsed.data.technicianId))
    .eq("id", id)
    .select("id");
  if (error) return { ...maintenanceSaveError(error), values };
  // RLS skips rows the user may not change instead of returning an error.
  if (data.length === 0) return { formError: MAINTENANCE_NO_PERMISSION, values };

  revalidatePath("/maintenance");
  revalidatePath(`/maintenance/${id}`);
  redirect(`/maintenance/${id}`);
}
