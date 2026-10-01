import { describe, expect, it } from "vitest";
import { maintenanceToCsv } from "./csv";
import type { MaintenanceExportRow } from "./queries";

const done: MaintenanceExportRow = {
  id: "m-1",
  type: "Corrective",
  problem: "Belt slipping, tension low",
  action_taken: "Adjusted the belt tension",
  status: "Completed",
  start_date: "2026-09-25",
  end_date: "2026-09-26",
  machine: { machine_code: "CNV-001", name: "Conveyor Belt 1" },
  technician: { full_name: "Malee Rakdee" },
  alarm: { alarm_code: "E-120" },
};

const pending: MaintenanceExportRow = {
  ...done,
  id: "m-2",
  problem: "-ท่อรั่ว",
  action_taken: null,
  status: "Pending",
  end_date: null,
  alarm: null,
};

describe("maintenanceToCsv", () => {
  it("has the header and one line per record", () => {
    const lines = maintenanceToCsv([done, pending]).slice(1).split("\r\n");

    expect(lines[0]).toBe(
      '"Machine ID","Machine name","Alarm code","Type","Problem","Action taken","Status","Technician","Start date","End date"',
    );
    expect(lines).toHaveLength(4); // header, two records, trailing empty after the last CRLF
  });

  it("shows dates without moving them to another day", () => {
    const csv = maintenanceToCsv([done]);

    expect(csv).toContain('"25 Sept 2026"');
    expect(csv).toContain('"26 Sept 2026"');
  });

  it("leaves the alarm and end date empty when there are none", () => {
    expect(maintenanceToCsv([pending])).toContain('"Pending","Malee Rakdee","25 Sept 2026",""');
    expect(maintenanceToCsv([pending])).toContain('"CNV-001","Conveyor Belt 1","",');
  });

  it("keeps a comma in the problem inside one cell and guards a leading dash", () => {
    expect(maintenanceToCsv([done])).toContain('"Belt slipping, tension low"');
    expect(maintenanceToCsv([pending])).toContain(`"'-ท่อรั่ว"`);
  });
});
