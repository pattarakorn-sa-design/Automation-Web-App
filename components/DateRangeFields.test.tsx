import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import DateRangeFields from "./DateRangeFields";

function render(props: { from?: string; to?: string; invalidRange?: boolean }) {
  return renderToStaticMarkup(
    <DateRangeFields
      from={props.from}
      to={props.to}
      invalidRange={props.invalidRange ?? false}
      fromLabel="Occurred from"
      toLabel="Occurred to"
      inputClassName="input"
    />,
  );
}

// The <input> tag with this id, so attribute order does not matter.
function inputTag(html: string, id: string): string {
  return html.match(new RegExp(`<input[^>]*id="${id}"[^>]*>`))?.[0] ?? "";
}

describe("DateRangeFields", () => {
  it("renders two labelled date inputs named from and to", () => {
    const html = render({});
    expect(html).toContain('<label for="filter-from" class="text-sm font-medium">Occurred from</label>');
    expect(html).toContain('<label for="filter-to" class="text-sm font-medium">Occurred to</label>');
    for (const [id, name] of [
      ["filter-from", "from"],
      ["filter-to", "to"],
    ]) {
      const tag = inputTag(html, id);
      expect(tag).toContain(`name="${name}"`);
      expect(tag).toContain('type="date"');
      expect(tag).toContain('value=""');
    }
  });

  it("keeps the values from the URL", () => {
    const html = render({ from: "2026-09-01", to: "2026-09-30" });
    expect(inputTag(html, "filter-from")).toContain('value="2026-09-01"');
    expect(inputTag(html, "filter-to")).toContain('value="2026-09-30"');
  });

  it("has no error without an invalid range", () => {
    const html = render({ from: "2026-09-01", to: "2026-09-30" });
    expect(html).not.toContain('role="alert"');
    expect(html).not.toContain("aria-invalid");
  });

  it("explains an invalid range in Thai and links it to both inputs", () => {
    const html = render({ from: "2026-09-30", to: "2026-09-01", invalidRange: true });
    expect(html).toContain('role="alert"');
    expect(html).toContain("วันที่เริ่มต้นต้องไม่อยู่หลังวันที่สิ้นสุด");
    expect(html.match(/aria-invalid="true"/g)).toHaveLength(2);
    expect(html.match(/aria-describedby="filter-date-error"/g)).toHaveLength(2);
  });
});
