import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import EmptyState from "./EmptyState";
import ErrorState from "./ErrorState";

describe("EmptyState", () => {
  it("shows the default Thai message", () => {
    expect(renderToStaticMarkup(<EmptyState />)).toContain("ไม่พบข้อมูล");
  });

  it("renders a custom title, description and action", () => {
    const html = renderToStaticMarkup(
      <EmptyState
        title="ยังไม่มีเครื่องจักร"
        description="เพิ่มเครื่องแรกเพื่อเริ่มต้น"
        action={<a href="/machines/new">เพิ่มเครื่อง</a>}
      />,
    );

    expect(html).toContain("ยังไม่มีเครื่องจักร");
    expect(html).toContain("เพิ่มเครื่องแรกเพื่อเริ่มต้น");
    expect(html).toContain("เพิ่มเครื่อง</a>");
  });
});

describe("ErrorState", () => {
  it("is announced as an alert with default text", () => {
    const html = renderToStaticMarkup(<ErrorState />);

    expect(html).toContain('role="alert"');
    expect(html).toContain("เกิดข้อผิดพลาด");
  });

  it("renders a custom message", () => {
    const html = renderToStaticMarkup(<ErrorState message="เชื่อมต่อไม่ได้" />);

    expect(html).toContain("เชื่อมต่อไม่ได้");
  });
});
