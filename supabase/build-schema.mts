// Builds supabase/schema.sql, the whole database schema in one file for the
// project submission (plan 11.3), from the migrations in the order they run.
// The migrations stay the source of truth; a test fails when schema.sql is out
// of date. Run with `npm run db:schema` after adding a migration.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const HEADER = `-- Alarm & Maintenance Management System: database schema
--
-- Generated from supabase/migrations/ by \`npm run db:schema\`. Do not edit this
-- file by hand: add a migration and run the command again.
--
-- It creates the tables, enums, constraints, indexes, triggers, functions and
-- Row Level Security policies of the public schema, in migration order. It
-- expects a Supabase project (auth.users, auth.uid() and the authenticated
-- role). Sample data is separate, in supabase/seed.sql.
`;

export function buildSchema(migrationsDir: string): string {
  const files = readdirSync(migrationsDir)
    .filter((name) => name.endsWith(".sql"))
    .sort();
  const parts = files.map((name) => {
    const sql = readFileSync(join(migrationsDir, name), "utf8").trimEnd();
    return `-- ===== ${name} =====\n\n${sql}\n`;
  });
  return `${HEADER}\n${parts.join("\n")}`;
}

if (process.argv[1]?.endsWith("build-schema.mts")) {
  const dir = join(import.meta.dirname, "migrations");
  writeFileSync(join(import.meta.dirname, "schema.sql"), buildSchema(dir));
  console.log("Wrote supabase/schema.sql");
}
