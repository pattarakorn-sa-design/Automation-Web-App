import { z } from "zod";
import { fromBangkokInputValue } from "@/lib/format";
import { ALARM_STATUSES } from "./status";

// Matches the check on alarms.occurred_at, which allows a few minutes of
// clock difference between the browser and the database.
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000;

const causeField = z
  .string()
  .trim()
  .max(500, "Cause ยาวได้ไม่เกิน 500 ตัวอักษร");

const actionTakenField = z
  .string()
  .trim()
  .max(1000, "Action Taken ยาวได้ไม่เกิน 1000 ตัวอักษร");

// Alarm details that only admins create and edit (REQ-ALM-01, REQ-ALM-05).
// Same rules as the checks on public.alarms (REQ-VAL-01 validation table).
export const alarmDetailsSchema = z.object({
  machineId: z.uuid("กรุณาเลือกเครื่องจักร"),
  alarmCode: z
    .string()
    .trim()
    .min(1, "กรุณากรอก Alarm Code")
    .toUpperCase()
    .regex(
      /^[A-Z0-9-]{2,20}$/,
      "Alarm Code ต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข หรือขีด ยาว 2–20 ตัว เช่น E-101",
    ),
  description: z
    .string()
    .trim()
    .min(1, "กรุณากรอกรายละเอียด Alarm")
    .max(500, "รายละเอียดยาวได้ไม่เกิน 500 ตัวอักษร"),
  // A datetime-local value, read as Bangkok time.
  occurredAt: z
    .string()
    .min(1, "กรุณาระบุวันและเวลาที่เกิด Alarm")
    .transform((value, ctx) => {
      const date = fromBangkokInputValue(value);
      if (!date) {
        ctx.addIssue({ code: "custom", message: "วันและเวลาไม่ถูกต้อง" });
        return z.NEVER;
      }
      if (date.getTime() > Date.now() + FUTURE_TOLERANCE_MS) {
        ctx.addIssue({ code: "custom", message: "เวลาที่เกิด Alarm ต้องไม่อยู่ในอนาคต" });
        return z.NEVER;
      }
      return date;
    }),
  cause: causeField,
});

// Status change with notes, by admins and technicians (REQ-ALM-04).
// BR-ALM-03: closing needs both a cause and the action taken.
export const alarmStatusSchema = z
  .object({
    status: z.enum(ALARM_STATUSES, "กรุณาเลือกสถานะ"),
    cause: causeField,
    actionTaken: actionTakenField,
  })
  .superRefine((value, ctx) => {
    if (value.status !== "Closed") return;
    if (!value.cause) {
      ctx.addIssue({
        code: "custom",
        path: ["cause"],
        message: "กรุณากรอก Cause ก่อนปิด Alarm",
      });
    }
    if (!value.actionTaken) {
      ctx.addIssue({
        code: "custom",
        path: ["actionTaken"],
        message: "กรุณากรอก Action Taken ก่อนปิด Alarm",
      });
    }
  });

export type AlarmDetailsInput = z.infer<typeof alarmDetailsSchema>;
export type AlarmStatusInput = z.infer<typeof alarmStatusSchema>;

function readFields(formData: FormData, fields: readonly string[]) {
  return Object.fromEntries(
    fields.map((field) => {
      const value = formData.get(field);
      return [field, typeof value === "string" ? value : ""];
    }),
  ) as Record<string, string>;
}

export function alarmDetailsValues(formData: FormData) {
  return readFields(formData, [
    "machineId",
    "alarmCode",
    "description",
    "occurredAt",
    "cause",
  ]);
}

export function alarmStatusValues(formData: FormData) {
  return readFields(formData, ["status", "cause", "actionTaken"]);
}
