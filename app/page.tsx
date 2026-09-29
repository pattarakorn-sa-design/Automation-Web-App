import Link from "next/link";
import { signOut } from "@/features/auth/actions";
import { requireUser } from "@/features/auth/session";

// Temporary home page until the dashboard is built in phase 7.
// It shows who is signed in so login, logout and role checks can be tested.
export default async function HomePage({ searchParams }: PageProps<"/">) {
  const user = await requireUser();
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-12">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
          >
            Logout
          </button>
        </form>
      </div>

      {error === "forbidden" ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          คุณไม่มีสิทธิ์เข้าหน้านั้น
        </p>
      ) : null}

      <p>
        Signed in as <strong>{user.fullName}</strong> ({user.email}) with role{" "}
        <strong>{user.role}</strong>.
      </p>

      <nav className="flex gap-4 text-blue-600 underline dark:text-blue-400">
        <Link href="/profile">Profile</Link>
        {user.role === "admin" ? <Link href="/users">Users</Link> : null}
      </nav>
    </main>
  );
}
