import Link from "next/link";
import { formatDate } from "@/lib/format";
import MaintenanceStatusBadge from "./MaintenanceStatusBadge";
import type { MaintenanceListItem } from "./queries";

const columns = ["Start", "Machine", "Problem", "Type", "Technician", "Status"];

// Maintenance list, newest start date first. Below the lg breakpoint (1024 px)
// each record is a card, so the status and the technician stay visible on a
// 360 px screen; from lg up it is a table (same pattern as the alarm list,
// which also switches at lg because it has six wide columns).
export default function MaintenanceTable({ records }: { records: MaintenanceListItem[] }) {
  return (
    <>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:hidden">
        {records.map((record) => (
          <li
            key={record.id}
            className="relative flex flex-col gap-1 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {record.machine ? (
                  <>
                    <span className="font-mono">{record.machine.machine_code}</span>
                    {" · "}
                  </>
                ) : null}
                {record.type}
              </p>
              <MaintenanceStatusBadge status={record.status} />
            </div>
            {/* The link covers the whole card, so the card is one tap target. */}
            <Link
              href={`/maintenance/${record.id}`}
              className="line-clamp-2 font-medium text-blue-700 after:absolute after:inset-0 dark:text-blue-400"
            >
              {record.problem}
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {record.technician?.full_name ?? "–"} · {formatDate(record.start_date)}
            </p>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-lg border border-gray-200 lg:block dark:border-gray-800">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400">
            <tr>
              {columns.map((column) => (
                <th key={column} scope="col" className="px-4 py-3 font-medium">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
            {records.map((record) => (
              <tr
                key={record.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                <td className="whitespace-nowrap px-4 py-3">{formatDate(record.start_date)}</td>
                <td className="whitespace-nowrap px-4 py-3 font-mono">
                  {record.machine ? (
                    <Link
                      href={`/machines/${record.machine.id}`}
                      className="text-blue-700 underline-offset-2 hover:underline dark:text-blue-400"
                    >
                      {record.machine.machine_code}
                    </Link>
                  ) : (
                    "–"
                  )}
                </td>
                <td className="max-w-xs truncate px-4 py-3" title={record.problem}>
                  <Link
                    href={`/maintenance/${record.id}`}
                    className="text-blue-700 underline-offset-2 hover:underline dark:text-blue-400"
                  >
                    {record.problem}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3">{record.type}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  {record.technician?.full_name ?? "–"}
                </td>
                <td className="px-4 py-3">
                  <MaintenanceStatusBadge status={record.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
