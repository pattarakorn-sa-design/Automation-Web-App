import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import StatusBadge from "@/components/StatusBadge";
import { requireUser } from "@/features/auth/session";
import DeleteMachineButton from "@/features/machines/DeleteMachineButton";
import { getMachine } from "@/features/machines/queries";
import { formatDateTime } from "@/lib/format";
import { logLoadError } from "@/lib/log";

export async function generateMetadata({
  params,
}: PageProps<"/machines/[id]">): Promise<Metadata> {
  const machine = await getMachine((await params).id).catch((error) => {
    logLoadError("machine page title", error);
    return null;
  });
  return { title: machine?.machine_code ?? "Machine" };
}

export default async function MachinePage({ params }: PageProps<"/machines/[id]">) {
  const user = await requireUser();
  const machine = await getMachine((await params).id);
  if (!machine) notFound();

  const details = [
    ["Type", machine.type],
    ["Location", machine.location],
    ["Added", formatDateTime(machine.created_at)],
    ["Last updated", formatDateTime(machine.updated_at)],
  ];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-8">
      <Link
        href="/machines"
        className="text-sm text-blue-700 hover:underline dark:text-blue-400"
      >
        ← All machines
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-sm text-gray-600 dark:text-gray-400">
            {machine.machine_code}
          </p>
          <h1 className="text-2xl font-semibold">{machine.name}</h1>
          <StatusBadge status={machine.status} className="self-start" />
        </div>

        <div className="flex flex-wrap items-start gap-2">
          {/* Admins and technicians both record maintenance (REQ-MNT-01). */}
          <Link
            href={`/maintenance/new?machine=${machine.id}`}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            New maintenance
          </Link>
          {user.role === "admin" ? (
            <>
              <Link
                href={`/alarms/new?machine=${machine.id}`}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                New alarm
              </Link>
              <Link
                href={`/machines/${machine.id}/edit`}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
              >
                Edit
              </Link>
              <DeleteMachineButton
                machineId={machine.id}
                machineCode={machine.machine_code}
              />
            </>
          ) : null}
        </div>
      </div>

      <dl className="grid grid-cols-1 gap-4 rounded-lg border border-gray-200 p-4 sm:grid-cols-2 dark:border-gray-800">
        {details.map(([label, value]) => (
          <div key={label}>
            <dt className="text-sm text-gray-600 dark:text-gray-400">{label}</dt>
            <dd className="font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
