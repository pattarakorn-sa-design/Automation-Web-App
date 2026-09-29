<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Alarm & Maintenance Management System

A web app for a factory to manage machines, alarms and maintenance work, built as a
two-person university project. The instructor grades the running system **and the
commit history**, so how work is committed matters as much as the code.

- Requirements, permission matrix, business rules and validation rules: `docs/REQUIREMENTS.md`.
  Read it before building a feature. Do not invent requirements; if something is unclear, ask.
- Team notes (setup gotchas, CI and test conventions): `docs/NOTES.md`. Read it after pulling.
  Add an entry there when you change something the other person will trip over.
- Stack: Next.js 16 (App Router, TypeScript), Tailwind CSS v4, Supabase (Postgres + Auth + RLS),
  GitHub Actions for CI, Vercel for hosting.

## Team and ownership

| Area | Owner |
|---|---|
| Database schema, migrations, RLS policies | Pattarakorn |
| Auth, `proxy.ts`, role checks, Server Actions, queries, business rules | Pattarakorn |
| Shared UI components, page styling and layout, dark mode, responsive | Phakkatima |
| GitHub Actions CI, test runner setup, seed data, README, screenshots | Phakkatima |

When working on a `design/*` branch, change only markup, styling and files under `components/`.
Do not change Server Actions, data fetching, validation schemas, migrations, RLS policies or
`lib/supabase/`. If a UI change needs one of those, stop and ask the owner instead of editing it.

## Git workflow

- Never commit directly to `main`. Branch from an up-to-date `main`, then open a Pull Request.
- Branch names: `feat/<name>`, `design/<name>`, `ci/<name>`, `docs/<name>`, `chore/<name>`.
- Make small commits, one logical change each. Do not squash a whole feature into one commit.
- Commit messages: short English imperative summary, e.g. `Add machine create form validation`.
- **Commit messages, PR descriptions and code comments must not mention AI tools.**
  No `Co-Authored-By` trailers for AI assistants and no "Generated with ..." footers.
- The other team member reviews and merges the PR. CI must pass before merging.
- Never force-push `main` or a branch someone else is working on.
- Personal AI-assistant config files other than this `AGENTS.md` stay local: list them in
  `.git/info/exclude` instead of committing them.

## Before every commit

Run and make sure all pass:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

## Project structure

```
app/                 routes, layouts, pages
components/          reusable UI (StatusBadge, EmptyState, ErrorState, ConfirmDialog, ...)
features/<domain>/   code for one domain: auth, machines, alarms, maintenance, dashboard
                     (server actions, queries, validation schemas, domain components)
lib/supabase/        Supabase clients: client.ts (browser), server.ts (server only)
types/               shared TypeScript types, including database types
supabase/migrations/ SQL migrations, one file per change
docs/                requirements and project documents
```

Organise code by domain, not by page. Keep UI, business rules and data access separate.

## Architecture rules

- Server Components by default. Add `"use client"` only to the subtree that needs state,
  event handlers or browser APIs.
- All writes go through Server Actions (or Route Handlers). Each one checks the user's role on the
  server before touching the database.
- Row Level Security is enabled on every table and mirrors the permission matrix. RLS is the last
  line of defence; hiding a button in the UI is never authorization.
- Validate twice: on the client for instant feedback and on the server with the same zod schema.
  The database also enforces constraints (NOT NULL, UNIQUE, CHECK, foreign keys).
- Route protection lives in `proxy.ts`. In Next.js 16 `middleware.ts` was renamed to `proxy.ts`.
- Create a new server Supabase client per request with `createClient()` from `lib/supabase/server.ts`.
- Lists are paginated and counts use database aggregates; never fetch all rows to count them.

## Security rules

- The only Supabase values allowed in the browser are `NEXT_PUBLIC_SUPABASE_URL` and
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- `SUPABASE_SECRET_KEY` bypasses RLS. Use it only in server-only code, never with a `NEXT_PUBLIC_`
  prefix, never in a Client Component, never in a commit.
- Never commit `.env.local` or any real key. Only `.env.example` (names, no values) is committed.
- Never print secrets in logs, error messages or screenshots.

## UI conventions

- UI text in English. Validation and error messages shown to users in Thai.
- Status badges always show text as well as colour:
  Running = green, Stop = gray, Alarm = red, Maintenance = yellow.
- Show an error message under the field that failed and say how to fix it.
- Disable the submit button while a form is submitting.
- Show a clear "ไม่พบข้อมูล" empty state instead of an empty table, and a readable error state
  instead of a blank page when loading fails.
- Layouts must work from 360 px wide screens upward.
