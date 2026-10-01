import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import type { Machine } from "./queries";

const columns = ["Machine ID", "Name", "Type", "Location", "Status"];

// Machine list. Below the md breakpoint each machine is a card, so the status
// stays visible on a 360 px screen; from md up it is a table.
export default function MachineTable({ machines }: { machines: Machine[] }) {
  return (
    <>
      <ul className="flex flex-col gap-3 md:hidden">
        {machines.map((machine) => (
          <li
            key={machine.id}
            className="relative flex flex-col gap-1 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
          >
            <div className="flex items-center justify-between gap-3">
              {/* The link covers the whole card, so the card is one tap target. */}
              <Link
                href={`/machines/${machine.id}`}
                className="font-mono font-medium text-blue-700 after:absolute after:inset-0 dark:text-blue-400"
              >
                {machine.machine_code}
              </Link>
              <StatusBadge status={machine.status} />
            </div>
            <p className="font-medium">{machine.name}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {machine.type} · {machine.location}
            </p>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-lg border border-gray-200 md:block dark:border-gray-800">
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
            {machines.map((machine) => (
              <tr
                key={machine.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-900"
              >
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
    </>
  );
}
