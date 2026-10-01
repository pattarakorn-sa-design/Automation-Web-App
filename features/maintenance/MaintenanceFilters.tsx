import Form from "next/form";
import Link from "next/link";
import type { MachineOption } from "@/features/machines/queries";
import type { ProfileOption } from "@/features/users/queries";
import {
  hasActiveMaintenanceFilters,
  type MaintenanceFilters as Filters,
} from "./filters";
import { MAINTENANCE_STATUSES } from "./rules";

const controlClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:outline-2 focus:outline-offset-0 focus:outline-blue-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";

// REQ-SRC-03: filter by machine, status and technician. Values are kept in
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
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1.5fr_auto] lg:items-end"
    >
      <div className="flex flex-col gap-1.5">
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

      <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
        <button
          type="submit"
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 lg:flex-none"
        >
          Search
        </button>
        {hasActiveMaintenanceFilters(filters) ? (
          <Link
            href="/maintenance"
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100 lg:flex-none dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Clear
          </Link>
        ) : null}
      </div>
    </Form>
  );
}
