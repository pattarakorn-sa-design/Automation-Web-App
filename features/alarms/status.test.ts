import { describe, expect, it } from "vitest";
import { canChangeStatus, canUpdateAlarm, nextStatuses } from "./status";

describe("nextStatuses (BR-ALM-01, BR-ALM-02)", () => {
  it.each(["admin", "technician"] as const)(
    "lets a %s move an open alarm to In Progress or Closed",
    (role) => {
      expect(nextStatuses("Open", role)).toEqual(["In Progress", "Closed"]);
    },
  );

  it.each(["admin", "technician"] as const)(
    "lets a %s move an in-progress alarm back to Open or to Closed",
    (role) => {
      expect(nextStatuses("In Progress", role)).toEqual(["Open", "Closed"]);
    },
  );

  it("lets only an admin reopen a closed alarm, and only to Open", () => {
    expect(nextStatuses("Closed", "admin")).toEqual(["Open"]);
    expect(nextStatuses("Closed", "technician")).toEqual([]);
  });
});

describe("canChangeStatus", () => {
  it("allows the listed transitions", () => {
    expect(canChangeStatus("Open", "Closed", "technician")).toBe(true);
    expect(canChangeStatus("Closed", "Open", "admin")).toBe(true);
  });

  it("refuses Closed to In Progress even for an admin (TC-ALM-08)", () => {
    expect(canChangeStatus("Closed", "In Progress", "admin")).toBe(false);
  });

  it("refuses any change to a closed alarm by a technician (TC-ALM-06)", () => {
    expect(canChangeStatus("Closed", "Open", "technician")).toBe(false);
    expect(canChangeStatus("Closed", "Closed", "technician")).toBe(false);
  });

  it("allows keeping the same status to update the notes while not closed", () => {
    expect(canChangeStatus("In Progress", "In Progress", "technician")).toBe(true);
    expect(canChangeStatus("Closed", "Closed", "admin")).toBe(true);
  });
});

describe("canUpdateAlarm", () => {
  it("makes closed alarms read-only for technicians", () => {
    expect(canUpdateAlarm("Closed", "technician")).toBe(false);
    expect(canUpdateAlarm("Closed", "admin")).toBe(true);
    expect(canUpdateAlarm("Open", "technician")).toBe(true);
  });
});
