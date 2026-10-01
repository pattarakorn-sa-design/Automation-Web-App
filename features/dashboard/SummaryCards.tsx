import Link from "next/link";
import type { ReactNode } from "react";
import StatusBadge from "@/components/StatusBadge";
import AlarmStatusBadge from "@/features/alarms/AlarmStatusBadge";
import MaintenanceStatusBadge from "@/features/maintenance/MaintenanceStatusBadge";
import type { DashboardSummary } from "./summary";

const cardClass =
  "flex flex-col gap-3 rounded-lg border border-gray-200 p-4 dark:border-gray-800";

// One status line. The whole row is the link, with a hover background, so it
// is clear that it can be clicked and every card behaves the same way.
function StatusRow({
  href,
  label,
  count,
}: {
  href: string;
  label: ReactNode;
  count: number;
}) {
  return (
    <li>
      <Link
        href={href}
        className="-mx-2 flex items-center justify-between gap-3 rounded-md px-2 py-1 text-sm hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-blue-600 dark:hover:bg-gray-800"
      >
        {label}
        <span className="font-medium tabular-nums">{count}</span>
      </Link>
    </li>
  );
}

// Headline number of a card, linking to the full list it summarises.
function Headline({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="-mx-2 self-start rounded-md px-2 text-3xl font-semibold hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-blue-600 dark:hover:bg-gray-800"
    >
      {children}
    </Link>
  );
}

const subtle = "text-base font-normal text-gray-600 dark:text-gray-400";

// Summary cards (REQ-DSH-01 to REQ-DSH-04). The headline number links to the
// full list and each status row to the list filtered by that status.
export default function SummaryCards({ summary }: { summary: DashboardSummary }) {
  const { machines, alarms, maintenance } = summary;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <section aria-labelledby="card-machines" className={cardClass}>
        <h2 id="card-machines" className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Machines
        </h2>
        <Headline href="/machines">
          {machines.total}
          <span className={subtle}> in total</span>
        </Headline>
        <ul className="flex flex-col gap-1">
          {Object.entries(machines.byStatus).map(([status, count]) => (
            <StatusRow
              key={status}
              href={`/machines?status=${status}`}
              label={<StatusBadge status={status as keyof typeof machines.byStatus} />}
              count={count}
            />
          ))}
        </ul>
      </section>

      <section aria-labelledby="card-alarms" className={cardClass}>
        <h2 id="card-alarms" className="text-sm font-medium text-gray-600 dark:text-gray-400">
          Alarms not closed
        </h2>
        <Headline href="/alarms">
          {alarms.open}
          <span className={subtle}> of {alarms.total}</span>
        </Headline>
        <ul className="flex flex-col gap-1">
          {/* Same coloured badges as the lists, like the machine card above. */}
          <StatusRow
            href="/alarms?status=Open"
            label={<AlarmStatusBadge status="Open" />}
            count={alarms.byStatus.Open}
          />
          <StatusRow
            href="/alarms?status=In+Progress"
            label={<AlarmStatusBadge status="In Progress" />}
            count={alarms.byStatus["In Progress"]}
          />
          <StatusRow
            href="/alarms?status=Closed"
            label={<AlarmStatusBadge status="Closed" />}
            count={alarms.byStatus.Closed}
          />
        </ul>
      </section>

      <section aria-labelledby="card-maintenance" className={cardClass}>
        <h2
          id="card-maintenance"
          className="text-sm font-medium text-gray-600 dark:text-gray-400"
        >
          Maintenance not finished
        </h2>
        <Headline href="/maintenance">
          {maintenance.unfinished}
          <span className={subtle}> of {maintenance.total}</span>
        </Headline>
        <ul className="flex flex-col gap-1">
          <StatusRow
            href="/maintenance?status=Pending"
            label={<MaintenanceStatusBadge status="Pending" />}
            count={maintenance.byStatus.Pending}
          />
          <StatusRow
            href="/maintenance?status=In+Progress"
            label={<MaintenanceStatusBadge status="In Progress" />}
            count={maintenance.byStatus["In Progress"]}
          />
          <StatusRow
            href="/maintenance?status=Completed"
            label={<MaintenanceStatusBadge status="Completed" />}
            count={maintenance.byStatus.Completed}
          />
        </ul>
      </section>
    </div>
  );
}
