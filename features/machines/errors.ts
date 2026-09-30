// Turns database errors from machine writes into messages for the user.
// Codes are PostgreSQL SQLSTATEs as returned by Supabase in error.code.

export type MachineFormState = {
  fieldErrors?: Record<string, string[] | undefined>;
  formError?: string;
  // What the user submitted. React resets a form after its action runs, so
  // the form shows these again instead of losing the user's input on an error.
  values?: Record<string, string>;
};

type DbError = { code?: string } | null | undefined;

export const MACHINE_ID_TAKEN = "Machine ID นี้มีอยู่แล้ว";
export const MACHINE_IN_USE =
  "ลบไม่ได้ เพราะเครื่องนี้มี Alarm หรือ Maintenance ผูกอยู่ ถ้าเลิกใช้เครื่องแล้วให้เปลี่ยนสถานะเป็น Stop แทน";
export const NO_PERMISSION = "คุณไม่มีสิทธิ์แก้ไขข้อมูลเครื่องจักร";
export const SAVE_FAILED = "บันทึกไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
export const DELETE_FAILED = "ลบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
export const MACHINE_NOT_FOUND = "ไม่พบเครื่องจักรนี้ อาจถูกลบไปแล้ว";

export function machineSaveError(error: DbError): MachineFormState {
  switch (error?.code) {
    case "23505": // unique_violation on machine_code (REQ-MCH-03)
      return { fieldErrors: { machineCode: [MACHINE_ID_TAKEN] } };
    case "42501": // insufficient_privilege, e.g. RLS
      return { formError: NO_PERMISSION };
    case "23514": // check_violation: the form should have caught it first
      return { formError: "ข้อมูลไม่ตรงตามเงื่อนไขของระบบ กรุณาตรวจสอบอีกครั้ง" };
    default:
      return { formError: SAVE_FAILED };
  }
}

export function machineDeleteError(error: DbError): string {
  switch (error?.code) {
    case "23503": // foreign_key_violation: alarms or maintenance still point here (BR-MCH-02)
      return MACHINE_IN_USE;
    case "42501":
      return NO_PERMISSION;
    default:
      return DELETE_FAILED;
  }
}
