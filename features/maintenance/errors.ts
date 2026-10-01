// Turns database errors from maintenance writes into messages for the user.
// Codes are PostgreSQL SQLSTATEs as returned by Supabase in error.code.

export type MaintenanceFormState = {
  fieldErrors?: Record<string, string[] | undefined>;
  formError?: string;
  // What the user submitted, shown again after a failed save because React
  // resets a form after its action runs.
  values?: Record<string, string>;
};

type DbError = { code?: string; message?: string } | null | undefined;

export const MAINTENANCE_NOT_FOUND = "ไม่พบงานซ่อมนี้";
export const MAINTENANCE_NO_PERMISSION =
  "คุณแก้ไขได้เฉพาะงานซ่อมที่คุณเป็น Technician ผู้รับผิดชอบ";
export const MAINTENANCE_SAVE_FAILED = "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
export const ALARM_OTHER_MACHINE = "Alarm ที่เลือกต้องเป็นของเครื่องจักรเครื่องเดียวกัน";
export const COMPLETED_NEEDS_DETAILS =
  "กรุณากรอก Action Taken และวันจบก่อนตั้งสถานะเป็น Completed";
export const END_BEFORE_START = "วันจบต้องไม่ก่อนวันเริ่ม";
export const ASSIGNEE_NOT_WORKER =
  "ผู้รับผิดชอบต้องเป็น Admin หรือ Technician กรุณาเลือกใหม่";
export const CHECK_FAILED = "ข้อมูลไม่ตรงตามเงื่อนไขของระบบ กรุณาตรวจสอบอีกครั้ง";

export function maintenanceSaveError(error: DbError): MaintenanceFormState {
  const message = error?.message ?? "";
  switch (error?.code) {
    case "42501": // RLS: not an admin and not the responsible technician
      return { formError: MAINTENANCE_NO_PERMISSION };
    case "23503": // foreign key: which one is in the message
      if (message.includes("alarm_same_machine")) {
        return { fieldErrors: { alarmId: [ALARM_OTHER_MACHINE] } };
      }
      if (message.includes("technician_id")) {
        return { fieldErrors: { technicianId: ["ไม่พบ Technician ที่เลือก กรุณาเลือกใหม่"] } };
      }
      return { fieldErrors: { machineId: ["ไม่พบเครื่องจักรที่เลือก กรุณาเลือกใหม่"] } };
    case "23514": // check constraint or trigger: the form normally catches these first
      if (message.includes("maintenance_records_technician_role")) {
        return { fieldErrors: { technicianId: [ASSIGNEE_NOT_WORKER] } };
      }
      if (message.includes("maintenance_records_completed_requires_details")) {
        return { formError: COMPLETED_NEEDS_DETAILS };
      }
      if (message.includes("maintenance_records_end_after_start")) {
        return { fieldErrors: { endDate: [END_BEFORE_START] } };
      }
      return { formError: CHECK_FAILED };
    default:
      return { formError: MAINTENANCE_SAVE_FAILED };
  }
}
