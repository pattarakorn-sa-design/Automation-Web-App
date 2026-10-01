"use client";

import Link from "next/link";
import { useActionState, useRef, useState, type FormEvent } from "react";
import { z } from "zod";
import SelectField from "@/components/SelectField";
import SubmitButton from "@/components/SubmitButton";
import TextAreaField from "@/components/TextAreaField";
import TextField from "@/components/TextField";
import { fetchAlarmOptions, type AlarmOption } from "@/features/alarms/options";
import type { Role } from "@/features/auth/roles";
import type { MachineOption } from "@/features/machines/queries";
import type { ProfileOption } from "@/features/users/queries";
import { logLoadError } from "@/lib/log";
import { createClient } from "@/lib/supabase/client";
import type { MaintenanceFormState } from "./errors";
import { MAINTENANCE_STATUSES, MAINTENANCE_TYPES, technicianOptions } from "./rules";
import { maintenanceFormValues, maintenanceSchema } from "./schema";

export type MaintenanceFormValues = {
  machineId: string;
  alarmId: string;
  technicianId: string;
  type: string;
  problem: string;
  actionTaken: string;
  status: string;
  startDate: string;
  endDate: string;
};

type MaintenanceFormProps = {
  action: (
    prevState: MaintenanceFormState,
    formData: FormData,
  ) => Promise<MaintenanceFormState>;
  machines: MachineOption[];
  // Alarms of the initially selected machine; others are loaded on demand.
  alarms: AlarmOption[];
  people: ProfileOption[];
  currentUser: { id: string; fullName: string; role: Role };
  initial: MaintenanceFormValues;
  submitLabel: string;
  cancelHref: string;
};

const initialState: MaintenanceFormState = {};

// Create or edit a maintenance record (REQ-MNT-01, REQ-MNT-05).
export default function MaintenanceForm({
  action,
  machines,
  alarms,
  people,
  currentUser,
  initial,
  submitLabel,
  cancelHref,
}: MaintenanceFormProps) {
  const [state, formAction] = useActionState(action, initialState);
  const [clientErrors, setClientErrors] =
    useState<MaintenanceFormState["fieldErrors"]>();
  const values = (state.values as MaintenanceFormValues | undefined) ?? initial;
  // The alarm list depends on the machine, so the machine is tracked here.
  const [machineId, setMachineId] = useState(values.machineId);
  // Alarms of the selected machine (BR-MNT-03). The page provides them for the
  // first machine; picking another machine loads that machine's alarms here.
  const [alarmOptions, setAlarmOptions] = useState<{
    status: "ready" | "loading" | "error";
    alarms: AlarmOption[];
  }>({ status: "ready", alarms });
  // Ignores a slow response for a machine the user has already moved away from.
  const latestMachine = useRef(machineId);

  async function changeMachine(nextMachineId: string) {
    setMachineId(nextMachineId);
    latestMachine.current = nextMachineId;
    if (!nextMachineId) {
      setAlarmOptions({ status: "ready", alarms: [] });
      return;
    }
    setAlarmOptions({ status: "loading", alarms: [] });
    try {
      const loaded = await fetchAlarmOptions(createClient(), nextMachineId);
      if (latestMachine.current === nextMachineId) {
        setAlarmOptions({ status: "ready", alarms: loaded });
      }
    } catch (error) {
      logLoadError("alarm options for the maintenance form", error);
      if (latestMachine.current === nextMachineId) {
        setAlarmOptions({ status: "error", alarms: [] });
      }
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    const parsed = maintenanceSchema.safeParse(
      maintenanceFormValues(new FormData(event.currentTarget)),
    );
    if (!parsed.success) {
      event.preventDefault();
      setClientErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }
    setClientErrors(undefined);
  }

  const fieldErrors = clientErrors ?? state.fieldErrors;
  const isAdmin = currentUser.role === "admin";
  const alarmPlaceholder = !machineId
    ? "Select a machine first"
    : alarmOptions.status === "loading"
      ? "Loading alarms..."
      : "No alarm";

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
        value={machineId}
        onChange={(event) => void changeMachine(event.target.value)}
        placeholder="Select a machine"
        options={machines.map((machine) => ({
          value: machine.id,
          label: `${machine.machine_code} · ${machine.name}`,
        }))}
        error={fieldErrors?.machineId?.[0]}
      />
      <SelectField
        // Remount when the machine or its alarm list changes, so an alarm of the
        // old machine is not kept and the saved alarm is selected once loaded.
        key={`${machineId}-${alarmOptions.status}`}
        label="Caused by alarm (optional)"
        name="alarmId"
        defaultValue={values.alarmId}
        placeholder={alarmPlaceholder}
        disabled={!machineId || alarmOptions.status === "loading"}
        hint={
          alarmOptions.status === "error"
            ? "โหลดรายการ Alarm ไม่สำเร็จ เลือกเครื่องจักรใหม่อีกครั้ง หรือบันทึกโดยไม่ระบุ Alarm"
            : undefined
        }
        options={alarmOptions.alarms.map((alarm) => ({
          value: alarm.id,
          label: `${alarm.alarm_code} (${alarm.status})`,
        }))}
        error={fieldErrors?.alarmId?.[0]}
      />

      {isAdmin ? (
        <SelectField
          label="Technician"
          name="technicianId"
          defaultValue={values.technicianId}
          placeholder="Select the responsible technician"
          options={technicianOptions(people, values.technicianId)}
          error={fieldErrors?.technicianId?.[0]}
        />
      ) : (
        // Technicians always record work under their own name (BR-MNT-01).
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            Technician
          </span>
          <p className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 dark:border-gray-800 dark:bg-gray-900">
            {currentUser.fullName} (you)
          </p>
          <input type="hidden" name="technicianId" value={currentUser.id} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SelectField
          label="Type"
          name="type"
          defaultValue={values.type}
          options={MAINTENANCE_TYPES.map((type) => ({ value: type, label: type }))}
          error={fieldErrors?.type?.[0]}
        />
        <SelectField
          label="Status"
          name="status"
          defaultValue={values.status}
          options={MAINTENANCE_STATUSES.map((status) => ({ value: status, label: status }))}
          error={fieldErrors?.status?.[0]}
        />
      </div>

      <TextAreaField
        label="Problem"
        name="problem"
        defaultValue={values.problem}
        error={fieldErrors?.problem?.[0]}
      />
      <TextAreaField
        label="Action taken"
        name="actionTaken"
        defaultValue={values.actionTaken}
        hint="Needed before the status can be Completed."
        error={fieldErrors?.actionTaken?.[0]}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          label="Start date"
          name="startDate"
          type="date"
          defaultValue={values.startDate}
          error={fieldErrors?.startDate?.[0]}
        />
        <TextField
          label="End date"
          name="endDate"
          type="date"
          defaultValue={values.endDate}
          hint="Needed before the status can be Completed."
          error={fieldErrors?.endDate?.[0]}
        />
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
