import type { Metadata } from "next";
import ErrorState from "@/components/ErrorState";
import { listAlarmOptions } from "@/features/alarms/queries";
import { requireRole } from "@/features/auth/session";
import { listMachineOptions } from "@/features/machines/queries";
import MaintenanceForm from "@/features/maintenance/MaintenanceForm";
import { createMaintenance } from "@/features/maintenance/actions";
import { listProfileOptions } from "@/features/users/queries";
import { bangkokToday } from "@/lib/format";

export const metadata: Metadata = {
  title: "New maintenance record",
};

export default async function NewMaintenancePage({
  searchParams,
}: PageProps<"/maintenance/new">) {
  const user = await requireRole("admin", "technician");
  // ?machine=<id>&alarm=<id> preselect the fields, e.g. from an alarm's page.
  const { machine, alarm } = await searchParams;

  let machines: Awaited<ReturnType<typeof listMachineOptions>>;
  let alarms: Awaited<ReturnType<typeof listAlarmOptions>>;
  let people: Awaited<ReturnType<typeof listProfileOptions>>;
  try {
    [machines, alarms, people] = await Promise.all([
      listMachineOptions(),
      listAlarmOptions(typeof alarm === "string" ? alarm : null),
      listProfileOptions(),
    ]);
  } catch {
    return (
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold">New maintenance record</h1>
        <ErrorState message="โหลดข้อมูลสำหรับฟอร์มไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" />
      </main>
    );
  }

  const machineId =
    typeof machine === "string" && machines.some((m) => m.id === machine) ? machine : "";
  const alarmId =
    typeof alarm === "string" &&
    alarms.some((a) => a.id === alarm && a.machine_id === machineId)
      ? alarm
      : "";

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">New maintenance record</h1>
      <MaintenanceForm
        action={createMaintenance}
        machines={machines}
        alarms={alarms}
        people={people}
        currentUser={user}
        initial={{
          machineId,
          alarmId,
          technicianId: user.role === "technician" ? user.id : "",
          type: alarmId ? "Corrective" : "Preventive",
          problem: "",
          actionTaken: "",
          status: "Pending",
          startDate: bangkokToday(),
          endDate: "",
        }}
        submitLabel="Save record"
        cancelHref="/maintenance"
      />
    </main>
  );
}
