import { describe, expect, it } from "vitest";
import {
  ALARM_OTHER_MACHINE,
  MAINTENANCE_NO_PERMISSION,
  MAINTENANCE_SAVE_FAILED,
  maintenanceSaveError,
} from "./errors";

describe("maintenanceSaveError", () => {
  it("explains a record the user may not change", () => {
    expect(maintenanceSaveError({ code: "42501" })).toEqual({
      formError: MAINTENANCE_NO_PERMISSION,
    });
  });

  it("points at the alarm field when the alarm is from another machine (TC-MNT-07)", () => {
    expect(
      maintenanceSaveError({
        code: "23503",
        message:
          'insert or update on table "maintenance_records" violates foreign key constraint "maintenance_records_alarm_same_machine_fkey"',
      }),
    ).toEqual({ fieldErrors: { alarmId: [ALARM_OTHER_MACHINE] } });
  });

  it("points at the technician or the machine for the other foreign keys", () => {
    expect(
      maintenanceSaveError({
        code: "23503",
        message: 'violates foreign key constraint "maintenance_records_technician_id_fkey"',
      }).fieldErrors,
    ).toHaveProperty("technicianId");
    expect(
      maintenanceSaveError({
        code: "23503",
        message: 'violates foreign key constraint "maintenance_records_machine_id_fkey"',
      }).fieldErrors,
    ).toHaveProperty("machineId");
  });

  it("falls back to a generic message", () => {
    expect(maintenanceSaveError(null)).toEqual({ formError: MAINTENANCE_SAVE_FAILED });
  });
});
