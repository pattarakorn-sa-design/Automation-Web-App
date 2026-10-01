import { z } from "zod";
import { isDateValue } from "@/lib/format";
import { MAINTENANCE_STATUSES, MAINTENANCE_TYPES } from "./rules";

// Same rules as the checks on public.maintenance_records (REQ-MNT-02,
// REQ-VAL-01 validation table). Shared by the form and the Server Actions.
export const maintenanceSchema = z
  .object({
    machineId: z.uuid("กรุณาเลือกเครื่องจักร"),
    // Optional link to the alarm that caused the work (REQ-MNT-03).
    alarmId: z.union([z.literal(""), z.uuid("Alarm ที่เลือกไม่ถูกต้อง")]),
    technicianId: z.uuid("กรุณาเลือก Technician ผู้รับผิดชอบ"),
    type: z.enum(MAINTENANCE_TYPES, "กรุณาเลือกประเภทงาน"),
    problem: z
      .string()
      .trim()
      .min(1, "กรุณากรอกปัญหาที่พบ")
      .max(1000, "Problem ยาวได้ไม่เกิน 1000 ตัวอักษร"),
    actionTaken: z
      .string()
      .trim()
      .max(1000, "Action Taken ยาวได้ไม่เกิน 1000 ตัวอักษร"),
    status: z.enum(MAINTENANCE_STATUSES, "กรุณาเลือกสถานะ"),
    startDate: z
      .string()
      .refine((value) => value !== "", "กรุณาระบุวันเริ่ม")
      .refine((value) => value === "" || isDateValue(value), "วันเริ่มไม่ถูกต้อง"),
    endDate: z
      .string()
      .refine((value) => value === "" || isDateValue(value), "วันจบไม่ถูกต้อง"),
  })
  .superRefine((value, ctx) => {
    if (
      value.endDate &&
      isDateValue(value.startDate) &&
      isDateValue(value.endDate) &&
      value.endDate < value.startDate
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["endDate"],
        message: "วันจบต้องไม่ก่อนวันเริ่ม",
      });
    }
    // BR-MNT-02: completed work needs the action taken and an end date.
    if (value.status === "Completed") {
      if (!value.actionTaken) {
        ctx.addIssue({
          code: "custom",
          path: ["actionTaken"],
          message: "กรุณากรอก Action Taken ก่อนตั้งสถานะเป็น Completed",
        });
      }
      if (!value.endDate) {
        ctx.addIssue({
          code: "custom",
          path: ["endDate"],
          message: "กรุณาระบุวันจบก่อนตั้งสถานะเป็น Completed",
        });
      }
    }
  });

export type MaintenanceInput = z.infer<typeof maintenanceSchema>;

const FIELDS = [
  "machineId",
  "alarmId",
  "technicianId",
  "type",
  "problem",
  "actionTaken",
  "status",
  "startDate",
  "endDate",
] as const;

// Reads the maintenance fields out of a submitted form as plain strings.
export function maintenanceFormValues(formData: FormData): Record<string, string> {
  return Object.fromEntries(
    FIELDS.map((field) => {
      const value = formData.get(field);
      return [field, typeof value === "string" ? value : ""];
    }),
  );
}
