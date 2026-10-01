import { describe, expect, it } from "vitest";
import { alarmsToCsv } from "./csv";
import type { AlarmExportRow } from "./queries";

const closed: AlarmExportRow = {
  id: "a-1",
  alarm_code: "E-205",
  description: "Heater band temperature low,\nzone 2",
  occurred_at: "2026-09-28T06:51:00Z",
  cause: "Heater band worn out",
  action_taken: 'Replaced the "main" band',
  status: "Closed",
  closed_at: "2026-09-28T10:51:00Z",
  machine: { machine_code: "INJ-002", name: "Injection Molder 2" },
  creator: { full_name: "Somchai Jaidee" },
  closer: { full_name: "Malee Rakdee" },
};

const open: AlarmExportRow = {
  ...closed,
  id: "a-2",
  alarm_code: "=E-101",
  description: "ความดันสูงเกินกำหนด",
  cause: null,
  action_taken: null,
  status: "Open",
  closed_at: null,
  closer: null,
};

describe("alarmsToCsv", () => {
  const lines = alarmsToCsv([closed, open]).slice(1).split("\r\n");

  it("has the header and one data line per alarm (a cell may contain a new line)", () => {
    expect(lines[0]).toBe(
      '"Alarm code","Machine ID","Machine name","Description","Occurred at","Status","Cause","Action taken","Created by","Closed by","Closed at"',
    );
    expect(alarmsToCsv([]).slice(1)).toBe(`${lines[0]}\r\n`);
  });

  it("shows times in Bangkok time like the screen", () => {
    // 06:51 UTC is 13:51 in Bangkok.
    expect(alarmsToCsv([closed])).toContain('"28 Sept 2026, 13:51"');
    expect(alarmsToCsv([closed])).toContain('"28 Sept 2026, 17:51"');
  });

  it("keeps a comma, a new line and a quote in the description and action in one cell", () => {
    const csv = alarmsToCsv([closed]);

    expect(csv).toContain('"Heater band temperature low,\nzone 2"');
    expect(csv).toContain('"Replaced the ""main"" band"');
  });

  it("leaves the cause, closer and closed time empty for an open alarm", () => {
    expect(alarmsToCsv([open])).toContain('"Open","","","Somchai Jaidee","",""');
  });

  it("keeps Thai text and stops a formula in the alarm code from running", () => {
    const csv = alarmsToCsv([open]);

    expect(csv).toContain('"ความดันสูงเกินกำหนด"');
    expect(csv).toContain(`"'=E-101"`);
  });

  it("copes with an alarm whose machine or people are missing", () => {
    // The generated types say the machine is always there, but the export
    // must not crash if a row ever comes back without it.
    const csv = alarmsToCsv([{ ...open, machine: null, creator: null } as unknown as AlarmExportRow]);

    expect(csv).toContain(`"'=E-101","","",`);
  });
});
