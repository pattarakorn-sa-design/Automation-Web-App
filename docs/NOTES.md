# Team Notes

Things worth knowing that are not obvious from the code. Read this after pulling.
Add a new entry at the top when you change something the other person will trip over.
Keep entries short, in English, and do not mention AI tools.

## Schema file (plan 11.3, `supabase/schema.sql`)

- `supabase/schema.sql` is every migration joined in file name order, for the submission. It is
  generated: after adding a migration run `npm run db:schema` and commit both files. A test fails
  when the file is out of date, so CI catches a forgotten update.
- It was run as one script inside a single transaction on a fresh Postgres (PGlite, with stand-ins
  for `auth.users` and `auth.uid()`), then `seed.sql`: 4 tables with RLS, 5 enums, 13 policies,
  8 triggers, and 10 / 9 / 8 seed rows. Adding the `viewer` enum value in the same transaction is
  fine because nothing in the file uses that value as a literal.
- The builder is `supabase/build-schema.mts`. The `.mts` extension makes Node run it as an ES
  module; a `.ts` file prints a MODULE_TYPELESS_PACKAGE_JSON warning unless package.json sets
  `"type": "module"`, which we do not want to change for the whole project.

## Manual test checklist (`docs/TEST_CHECKLIST.md`)

- Each main table has three result columns: **A** (Admin), **T** (Technician) and **V** (Viewer). Use `-` for a role the
  case does not apply to. Add a new case to every table that has the role it affects, and keep the IDs unique.
- Test records cannot be deleted from the app: alarms have no delete, and a machine with an alarm or maintenance record cannot
  be deleted. Use a dedicated test machine (`TST-001`) and `TST-` alarm codes, close what you create, and run the Dashboard
  count case (TC-DSH-01) before creating test data. After the Vercel test round the database owner deletes the `TST-001` rows
  in the SQL Editor and checks that the Dashboard is back to the seed numbers (Notes item 4 of the checklist).
- Search and filter cases use the seed codes (`INJ-002`, `CNC-001`, ...). Do not use a machine code that is not in `supabase/seed.sql`.
- The date range cases need alarms at 23:30 and 00:30 Bangkok time on consecutive days, because that is where a filter that
  uses UTC days goes wrong. Occurred At is typed in Bangkok time.

## Viewer role (plan 9.3, REQ-AUTH-08)

- `app_role` has a third value, `viewer`: read-only. Viewers see every page other signed-in users
  see, can export CSV and edit their own display name, and nothing else. An admin sets the role on
  the Users page; new sign-ups still start as `technician`.
- No RLS policy changed. Every write policy, trigger and `requireRole()` call names the roles it
  allows, so a viewer is refused everywhere. Keep it that way: write `role in ('admin',
  'technician')` or `isWorkerRole(role)`, never `role <> 'admin'` / `role !== "admin"`, which
  would let a viewer through.
- Trigger `maintenance_records_enforce_assignee_role` (function
  `enforce_maintenance_assignee_role`) only lets an admin or technician be the responsible person.
  It checks inserts and changes of `technician_id` only, so a record whose technician later became a
  viewer can still be edited. Its error is 23514 with `maintenance_records_technician_role` in the
  message, mapped to a Thai message on the Technician field.
