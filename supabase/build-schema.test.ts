import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { buildSchema } from "./build-schema.mjs";

const dir = import.meta.dirname;

describe("supabase/schema.sql", () => {
  it("is up to date with the migrations (run npm run db:schema)", () => {
    const committed = readFileSync(join(dir, "schema.sql"), "utf8");
    expect(committed).toBe(buildSchema(join(dir, "migrations")));
  });

  it("contains every migration once, in file name order", () => {
    const schema = buildSchema(join(dir, "migrations"));
    const files = readdirSync(join(dir, "migrations"))
      .filter((name) => name.endsWith(".sql"))
      .sort();
    const positions = files.map((name) => schema.indexOf(`-- ===== ${name} =====`));
    expect(positions.every((position) => position > 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });
});
