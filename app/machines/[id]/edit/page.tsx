import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/features/auth/session";
import MachineForm from "@/features/machines/MachineForm";
import { updateMachine } from "@/features/machines/actions";
import { getMachine, listMachineTypes } from "@/features/machines/queries";
import { logLoadError } from "@/lib/log";

export const metadata: Metadata = {
  title: "Edit machine",
};

export default async function EditMachinePage({
  params,
}: PageProps<"/machines/[id]/edit">) {
  await requireRole("admin");
  const machine = await getMachine((await params).id);
  if (!machine) notFound();
  const types = await listMachineTypes().catch((error) => {
    logLoadError("machine type suggestions", error);
    return [];
  });

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">
        Edit <span className="font-mono">{machine.machine_code}</span>
      </h1>
      <MachineForm
        // The id comes from the server, not from a hidden form field.
        action={updateMachine.bind(null, machine.id)}
        initial={{
          machineCode: machine.machine_code,
          name: machine.name,
          type: machine.type,
          location: machine.location,
          status: machine.status,
        }}
        types={types}
        submitLabel="Save changes"
        cancelHref={`/machines/${machine.id}`}
      />
    </main>
  );
}
