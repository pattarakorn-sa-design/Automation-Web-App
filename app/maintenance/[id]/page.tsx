import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/features/auth/session";
import MaintenanceStatusBadge from "@/features/maintenance/MaintenanceStatusBadge";
import { getMaintenance } from "@/features/maintenance/queries";
import { canEditMaintenance } from "@/features/maintenance/rules";
import { formatDate, formatDateTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Maintenance record",
};

export default async function MaintenanceRecordPage({
  params,
}: PageProps<"/maintenance/[id]">) {
  const user = await requireUser();
  const record = await getMaintenance((await params).id);
  if (!record) notFound();

  const details: [string, ReactNode][] = [
    ["Type", record.type],
    ["Technician", record.technician?.full_name ?? "–"],
    ["Start date", formatDate(record.start_date)],
    ["End date", record.end_date ? formatDate(record.end_date) : "–"],
    [
      "Caused by alarm",
      record.alarm ? (
        <Link
          href={`/alarms/${record.alarm.id}`}
          className="font-mono text-blue-700 hover:underline dark:text-blue-400"
        >
          {record.alarm.alarm_code}
        </Link>
      ) : (
        "–"
      ),
    ],
    [
      "Recorded",
      `${formatDateTime(record.created_at)} by ${record.creator?.full_name ?? "–"}`,
    ],
  ];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <Link href="/maintenance" className="text-sm text-blue-700 hover:underline dark:text-blue-400">
        ← All maintenance
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {record.machine ? (
              <Link
                href={`/machines/${record.machine.id}`}
                className="font-mono text-blue-700 hover:underline dark:text-blue-400"
              >
                {record.machine.machine_code}
              </Link>
            ) : null}{" "}
            {record.machine?.name}
          </p>
          <h1 className="text-2xl font-semibold">{record.problem}</h1>
          <MaintenanceStatusBadge status={record.status} className="self-start" />
        </div>
        {canEditMaintenance(record.technician_id, user) ? (
          <Link
            href={`/maintenance/${record.id}/edit`}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            Edit
          </Link>
        ) : null}
      </div>

      <dl className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 p-4 sm:grid-cols-2 dark:border-gray-800">
        {details.map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-gray-600 dark:text-gray-400">{label}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="flex flex-col gap-2 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
        <h2 className="text-lg font-semibold">Action taken</h2>
        <p className="whitespace-pre-line">{record.action_taken || "–"}</p>
      </section>
    </main>
  );
}
