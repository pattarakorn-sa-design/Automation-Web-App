import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SelectField from "./SelectField";
import TextAreaField from "./TextAreaField";

describe("TextAreaField", () => {
  it("links the label, error and hint to the textarea like TextField", () => {
    const html = renderToStaticMarkup(
      <TextAreaField
        label="Cause"
        name="cause"
        error="กรุณากรอก Cause"
        hint="What went wrong"
      />,
    );

    expect(html).toContain('for="field-cause"');
    expect(html).toContain('<textarea id="field-cause" name="cause" rows="3"');
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="field-cause-error field-cause-hint"');
    expect(html).toContain("กรุณากรอก Cause");
  });

  it("takes a custom id and rows", () => {
    const html = renderToStaticMarkup(
      <TextAreaField label="Notes" name="notes" id="notes-1" rows={6} />,
    );

    expect(html).toContain('id="notes-1"');
    expect(html).toContain('rows="6"');
    expect(html).not.toContain("aria-invalid");
  });
});

describe("SelectField", () => {
  const options = [
    { value: "a", label: "Alpha" },
    { value: "b", label: "Beta" },
  ];

  it("renders the placeholder first and every option", () => {
    const html = renderToStaticMarkup(
      <SelectField label="Machine" name="machineId" options={options} placeholder="Select a machine" />,
    );

    expect(html).toMatch(
      /<option value="">Select a machine<\/option><option value="a">Alpha<\/option><option value="b">Beta<\/option>/,
    );
    expect(html).toContain('for="field-machineId"');
  });

  it("has no placeholder option unless asked", () => {
    const html = renderToStaticMarkup(
      <SelectField label="Status" name="status" options={options} />,
    );

    expect(html).not.toContain('value=""');
  });

  it("shows the error under the field and marks it invalid", () => {
    const html = renderToStaticMarkup(
      <SelectField label="Status" name="status" options={options} error="กรุณาเลือกสถานะ" />,
    );

    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="field-status-error"');
    expect(html).toContain("กรุณาเลือกสถานะ");
  });
});
