import { describe, expect, it } from "vitest";
import { withLinkedAlarm, type AlarmOption } from "./options";

function alarm(id: string): AlarmOption {
  return {
    id,
    machine_id: "m-1",
    alarm_code: `E-${id}`,
    occurred_at: "2026-09-29T00:00:00Z",
    status: "Closed",
  };
}

describe("withLinkedAlarm", () => {
  it("adds the linked alarm when it is not among the fetched ones", () => {
    expect(withLinkedAlarm([alarm("1")], alarm("9")).map((a) => a.id)).toEqual(["1", "9"]);
  });

  it("does not add it twice", () => {
    expect(withLinkedAlarm([alarm("1")], alarm("1"))).toHaveLength(1);
  });

  it("leaves the list as is without a linked alarm", () => {
    const options = [alarm("1")];
    expect(withLinkedAlarm(options, null)).toBe(options);
  });
});
