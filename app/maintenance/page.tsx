import type { Metadata } from "next";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import { requireUser } from "@/features/auth/session";
import { pageCount } from "@/features/machines/filters";
import { listMachineOptions } from "@/features/machines/queries";
import MaintenanceFilters from "@/features/maintenance/MaintenanceFilters";
import MaintenanceTable from "@/features/maintenance/MaintenanceTable";
import {
  hasActiveMaintenanceFilters,
  maintenanceFiltersQuery,
  parseMaintenanceFilters,
} from "@/features/maintenance/filters";
import { listMaintenance } from "@/features/maintenance/queries";
import { listProfileOptions } from "@/features/users/queries";
import { logLoadError } from "@/lib/log";

export const metadata: Metadata = {
  title: "Maintenance",
};

export default async function MaintenancePage({
  searchParams,
}: PageProps<"/maintenance">) {
  await requireUser();
  const filters = parseMaintenanceFilters(await searchParams);

  let result: Awaited<ReturnType<typeof listMaintenance>>;
  let machines: Awaited<ReturnType<typeof listMachineOptions>>;
  let people: Awaited<ReturnType<typeof listProfileOptions>>;
  try {
    [result, machines, people] = await Promise.all([
      listMaintenance(filters),
      listMachineOptions(),
      listProfileOptions(),
    ]);
  } catch (error) {
    logLoadError("maintenance list", error);
    return (
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Maintenance</h1>
        <ErrorState message="โหลดรายการงานซ่อมไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" />
      </main>
    );
  }

  const { records, total } = result;
  const pages = pageCount(total);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Maintenance</h1>
        <div className="flex flex-wrap items-center gap-2">
          {/* A plain link: the file is a download, not a page to navigate to. */}
          <a
            href={`/maintenance/export${maintenanceFiltersQuery(filters, { page: 1 })}`}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Export CSV
          </a>
          {/* Admins and technicians both record work (REQ-MNT-01). */}
          <Link
            href="/maintenance/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            New record
          </Link>
        </div>
      </div>

      <MaintenanceFilters filters={filters} machines={machines} people={people} />

      {records.length === 0 ? (
        <EmptyState
          description={
            hasActiveMaintenanceFilters(filters)
              ? "ไม่มีงานซ่อมที่ตรงกับเงื่อนไข ลองเปลี่ยนตัวกรองหรือกด Clear"
              : "ยังไม่มีงานซ่อมในระบบ"
          }
        />
      ) : (
        <>
          <MaintenanceTable records={records} />
          <nav
            aria-label="Pagination"
            className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600 dark:text-gray-400"
          >
            <p>
              Page {filters.page} of {pages} · {total} record{total === 1 ? "" : "s"}
            </p>
            <div className="flex gap-2">
              {filters.page > 1 ? (
                <Link
                  href={`/maintenance${maintenanceFiltersQuery(filters, { page: filters.page - 1 })}`}
                  className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  Previous
                </Link>
              ) : null}
              {filters.page < pages ? (
                <Link
                  href={`/maintenance${maintenanceFiltersQuery(filters, { page: filters.page + 1 })}`}
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
