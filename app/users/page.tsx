import type { Metadata } from "next";
import EmptyState from "@/components/EmptyState";
import ErrorState from "@/components/ErrorState";
import { requireRole } from "@/features/auth/session";
import UserRowForm from "@/features/users/UserRowForm";
import { listUsersForAdmin } from "@/features/users/queries";

export const metadata: Metadata = {
  title: "Users",
};

export default async function UsersPage() {
  const admin = await requireRole("admin");

  let users: Awaited<ReturnType<typeof listUsersForAdmin>>;
  try {
    users = await listUsersForAdmin();
  } catch {
    return (
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
        <h1 className="mb-6 text-2xl font-semibold">Users</h1>
        <ErrorState message="โหลดรายชื่อผู้ใช้ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" />
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
      <h1 className="mb-1 text-2xl font-semibold">Users</h1>
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        Change other users&apos; names and roles. New accounts are added in the
        Supabase dashboard and start as technician.
      </p>

      {users.length === 0 ? (
        <EmptyState />
      ) : (
        <div>
          {users.map((user) => (
            <UserRowForm
              key={user.id}
              userId={user.id}
              email={user.email}
              fullName={user.full_name}
              role={user.role}
              isCurrentUser={user.id === admin.id}
            />
          ))}
        </div>
      )}
    </main>
  );
}
