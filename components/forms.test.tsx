import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import LoginCard from "./LoginCard";
import SubmitButton from "./SubmitButton";
import TextField from "./TextField";

describe("TextField", () => {
  it("links the label to the input", () => {
    const html = renderToStaticMarkup(<TextField label="Email" name="email" />);

    expect(html).toContain('for="field-email"');
    expect(html).toContain('id="field-email"');
    expect(html).toContain('name="email"');
  });

  it("shows the error under the field and marks the input invalid", () => {
    const html = renderToStaticMarkup(
      <TextField label="Email" name="email" error="กรุณากรอก Email" />,
    );

    expect(html).toContain("กรุณากรอก Email");
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-describedby="field-email-error"');
  });

  it("does not mark the input invalid when there is no error", () => {
    const html = renderToStaticMarkup(<TextField label="Email" name="email" />);

    expect(html).not.toContain("aria-invalid");
    expect(html).not.toContain("aria-describedby");
  });

  it("uses a custom id for the input, label, error and hint", () => {
    const html = renderToStaticMarkup(
      <TextField
        label="Name"
        name="fullName"
        id="name-user-1"
        error="กรุณากรอกชื่อ"
        hint="ไม่เกิน 100 ตัวอักษร"
      />,
    );

    expect(html).toContain('for="name-user-1"');
    expect(html).toContain('id="name-user-1"');
    expect(html).toContain('id="name-user-1-error"');
    expect(html).toContain('id="name-user-1-hint"');
    expect(html).toContain('aria-describedby="name-user-1-error name-user-1-hint"');
    expect(html).not.toContain("field-fullName");
  });

  it("gives every row a unique id when the field name repeats", () => {
    const html = renderToStaticMarkup(
      <>
        <TextField label="Name" name="fullName" id="name-user-1" error="ผิด" />
        <TextField label="Name" name="fullName" id="name-user-2" error="ผิด" />
      </>,
    );

    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("passes input attributes through", () => {
    const html = renderToStaticMarkup(
      <TextField
        label="รหัสผ่าน"
        name="password"
        type="password"
        autoComplete="current-password"
        required
      />,
    );

    expect(html).toContain('type="password"');
    expect(html).toContain('autoComplete="current-password"');
    expect(html).toContain("required");
  });
});

describe("SubmitButton", () => {
  it("renders an enabled submit button outside of a pending form", () => {
    const html = renderToStaticMarkup(<SubmitButton>Sign in</SubmitButton>);

    expect(html).toContain('type="submit"');
    expect(html).toContain("Sign in");
    // Match the attribute itself, not the "disabled:" Tailwind classes.
    expect(html).not.toMatch(/\sdisabled(=|\s|>)/);
  });
});

describe("LoginCard", () => {
  it("renders its children and no alert by default", () => {
    const html = renderToStaticMarkup(
      <LoginCard>
        <span>form goes here</span>
      </LoginCard>,
    );

    expect(html).toContain("form goes here");
    expect(html).toContain("Sign in to continue");
    expect(html).not.toContain('role="alert"');
  });

  it("shows a custom description under the title", () => {
    const html = renderToStaticMarkup(
      <LoginCard description="Sign in with your admin account">
        <span />
      </LoginCard>,
    );

    expect(html).toContain("Sign in with your admin account");
    expect(html).not.toContain("Sign in to continue");
  });

  it("shows a form-level error as an alert", () => {
    const html = renderToStaticMarkup(
      <LoginCard error="Email หรือรหัสผ่านไม่ถูกต้อง">
        <span />
      </LoginCard>,
    );

    expect(html).toContain('role="alert"');
    expect(html).toContain("Email หรือรหัสผ่านไม่ถูกต้อง");
  });
});
