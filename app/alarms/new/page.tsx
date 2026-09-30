import type { Metadata } from "next";
import ErrorState from "@/components/ErrorState";
import AlarmDetailsForm from "@/features/alarms/AlarmDetailsForm";
import { createAlarm } from "@/features/alarms/actions";
import { requireRole } from "@/features/auth/session";
import { listMachineOptions } from "@/features/machines/queries";
import { toBangkokInputValue } from "@/lib/format";

export const metadata: Metadata = {
  title: "New alarm",
};

export default async function NewAlarmPage({ searchParams }: PageProps<"/alarms/new">) {
  await requireRole("admin");
  // ?machine=<id> preselects the machine, e.g. from a machine's page.
  const { machine } = await searchParams;

  let machines: Awaited<ReturnType<typeof listMachineOptions>>;
  try {
    machines = await listMachineOptions();
  } catch {
    return (
      <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold">New alarm</h1>
        <ErrorState message="โหลดรายการเครื่องจักรไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" />
      </main>
    );
  }

  const now = toBangkokInputValue(new Date());
  const preselected =
    typeof machine === "string" && machines.some((m) => m.id === machine) ? machine : "";

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">New alarm</h1>
      <AlarmDetailsForm
        action={createAlarm}
        machines={machines}
        initial={{
          machineId: preselected,
          alarmCode: "",
          description: "",
          occurredAt: now,
          cause: "",
        }}
        maxOccurredAt={now}
        submitLabel="Create alarm"
        cancelHref="/alarms"
      />
    </main>
  );
}
