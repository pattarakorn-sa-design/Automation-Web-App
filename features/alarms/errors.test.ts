import { describe, expect, it } from "vitest";
import {
  ALARM_NO_PERMISSION,
  ALARM_SAVE_FAILED,
  ALARM_STATUS_NOT_ALLOWED,
  alarmSaveError,
} from "./errors";

describe("alarmSaveError", () => {
  it("explains a refused change by role", () => {
    expect(alarmSaveError({ code: "42501" })).toEqual({ formError: ALARM_NO_PERMISSION });
  });

  it("explains a refused status change", () => {
    expect(alarmSaveError({ code: "23514" })).toEqual({
      formError: ALARM_STATUS_NOT_ALLOWED,
    });
  });

  it("points at the machine field when the machine is gone", () => {
    expect(alarmSaveError({ code: "23503" }).fieldErrors?.machineId).toHaveLength(1);
  });

  it("falls back to a generic message", () => {
    expect(alarmSaveError(null)).toEqual({ formError: ALARM_SAVE_FAILED });
  });
});