- When a page hides a form from a viewer, also check the text shown instead. The alarm page first
  told viewers "This alarm is closed" on open alarms (issue #56); `alarmReadOnlyMessage()` in
  `features/alarms/status.ts` now picks the message by role and status.
- The two migrations must run in order and as separate runs: Postgres cannot use a new enum value in
  the transaction that added it. After running them, run `npm run db:types`.
- The migrations were tested on a throwaway in-memory Postgres (PGlite) with stand-ins for
  `auth.users` and `auth.uid()`: a viewer reads machines, alarms and profiles, every write is refused,
  and an admin cannot assign maintenance to a viewer.

## Date range filter (plan 9.2, `lib/dateRange.ts`)

- Alarms filter by the day they occurred, Maintenance by start date. The URL keys are `from` and
  `to` ("YYYY-MM-DD"), both days included, and the export buttons pass them on, so a CSV covers
  the same range as the list.
- `occurred_at` is a timestamp, so a day means a Bangkok day: `timestampBounds()` turns
  `to=2026-09-30` into `occurred_at < 2026-09-30T17:00Z` (midnight in Bangkok after that day). Do
  not compare it with the plain date: Vercel runs in UTC and alarms after 17:00 would land on the
  wrong day. `start_date` is a date column and is compared as it is (`dateBounds()`).
- A value that is not a real date is dropped like other bad filter values. When `from` is after
  `to`, both stay in the form, `invalidRange` is true, a Thai message shows under the fields and
  the list is not filtered by date. Queries must go through `timestampBounds` / `dateBounds`,
  which return no bounds for an invalid range.
- On wide screens the filter fields are one row of six columns and Search / Clear sit on their own
  row; below `lg` the two dates share a row.

## Dark mode (plan 9.5, `components/theme.ts`, `components/ThemeToggle.tsx`)

- Dark mode is the `dark` class on `<html>`, not `prefers-color-scheme`. `app/globals.css` has
  `@custom-variant dark (&:where(.dark, .dark *))`, so every `dark:` class in the app keeps working
  and follows the class. The CSS variables for the page colours and `color-scheme` are set on `.dark`
  (`color-scheme` makes native controls such as date pickers and select lists match).
- The user picks Light, Dark or System with the button in the navbar. The choice is saved in
  `localStorage` under `theme`; System means "no value" (the button removes the key) and follows the
  device, also while the page is open.
- `themeInitScript` (in `theme.ts`) is inlined in `<head>` by `app/layout.tsx` and adds the class
  before the first paint, so a saved dark theme never shows a white page first. It runs as plain
  text, so it must not import anything. `<html>` has `suppressHydrationWarning` because the class
  list differs from what the server rendered. A strict Content Security Policy that blocks inline
  scripts would break it: add a nonce if one is ever set (see the Next.js CSP guide).
- Reading `localStorage` throws when site data is blocked. The script and the button both catch it
  and fall back to the device setting (the button keeps its choice in memory until reload).
- With several tabs open, a change made in one tab reaches the others as a `storage` event.
  `subscribe()` in `components/themeStore.ts` applies it to the page as well as to the button: if
  only the button re-rendered, its label would say Dark while the page stayed light. The theme logic
  (read, apply, save, subscribe) is in `themeStore.ts`, without React, so it can be tested with a
  stand-in window. To check this by hand, open two tabs of the same site and press the button in one.
- The button is not on `/login` (the navbar is not shown there). The login page still follows the
  saved choice or the device.
- To look at a page in dark mode without changing the device: run
  `localStorage.setItem("theme", "dark")` in the browser console and reload, or press the button.
  Do not test dark mode only by flipping the operating system setting any more: a saved choice
  overrides it.
- If a new component uses its own colours, give it `dark:` classes like the shared components do.

## CSV export (plan 9.4, `lib/export.ts`)

- `exportAlarms(filters)` and `exportMaintenance(filters)` in each domain's `queries.ts` return
  `{ rows, truncated }`. They take the same filters as the list pages (use
  `parseAlarmFilters` / `parseMaintenanceFilters` on the request URL), ignore `page`, and keep the
  list order. Do not reuse `listAlarms` / `listMaintenance` for exports: they return one page.
- At most `EXPORT_ROW_LIMIT` (5000) rows. The query asks for one extra row; `truncated: true` means
  more rows matched, so tell the user (e.g. a note in the file name or a header) instead of
  silently cutting the file.
- Supabase returns at most "Max rows" rows per request (Project Settings > API, 1000 by default)
  and cuts a bigger `.limit()` without an error (issue #42). So the exports read pages of 1000 with
  `fetchExportRows()` in `lib/export.ts` until 5001 rows or an empty page, and sort by `id` last so
  rows cannot move between pages. Any new query that may return more than 1000 rows needs the same.
- Rows are read with the signed-in user's client, so RLS still applies. Call `requireUser()` in
  the Route Handler before calling them. Times are UTC ISO strings; format them with
  `formatDateTime` so the file shows Bangkok time like the screen.
- If an export query throws, call `logLoadError("alarms export", error)` (see below) and return
  a 500 response with a Thai message instead of an empty file.
- The export is built from three layers: `lib/csv.ts` (`toCsv`, `csvResponse`, `csvErrorResponse`,
  pure and shared), `features/alarms/csv.ts` / `features/maintenance/csv.ts` (which columns, in which
  format) and the Route Handlers `app/alarms/export/route.ts` / `app/maintenance/export/route.ts`.
  To add or reorder a column, change the `HEADER` array and the row mapping in the domain's `csv.ts`.
- `lib/csv.ts` quotes every cell, doubles `"`, puts a `'` before a cell starting with `=`, `+`, `-`,
  `@`, tab or carriage return (CSV injection), starts the file with a byte order mark so Excel shows
  Thai, and ends lines with CRLF. A file cut at the row limit is named `...-partial.csv`.
- The buttons are plain `<a href="/alarms/export?...">` links, not `next/link`: `Link` would try to
  navigate to a page instead of downloading a file. They carry the current filters and leave out
  `page`, because an export is not paginated.
- In a test, `response.text()` removes a leading byte order mark when it decodes. To check the BOM,
  read the bytes (`new Uint8Array(await response.arrayBuffer())`, first three are `EF BB BF`).
- Not checked in a real Excel yet: the tests read the file back with an RFC 4180 reader and check
  the BOM bytes, but opening the downloaded file in Excel (Thai text, a description with a comma and
  a new line) is still a manual step, TC-BNS-04.

## Logging load errors (`lib/log.ts`)

- Every `catch` that shows an `ErrorState` or falls back to empty data calls
  `logLoadError("where", error)` first, so the cause appears in Vercel > Logs (or the browser
  console for Client Components) while the user sees the Thai message. A silent `catch` left
  nothing to debug with (issue #35).
- Pass only the error the failing function threw. Never log env values, keys or a Supabase client.

## Dashboard (`features/dashboard/`, `app/page.tsx`)

- Counts come from the database, one `count: "exact", head: true` query per status (no rows are
  sent), and `buildSummary()` adds them up. Statuses are enums, so per-status counts always add up
  to the totals. "Alarms not closed" = Open + In Progress; "Maintenance not finished" = Pending +
  In Progress.
- If any dashboard query fails, the page shows `ErrorState` instead of numbers (issue #17). When
  Supabase itself is unreachable, `proxy.ts` cannot check the session and sends the user to
  `/login` instead; that is accepted. TC-DSH-06 in `docs/TEST_CHECKLIST.md` tests the error
  state by breaking one query locally.
- The headline number of each card links to the full list, and every status row is one link
  (label and count together, with a hover background)
  to the matching list with its filter in the URL, e.g. `/alarms?status=Open`. Keep the whole row
  clickable when restyling: a link on only the number or only the label was easy to miss. The Logout, Profile and Users links live only in the navbar.
- Every status row in the three cards uses the coloured badge of its list (`StatusBadge`,
  `AlarmStatusBadge`, `MaintenanceStatusBadge`), so the cards read the same way and the rows line up
  across them. A plain-text label looked like a different kind of row next to the machine badges.
  The dashboard was checked at 360, 768 and 1280 px and in dark mode, with four-digit counts too.

## Maintenance (`features/maintenance/`, `app/maintenance/`)

- Who may edit: `canEditMaintenance()` in `rules.ts` (admin: every record, technician: only where
  they are `technician_id`). RLS enforces the same rule. The Edit link and the edit page use it.
- Technicians never choose the technician: the form shows their name, and the Server Action
  replaces whatever was submitted with their own id (`responsibleTechnician()`), so they cannot
  create or hand a record to someone else.
- The "Caused by alarm" select only lists alarms of the selected machine (BR-MNT-03): up to the
  200 newest of that machine, plus the one already linked. The page sends the alarms of the
  preselected machine; when the user picks another machine, the form loads that machine's alarms
  in the browser with `fetchAlarmOptions()` (`features/alarms/options.ts`, a read allowed by RLS).
  Do not fetch alarms of all machines and filter in the browser: older machines lose their
  alarms once 200 newer ones exist elsewhere (issue #27). The database rejects a mismatch too;
  that error is shown under the alarm field.
- Maintenance check violations (`23514`) are told apart by constraint name in `errors.ts`, like
  the alarm errors.
- `start_date` / `end_date` are `date` columns: use `<input type="date">`, `bangkokToday()`,
  `isDateValue()` and `formatDate()` from `lib/format.ts`. No time zone conversion is needed.
- `/maintenance/new?machine=<id>&alarm=<id>` preselects the fields. The alarm page links to it
  ("Record maintenance") and the machine page links with the machine only.
- Option lists for selects: `listProfileOptions()` (`features/users/queries.ts`) and
  `listAlarmOptions()` (`features/alarms/queries.ts`).
- `MaintenanceTable` shows each record as a card below `lg` (1024 px) and as a table from `lg` up,
  like `AlarmTable`: six columns do not fit 768 px. Between 768 and 1023 px the cards sit in two
  columns. The card is one link (to the record), so the machine link is only in the table.

## Alarms (`features/alarms/`, `app/alarms/`)

- Status rules live in `features/alarms/status.ts` (`nextStatuses`, `canChangeStatus`,
  `canUpdateAlarm`) and mirror the database trigger. If a rule changes, change both, or the page
  will offer an option the database then refuses (shown as "เปลี่ยนสถานะนี้ไม่ได้ ...").
- One SQLSTATE can have several causes, so `features/alarms/errors.ts` also reads the constraint
  name or the trigger's text in `error.message` (e.g. `23503` from
  `maintenance_records_alarm_same_machine_fkey` means linked maintenance keeps the alarm on its
  machine, not that the machine is missing). When adding a constraint or a trigger message, add
  its case there with a test.
- Two forms: `AlarmDetailsForm` (admin: machine, code, description, time, cause) on `/alarms/new`
  and `/alarms/[id]/edit`, and `AlarmStatusForm` (admin and technician: status, cause, action
  taken) on `/alarms/[id]`. Technicians see a closed alarm read-only.
- `AlarmTable` uses the same card-plus-table pattern as `MachineTable`, but switches to the table at
  `lg` (1024 px), not `md`: with the description column the table was wider than 768 px and cut off
  the status badge. Between 768 and 1023 px the cards sit in two columns. Choose the breakpoint
  by looking at the widest column set, not by copying the machine list.
- `<input type="datetime-local">` has no time zone. Values are read and written as Bangkok time
  with `toBangkokInputValue()` / `fromBangkokInputValue()` in `lib/format.ts`, because the server
  (Vercel) runs in UTC. Never pass a datetime-local string straight to `new Date()`.
- `/alarms/new?machine=<id>` preselects the machine; the machine page links to it for admins.
- Machine status does not change when an alarm opens or closes (OQ-03). Admins change it on the
  machine's edit page.
- `listMachineOptions()` in `features/machines/queries.ts` returns every machine for a `<select>`.

## Form fields (`components/`)

- `TextAreaField` and `SelectField` take the same props as `TextField` (`label`, `name`, optional
  `id`, `error`, `hint`) and use the same styling. `SelectField` takes `options` as
  `{ value, label }[]` and an optional `placeholder` shown as an empty first option.

## Machines (`features/machines/`, `app/machines/`)

- List filters live in the URL: `/machines?q=cnc&status=Running&type=Robot&page=2`.
  `parseMachineFilters()` drops invalid values instead of failing, and the filter form uses
  `next/form` with GET, so refresh and shared links keep the same results.
- `filters.ts` also has `containsPattern()` (safe ILIKE text for `.or(...)` searches),
  `pageRange()` and `pageCount()` (20 rows per page). Reuse them for the Alarm and Maintenance lists.
- Database errors become Thai messages in `errors.ts` by SQLSTATE: `23505` duplicate Machine ID
  (shown under the field), `23503` machine still has alarms or maintenance, `42501` no permission.
- React resets a form after its action runs, so a failed save would wipe what the user typed.
  The Server Action returns the submitted `values` and the form uses them as `defaultValue`.
- Machine types have no table of their own: the Type filter and the form's suggestions read the
  distinct `type` values from `machines`.
- `MachineTable` shows each machine as a card below `md` (768 px) and as a table from `md` up. A
  table with five columns does not fit 360 px, and the status was off-screen when it only scrolled
  sideways. Use the same card-plus-table pattern for the Alarm and Maintenance lists.
- Every filter control and button has the same height (`h-10`), so the search box, selects and buttons
  line up in one row. Keep that when adding filters.
- `@next/next/no-html-link-for-pages` fails lint when a plain `<a>` points at a real page, even in
  a test. Use `<Link>` in app code, or an in-page `#anchor` in tests.
- Dates: `formatDateTime()` in `lib/format.ts` shows timestamps in Asia/Bangkok time.

## Auth (`features/auth/`, `proxy.ts`)

- `proxy.ts` refreshes the session cookie and sends signed-out users to `/login`. To make a page
  public, add its path to `PUBLIC_PATHS` in `lib/supabase/proxy.ts`. The proxy does not check roles.
- In Server Components and Server Actions (both run on the server):
  - `getCurrentUser()` returns `{ id, email, fullName, role }` or `null`. It is cached per request,
    so calling it in a layout and a page costs one query.
  - `requireUser()` redirects to `/login` when nobody is signed in.
  - `requireRole("admin")` also redirects other roles to `/?error=forbidden`, where the home page
    shows "คุณไม่มีสิทธิ์เข้าหน้านั้น". Call it at the top of every admin page and admin Server Action.
- These helpers are `server-only`. A Client Component (e.g. a navbar that needs the role) gets the
  user as a prop from a Server Component parent instead of importing them.
- Logout: `<form action={signOut}><button type="submit">Logout</button></form>` with `signOut`
  from `features/auth/actions.ts`. It works in both Server and Client Components.
- Supabase Authentication > URL Configuration: Site URL is `https://automation-web-app.vercel.app`,
  and Redirect URLs list that URL and `http://localhost:3000` (each with `/**`). Supabase uses them
  for links in its emails (e.g. password reset). Set them again in any new Supabase project.
- Sign-up is turned off in Supabase (Authentication > Sign In / Providers). New accounts are added
  by the owner in the Supabase dashboard and start as `technician`.
- `proxy.ts` runs on every page, so if `NEXT_PUBLIC_SUPABASE_URL` or
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is missing, every page fails, not just the ones that load
  data. When creating a new Vercel environment or a new local clone, set both before anything else.
- Known limitation, accepted: two admins demoting each other at the same moment could leave no
  admin. It needs two admins acting within the same second, so it is not guarded. To recover, the
  Supabase project owner sets `role = 'admin'` on a profile in the Supabase dashboard.
- `/users` (admin only) edits other users' names and roles; `/profile` lets anyone edit their own
  name. Emails come from the `admin_list_users()` database function, which returns nothing for
  non-admins. `profiles` has no email column on purpose, so technicians cannot see emails.

## Forms pattern (see `features/auth/LoginForm.tsx`, `features/users/`)

- Server Action signature for `useActionState`: `(prevState, formData) => Promise<FormState>`
  returning `fieldErrors` (from `z.flattenError(...).fieldErrors`), `formError` or `success`.
- The Client Component form runs the same zod schema in `onSubmit` and calls `preventDefault()`
  when it fails, so errors show instantly; the Server Action validates again.
- Use `noValidate` on the form so the browser's English popups do not replace the Thai messages.
- After an update, check `.select("id")` returned a row: RLS silently skips rows the user may
  not change instead of returning an error.
- Hide the form-level error while client-side field errors are shown, and hide the "saved"
  message once the user edits the form again (`onChange` on the form), so old messages do not
  stay next to new ones.

## Database (`supabase/migrations/`, `types/database.ts`)

- Schema changes are SQL files in `supabase/migrations/`, applied in filename order in the
  Supabase SQL Editor. Never edit a migration that has already been applied; add a new one.
- `types/database.ts` is generated from the live database. Do not edit it by hand. After a
  schema change, run `npx supabase login` once, then `npm run db:types`, and commit the result.
- Row types: `import type { Tables, Enums } from "@/types/database"`, then
  `Tables<"machines">` or `Enums<"machine_status">`.
- `db:types` is tied to the project ref in `package.json` (not a secret). Only someone with access
  to that Supabase project can run it, so the generated file is committed for everyone else.
- RLS is on for every table. Anonymous users can read nothing. Technicians cannot write machines,
  cannot create alarms, and can only write maintenance records where they are the technician.
  Alarm status changes and who may edit which alarm columns are enforced by a database trigger.
  `created_by` on alarms and maintenance records cannot be changed after insert.
- A technician can only create a maintenance record with `technician_id` = themselves, so the
  maintenance form must lock the Technician field to the current user for technicians.
- Every user can update their own `full_name`, but nobody can change their own `role` (a trigger
  rejects it), so there is always at least one admin left. Admins can change other users' names
  and roles.
- The alarm and maintenance triggers skip their checks when there is no signed-in user
  (SQL Editor, secret key). Server Actions that write alarms or maintenance records must use the
  user's client from `lib/supabase/server.ts`, never `SUPABASE_SECRET_KEY`, or the status rules
  and `closed_by` / `closed_at` will not be applied.

## Seed data (`supabase/seed.sql`)

- Do not insert into `auth.users` or `profiles`: profiles are created by a trigger when a user is
  added in Authentication. Create at least one test user before running the seed, and pick
  existing profile ids with a subquery (e.g. for `technician_id`, which is required).
- The SQL Editor has no signed-in user, so triggers do not fill `closed_by` / `closed_at`.
  A seeded alarm with status `Closed` must set `closed_at`, `cause` and `action_taken` itself.
- A seeded `Completed` maintenance record needs `action_taken` and `end_date`.
- `alarms.occurred_at` cannot be in the future.
- How to run it: apply the migrations, create at least one user, then paste `supabase/seed.sql`
  into the SQL Editor and run it. Without any user it stops with a clear message and inserts nothing.
- It is safe to run again: if the sample machines (`CNC-001` ... `PMP-001`) already exist it does
  nothing. To reload, delete those machines and their alarms and maintenance records first.
- What it adds: 10 machines (Running 6, Stop 2, Alarm 1, Maintenance 1), 9 alarms (Open 3,
  In Progress 2, Closed 4) and 8 maintenance records (Completed 4, In Progress 2, Pending 2).
  Maintenance records are assigned in turn to the technicians that exist; if there are none it uses
  every profile, so it also works with a single admin.
- The counts above are what the Dashboard should show on a fresh seed (see TC-DSH-01 to 04 in
  `docs/TEST_CHECKLIST.md`).

## Shared UI components (`components/`)

Import them instead of writing your own, so every page looks the same.

- `StatusBadge`: `<StatusBadge status="Running" />`. `status` is `"Running" | "Stop" | "Alarm" | "Maintenance"`.
  It exports the `MachineStatus` type. When `types/` gets the database types, switch the import to those.
  It only covers machine status; alarm and maintenance statuses need their own badge.
- `EmptyState`: default text is "ไม่พบข้อมูล". Optional `title`, `description`, `action`.
  Use it instead of an empty table. It is safe in Server Components.
- `ErrorState`: `role="alert"` with a Thai default message. Optional `title`, `message`, `action`
  (put a retry link or button in `action`). Safe in Server Components.
- `ConfirmDialog`: a Client Component built on the native `<dialog>`. You control it with the `open`
  prop and the `onConfirm` / `onCancel` callbacks. Set `destructive` for delete actions and
  `pending` while the Server Action runs; both buttons are disabled while `pending` is true.
  Esc and a click on the backdrop call `onCancel`.
- `Navbar`: the top menu, rendered once in `app/layout.tsx` only when `getCurrentUser()` returns a
  user, so it never shows on `/login`. Do not add your own header to a page. It shows Dashboard,
  Machines, Alarms, Maintenance, and Users for admins only, plus the user's name (link to `/profile`),
  role and a Logout button. On screens below `lg` (1024 px) the menu folds behind a button.
  - To add or hide a menu item, edit `NAV_ITEMS` in `components/navigation.ts` (`roles` limits who
    sees it). This only hides links: the page must still call `requireRole(...)`.
  - Because the layout reads the session, every page (including not-found) is rendered on demand.
- Form pieces, for the login page and later forms. None of them touches auth or data, so wire them to
  your own Server Action:
  - `LoginCard`: centred card with the title. Pass `error` for a form-level message such as
    "Email หรือรหัสผ่านไม่ถูกต้อง" (shown as an alert). Put the fields and button inside as children.
  - `TextField`: label plus input. Pass `name`, `label`, optional `error` (shown under the field)
    and `hint`. Other input props (`type`, `autoComplete`, `required`, `defaultValue`) pass through.
    It is uncontrolled, so it works directly inside `<form action={serverAction}>`.
    The input `id` defaults to `field-<name>`. When one page has several forms with a field of the same
    name (one row per user or machine), pass a unique `id`, e.g. `id={`name-${row.id}`}`; the error and
    hint ids are built from it, so the label and error text point at the right input.
  - `SubmitButton`: a Client Component that disables itself and shows `pendingLabel` (default
    `"Saving..."`, UI text is English) while the parent `<form action>` is submitting (it uses
    `useFormStatus`, so it must be inside the form).
  - Example: `features/auth/LoginForm.tsx` is built from all three. It wraps the form in `LoginCard`
    (passing `state.formError` as `error`) and keeps A's `useActionState` and zod validation as they
    were, so copy that file as the starting point for new forms.
- These components have `dark:` classes already, so they follow the theme (see "Dark mode" at the top).

## Testing (Vitest)

- Run tests with `npm test` (it runs `vitest run` once, no watch mode, so CI never hangs).
- Config is `vitest.config.mts`. Test files are `*.test.ts` / `*.test.tsx` next to the code they test.
- The `@/` import alias works in tests through `resolve.tsconfigPaths`. Do not add `vite-tsconfig-paths`;
  Vitest 5 supports it natively and warns if the plugin is installed.
- Environment is `node`. Add `jsdom` and Testing Library only when a component test needs them.
  Components without state can be tested with `renderToStaticMarkup` from `react-dom/server`
  (see `components/StatusBadge.test.tsx`).
- `lib/supabase/env.ts` reads `process.env` at import time. In tests, use `vi.stubEnv(...)`, then
  `vi.resetModules()` and a dynamic `import()` (see `lib/supabase/env.test.ts`).

## Dependencies

- `@types/node` is `^22` (was `^20`). Vitest 5 has a peer dependency on `@types/node` 22 or newer, so
  `npm install` fails with ERESOLVE on `^20`.
- `npm install` prints an `allow-scripts` warning about `unrs-resolver`. It is harmless.

## CI (`.github/workflows/ci.yml`)

- Runs on every push and on pull requests into `main`: `npm ci`, `npm run lint`, `npm run build`, `npm test` (Node 22).
- `next build` needs the two `NEXT_PUBLIC_SUPABASE_*` variables to exist, so the workflow sets placeholder
  values. No real Supabase key is used in CI. If a build or test starts calling Supabase for real, switch
  those two values to GitHub Secrets (Settings > Secrets and variables > Actions).
- CI must be green before a PR is merged.

## Local checks

- `npx tsc --noEmit` reports `Cannot find name 'LayoutProps'` on a fresh clone. Those types are generated by
  Next.js, so run `npm run build` (or `npx next typegen`) once first, then `tsc` passes.
- `.env.local` is created by hand from `.env.example` and is git-ignored. Never commit it.
- To look at a page at 360 px or in dark mode without a real login, make a temporary page such as
  `app/preview/page.tsx` that renders the components with sample data, and add its path to
  `PUBLIC_PATHS` in `lib/supabase/proxy.ts`. Neither change is ever committed: list the preview folder
  in `.git/info/exclude`, undo the proxy edit, and check `git status` before every commit. A headless
  Chrome can then take screenshots. To see both themes set `localStorage.theme` to `light` or `dark`
  before loading the page (see "Dark mode" at the top).

## Next.js 16

- This is not the Next.js from older docs. Read the matching guide in `node_modules/next/dist/docs/`
  before using an API you are not sure about (for example `proxy.ts` replaces `middleware.ts`).
