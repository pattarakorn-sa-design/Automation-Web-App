import type { Metadata } from "next";
import { requireUser } from "@/features/auth/session";
import ProfileForm from "@/features/users/ProfileForm";

export const metadata: Metadata = {
  title: "Profile",
};

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
      <h1 className="mb-1 text-2xl font-semibold">Profile</h1>
      <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
        {user.email} · role <strong>{user.role}</strong> (only another admin can
        change your role)
      </p>
      <ProfileForm fullName={user.fullName} />
    </main>
  );
}
