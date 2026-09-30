"use client";

import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";
import { z } from "zod";
import SubmitButton from "@/components/SubmitButton";
import TextField from "@/components/TextField";
import type { MachineFormState } from "./errors";
import { MACHINE_STATUSES, machineFormValues, machineSchema } from "./schema";

type MachineFormProps = {
  action: (
    prevState: MachineFormState,
    formData: FormData,
  ) => Promise<MachineFormState>;
  // Current values when editing; empty when adding a machine.
  initial?: {
    machineCode: string;
    name: string;
    type: string;
    location: string;
    status: string;
  };
  // Existing machine types, offered as suggestions in the Type field.
  types: string[];
  submitLabel: string;
  cancelHref: string;
};

const initialState: MachineFormState = {};

export default function MachineForm({
  action,
  initial,
  types,
  submitLabel,
  cancelHref,
}: MachineFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const [clientErrors, setClientErrors] =
    useState<MachineFormState["fieldErrors"]>();

  // Check on the client first for instant feedback; the Server Action checks
  // again with the same schema.
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const parsed = machineSchema.safeParse(
      machineFormValues(new FormData(event.currentTarget)),
    );
    if (!parsed.success) {
      event.preventDefault();
      setClientErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }
    setClientErrors(undefined);
  }

  const fieldErrors = clientErrors ?? state.fieldErrors;
  // After a failed save show what the user typed, otherwise the saved values.
  const values = state.values ?? initial;

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      noValidate
      className="flex flex-col gap-4"
    >
      {state.formError && !clientErrors ? (
        <p
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
        >
          {state.formError}
        </p>
      ) : null}

      <TextField
        label="Machine ID"
        name="machineCode"
        defaultValue={values?.machineCode}
        hint="e.g. M-001 or CNC-0012"
        autoComplete="off"
        autoCapitalize="characters"
        required
        error={fieldErrors?.machineCode?.[0]}
      />
      <TextField
        label="Name"
        name="name"
        defaultValue={values?.name}
        required
        error={fieldErrors?.name?.[0]}
      />
      <TextField
        label="Type"
        name="type"
        defaultValue={values?.type}
        list="machine-types"
        hint="Pick an existing type or enter a new one"
        required
        error={fieldErrors?.type?.[0]}
      />
      <datalist id="machine-types">
        {types.map((type) => (
          <option key={type} value={type} />
        ))}
      </datalist>
      <TextField
        label="Location"
        name="location"
        defaultValue={values?.location}
        required
        error={fieldErrors?.location?.[0]}
      />

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="field-status"
          className="text-sm font-medium text-gray-900 dark:text-gray-100"
        >
          Status
        </label>
        <select
          id="field-status"
          name="status"
          defaultValue={values?.status ?? "Running"}
          aria-invalid={fieldErrors?.status ? true : undefined}
          aria-describedby={fieldErrors?.status ? "field-status-error" : undefined}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 shadow-sm focus:outline-2 focus:outline-offset-0 focus:outline-blue-600 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
        >
          {MACHINE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        {fieldErrors?.status ? (
          <p id="field-status-error" className="text-sm text-red-700 dark:text-red-400">
            {fieldErrors.status[0]}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href={cancelHref}
          className="rounded-md border border-gray-300 px-4 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Cancel
        </Link>
        <SubmitButton className="sm:w-auto">{submitLabel}</SubmitButton>
      </div>
    </form>
  );
}
