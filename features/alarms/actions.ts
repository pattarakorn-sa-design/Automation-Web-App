"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireRole } from "@/features/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  ALARM_NOT_FOUND,
  alarmSaveError,
  type AlarmFormState,
} from "./errors";
import {
  alarmDetailsSchema,
  alarmDetailsValues,
  alarmStatusSchema,
  alarmStatusValues,
  type AlarmDetailsInput,
} from "./schema";
import { canChangeStatus, canUpdateAlarm } from "./status";

function detailsRow(input: AlarmDetailsInput) {
  return {
    machine_id: input.machineId,
    alarm_code: input.alarmCode,
    description: input.description,
    occurred_at: input.occurredAt.toISOString(),
    cause: input.cause || null,
  };
}

// REQ-ALM-01: admins create alarms. Status starts as Open and created_by is
// filled in by the database.
export async function createAlarm(
  _prevState: AlarmFormState,
  formData: FormData,
): Promise<AlarmFormState> {
  await requireRole("admin");

  const values = alarmDetailsValues(formData);
  const parsed = alarmDetailsSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("alarms")
    .insert(detailsRow(parsed.data))
    .select("id")
    .single();
  if (error) return { ...alarmSaveError(error), values };

  revalidatePath("/alarms");
  redirect(`/alarms/${data.id}`);
}

// REQ-ALM-05: admins edit machine, code, description, time and cause.
// Bound to the alarm id in the edit page.
export async function updateAlarmDetails(
  id: string,
  _prevState: AlarmFormState,
  formData: FormData,
): Promise<AlarmFormState> {
  await requireRole("admin");

  const values = alarmDetailsValues(formData);
  const parsed = alarmDetailsSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("alarms")
    .update(detailsRow(parsed.data))
    .eq("id", id)
    .select("id");
  if (error) return { ...alarmSaveError(error), values };
  if (data.length === 0) return { formError: ALARM_NOT_FOUND, values };

  revalidatePath("/alarms");
  revalidatePath(`/alarms/${id}`);
  redirect(`/alarms/${id}`);
}

// REQ-ALM-04: admins and technicians change the status and the notes.
// Rules are checked here first for a clear message; the database trigger
// enforces them again and sets closed_by / closed_at (BR-ALM-04).
export async function updateAlarmStatus(
  id: string,
  _prevState: AlarmFormState,
  formData: FormData,
): Promise<AlarmFormState> {
  const user = await requireRole("admin", "technician");

  const values = alarmStatusValues(formData);
  const parsed = alarmStatusSchema.safeParse(values);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };
  }

  const supabase = await createClient();
  const { data: current, error: readError } = await supabase
    .from("alarms")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (readError) return { ...alarmSaveError(readError), values };
  if (!current) return { formError: ALARM_NOT_FOUND, values };

  const { status, cause, actionTaken } = parsed.data;
  if (!canUpdateAlarm(current.status, user.role)) {
    return {
      formError: "Alarm ที่ปิดแล้ว มีเพียง Admin ที่เปิดใหม่ได้",
      values,
    };
  }
  if (!canChangeStatus(current.status, status, user.role)) {
    return {
      fieldErrors: {
        status: [`เปลี่ยนจาก ${current.status} เป็น ${status} ไม่ได้ ต้องเปิดใหม่เป็น Open ก่อน`],
      },
      values,
    };
  }

  const { data, error } = await supabase
    .from("alarms")
    .update({ status, cause: cause || null, action_taken: actionTaken || null })
    .eq("id", id)
    .select("id");
  if (error) return { ...alarmSaveError(error), values };
  if (data.length === 0) return { formError: ALARM_NOT_FOUND, values };

  revalidatePath("/alarms");
  revalidatePath(`/alarms/${id}`);
  return { success: status === current.status ? "บันทึกแล้ว" : `เปลี่ยนสถานะเป็น ${status} แล้ว` };
}
