import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const requireUser = vi.fn();
const exportMaintenance = vi.fn();
const logLoadError = vi.fn();

vi.mock("@/features/auth/session", () => ({ requireUser }));
vi.mock("@/features/maintenance/queries", () => ({ exportMaintenance }));
vi.mock("@/lib/log", () => ({ logLoadError }));

const { GET } = await import("./route");

const row = {
  id: "m-1",
  type: "Corrective",
  problem: "Belt slipping under load",
  action_taken: null,
  status: "Pending",
  start_date: "2026-10-01",
  end_date: null,
  machine: { machine_code: "CNV-001", name: "Conveyor Belt 1" },
  technician: { full_name: "Malee Rakdee" },
  alarm: null,
};

function request(query = "") {
  return new NextRequest(`http://localhost/maintenance/export${query}`);
}

describe("GET /maintenance/export", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    requireUser.mockResolvedValue({ id: "u-1", role: "technician" });
  });

  it("checks that someone is signed in before reading any data", async () => {
    requireUser.mockRejectedValue(new Error("NEXT_REDIRECT"));

    await expect(GET(request())).rejects.toThrow("NEXT_REDIRECT");
    expect(exportMaintenance).not.toHaveBeenCalled();
  });

  it("passes the list filters from the URL to the export query", async () => {
    exportMaintenance.mockResolvedValue({ rows: [row], truncated: false });
    const machine = "3f1c7d0e-8b2a-4c5d-9e6f-1a2b3c4d5e6f";
    const technician = "9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d";

    await GET(request(`?machine=${machine}&status=In+Progress&technician=${technician}&page=3`));

    expect(exportMaintenance).toHaveBeenCalledWith(
      expect.objectContaining({ machine, status: "In Progress", technician }),
    );
  });

  it("ignores filter values the list page would ignore", async () => {
    exportMaintenance.mockResolvedValue({ rows: [], truncated: false });

    await GET(request("?machine=not-a-uuid&status=Nope"));

    expect(exportMaintenance).toHaveBeenCalledWith(
      expect.objectContaining({ machine: undefined, status: undefined }),
    );
  });

  it("returns a CSV attachment with a byte order mark", async () => {
    exportMaintenance.mockResolvedValue({ rows: [row], truncated: false });

    const response = await GET(request());
    // text() drops a leading BOM when it decodes, so read the raw bytes: this
    // is what Excel sees.
    const bytes = new Uint8Array(await response.clone().arrayBuffer());
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("text/csv; charset=utf-8");
    expect(response.headers.get("Content-Disposition")).toMatch(
      /^attachment; filename="maintenance-\d{4}-\d{2}-\d{2}\.csv"$/,
    );
    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    expect(body).toContain('"Belt slipping under load"');
  });

  it("names the file -partial when more rows matched than the limit", async () => {
    exportMaintenance.mockResolvedValue({ rows: [row], truncated: true });

    const response = await GET(request());

    expect(response.headers.get("Content-Disposition")).toMatch(/-partial\.csv"$/);
  });

  it("logs the cause and answers 500 with a Thai message, not an empty file", async () => {
    const failure = new Error("exportMaintenance failed: timeout");
    exportMaintenance.mockRejectedValue(failure);

    const response = await GET(request());

    expect(logLoadError).toHaveBeenCalledWith("maintenance export", failure);
    expect(response.status).toBe(500);
    expect(await response.text()).toContain("ส่งออกข้อมูลไม่สำเร็จ");
  });
});
