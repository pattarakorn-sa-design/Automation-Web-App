import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { listAlarmOptions } from "@/features/alarms/queries";
import { requireRole } from "@/features/auth/session";
import { listMachineOptions } from "@/features/machines/queries";
import MaintenanceForm from "@/features/maintenance/MaintenanceForm";
import { updateMaintenance } from "@/features/maintenance/actions";
import { getMaintenance } from "@/features/maintenance/queries";
import { canEditMaintenance } from "@/features/maintenance/rules";
import { listProfileOptions } from "@/features/users/queries";

export const metadata: Metadata = {
  title: "Edit maintenance record",
};

export default async function EditMaintenancePage({
  params,
}: PageProps<"/maintenance/[id]/edit">) {
  const user = await requireRole("admin", "technician");
  const record = await getMaintenance((await params).id);
  if (!record) notFound();
  // BR-MNT-01: technicians edit only their own records.
  if (!canEditMaintenance(record.technician_id, user)) redirect("/?error=forbidden");

  const [machines, alarms, people] = await Promise.all([
    listMachineOptions(),
    listAlarmOptions(record.alarm_id),
    listProfileOptions(),
  ]);

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Edit maintenance record</h1>
      <MaintenanceForm
        // The id comes from the server, not from a hidden form field.
        action={updateMaintenance.bind(null, record.id)}
        machines={machines}
        alarms={alarms}
        people={people}
        currentUser={user}
        initial={{
          machineId: record.machine_id,
          alarmId: record.alarm_id ?? "",
          technicianId: record.technician_id,
          type: record.type,
          problem: record.problem,
          actionTaken: record.action_taken ?? "",
          status: record.status,
          startDate: record.start_date,
          endDate: record.end_date ?? "",
        }}
        submitLabel="Save changes"
        cancelHref={`/maintenance/${record.id}`}
      />
    </main>
  );
}
