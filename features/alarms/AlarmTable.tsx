import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import AlarmStatusBadge from "./AlarmStatusBadge";
import type { AlarmListItem } from "./queries";

const columns = ["Occurred", "Machine", "Alarm code", "Description", "Status"];

// Alarm list, newest first. Below the lg breakpoint (1024 px) each alarm is a card, so
// the status and the description stay visible on a 360 px screen; from lg up
// it is a table (same pattern as the machine list).
export default function AlarmTable({ alarms }: { alarms: AlarmListItem[] }) {
  return (
    <>
      <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:hidden">
        {alarms.map((alarm) => (
          <li
            key={alarm.id}
            className="relative flex flex-col gap-1 rounded-lg border border-gray-200 p-4 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
          >
            <div className="flex items-center justify-between gap-3">
              {/* The link covers the whole card, so the card is one tap target. */}
              <Link
                href={`/alarms/${alarm.id}`}
                className="font-mono font-semibold text-blue-700 after:absolute after:inset-0 dark:text-blue-400"
              >
                {alarm.alarm_code}
              </Link>
              <AlarmStatusBadge status={alarm.status} />
            </div>
            <p className="line-clamp-2">{alarm.description}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {alarm.machine ? (
                <>
                  <span className="font-mono">{alarm.machine.machine_code}</span>
                  {" · "}
                </>
              ) : null}
              {formatDateTime(alarm.occurred_at)}
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
            {alarms.map((alarm) => (
              <tr
                key={alarm.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-900"
              >
                <td className="whitespace-nowrap px-4 py-3">
                  {formatDateTime(alarm.occurred_at)}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono">
                  {alarm.machine ? (
                    <Link
                      href={`/machines/${alarm.machine.id}`}
                      className="text-blue-700 underline-offset-2 hover:underline dark:text-blue-400"
                    >
                      {alarm.machine.machine_code}
                    </Link>
                  ) : (
                    "–"
                  )}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-mono font-medium">
                  <Link
                    href={`/alarms/${alarm.id}`}
                    className="text-blue-700 underline-offset-2 hover:underline dark:text-blue-400"
                  >
                    {alarm.alarm_code}
                  </Link>
                </td>
                <td className="max-w-xs truncate px-4 py-3" title={alarm.description}>
                  {alarm.description}
                </td>
                <td className="px-4 py-3">
                  <AlarmStatusBadge status={alarm.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
