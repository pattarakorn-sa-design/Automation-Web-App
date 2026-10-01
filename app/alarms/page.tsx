import type { Metadata } from "next";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import AlarmFilters from "@/features/alarms/AlarmFilters";
import AlarmTable from "@/features/alarms/AlarmTable";
import {
  alarmFiltersQuery,
  hasActiveAlarmFilters,
  parseAlarmFilters,
} from "@/features/alarms/filters";
import { listAlarms } from "@/features/alarms/queries";
import { requireUser } from "@/features/auth/session";
import { pageCount } from "@/features/machines/filters";
import { listMachineOptions } from "@/features/machines/queries";
import { logLoadError } from "@/lib/log";

export const metadata: Metadata = {
  title: "Alarms",
};

export default async function AlarmsPage({ searchParams }: PageProps<"/alarms">) {
  const user = await requireUser();
  const filters = parseAlarmFilters(await searchParams);

  let result: Awaited<ReturnType<typeof listAlarms>>;
  let machines: Awaited<ReturnType<typeof listMachineOptions>>;
  try {
    [result, machines] = await Promise.all([
      listAlarms(filters),
      listMachineOptions(),
    ]);
  } catch (error) {
    logLoadError("alarms list", error);
    return (
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <h1 className="mb-6 text-2xl font-semibold">Alarms</h1>
        <ErrorState message="โหลดรายการ Alarm ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" />
      </main>
    );
  }

  const { alarms, total } = result;
  const pages = pageCount(total);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Alarms</h1>
        {user.role === "admin" ? (
          <Link
            href="/alarms/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            New alarm
          </Link>
        ) : null}
      </div>

      <AlarmFilters filters={filters} machines={machines} />

      {alarms.length === 0 ? (
        <EmptyState
          description={
            hasActiveAlarmFilters(filters)
              ? "ไม่มี Alarm ที่ตรงกับเงื่อนไข ลองเปลี่ยนตัวกรองหรือกด Clear"
              : "ยังไม่มี Alarm ในระบบ"
          }
        />
      ) : (
        <>
          <AlarmTable alarms={alarms} />
          <nav
            aria-label="Pagination"
            className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600 dark:text-gray-400"
          >
            <p>
              Page {filters.page} of {pages} · {total} alarm{total === 1 ? "" : "s"}
            </p>
            <div className="flex gap-2">
              {filters.page > 1 ? (
                <Link
                  href={`/alarms${alarmFiltersQuery(filters, { page: filters.page - 1 })}`}
                  className="rounded-md border border-gray-300 px-3 py-1.5 hover:bg-gray-100 dark:border-gray-700 dark:hover:bg-gray-800"
                >
                  Previous
                </Link>
              ) : null}
              {filters.page < pages ? (
                <Link
                  href={`/alarms${alarmFiltersQuery(filters, { page: filters.page + 1 })}`}
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
