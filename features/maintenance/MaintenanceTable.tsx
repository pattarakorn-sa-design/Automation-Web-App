import Link from "next/link";
import { formatDate } from "@/lib/format";
import MaintenanceStatusBadge from "./MaintenanceStatusBadge";
import type { MaintenanceListItem } from "./queries";

// Maintenance list, newest start date first. On narrow screens only the
// table scrolls sideways.
export default function MaintenanceTable({ records }: { records: MaintenanceListItem[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
      <table className="w-full min-w-[48rem] text-left text-sm">
        <thead className="bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              Start
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Machine
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Problem
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Type
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Technician
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
          {records.map((record) => (
            <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
              <td className="whitespace-nowrap px-4 py-3">{formatDate(record.start_date)}</td>
              <td className="px-4 py-3 font-mono">
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
              <td className="px-4 py-3">{record.type}</td>
              <td className="px-4 py-3">{record.technician?.full_name ?? "–"}</td>
              <td className="px-4 py-3">
                <MaintenanceStatusBadge status={record.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
