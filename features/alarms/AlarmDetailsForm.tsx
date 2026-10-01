"use client";

import Link from "next/link";
import { useActionState, useState, type FormEvent } from "react";
import { z } from "zod";
import SelectField from "@/components/SelectField";
import SubmitButton from "@/components/SubmitButton";
import TextAreaField from "@/components/TextAreaField";
import TextField from "@/components/TextField";
import type { MachineOption } from "@/features/machines/queries";
import type { AlarmFormState } from "./errors";
import { alarmDetailsSchema, alarmDetailsValues } from "./schema";

type AlarmDetailsFormProps = {
  action: (prevState: AlarmFormState, formData: FormData) => Promise<AlarmFormState>;
  machines: MachineOption[];
  // Form values as strings; occurredAt is a datetime-local value in Bangkok time.
  initial: {
    machineId: string;
    alarmCode: string;
    description: string;
    occurredAt: string;
    cause: string;
  };
  // Latest datetime-local value the user may pick (now, in Bangkok time).
  maxOccurredAt: string;
  submitLabel: string;
  cancelHref: string;
};

const initialState: AlarmFormState = {};

// Create or edit alarm details (admins only, REQ-ALM-01, REQ-ALM-05).
export default function AlarmDetailsForm({
  action,
  machines,
  initial,
  maxOccurredAt,
  submitLabel,
  cancelHref,
}: AlarmDetailsFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const [clientErrors, setClientErrors] = useState<AlarmFormState["fieldErrors"]>();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const parsed = alarmDetailsSchema.safeParse(
      alarmDetailsValues(new FormData(event.currentTarget)),
    );
    if (!parsed.success) {
      event.preventDefault();
      setClientErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }
    setClientErrors(undefined);
  }

  const fieldErrors = clientErrors ?? state.fieldErrors;
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

      <SelectField
        label="Machine"
        name="machineId"
        defaultValue={values.machineId}
        placeholder="Select a machine"
        options={machines.map((machine) => ({
          value: machine.id,
          label: `${machine.machine_code} · ${machine.name}`,
        }))}
        error={fieldErrors?.machineId?.[0]}
      />
      <TextField
        label="Alarm code"
        name="alarmCode"
        defaultValue={values.alarmCode}
        hint="e.g. E-101"
        autoComplete="off"
        autoCapitalize="characters"
        error={fieldErrors?.alarmCode?.[0]}
      />
      <TextAreaField
        label="Description"
        name="description"
        defaultValue={values.description}
        error={fieldErrors?.description?.[0]}
      />
      <TextField
        label="Occurred at"
        name="occurredAt"
        type="datetime-local"
        defaultValue={values.occurredAt}
        max={maxOccurredAt}
        hint="Bangkok time"
        error={fieldErrors?.occurredAt?.[0]}
      />
      <TextAreaField
        label="Cause (optional)"
        name="cause"
        defaultValue={values.cause}
        error={fieldErrors?.cause?.[0]}
      />

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
