import { describe, expect, it } from "vitest";
import {
  ALARM_OTHER_MACHINE,
  ASSIGNEE_NOT_WORKER,
  CHECK_FAILED,
  COMPLETED_NEEDS_DETAILS,
  END_BEFORE_START,
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

  describe("check violations (23514, issue #28)", () => {
    it("asks for action taken and an end date to complete", () => {
      expect(
        maintenanceSaveError({
          code: "23514",
          message:
            'new row for relation "maintenance_records" violates check constraint "maintenance_records_completed_requires_details"',
        }),
      ).toEqual({ formError: COMPLETED_NEEDS_DETAILS });
    });

    it("points at the end date when it is before the start date", () => {
      expect(
        maintenanceSaveError({
          code: "23514",
          message:
            'new row for relation "maintenance_records" violates check constraint "maintenance_records_end_after_start"',
        }),
      ).toEqual({ fieldErrors: { endDate: [END_BEFORE_START] } });
    });

    it("points at the technician when the assignee is not an admin or technician", () => {
      expect(
        maintenanceSaveError({
          code: "23514",
          message:
            "maintenance_records_technician_role: the responsible person must be an admin or a technician",
        }),
      ).toEqual({ fieldErrors: { technicianId: [ASSIGNEE_NOT_WORKER] } });
    });

    it("falls back to the general check message for other checks", () => {
      expect(
        maintenanceSaveError({
          code: "23514",
          message:
            'new row for relation "maintenance_records" violates check constraint "maintenance_records_problem_check"',
        }),
      ).toEqual({ formError: CHECK_FAILED });
    });
  });

  it("falls back to a generic message", () => {
    expect(maintenanceSaveError(null)).toEqual({ formError: MAINTENANCE_SAVE_FAILED });
  });
});
