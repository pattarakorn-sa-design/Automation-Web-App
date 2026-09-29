"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: string;
  // Shown while the form is being submitted.
  pendingLabel?: string;
  className?: string;
};

// Place inside a <form action={...}>. It disables itself while the form is
// submitting so the same data cannot be sent twice (REQ-VAL-04).
export default function SubmitButton({
  children,
  pendingLabel = "กำลังดำเนินการ...",
  className,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={`w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60${className ? ` ${className}` : ""}`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
