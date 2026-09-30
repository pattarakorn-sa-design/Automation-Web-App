import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import type { Machine } from "./queries";

// Machine list. On narrow screens only the table scrolls sideways, not the page.
export default function MachineTable({ machines }: { machines: Machine[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <thead className="bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              Machine ID
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Name
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Type
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Location
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
          {machines.map((machine) => (
            <tr key={machine.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
              <td className="px-4 py-3 font-mono font-medium">
                <Link
                  href={`/machines/${machine.id}`}
                  className="text-blue-700 underline-offset-2 hover:underline dark:text-blue-400"
                >
                  {machine.machine_code}
                </Link>
              </td>
              <td className="px-4 py-3">{machine.name}</td>
              <td className="px-4 py-3">{machine.type}</td>
              <td className="px-4 py-3">{machine.location}</td>
              <td className="px-4 py-3">
                <StatusBadge status={machine.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
