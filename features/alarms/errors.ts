// Turns database errors from alarm writes into messages for the user.
// Codes are PostgreSQL SQLSTATEs as returned by Supabase in error.code. One code
// can have several causes, so the constraint name or the trigger's text in
// error.message tells them apart.

export type AlarmFormState = {
  fieldErrors?: Record<string, string[] | undefined>;
  formError?: string;
  success?: string;
  // What the user submitted, shown again after a failed save because React
  // resets a form after its action runs.
  values?: Record<string, string>;
};

type DbError = { code?: string; message?: string } | null | undefined;

export const ALARM_NOT_FOUND = "ไม่พบ Alarm นี้";
export const ALARM_NO_PERMISSION = "คุณไม่มีสิทธิ์แก้ไข Alarm นี้";
export const ALARM_STATUS_NOT_ALLOWED =
  "เปลี่ยนสถานะนี้ไม่ได้ Alarm ที่ปิดแล้วต้องให้ Admin เปิดใหม่เป็น Open ก่อน";
export const ALARM_CLOSE_NEEDS_DETAILS = "กรุณากรอก Cause และ Action Taken ก่อนปิด Alarm";
export const ALARM_OCCURRED_IN_FUTURE = "เวลาที่เกิด Alarm ต้องไม่อยู่ในอนาคต";
export const ALARM_HAS_MAINTENANCE =
  "Alarm นี้มีงานซ่อมอ้างอิงอยู่ จึงเปลี่ยนเครื่องจักรไม่ได้";
export const ALARM_MACHINE_NOT_FOUND = "ไม่พบเครื่องจักรที่เลือก กรุณาเลือกใหม่";
export const ALARM_SAVE_FAILED = "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";

// 23514: check constraints on public.alarms, or the status trigger
// (enforce_alarm_update_rules raises "Alarm status cannot change from ...").
function checkViolation(message: string): AlarmFormState {
  if (message.includes("Alarm status cannot change")) {
    return { formError: ALARM_STATUS_NOT_ALLOWED };
  }
  if (message.includes("alarms_closed_requires_details")) {
    return { formError: ALARM_CLOSE_NEEDS_DETAILS };
  }
  if (message.includes("alarms_occurred_at_check")) {
    return { fieldErrors: { occurredAt: [ALARM_OCCURRED_IN_FUTURE] } };
  }
  return { formError: ALARM_SAVE_FAILED };
}

// 23503: either the chosen machine is gone, or the alarm's machine cannot change
// because maintenance records link to (alarm, machine) together (BR-MNT-03).
function foreignKeyViolation(message: string): AlarmFormState {
  if (message.includes("maintenance_records_alarm_same_machine_fkey")) {
    return { formError: ALARM_HAS_MAINTENANCE };
  }
  return { fieldErrors: { machineId: [ALARM_MACHINE_NOT_FOUND] } };
}

export function alarmSaveError(error: DbError): AlarmFormState {
  const message = error?.message ?? "";
  switch (error?.code) {
    case "42501": // RLS, or the trigger refusing a technician's change
      return { formError: ALARM_NO_PERMISSION };
    case "23514":
      return checkViolation(message);
    case "23503":
      return foreignKeyViolation(message);
    default:
      return { formError: ALARM_SAVE_FAILED };
  }
}
