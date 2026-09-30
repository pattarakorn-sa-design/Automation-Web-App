import { describe, expect, it } from "vitest";
import {
  DELETE_FAILED,
  MACHINE_ID_TAKEN,
  MACHINE_IN_USE,
  NO_PERMISSION,
  SAVE_FAILED,
  machineDeleteError,
  machineSaveError,
} from "./errors";

describe("machineSaveError", () => {
  it("shows a duplicate Machine ID under the Machine ID field", () => {
    expect(machineSaveError({ code: "23505" })).toEqual({
      fieldErrors: { machineCode: [MACHINE_ID_TAKEN] },
    });
  });

  it("explains a permission error", () => {
    expect(machineSaveError({ code: "42501" })).toEqual({ formError: NO_PERMISSION });
  });

  it("falls back to a generic message", () => {
    expect(machineSaveError({ code: "08006" })).toEqual({ formError: SAVE_FAILED });
    expect(machineSaveError(null)).toEqual({ formError: SAVE_FAILED });
  });
});

describe("machineDeleteError", () => {
  it("explains that a machine with alarms or maintenance cannot be deleted", () => {
    expect(machineDeleteError({ code: "23503" })).toBe(MACHINE_IN_USE);
  });

  it("explains a permission error and falls back otherwise", () => {
    expect(machineDeleteError({ code: "42501" })).toBe(NO_PERMISSION);
    expect(machineDeleteError({ code: "XX000" })).toBe(DELETE_FAILED);
  });
});
