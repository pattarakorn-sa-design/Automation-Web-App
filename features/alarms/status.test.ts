import { describe, expect, it } from "vitest";
import {
  ALARM_CLOSED_MESSAGE,
  ALARM_READ_ONLY_MESSAGE,
  alarmReadOnlyMessage,
  canChangeStatus,
  canUpdateAlarm,
  nextStatuses,
} from "./status";

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

describe("viewer (REQ-AUTH-08)", () => {
  it("gets no status choices and cannot update any alarm", () => {
    for (const status of ["Open", "In Progress", "Closed"] as const) {
      expect(nextStatuses(status, "viewer")).toEqual([]);
      expect(canUpdateAlarm(status, "viewer")).toBe(false);
    }
  });

  it("cannot change a status, not even keep the same one", () => {
    expect(canChangeStatus("Open", "In Progress", "viewer")).toBe(false);
    expect(canChangeStatus("Open", "Open", "viewer")).toBe(false);
  });
});

describe("alarmReadOnlyMessage (issue #56)", () => {
  it("gives admins the form in every status", () => {
    for (const status of ["Open", "In Progress", "Closed"] as const) {
      expect(alarmReadOnlyMessage(status, "admin")).toBeNull();
    }
  });

  it("gives technicians the form until the alarm is closed", () => {
    expect(alarmReadOnlyMessage("Open", "technician")).toBeNull();
    expect(alarmReadOnlyMessage("In Progress", "technician")).toBeNull();
    expect(alarmReadOnlyMessage("Closed", "technician")).toBe(ALARM_CLOSED_MESSAGE);
  });

  it("tells a viewer about read-only access, not that an open alarm is closed", () => {
    for (const status of ["Open", "In Progress", "Closed"] as const) {
      expect(alarmReadOnlyMessage(status, "viewer")).toBe(ALARM_READ_ONLY_MESSAGE);
    }
  });
});
