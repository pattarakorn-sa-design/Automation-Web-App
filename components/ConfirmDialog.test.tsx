import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ConfirmDialog from "./ConfirmDialog";

function render() {
  return renderToStaticMarkup(
    <ConfirmDialog
      open={false}
      title="ลบเครื่องจักร"
      description="ต้องการลบเครื่องนี้หรือไม่"
      onConfirm={() => {}}
      onCancel={() => {}}
    />,
  );
}

describe("ConfirmDialog", () => {
  it("shows the title, description and default Thai button labels", () => {
    const html = render();

    expect(html).toContain("ลบเครื่องจักร");
    expect(html).toContain("ต้องการลบเครื่องนี้หรือไม่");
    expect(html).toContain("ยืนยัน");
    expect(html).toContain("ยกเลิก");
  });

  // A click on the padding of the <dialog> itself has the dialog as its target,
  // which the backdrop-click handler would treat as a click outside the box.
  it("keeps padding off the dialog element so only the backdrop targets it", () => {
    const html = render();
    const dialogTag = html.match(/<dialog[^>]*>/)?.[0] ?? "";
    const dialogClasses = dialogTag.match(/class="([^"]*)"/)?.[1] ?? "";

    expect(dialogClasses).not.toMatch(/(^|\s)p[xytblr]?-(?!0(\s|$))\d/);
    expect(html).toContain('<div class="p-6">');
  });
});
