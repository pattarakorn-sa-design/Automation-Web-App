import Form from "next/form";
import Link from "next/link";
import { hasActiveFilters, type MachineFilters as Filters } from "./filters";
import { MACHINE_STATUSES } from "./schema";

// h-10 on every control and button keeps the search box, the selects and the
// buttons the same height, so they line up in one row.
const controlClass =
  "h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900 shadow-sm focus:outline-2 focus:outline-offset-0 focus:outline-blue-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100";

// Search and filters live in the URL (REQ-SRC-05): the form submits with GET,
// so refreshing or sharing the link keeps the same results. Submitting always
// goes back to page 1 because "page" is not one of the fields.
export default function MachineFilters({
  filters,
  types,
}: {
  filters: Filters;
  types: string[];
}) {
  return (
    <Form
      action="/machines"
      role="search"
      className="grid grid-cols-2 gap-3 lg:grid-cols-[2fr_1fr_1fr_auto] lg:items-end"
    >
      <div className="col-span-2 flex flex-col gap-1.5 lg:col-span-1">
        <label htmlFor="filter-q" className="text-sm font-medium">
          Search
        </label>
        <input
          id="filter-q"
          name="q"
          type="search"
          defaultValue={filters.q}
          placeholder="Machine ID or name"
          maxLength={50}
          className={controlClass}
        />
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
          {MACHINE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="filter-type" className="text-sm font-medium">
          Type
        </label>
        <select
          id="filter-type"
          name="type"
          defaultValue={filters.type ?? ""}
          className={controlClass}
        >
          <option value="">All types</option>
          {types.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      <div className="col-span-2 flex gap-2 lg:col-span-1">
        <button
          type="submit"
          className="h-10 flex-1 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 lg:flex-none"
        >
          Search
        </button>
        {hasActiveFilters(filters) ? (
          <Link
            href="/machines"
            className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-gray-300 px-4 text-sm font-medium text-gray-700 hover:bg-gray-100 lg:flex-none dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Clear
          </Link>
        ) : null}
      </div>
    </Form>
  );
}
