import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import type { DashboardSummary } from "./summary";

const cardClass =
  "flex flex-col gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-800";

// Summary cards (REQ-DSH-01 to REQ-DSH-04). Each card links to the list it
// counts, filtered where that helps.
export default function SummaryCards({ summary }: { summary: DashboardSummary }) {
  const { machines, alarms, maintenance } = summary;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <section aria-labelledby="card-machines" className={cardClass}>
        <h2 id="card-machines" className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Machines
        </h2>
        <Link href="/machines" className="text-3xl font-semibold hover:underline">
          {machines.total}
          <span className="sr-only"> machines in total</span>
        </Link>
        <ul className="flex flex-col gap-2">
          {Object.entries(machines.byStatus).map(([status, count]) => (
            <li key={status} className="flex items-center justify-between gap-3">
              <StatusBadge status={status as keyof typeof machines.byStatus} />
              <Link
                href={`/machines?status=${status}`}
                className="font-medium tabular-nums hover:underline"
              >
                {count}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="card-alarms" className={cardClass}>
        <h2 id="card-alarms" className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Alarms not closed
        </h2>
        <p className="text-3xl font-semibold">
          {alarms.open}
          <span className="text-base font-normal text-gray-600 dark:text-gray-400">
            {" "}
            of {alarms.total}
          </span>
        </p>
        <ul className="flex flex-col gap-1 text-sm">
          <li className="flex justify-between gap-3">
            <Link href="/alarms?status=Open" className="hover:underline">
              Open
            </Link>
            <span className="tabular-nums">{alarms.byStatus.Open}</span>
          </li>
          <li className="flex justify-between gap-3">
            <Link href="/alarms?status=In+Progress" className="hover:underline">
              In Progress
            </Link>
            <span className="tabular-nums">{alarms.byStatus["In Progress"]}</span>
          </li>
          <li className="flex justify-between gap-3">
            <Link href="/alarms?status=Closed" className="hover:underline">
              Closed
            </Link>
            <span className="tabular-nums">{alarms.byStatus.Closed}</span>
          </li>
        </ul>
      </section>

      <section aria-labelledby="card-maintenance" className={cardClass}>
        <h2
          id="card-maintenance"
          className="text-sm font-medium text-gray-600 dark:text-gray-400"
        >
          Maintenance not finished
        </h2>
        <p className="text-3xl font-semibold">
          {maintenance.unfinished}
          <span className="text-base font-normal text-gray-600 dark:text-gray-400">
            {" "}
            of {maintenance.total}
          </span>
        </p>
        <ul className="flex flex-col gap-1 text-sm">
          <li className="flex justify-between gap-3">
            <Link href="/maintenance?status=Pending" className="hover:underline">
              Pending
            </Link>
            <span className="tabular-nums">{maintenance.byStatus.Pending}</span>
          </li>
          <li className="flex justify-between gap-3">
            <Link href="/maintenance?status=In+Progress" className="hover:underline">
              In Progress
            </Link>
            <span className="tabular-nums">{maintenance.byStatus["In Progress"]}</span>
          </li>
          <li className="flex justify-between gap-3">
            <Link href="/maintenance?status=Completed" className="hover:underline">
              Completed
            </Link>
            <span className="tabular-nums">{maintenance.byStatus.Completed}</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
