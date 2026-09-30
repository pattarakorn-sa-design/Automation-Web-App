import type { Metadata } from "next";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import { requireUser } from "@/features/auth/session";
import MachineFilters from "@/features/machines/MachineFilters";
import MachineTable from "@/features/machines/MachineTable";
import {
  hasActiveFilters,
  machineFiltersQuery,
  pageCount,
  parseMachineFilters,
} from "@/features/machines/filters";
import { listMachines, listMachineTypes } from "@/features/machines/queries";

export const metadata: Metadata = {
  title: "Machines",
};

export default async function MachinesPage({
  searchParams,
}: PageProps<"/machines">) {
  const user = await requireUser();
  const filters = parseMachineFilters(await searchParams);

  let result: Awaited<ReturnType<typeof listMachines>>;
  let types: string[];
  try {
    [result, types] = await Promise.all([
      listMachines(filters),
      listMachineTypes(),
    ]);
  } catch {
    return (
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Machines</h1>
        <ErrorState message="โหลดรายการเครื่องจักรไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" />
      </main>
    );
  }

  const { machines, total } = result;
  const pages = pageCount(total);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Machines</h1>
        {user.role === "admin" ? (
          <Link
            href="/machines/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Add machine
          </Link>
        ) : null}
      </div>

      <MachineFilters filters={filters} types={types} />

      {machines.length === 0 ? (
        <EmptyState
          description={
            hasActiveFilters(filters)
              ? "ไม่มีเครื่องจักรที่ตรงกับเงื่อนไข ลองเปลี่ยนคำค้นหรือล้างตัวกรอง"
              : "ยังไม่มีเครื่องจักรในระบบ"
          }
        />
      ) : (
        <>
          <MachineTable machines={machines} />
          <nav
            aria-label="Pagination"
            className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600 dark:text-gray-400"
          >
            <p>
              Page {filters.page} of {pages} · {total} machine{total === 1 ? "" : "s"}
            </p>
            <div className="flex gap-2">
              {filters.page > 1 ? (
                <Link
                  href={`/machines${machineFiltersQuery(filters, { page: filters.page - 1 })}`}
                  className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  Previous
                </Link>
              ) : null}
              {filters.page < pages ? (
                <Link
                  href={`/machines${machineFiltersQuery(filters, { page: filters.page + 1 })}`}
                  className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  Next
                </Link>
              ) : null}
            </div>
          </nav>
        </>
      )}
    </main>
  );
}
