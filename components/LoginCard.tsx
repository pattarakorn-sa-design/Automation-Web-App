import type { ReactNode } from "react";

type LoginCardProps = {
  // Error for the whole form, e.g. a wrong Email or password.
  error?: string;
  children: ReactNode;
};

// Centered card for the sign-in page. Put the form fields and the submit
// button inside as children.
export default function LoginCard({ error, children }: LoginCardProps) {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-gray-50 px-4 py-8 dark:bg-gray-950">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Alarm &amp; Maintenance
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Sign in to continue
          </p>
        </div>
        {error ? (
          <p
            role="alert"
            className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
          >
            {error}
          </p>
        ) : null}
        {children}
      </div>
    </main>
  );
}
