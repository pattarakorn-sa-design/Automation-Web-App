"use client";

import { useActionState, useState, type FormEvent } from "react";
import { z } from "zod";
import SelectField from "@/components/SelectField";
import SubmitButton from "@/components/SubmitButton";
import TextAreaField from "@/components/TextAreaField";
import type { AlarmFormState } from "./errors";
import { alarmStatusSchema, alarmStatusValues } from "./schema";
import type { AlarmStatus } from "./status";

type AlarmStatusFormProps = {
  action: (prevState: AlarmFormState, formData: FormData) => Promise<AlarmFormState>;
  currentStatus: AlarmStatus;
  // Statuses this user may move to from the current one (from nextStatuses()).
  nextStatuses: AlarmStatus[];
  cause: string;
  actionTaken: string;
};

const initialState: AlarmFormState = {};

// Status change with cause and action taken (REQ-ALM-04, BR-ALM-03).
// Only offers the transitions allowed for this user; the server and the
// database check them again.
export default function AlarmStatusForm({
  action,
  currentStatus,
  nextStatuses,
  cause,
  actionTaken,
}: AlarmStatusFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const [clientErrors, setClientErrors] = useState<AlarmFormState["fieldErrors"]>();
  // Hides the last "saved" message once the user starts editing again.
  const [edited, setEdited] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const parsed = alarmStatusSchema.safeParse(
      alarmStatusValues(new FormData(event.currentTarget)),
    );
    if (!parsed.success) {
      event.preventDefault();
      setClientErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }
    setClientErrors(undefined);
    setEdited(false);
  }

  const fieldErrors = clientErrors ?? state.fieldErrors;
  const values = state.values ?? {
    status: currentStatus,
    cause,
    actionTaken,
  };

  const options = [
    { value: currentStatus, label: `${currentStatus} (keep)` },
    ...nextStatuses.map((status) => ({
      value: status,
      label: currentStatus === "Closed" && status === "Open" ? "Open (reopen)" : status,
    })),
  ];

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      onChange={() => setEdited(true)}
      noValidate
      className="flex flex-col gap-4"
    >
      <SelectField
        label="Status"
        name="status"
        defaultValue={values.status}
        options={options}
        hint="Closing needs both a cause and the action taken."
        error={fieldErrors?.status?.[0]}
      />
      <TextAreaField
        label="Cause"
        name="cause"
        defaultValue={values.cause}
        error={fieldErrors?.cause?.[0]}
      />
      <TextAreaField
        label="Action taken"
        name="actionTaken"
        defaultValue={values.actionTaken}
        error={fieldErrors?.actionTaken?.[0]}
      />

      {state.formError && !clientErrors ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {state.formError}
        </p>
      ) : null}
      {state.success && !edited ? (
        <p role="status" className="text-sm text-green-700 dark:text-green-400">
          {state.success}
        </p>
      ) : null}

      <SubmitButton className="sm:w-auto sm:self-end">Save</SubmitButton>
    </form>
  );
}
