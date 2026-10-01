import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import AlarmStatusBadge from "@/features/alarms/AlarmStatusBadge";
import { formatDateTime } from "@/lib/format";
import type { RecentAlarm } from "./queries";

// REQ-DSH-05: the five newest alarms, each linking to its detail page.
export default function RecentAlarms({ alarms }: { alarms: RecentAlarm[] }) {
  return (
    <section aria-labelledby="recent-alarms" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="recent-alarms" className="text-lg font-semibold">
          Latest alarms
        </h2>
        <Link href="/alarms" className="text-sm text-blue-700 hover:underline dark:text-blue-400">
          All alarms
        </Link>
      </div>

      {alarms.length === 0 ? (
        <EmptyState description="ยังไม่มี Alarm ในระบบ" />
      ) : (
        <ul className="divide-y divide-gray-200 rounded-lg border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
          {alarms.map((alarm) => (
            <li
              key={alarm.id}
              className="relative flex flex-col gap-1 p-4 hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              <div className="flex items-center justify-between gap-3">
                {/* The link covers the whole row, so the row is one tap target. */}
                <Link
                  href={`/alarms/${alarm.id}`}
                  className="font-mono font-semibold text-blue-700 after:absolute after:inset-0 dark:text-blue-400"
                >
                  {alarm.alarm_code}
                </Link>
                <AlarmStatusBadge status={alarm.status} />
              </div>
              <p className="line-clamp-1">{alarm.description}</p>
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
      )}
    </section>
  );
}
