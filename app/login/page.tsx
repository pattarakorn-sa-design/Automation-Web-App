import type { Metadata } from "next";
import { redirect } from "next/navigation";
import LoginForm from "@/features/auth/LoginForm";
import { getCurrentUser } from "@/features/auth/session";

export const metadata: Metadata = {
  title: "Sign in",
};

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-semibold">
          Alarm &amp; Maintenance
        </h1>
        <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
          Sign in with the account your admin created for you.
        </p>
        <LoginForm />
      </div>
    </main>
  );
}
