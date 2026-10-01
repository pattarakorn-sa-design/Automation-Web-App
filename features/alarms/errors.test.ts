import { describe, expect, it } from "vitest";
import {
  ALARM_CLOSE_NEEDS_DETAILS,
  ALARM_HAS_MAINTENANCE,
  ALARM_MACHINE_NOT_FOUND,
  ALARM_NO_PERMISSION,
  ALARM_OCCURRED_IN_FUTURE,
  ALARM_SAVE_FAILED,
  ALARM_STATUS_NOT_ALLOWED,
  alarmSaveError,
} from "./errors";

describe("alarmSaveError", () => {
  it("explains a refused change by role", () => {
    expect(alarmSaveError({ code: "42501" })).toEqual({ formError: ALARM_NO_PERMISSION });
  });

  describe("check violations (23514, issue #22)", () => {
    it("explains a status change refused by the trigger", () => {
      expect(
        alarmSaveError({
          code: "23514",
          message: "Alarm status cannot change from Closed to In Progress",
        }),
      ).toEqual({ formError: ALARM_STATUS_NOT_ALLOWED });
    });

    it("asks for cause and action taken when closing without them", () => {
      expect(
        alarmSaveError({
          code: "23514",
          message:
            'new row for relation "alarms" violates check constraint "alarms_closed_requires_details"',
        }),
      ).toEqual({ formError: ALARM_CLOSE_NEEDS_DETAILS });
    });

    it("points at the time field for a time in the future", () => {
      expect(
        alarmSaveError({
          code: "23514",
          message:
            'new row for relation "alarms" violates check constraint "alarms_occurred_at_check"',
        }),
      ).toEqual({ fieldErrors: { occurredAt: [ALARM_OCCURRED_IN_FUTURE] } });
    });

    it("falls back to a generic message for other checks", () => {
      expect(
        alarmSaveError({
          code: "23514",
          message:
            'new row for relation "alarms" violates check constraint "alarms_alarm_code_check"',
        }),
      ).toEqual({ formError: ALARM_SAVE_FAILED });
    });
  });

  describe("foreign key violations (23503, issue #21)", () => {
    it("explains that linked maintenance keeps the alarm on its machine", () => {
      expect(
        alarmSaveError({
          code: "23503",
          message:
            'update or delete on table "alarms" violates foreign key constraint "maintenance_records_alarm_same_machine_fkey" on table "maintenance_records"',
        }),
      ).toEqual({ formError: ALARM_HAS_MAINTENANCE });
    });

    it("points at the machine field when the machine is gone", () => {
      expect(
        alarmSaveError({
          code: "23503",
          message:
            'insert or update on table "alarms" violates foreign key constraint "alarms_machine_id_fkey"',
        }),
      ).toEqual({ fieldErrors: { machineId: [ALARM_MACHINE_NOT_FOUND] } });
    });
  });

  it("falls back to a generic message", () => {
    expect(alarmSaveError(null)).toEqual({ formError: ALARM_SAVE_FAILED });
  });
});
