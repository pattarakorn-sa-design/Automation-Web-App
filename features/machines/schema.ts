import { z } from "zod";
import { Constants } from "@/types/database";

export const MACHINE_STATUSES = Constants.public.Enums.machine_status;

// Same rules as the checks on public.machines (REQ-MCH-02 to REQ-MCH-04,
// REQ-VAL-01). Shared by the machine form and the Server Actions.
export const machineSchema = z.object({
  machineCode: z
    .string()
    .trim()
    .min(1, "กรุณากรอก Machine ID")
    // Stored in uppercase so "m-001" and "M-001" count as the same ID.
    .toUpperCase()
    .regex(
      /^[A-Z]{1,4}-[0-9]{3,5}$/,
      "รูปแบบ Machine ID ไม่ถูกต้อง ต้องเป็นตัวอักษร 1–4 ตัว ขีด และตัวเลข 3–5 หลัก เช่น M-001 หรือ CNC-0012",
    ),
  name: z
    .string()
    .trim()
    .min(1, "กรุณากรอกชื่อเครื่องจักร")
    .max(100, "ชื่อเครื่องจักรยาวได้ไม่เกิน 100 ตัวอักษร"),
  type: z
    .string()
    .trim()
    .min(1, "กรุณากรอกประเภทเครื่องจักร")
    .max(50, "ประเภทเครื่องจักรยาวได้ไม่เกิน 50 ตัวอักษร"),
  location: z
    .string()
    .trim()
    .min(1, "กรุณากรอกตำแหน่งที่ตั้ง")
    .max(100, "ตำแหน่งที่ตั้งยาวได้ไม่เกิน 100 ตัวอักษร"),
  status: z.enum(MACHINE_STATUSES, "กรุณาเลือกสถานะเครื่องจักร"),
});

export type MachineInput = z.infer<typeof machineSchema>;

// Reads the machine fields out of a submitted form.
export function machineFormValues(formData: FormData) {
  return {
    machineCode: formData.get("machineCode"),
    name: formData.get("name"),
    type: formData.get("type"),
    location: formData.get("location"),
    status: formData.get("status"),
  };
}
