import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import AlarmStatusBadge from "./AlarmStatusBadge";
import type { AlarmListItem } from "./queries";

// Alarm list, newest first. On narrow screens only the table scrolls sideways.
export default function AlarmTable({ alarms }: { alarms: AlarmListItem[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-800">
      <table className="w-full min-w-[44rem] text-left text-sm">
        <thead className="bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400">
          <tr>
            <th scope="col" className="px-4 py-3 font-medium">
              Occurred
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Machine
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Alarm code
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Description
            </th>
            <th scope="col" className="px-4 py-3 font-medium">
              Status
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
          {alarms.map((alarm) => (
            <tr key={alarm.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
              <td className="whitespace-nowrap px-4 py-3">
                {formatDateTime(alarm.occurred_at)}
              </td>
              <td className="px-4 py-3 font-mono">
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
              <td className="px-4 py-3 font-mono font-medium">
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
  );
}
