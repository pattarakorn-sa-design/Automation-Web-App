import type { Metadata } from "next";
import { notFound } from "next/navigation";
import AlarmDetailsForm from "@/features/alarms/AlarmDetailsForm";
import { updateAlarmDetails } from "@/features/alarms/actions";
import { getAlarm } from "@/features/alarms/queries";
import { requireRole } from "@/features/auth/session";
import { listMachineOptions } from "@/features/machines/queries";
import { toBangkokInputValue } from "@/lib/format";

export const metadata: Metadata = {
  title: "Edit alarm",
};

export default async function EditAlarmPage({ params }: PageProps<"/alarms/[id]/edit">) {
  await requireRole("admin");
  const alarm = await getAlarm((await params).id);
  if (!alarm) notFound();
  const machines = await listMachineOptions();

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
      <h1 className="mb-1 text-2xl font-semibold">
        Edit alarm <span className="font-mono">{alarm.alarm_code}</span>
      </h1>
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        Change the status, cause and action taken on the alarm page.
      </p>
      <AlarmDetailsForm
        // The id comes from the server, not from a hidden form field.
        action={updateAlarmDetails.bind(null, alarm.id)}
        machines={machines}
        initial={{
          machineId: alarm.machine_id,
          alarmCode: alarm.alarm_code,
          description: alarm.description,
          occurredAt: toBangkokInputValue(alarm.occurred_at),
          cause: alarm.cause ?? "",
        }}
        maxOccurredAt={toBangkokInputValue(new Date())}
        submitLabel="Save changes"
        cancelHref={`/alarms/${alarm.id}`}
      />
    </main>
  );
}
