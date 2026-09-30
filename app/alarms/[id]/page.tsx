import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AlarmStatusBadge from "@/features/alarms/AlarmStatusBadge";
import AlarmStatusForm from "@/features/alarms/AlarmStatusForm";
import { updateAlarmStatus } from "@/features/alarms/actions";
import { getAlarm } from "@/features/alarms/queries";
import { canUpdateAlarm, nextStatuses } from "@/features/alarms/status";
import { requireUser } from "@/features/auth/session";
import { formatDateTime } from "@/lib/format";

export async function generateMetadata({
  params,
}: PageProps<"/alarms/[id]">): Promise<Metadata> {
  const alarm = await getAlarm((await params).id).catch(() => null);
  return { title: alarm ? `Alarm ${alarm.alarm_code}` : "Alarm" };
}

export default async function AlarmPage({ params }: PageProps<"/alarms/[id]">) {
  const user = await requireUser();
  const alarm = await getAlarm((await params).id);
  if (!alarm) notFound();

  const details: [string, string][] = [
    ["Occurred", formatDateTime(alarm.occurred_at)],
    ["Created by", alarm.creator?.full_name ?? "–"],
    [
      "Closed",
      alarm.closed_at
        ? `${formatDateTime(alarm.closed_at)} by ${alarm.closer?.full_name ?? "–"}`
        : "–",
    ],
    ["Last updated", formatDateTime(alarm.updated_at)],
  ];

  const editable = canUpdateAlarm(alarm.status, user.role);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <Link href="/alarms" className="text-sm text-blue-700 hover:underline dark:text-blue-400">
        ← All alarms
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {alarm.machine ? (
              <Link
                href={`/machines/${alarm.machine.id}`}
                className="font-mono text-blue-700 hover:underline dark:text-blue-400"
              >
                {alarm.machine.machine_code}
              </Link>
            ) : null}{" "}
            {alarm.machine?.name}
          </p>
          <h1 className="font-mono text-2xl font-semibold">{alarm.alarm_code}</h1>
          <AlarmStatusBadge status={alarm.status} className="self-start" />
        </div>
        <div className="flex flex-wrap items-start gap-2">
          {/* Admins and technicians record the repair for this alarm (REQ-MNT-03). */}
          <Link
            href={`/maintenance/new?machine=${alarm.machine_id}&alarm=${alarm.id}`}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            Record maintenance
          </Link>
          {user.role === "admin" ? (
            <Link
              href={`/alarms/${alarm.id}/edit`}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
            >
              Edit details
            </Link>
          ) : null}
        </div>
      </div>

      <p className="whitespace-pre-line">{alarm.description}</p>

      <dl className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 p-4 sm:grid-cols-2 dark:border-gray-800">
        {details.map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-gray-600 dark:text-gray-400">{label}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      <section className="flex flex-col gap-4 rounded-lg border border-gray-200 p-4 dark:border-gray-800">
        <h2 className="text-lg font-semibold">Status and notes</h2>
        {editable ? (
          <AlarmStatusForm
            // The id comes from the server, not from a hidden form field.
            action={updateAlarmStatus.bind(null, alarm.id)}
            currentStatus={alarm.status}
            nextStatuses={nextStatuses(alarm.status, user.role)}
            cause={alarm.cause ?? ""}
            actionTaken={alarm.action_taken ?? ""}
          />
        ) : (
          <>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm text-gray-600 dark:text-gray-400">Cause</dt>
                <dd className="whitespace-pre-line">{alarm.cause || "–"}</dd>
              </div>
              <div>
                <dt className="text-sm text-gray-600 dark:text-gray-400">Action taken</dt>
                <dd className="whitespace-pre-line">{alarm.action_taken || "–"}</dd>
              </div>
            </dl>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              This alarm is closed. Only an admin can reopen it.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
