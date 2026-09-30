"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/features/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  MACHINE_NOT_FOUND,
  machineDeleteError,
  machineSaveError,
  type MachineFormState,
} from "./errors";
import { machineFormValues, machineSchema, type MachineInput } from "./schema";

function toRow(input: MachineInput) {
  return {
    machine_code: input.machineCode,
    name: input.name,
    type: input.type,
    location: input.location,
    status: input.status,
  };
}

// REQ-MCH-01: admins add machines.
export async function createMachine(
  _prevState: MachineFormState,
  formData: FormData,
): Promise<MachineFormState> {
  await requireRole("admin");

  const parsed = machineSchema.safeParse(machineFormValues(formData));
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("machines")
    .insert(toRow(parsed.data))
    .select("id")
    .single();
  if (error) return machineSaveError(error);

  revalidatePath("/machines");
  redirect(`/machines/${data.id}`);
}

// REQ-MCH-01: admins edit machines. Bound to the machine id in the edit page.
export async function updateMachine(
  id: string,
  _prevState: MachineFormState,
  formData: FormData,
): Promise<MachineFormState> {
  await requireRole("admin");

  const parsed = machineSchema.safeParse(machineFormValues(formData));
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("machines")
    .update(toRow(parsed.data))
    .eq("id", id)
    .select("id");
  if (error) return machineSaveError(error);
  // RLS skips rows the user may not change instead of returning an error.
  if (data.length === 0) return { formError: MACHINE_NOT_FOUND };

  revalidatePath("/machines");
  revalidatePath(`/machines/${id}`);
  redirect(`/machines/${id}`);
}

// REQ-MCH-01, REQ-MCH-06: admins delete machines that nothing refers to.
// The database refuses when alarms or maintenance records point at the
// machine (on delete restrict), and the message explains why.
export async function deleteMachine(id: string): Promise<{ error?: string }> {
  await requireRole("admin");
  // Called from the browser, so the id is untrusted input.
  if (!z.uuid().safeParse(id).success) return { error: MACHINE_NOT_FOUND };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("machines")
    .delete()
    .eq("id", id)
    .select("id");
  if (error) return { error: machineDeleteError(error) };
  if (data.length === 0) return { error: MACHINE_NOT_FOUND };

  revalidatePath("/machines");
  redirect("/machines");
}
