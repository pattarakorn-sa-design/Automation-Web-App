import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const exportAlarms = vi.fn();
const logLoadError = vi.fn();

vi.mock("@/features/auth/session", () => ({ requireUser }));
vi.mock("@/features/alarms/queries", () => ({ exportAlarms }));
vi.mock("@/lib/log", () => ({ logLoadError }));

const { GET } = await import("./route");

const row = {
  id: "a-1",
  alarm_code: "E-101",
  description: "Injection pressure too high",
  occurred_at: "2026-10-01T04:00:00Z",
  cause: null,
  action_taken: null,
  status: "Open",
  closed_at: null,
  machine: { machine_code: "INJ-002", name: "Injection Molder 2" },
  creator: { full_name: "Somchai Jaidee" },
  closer: null,
};

function request(query = "") {
  return new NextRequest(`http://localhost/alarms/export${query}`);
}

describe("GET /alarms/export", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    requireUser.mockResolvedValue({ id: "u-1", role: "technician" });
  });

  it("checks that someone is signed in before reading any data", async () => {
    requireUser.mockRejectedValue(new Error("NEXT_REDIRECT"));

    await expect(GET(request())).rejects.toThrow("NEXT_REDIRECT");
    expect(exportAlarms).not.toHaveBeenCalled();
  });

  it("passes the list filters from the URL to the export query", async () => {
    exportAlarms.mockResolvedValue({ rows: [row], truncated: false });
    const machine = "3f1c7d0e-8b2a-4c5d-9e6f-1a2b3c4d5e6f";

    await GET(request(`?machine=${machine}&status=In+Progress&code=E-1&page=3`));

    expect(exportAlarms).toHaveBeenCalledWith(
      expect.objectContaining({ machine, status: "In Progress", code: "E-1" }),
    );
  });

  it("ignores filter values the list page would ignore", async () => {
    exportAlarms.mockResolvedValue({ rows: [], truncated: false });

    await GET(request("?machine=not-a-uuid&status=Nope"));

    expect(exportAlarms).toHaveBeenCalledWith(
      expect.objectContaining({ machine: undefined, status: undefined }),
    );
  });

  it("returns a CSV attachment with a byte order mark", async () => {
    exportAlarms.mockResolvedValue({ rows: [row], truncated: false });

    const response = await GET(request());
    // text() drops a leading BOM when it decodes, so read the raw bytes: this
    // is what Excel sees.
    const bytes = new Uint8Array(await response.clone().arrayBuffer());
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("Content-Disposition")).toMatch(
      /^attachment; filename="alarms-\d{4}-\d{2}-\d{2}\.csv"$/,
    );
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(body).toContain('"E-101"');
  });

  it("names the file -partial when more rows matched than the limit", async () => {
    exportAlarms.mockResolvedValue({ rows: [row], truncated: true });

    const response = await GET(request());

    expect(response.headers.get("Content-Disposition")).toMatch(/-partial\.csv"$/);
  });

  it("logs the cause and answers 500 with a Thai message, not an empty file", async () => {
    const failure = new Error("exportAlarms failed: timeout");
    exportAlarms.mockRejectedValue(failure);

    const response = await GET(request());

    expect(logLoadError).toHaveBeenCalledWith("alarms export", failure);
    expect(response.status).toBe(500);
    expect(await response.text()).toContain("ส่งออกข้อมูลไม่สำเร็จ");
  });
});
