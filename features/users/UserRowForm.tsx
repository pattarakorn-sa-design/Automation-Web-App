"use client";

import { useActionState, useState, type FormEvent } from "react";
import { z } from "zod";
import { Constants, type Enums } from "@/types/database";
import { updateUser, type FormState } from "./actions";
import { updateUserSchema } from "./schema";

type UserRowFormProps = {
  userId: string;
  email: string;
  fullName: string;
  role: Enums<"app_role">;
  isCurrentUser: boolean;
};

const initialState: FormState = {};

export default function UserRowForm({
  userId,
  email,
  fullName,
  role,
  isCurrentUser,
}: UserRowFormProps) {
  const [state, formAction, pending] = useActionState(updateUser, initialState);
  const [clientErrors, setClientErrors] = useState<FormState["fieldErrors"]>();
  // Hides the last "saved" message once the user starts editing again.
  const [edited, setEdited] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const data = new FormData(event.currentTarget);
    const parsed = updateUserSchema.safeParse({
      userId: data.get("userId"),
      fullName: data.get("fullName"),
      role: data.get("role"),
    });
    if (!parsed.success) {
      event.preventDefault();
      setClientErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }
    setClientErrors(undefined);
    setEdited(false);
  }

  const fieldErrors = clientErrors ?? state.fieldErrors;
  const nameErrorId = `name-error-${userId}`;

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      onChange={() => setEdited(true)}
      noValidate
      className="flex flex-col gap-2 border-b border-gray-200 py-4 sm:flex-row sm:items-start sm:gap-4 dark:border-gray-800"
    >
      <input type="hidden" name="userId" value={userId} />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <label htmlFor={`name-${userId}`} className="sr-only">
          Name of {email}
        </label>
        <input
          id={`name-${userId}`}
          name="fullName"
          defaultValue={fullName}
          disabled={isCurrentUser}
          aria-invalid={Boolean(fieldErrors?.fullName)}
          aria-describedby={fieldErrors?.fullName ? nameErrorId : undefined}
          className="rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:disabled:bg-gray-800"
        />
        {fieldErrors?.fullName ? (
          <p id={nameErrorId} className="text-sm text-red-600">
            {fieldErrors.fullName[0]}
          </p>
        ) : null}
        <p className="truncate text-sm text-gray-600 dark:text-gray-400">
          {email}
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor={`role-${userId}`} className="sr-only">
          Role of {email}
        </label>
        <select
          id={`role-${userId}`}
          name="role"
          defaultValue={role}
          disabled={isCurrentUser}
          className="rounded-md border border-gray-300 px-3 py-2 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-900 dark:disabled:bg-gray-800"
        >
          {Constants.public.Enums.app_role.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1 sm:w-40">
        {isCurrentUser ? (
          <p className="py-2 text-sm text-gray-600 dark:text-gray-400">
            You (edit on Profile)
          </p>
        ) : (
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {pending ? "Saving..." : "Save"}
          </button>
        )}
        {state.formError && !clientErrors ? (
          <p role="alert" className="text-sm text-red-600">
            {state.formError}
          </p>
        ) : null}
        {state.success && !pending && !edited ? (
          <p role="status" className="text-sm text-green-700 dark:text-green-400">
            {state.success}
          </p>
        ) : null}
      </div>
    </form>
  );
}
