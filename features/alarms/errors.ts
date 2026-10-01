// Turns database errors from alarm writes into messages for the user.
// Codes are PostgreSQL SQLSTATEs as returned by Supabase in error.code.

export type AlarmFormState = {
  fieldErrors?: Record<string, string[] | undefined>;
  formError?: string;
  success?: string;
  // What the user submitted, shown again after a failed save because React
  // resets a form after its action runs.
  values?: Record<string, string>;
};

type DbError = { code?: string } | null | undefined;

export const ALARM_NOT_FOUND = "ไม่พบ Alarm นี้";
export const ALARM_NO_PERMISSION = "คุณไม่มีสิทธิ์แก้ไข Alarm นี้";
export const ALARM_STATUS_NOT_ALLOWED =
  "เปลี่ยนสถานะนี้ไม่ได้ Alarm ที่ปิดแล้วต้องให้ Admin เปิดใหม่เป็น Open ก่อน";
export const ALARM_SAVE_FAILED = "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";

export function alarmSaveError(error: DbError): AlarmFormState {
  switch (error?.code) {
    case "42501": // RLS, or the trigger refusing a technician's change
      return { formError: ALARM_NO_PERMISSION };
    case "23514": // check constraint, or the trigger refusing a status change
      return { formError: ALARM_STATUS_NOT_ALLOWED };
    case "23503": // the machine no longer exists
      return { fieldErrors: { machineId: ["ไม่พบเครื่องจักรที่เลือก กรุณาเลือกใหม่"] } };
    default:
      return { formError: ALARM_SAVE_FAILED };
  }
}
