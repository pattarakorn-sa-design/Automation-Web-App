import ErrorState from "@/components/ErrorState";
import { requireUser } from "@/features/auth/session";
import RecentAlarms from "@/features/dashboard/RecentAlarms";
import SummaryCards from "@/features/dashboard/SummaryCards";
import { getDashboard } from "@/features/dashboard/queries";

// Dashboard (REQ-DSH-01 to REQ-DSH-05). Every signed-in role sees the same
// numbers. Logout, Profile and Users are in the navbar.
export default async function DashboardPage({ searchParams }: PageProps<"/">) {
  const user = await requireUser();
  const { error } = await searchParams;

  let dashboard: Awaited<ReturnType<typeof getDashboard>> | null = null;
  try {
    dashboard = await getDashboard();
  } catch {
    // Issue #17: a failed query shows the error state, never zeros or a blank page.
    dashboard = null;
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">Welcome, {user.fullName}</p>
      </div>

      {error === "forbidden" ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          คุณไม่มีสิทธิ์เข้าหน้านั้น
        </p>
      ) : null}

      {dashboard ? (
        <>
          <SummaryCards summary={dashboard.summary} />
          <RecentAlarms alarms={dashboard.recentAlarms} />
        </>
      ) : (
        <ErrorState message="โหลดข้อมูล Dashboard ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" />
      )}
    </main>
  );
}
