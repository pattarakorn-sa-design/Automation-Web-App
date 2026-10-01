import Form from "next/form";
import Link from "next/link";
import type { MachineOption } from "@/features/machines/queries";
import { hasActiveAlarmFilters, type AlarmFilters as Filters } from "./filters";
import { ALARM_STATUSES } from "./status";

// h-10 on every control and button keeps the selects, the search box and the
// buttons the same height, so they line up in one row.
const controlClass =
  "h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm focus:outline-2 focus:outline-offset-0 focus:outline-blue-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";

// REQ-SRC-02: filter by machine, status and alarm code. Values are kept in
// the URL (REQ-SRC-05); submitting always returns to page 1.
export default function AlarmFilters({
  filters,
  machines,
}: {
  filters: Filters;
  machines: MachineOption[];
}) {
  return (
    <Form
      action="/alarms"
      role="search"
      className="grid grid-cols-2 gap-3 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-end"
    >
      <div className="col-span-2 flex flex-col gap-1.5 lg:col-span-1">
        <label htmlFor="filter-machine" className="text-sm font-medium">
          Machine
        </label>
        <select
          id="filter-machine"
          name="machine"
          defaultValue={filters.machine ?? ""}
          className={controlClass}
        >
          <option value="">All machines</option>
          {machines.map((machine) => (
            <option key={machine.id} value={machine.id}>
              {machine.machine_code} · {machine.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="filter-status" className="text-sm font-medium">
          Status
        </label>
        <select
          id="filter-status"
          name="status"
          defaultValue={filters.status ?? ""}
          className={controlClass}
        >
          <option value="">All statuses</option>
          {ALARM_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="filter-code" className="text-sm font-medium">
          Alarm code
        </label>
        <input
          id="filter-code"
          name="code"
          type="search"
          defaultValue={filters.code}
          placeholder="e.g. E-101"
          maxLength={20}
          className={controlClass}
        />
      </div>

      <div className="col-span-2 flex gap-2 lg:col-span-1">
        <button
          type="submit"
          className="h-10 flex-1 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 lg:flex-none"
        >
          Search
        </button>
        {hasActiveAlarmFilters(filters) ? (
          <Link
            href="/alarms"
            className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-100 lg:flex-none dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Clear
          </Link>
        ) : null}
      </div>
    </Form>
  );
}
