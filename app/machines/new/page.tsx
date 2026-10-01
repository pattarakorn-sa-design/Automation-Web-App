import type { Metadata } from "next";
import { requireRole } from "@/features/auth/session";
import MachineForm from "@/features/machines/MachineForm";
import { createMachine } from "@/features/machines/actions";
import { listMachineTypes } from "@/features/machines/queries";
import { logLoadError } from "@/lib/log";

export const metadata: Metadata = {
  title: "Add machine",
};

export default async function NewMachinePage() {
  await requireRole("admin");
  // Suggestions only: the form still works if they fail to load.
  const types = await listMachineTypes().catch((error) => {
    logLoadError("machine type suggestions", error);
    return [];
  });

  return (
    <main className="mx-auto w-full max-w-lg flex-1 px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Add machine</h1>
      <MachineForm
        action={createMachine}
        types={types}
        submitLabel="Add machine"
        cancelHref="/machines"
      />
    </main>
  );
}
