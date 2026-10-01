import Form from "next/form";
import Link from "next/link";
import DateRangeFields from "@/components/DateRangeFields";
import type { MachineOption } from "@/features/machines/queries";
import type { ProfileOption } from "@/features/users/queries";
import {
  hasActiveMaintenanceFilters,
  type MaintenanceFilters as Filters,
} from "./filters";
import { MAINTENANCE_STATUSES } from "./rules";

// h-10 on every control and button, the same as the machine and alarm filters,
// so the filter bars look alike and line up (six columns on wide screens).
const controlClass =
  "h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm focus:outline-2 focus:outline-offset-0 focus:outline-blue-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";

// REQ-SRC-03, REQ-SRC-06: filter by machine, status, technician and start date. Values are kept in
// the URL (REQ-SRC-05); submitting always returns to page 1.
export default function MaintenanceFilters({
  filters,
  machines,
  people,
}: {
  filters: Filters;
  machines: MachineOption[];
  people: ProfileOption[];
}) {
  return (
    <Form
      action="/maintenance"
      role="search"
      className="grid grid-cols-2 gap-3 lg:grid-cols-6 lg:items-start"
    >
      <div className="col-span-2 flex flex-col gap-1.5">
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
          {MAINTENANCE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="filter-technician" className="text-sm font-medium">
          Technician
        </label>
        <select
          id="filter-technician"
          name="technician"
          defaultValue={filters.technician ?? ""}
          className={controlClass}
        >
          <option value="">All technicians</option>
          {people.map((person) => (
            <option key={person.id} value={person.id}>
              {person.full_name}
            </option>
          ))}
        </select>
      </div>

      <DateRangeFields
        from={filters.from}
        to={filters.to}
        invalidRange={filters.invalidRange}
        fromLabel="Started from"
        toLabel="Started to"
        inputClassName={controlClass}
        className="col-span-2"
      />

      <div className="col-span-2 flex gap-2 lg:col-span-6 lg:justify-end">
        <button
          type="submit"
          className="h-10 flex-1 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 lg:flex-none"
        >
          Search
        </button>
        {hasActiveMaintenanceFilters(filters) ? (
          <Link
            href="/maintenance"
            className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-100 lg:flex-none dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Clear
          </Link>
        ) : null}
      </div>
    </Form>
  );
}
