"use client";

import { useActionState, useState, type FormEvent } from "react";
import { z } from "zod";
import { updateOwnName, type FormState } from "./actions";
import { updateOwnNameSchema } from "./schema";

const initialState: FormState = {};

export default function ProfileForm({ fullName }: { fullName: string }) {
  const [state, formAction, pending] = useActionState(
    updateOwnName,
    initialState,
  );
  const [clientErrors, setClientErrors] = useState<FormState["fieldErrors"]>();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const parsed = updateOwnNameSchema.safeParse({
      fullName: new FormData(event.currentTarget).get("fullName"),
    });
    if (!parsed.success) {
      event.preventDefault();
      setClientErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }
    setClientErrors(undefined);
  }

  const fieldErrors = clientErrors ?? state.fieldErrors;

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        <label htmlFor="fullName" className="text-sm font-medium">
          Name
        </label>
        <input
          id="fullName"
          name="fullName"
          defaultValue={fullName}
          autoComplete="name"
          aria-invalid={Boolean(fieldErrors?.fullName)}
          aria-describedby={fieldErrors?.fullName ? "fullName-error" : undefined}
          className="rounded-md border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
        />
        {fieldErrors?.fullName ? (
          <p id="fullName-error" className="text-sm text-red-600">
            {fieldErrors.fullName[0]}
          </p>
        ) : null}
      </div>

      {state.formError ? (
        <p role="alert" className="text-sm text-red-600">
          {state.formError}
        </p>
      ) : null}
      {state.success && !pending ? (
        <p role="status" className="text-sm text-green-700 dark:text-green-400">
          {state.success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Saving..." : "Save"}
      </button>
    </form>
  );
}
